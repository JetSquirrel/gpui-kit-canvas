/**
 * Colour utilities for the canvas: sRGB <-> CIELAB conversions, a readable
 * foreground for an arbitrary background, and the compositing gpui-kit's own
 * theme resolution does. There is no scheme generator here: a gpui-kit theme
 * declares its tokens outright, and `lib/kit-themes.gen.ts` resolves the ones a
 * theme leaves out the same way `ColorsConfig::apply_config` does.
 */

import type { Palette } from "./tokens";

export type Lab = { L: number; a: number; b: number };
export type Lch = { L: number; C: number; h: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(clamp01(v / 255) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();

const lin = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const gam = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

const WHITE = [0.95047, 1, 1.08883];
const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
const fInv = (t: number) => (t > 0.2069 ? t * t * t : (t - 16 / 116) / 7.787);

export function rgbToLab(r: number, g: number, b: number): Lab {
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / WHITE[0];
  const y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / WHITE[1];
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / WHITE[2];
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** sRGB in 0..255, or null when the color is outside the gamut */
function labToRgb(lab: Lab): [number, number, number] | null {
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;
  const x = fInv(fx) * WHITE[0];
  const y = fInv(fy) * WHITE[1];
  const z = fInv(fz) * WHITE[2];
  const R = x * 3.2406 + y * -1.5372 + z * -0.4986;
  const G = x * -0.9689 + y * 1.8758 + z * 0.0415;
  const B = x * 0.0557 + y * -0.204 + z * 1.057;
  const out = [R, G, B].map(gam);
  if (out.some((v) => v < -0.002 || v > 1.002)) return null;
  return out.map((v) => clamp01(v) * 255) as [number, number, number];
}

export function labToLch(lab: Lab): Lch {
  const C = Math.hypot(lab.a, lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L: lab.L, C, h };
}

/** the color at a tone / chroma / hue, with chroma reduced until it fits sRGB */
export function tone(L: number, C: number, h: number): string {
  const rad = (h * Math.PI) / 180;
  let c = C;
  for (let i = 0; i < 40; i++) {
    const rgb = labToRgb({ L, a: c * Math.cos(rad), b: c * Math.sin(rad) });
    if (rgb) return rgbToHex(rgb[0], rgb[1], rgb[2]);
    c *= 0.88;
  }
  const rgb = labToRgb({ L, a: 0, b: 0 }) ?? [128, 128, 128];
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
}

/** readable text for an arbitrary background: near-black or near-white, whichever
 *  the background's lightness calls for. Keeps a hint of the background's hue so a
 *  hand-tuned token still reads as one family. */
export function onColorFor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  const lch = labToLch(rgbToLab(rgb[0], rgb[1], rgb[2]));
  return lch.L > 60 ? tone(12, Math.min(lch.C, 12), lch.h) : tone(98, Math.min(lch.C, 6), lch.h);
}

/** a 6- or 8-digit hex, which is what a gpui-kit theme file writes */
export const isHex = (v: string) => /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v.trim());

/** the alpha carried by an 8-digit hex; 1 for anything else */
export function alphaOf(hex: string): number {
  const m = /^#?[0-9a-f]{6}([0-9a-f]{2})$/i.exec(hex.trim());
  return m ? parseInt(m[1], 16) / 255 : 1;
}

/** the opaque colour a token resolves to over `under`, which is what a
 *  translucent token such as `list.active.background` actually looks like */
export function flatten(hex: string, under: string): string {
  const a = alphaOf(hex);
  if (a >= 1) return hex.slice(0, 7);
  const top = hexToRgb(hex.slice(0, 7));
  const base = hexToRgb(under.length > 7 ? under.slice(0, 7) : under);
  if (!top || !base) return hex.slice(0, 7);
  return rgbToHex(...(top.map((c, i) => c * a + base[i] * (1 - a)) as [number, number, number]));
}

/** `hex` with the given alpha, as an 8-digit hex */
export function withAlpha(hex: string, a: number): string {
  const base = hex.slice(0, 7);
  const byte = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${base}${byte}`;
}

/** `factor` of `a` mixed with the rest of `b`, in sRGB */
export function mix(a: string, b: string, factor: number): string {
  const ca = hexToRgb(a.slice(0, 7));
  const cb = hexToRgb(b.slice(0, 7));
  if (!ca || !cb) return a;
  return rgbToHex(...(ca.map((c, i) => c * factor + cb[i] * (1 - factor)) as [number, number, number]));
}

/** whether a palette reads as dark, so a preview can pick its own chrome */
export const isDarkColor = (hex: string) => {
  const rgb = hexToRgb(hex.slice(0, 7));
  if (!rgb) return false;
  return labToLch(rgbToLab(rgb[0], rgb[1], rgb[2])).L < 50;
};
