/**
 * Generates lib/kit-themes.gen.ts from a gpui-kit checkout.
 *
 * The canvas draws gpui-kit interfaces, so its palettes have to be the real
 * ones. This reads gpui-kit's shipped themes and resolves each into the token
 * subset the canvas paints with, following the same fallback chain as
 * `ColorsConfig::apply_config` in crates/component/src/theme/schema.rs: a token
 * the theme leaves out derives from that theme's own colors where the Rust
 * side names a fallback, and only a root token drops to the mode default.
 *
 *   node script/gen-kit-themes.mjs [path-to-gpui-kit]
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const KIT = resolve(process.argv[2] ?? process.env.GPUI_KIT ?? join(here, "..", "..", "gpui-kit"));
const THEME_SRC = join(KIT, "crates", "component", "src", "theme");

const named = JSON.parse(readFileSync(join(THEME_SRC, "default-colors.json"), "utf8"));

/* ---------- color math, mirroring gpui's Hsla ---------- */

/** #rgb, #rrggbb, #rrggbbaa or a shadcn scale name ("neutral-100", "white") */
function parse(value) {
  if (typeof value !== "string") return null;
  let v = value.trim();
  // A gradient's first stop is the closest flat colour the canvas can draw.
  if (v.includes("gradient")) {
    const stop = v.match(/#[0-9a-fA-F]{3,8}/);
    if (!stop) return null;
    v = stop[0];
  }
  if (v.startsWith("#")) {
    const h = v.slice(1);
    const ex = h.length === 3 || h.length === 4 ? [...h].map((c) => c + c).join("") : h;
    if (ex.length !== 6 && ex.length !== 8) return null;
    const n = (i) => parseInt(ex.slice(i, i + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: ex.length === 8 ? n(6) : 1 };
  }
  if (v === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const m = v.match(/^([a-z_]+)(?:-(\d+))?$/i);
  if (!m) return null;
  const scale = named[m[1]];
  if (!scale) return null;
  if (typeof scale === "object" && !Array.isArray(scale)) return parse(scale.hex);
  if (Array.isArray(scale)) {
    const want = m[2] ? Number(m[2]) : 500;
    const hit = scale.find((s) => s.scale === want) ?? scale.find((s) => s.scale === 500);
    return hit ? parse(hit.hex) : null;
  }
  return parse(scale);
}

const hex = (c) => {
  const b = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0");
  return `#${b(c.r)}${b(c.g)}${b(c.b)}${c.a < 1 ? b(c.a) : ""}`;
};

const opacity = (c, a) => ({ ...c, a: c.a * a });

/** `other` composited over `base`, as gpui's Hsla::blend does */
const blend = (base, other) => {
  const a = other.a + base.a * (1 - other.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const ch = (o, b) => (o * other.a + b * base.a * (1 - other.a)) / a;
  return { r: ch(other.r, base.r), g: ch(other.g, base.g), b: ch(other.b, base.b), a };
};

/* HSL lightness scaling, which is what gpui-kit's darken / lighten do */
function toHsl({ r, g, b, a }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l, a };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l, a };
}

function fromHsl({ h, s, l, a }) {
  l = Math.min(1, Math.max(0, l));
  if (s === 0) return { r: l, g: l, b: l, a };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const ch = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: ch(h + 1 / 3), g: ch(h), b: ch(h - 1 / 3), a };
}

const darken = (c, f) => fromHsl({ ...toHsl(c), l: toHsl(c).l * (1 - f) });
const lighten = (c, f) => fromHsl({ ...toHsl(c), l: toHsl(c).l * (1 + f) });

/* ---------- the tokens the canvas paints with ---------- */

/** canvas field -> the gpui-kit theme key(s) it reads, newest name first */
const KEYS = {
  background: ["background"],
  foreground: ["foreground"],
  border: ["border"],
  input: ["input.border"],
  ring: ["ring"],
  muted: ["muted.background"],
  mutedForeground: ["muted.foreground"],
  accent: ["accent.background"],
  accentForeground: ["accent.foreground"],
  popover: ["popover.background"],
  popoverForeground: ["popover.foreground"],
  overlay: ["overlay"],
  selection: ["selection.background"],
  primary: ["primary.background"],
  primaryForeground: ["primary.foreground"],
  primaryHover: ["primary.hover.background"],
  primaryActive: ["primary.active.background"],
  secondary: ["secondary.background"],
  secondaryForeground: ["secondary.foreground"],
  secondaryHover: ["secondary.hover.background"],
  secondaryActive: ["secondary.active.background"],
  danger: ["danger.background"],
  dangerForeground: ["danger.foreground"],
  warning: ["warning.background"],
  warningForeground: ["warning.foreground"],
  success: ["success.background"],
  successForeground: ["success.foreground"],
  info: ["info.background"],
  infoForeground: ["info.foreground"],
  link: ["link.foreground", "link"],
  titleBar: ["title_bar.background"],
  titleBarBorder: ["title_bar.border"],
  statusBar: ["status_bar.background"],
  statusBarBorder: ["status_bar.border"],
  sidebar: ["sidebar.background"],
  sidebarForeground: ["sidebar.foreground"],
  sidebarBorder: ["sidebar.border"],
  sidebarAccent: ["sidebar.accent.background"],
  sidebarAccentForeground: ["sidebar.accent.foreground"],
  sidebarPrimary: ["sidebar.primary.background"],
  sidebarPrimaryForeground: ["sidebar.primary.foreground"],
  tabBar: ["tab_bar.background"],
  tabBarSegmented: ["tab_bar.segmented.background"],
  tab: ["tab.background"],
  tabForeground: ["tab.foreground"],
  tabActive: ["tab.active.background"],
  tabActiveForeground: ["tab.active.foreground"],
  list: ["list.background"],
  listHover: ["list.hover.background"],
  listActive: ["list.active.background"],
  listActiveBorder: ["list.active.border"],
  listEven: ["list.even.background"],
  listHead: ["list.head.background"],
  table: ["table.background"],
  tableHead: ["table.head.background"],
  tableHeadForeground: ["table.head.foreground"],
  tableRowBorder: ["table.row.border"],
  tableHover: ["table.hover.background"],
  tableActive: ["table.active.background"],
  tableActiveBorder: ["table.active.border"],
  tableEven: ["table.even.background"],
  groupBox: ["group_box.background"],
  groupBoxForeground: ["group_box.foreground"],
  switchBg: ["switch.background"],
  switchThumb: ["switch.thumb.background"],
  sliderBar: ["slider.background", "slider.bar.background"],
  sliderThumb: ["slider.thumb.background"],
  progressBar: ["progress.bar.background", "progress_bar.background"],
  skeleton: ["skeleton.background"],
  scrollbarThumb: ["scrollbar.thumb.background"],
  windowBorder: ["window.border"],
  chart1: ["chart.1", "chart_1"],
  chart2: ["chart.2", "chart_2"],
  chart3: ["chart.3", "chart_3"],
  chart4: ["chart.4", "chart_4"],
  chart5: ["chart.5", "chart_5"],
  red: ["base.red"],
  green: ["base.green"],
  blue: ["base.blue"],
  yellow: ["base.yellow"],
  cyan: ["base.cyan"],
  magenta: ["base.magenta"],
};

/** the tokens the canvas keeps only to resolve the others */
const INTERNAL = ["red", "green", "blue", "yellow", "cyan", "magenta"];

/**
 * Resolution order matters: a fallback may only name a token already resolved,
 * exactly as the Rust macro expansion does.
 * Each entry is [field, fallback] where fallback is undefined for a root token.
 */
const ORDER = [
  ["background"],
  ["foreground"],
  ["border"],
  ["red"],
  ["green"],
  ["blue"],
  ["yellow"],
  ["cyan"],
  ["magenta"],
  ["input", (c) => c.border],
  ["muted"],
  ["mutedForeground", (c) => blend(c.muted, opacity(c.foreground, 0.7))],
  ["primary"],
  ["primaryForeground", (c) => c.foreground],
  ["primaryHover", (c) => blend(c.background, opacity(c.primary, 0.9))],
  ["primaryActive", (c, dark) => darken(c.primary, dark ? 0.2 : 0.1)],
  ["secondary"],
  ["secondaryForeground", (c) => c.foreground],
  ["secondaryHover", (c) => blend(c.background, opacity(c.secondary, 0.9))],
  ["secondaryActive", (c, dark) => darken(c.secondary, dark ? 0.2 : 0.1)],
  ["success", (c) => c.green],
  ["successForeground", (c) => c.primaryForeground],
  ["info", (c) => c.cyan],
  ["infoForeground", (c) => c.primaryForeground],
  ["warning", (c) => c.yellow],
  ["warningForeground", (c) => c.primaryForeground],
  ["danger", (c) => c.red],
  ["dangerForeground", (c) => c.primaryForeground],
  ["accent", (c) => c.secondary],
  ["accentForeground", (c) => c.foreground],
  ["groupBox", (c, dark) => blend(c.background, opacity(c.secondary, dark ? 0.3 : 0.4))],
  ["groupBoxForeground", (c) => c.foreground],
  ["chart1", (c) => lighten(c.blue, 0.4)],
  ["chart2", (c) => lighten(c.blue, 0.2)],
  ["chart3", (c) => c.blue],
  ["chart4", (c) => darken(c.blue, 0.2)],
  ["chart5", (c) => darken(c.blue, 0.4)],
  ["link", (c) => c.primary],
  ["list", (c) => c.background],
  ["listActive", (c) => blend(c.background, opacity(c.primary, 0.1))],
  ["listActiveBorder", (c) => blend(c.background, opacity(c.primary, 0.6))],
  ["listEven", (c) => c.list],
  ["listHead", (c) => c.list],
  ["listHover", (c) => opacity(c.accent, 0.6)],
  ["popover", (c) => c.background],
  ["popoverForeground", (c) => c.foreground],
  ["progressBar", (c) => c.primary],
  ["ring", (c) => c.blue],
  ["scrollbarThumb", (c) => c.accent],
  ["selection", (c) => c.primary],
  ["sidebar", (c) => blend(c.background, opacity(c.border, 0.15))],
  ["sidebarAccent", (c) => c.accent],
  ["sidebarAccentForeground", (c) => c.accentForeground],
  ["sidebarBorder", (c) => c.border],
  ["sidebarForeground", (c) => c.foreground],
  ["sidebarPrimary", (c) => c.primary],
  ["sidebarPrimaryForeground", (c) => c.primaryForeground],
  ["skeleton", (c) => c.secondary],
  ["sliderBar", (c) => c.primary],
  ["sliderThumb", (c) => c.primaryForeground],
  ["switchBg", (c) => c.secondaryActive],
  ["switchThumb", (c) => c.background],
  ["tab", (c) => c.background],
  ["tabActive", (c) => c.background],
  ["tabActiveForeground", (c) => c.foreground],
  ["tabBar", (c) => c.background],
  ["tabBarSegmented", (c) => c.secondary],
  ["tabForeground", (c) => c.foreground],
  ["table", (c) => c.list],
  ["tableActive", (c) => c.listActive],
  ["tableActiveBorder", (c) => c.listActiveBorder],
  ["tableEven", (c) => c.listEven],
  ["tableHead", (c) => c.listHead],
  ["tableHeadForeground", (c) => c.mutedForeground],
  ["tableRowBorder", (c) => c.border],
  ["tableHover", (c) => c.listHover],
  ["titleBar", (c) => c.background],
  ["titleBarBorder", (c) => c.border],
  ["statusBar", (c) => c.titleBar],
  ["statusBarBorder", (c) => c.titleBarBorder],
  ["overlay"],
  ["windowBorder", (c) => c.border],
];

/** read one token out of a theme's `colors`, trying every spelling */
const raw = (colors, field) => {
  for (const key of KEYS[field]) if (colors[key] != null) return colors[key];
  return undefined;
};

/** resolve a ThemeConfig into the canvas token set; `base` is the mode default */
function resolveColors(colors, dark, base) {
  const out = {};
  for (const [field, fallback] of ORDER) {
    const value = parse(raw(colors, field));
    if (value) out[field] = value;
    else if (fallback) out[field] = fallback(out, dark);
    else out[field] = base ? base[field] : { r: 0, g: 0, b: 0, a: 1 };
  }
  return out;
}

/* ---------- read gpui-kit's themes ---------- */

const defaults = JSON.parse(readFileSync(join(THEME_SRC, "default-theme.json"), "utf8"));
/** the mode defaults every other theme falls back to for its root tokens */
const base = {};
for (const theme of defaults.themes) {
  base[theme.mode] = resolveColors(theme.colors, theme.mode === "dark", null);
}

const themeFiles = readdirSync(join(KIT, "themes"))
  .filter((f) => f.endsWith(".json"))
  .sort();

const sets = [
  { file: null, name: "Default", themes: defaults.themes },
  ...themeFiles.map((f) => ({ file: f, ...JSON.parse(readFileSync(join(KIT, "themes", f), "utf8")) })),
];

const out = [];
for (const set of sets) {
  const slug = set.file ? set.file.replace(/\.json$/, "") : "default";
  for (const theme of set.themes ?? []) {
    const dark = theme.mode === "dark";
    const colors = resolveColors(theme.colors ?? {}, dark, base[theme.mode] ?? base.light);
    const entry = {
      key: `${slug}:${dark ? "dark" : "light"}`,
      label: theme.name,
      set: set.name ?? slug,
      dark,
      radius: theme.radius ?? 6,
      radiusLg: theme["radius.lg"] ?? 8,
    };
    for (const [field] of ORDER) {
      if (INTERNAL.includes(field)) continue;
      entry[field] = hex(colors[field]);
    }
    out.push(entry);
  }
}

/* one entry per key: a set that ships two dark variants keeps the first */
const seen = new Set();
const palettes = out.filter((p) => (seen.has(p.key) ? false : seen.add(p.key)));

const fields = ORDER.map(([f]) => f).filter((f) => !INTERNAL.includes(f));
const body = palettes
  .map(
    (p) =>
      `  {\n` +
      [
        `key: ${JSON.stringify(p.key)}`,
        `label: ${JSON.stringify(p.label)}`,
        `set: ${JSON.stringify(p.set)}`,
        `dark: ${p.dark}`,
        `radius: ${p.radius}`,
        `radiusLg: ${p.radiusLg}`,
        ...fields.map((f) => `${f}: ${JSON.stringify(p[f])}`),
      ]
        .map((l) => `    ${l},`)
        .join("\n") +
      `\n  }`
  )
  .join(",\n");

const ts = `// Generated by script/gen-kit-themes.mjs from a gpui-kit checkout. Do not edit.
// Regenerate with: node script/gen-kit-themes.mjs [path-to-gpui-kit]
import type { Palette } from "./tokens";

export const KIT_PALETTES: Palette[] = [
${body},
];
`;

writeFileSync(join(here, "..", "lib", "kit-themes.gen.ts"), ts);
console.log(`wrote lib/kit-themes.gen.ts — ${palettes.length} palettes, ${fields.length} tokens each`);
