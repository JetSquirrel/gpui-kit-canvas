"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { DENSITIES, Density, FONTS, Palette, RADII, RadiusScale, Theme } from "@/lib/tokens";
import { ensureFontLoaded } from "@/lib/theme";
import { Lang, t, useLang } from "@/lib/i18n";
import { Icon } from "./KitNode";
import { Toggle } from "./ui";

const radiusLabel = (k: RadiusScale, lang: Lang) =>
  k === "square" ? t("radiusSquare", lang) : k === "round" ? t("radiusRound", lang) : t("radiusDefault", lang);

const densityLabel = (k: Density, lang: Lang) =>
  k === "compact" ? t("densityCompact", lang) : k === "comfortable" ? t("densityComfortable", lang) : t("densityDefault", lang);

function Hint({ p, children }: { p: Palette; children: React.ReactNode }) {
  return <div style={{ fontSize: 11, lineHeight: 1.5, color: p.mutedForeground, padding: "0 4px" }}>{children}</div>;
}

function Head({ p, children }: { p: Palette; children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: p.mutedForeground, padding: "0 4px" }}>{children}</div>;
}

/** one row of the panel's option lists */
function Row({
  on,
  onClick,
  p,
  label,
  art,
}: {
  on: boolean;
  onClick: () => void;
  p: Palette;
  label: string;
  art?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="kit-press"
      style={{
        display: "flex",
        flexDirection: art ? "column" : "row",
        alignItems: art ? "flex-start" : "center",
        gap: art ? 10 : 12,
        padding: art ? "10px 12px 12px" : "0 12px",
        height: art ? undefined : 40,
        borderRadius: 8,
        border: `1px solid ${on ? p.primary : p.border}`,
        background: on ? p.accent : p.background,
        color: on ? p.accentForeground : p.foreground,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {on && <Icon name="check" size={16} />}
      </span>
      {art}
    </button>
  );
}

function OptionCard({
  on,
  onClick,
  p,
  label,
  children,
}: {
  on: boolean;
  onClick: () => void;
  p: Palette;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="kit-press"
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "12px 8px 10px",
        borderRadius: 8,
        border: `1px solid ${on ? p.primary : p.border}`,
        background: on ? p.accent : p.background,
        color: on ? p.accentForeground : p.foreground,
        cursor: "pointer",
      }}
    >
      {children}
      <span style={{ fontSize: 12, fontWeight: 600, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

const panelStyle: React.CSSProperties = {
  height: "100%",
  overflowY: "auto",
  padding: "12px 12px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

/** The theme's structural axes: radius, shadow and the focus ring. */
export function ShapePanel({ p, theme, onChange }: { p: Palette; theme: Theme; onChange: (patch: Partial<Theme>) => void }) {
  const lang = useLang();
  return (
    <div className="no-scrollbar" style={panelStyle}>
      <Head p={p}>{t("radiusScale", lang)}</Head>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {RADII.map((scale) => (
          <Row
            key={scale.key}
            on={theme.radius === scale.key}
            onClick={() => onChange({ radius: scale.key })}
            p={p}
            label={radiusLabel(scale.key, lang)}
            art={
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 64, height: 24, borderRadius: scale.radius, background: p.primary }} />
                <span style={{ width: 24, height: 24, borderRadius: scale.radius, background: p.secondary }} />
                <span
                  style={{
                    width: 40,
                    height: 24,
                    borderRadius: scale.radius + 2,
                    background: p.background,
                    border: `1px solid ${p.border}`,
                    boxSizing: "border-box",
                  }}
                />
              </span>
            }
          />
        ))}
      </div>
      <Hint p={p}>{t("radiusHint", lang)}</Hint>

      <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${p.border}`, background: p.groupBox, display: "flex", flexDirection: "column", gap: 8 }}>
        <Toggle on={theme.shadow} onChange={(shadow) => onChange({ shadow })} p={p} icon="panel-bottom" label={t("shadow", lang)} grow />
        <Hint p={p}>{t("shadowHint", lang)}</Hint>
      </div>
      <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${p.border}`, background: p.groupBox, display: "flex", flexDirection: "column", gap: 8 }}>
        <Toggle on={theme.focusRing} onChange={(focusRing) => onChange({ focusRing })} p={p} icon="frame" label={t("focusRing", lang)} grow />
        <Hint p={p}>{t("focusRingHint", lang)}</Hint>
      </div>
    </div>
  );
}

/** Typeface rows rendered in their own face, and the density tier. */
export function TypePanel({ p, theme, onChange }: { p: Palette; theme: Theme; onChange: (patch: Partial<Theme>) => void }) {
  const lang = useLang();
  return (
    <div className="no-scrollbar" style={panelStyle}>
      <Head p={p}>{t("fontFamily", lang)}</Head>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {FONTS.map((f) => {
          const on = theme.font === f.key;
          ensureFontLoaded(f.key);
          return (
            <button
              key={f.key}
              onClick={() => onChange({ font: f.key })}
              aria-pressed={on}
              className="kit-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 44,
                padding: "0 12px",
                borderRadius: 8,
                border: `1px solid ${on ? p.primary : p.border}`,
                background: on ? p.accent : p.background,
                color: on ? p.accentForeground : p.foreground,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: f.family,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 600, width: 32, flex: "0 0 auto" }}>Aa</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.label}
              </span>
              {on && <Icon name="check" size={16} />}
            </button>
          );
        })}
      </div>

      <Head p={p}>{t("density", lang)}</Head>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {DENSITIES.map((d) => (
          <Row
            key={d.key}
            on={theme.density === d.key}
            onClick={() => onChange({ density: d.key })}
            p={p}
            label={densityLabel(d.key, lang)}
            art={
              /* the row height each tier gives a control */
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 34,
                      height: d.key === "compact" ? 16 : d.key === "comfortable" ? 28 : 22,
                      borderRadius: 6,
                      background: p.secondary,
                    }}
                  />
                ))}
              </span>
            }
          />
        ))}
      </div>
      <Hint p={p}>{t("densityHint", lang)}</Hint>
    </div>
  );
}

/** Two option cards that replay their own motion when chosen, plus a click-to-try dot. */
export function MotionPanel({ p, theme, onChange }: { p: Palette; theme: Theme; onChange: (patch: Partial<Theme>) => void }) {
  const lang = useLang();
  const [tick, setTick] = useState(0);
  const reduced = theme.motion === "reduced";
  const transition = reduced ? { duration: 0 } : { duration: 0.22, ease: [0.2, 0, 0, 1] as const };
  return (
    <div className="no-scrollbar" style={panelStyle}>
      <Head p={p}>{t("motionScheme", lang)}</Head>
      <div style={{ display: "flex", gap: 6 }}>
        <OptionCard
          on={!reduced}
          onClick={() => {
            onChange({ motion: "default" });
            setTick((n) => n + 1);
          }}
          p={p}
          label={t("motionDefault", lang)}
        >
          <svg width="64" height="36" viewBox="0 0 64 36" aria-hidden>
            <path d="M4 32 C 24 32, 30 4, 60 4" fill="none" stroke={p.primary} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </OptionCard>
        <OptionCard
          on={reduced}
          onClick={() => {
            onChange({ motion: "reduced" });
            setTick((n) => n + 1);
          }}
          p={p}
          label={t("motionReduced", lang)}
        >
          <svg width="64" height="36" viewBox="0 0 64 36" aria-hidden>
            <path d="M4 32 L 32 32 L 32 4 L 60 4" fill="none" stroke={p.primary} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </OptionCard>
      </div>
      <Hint p={p}>{t("motionHint", lang)}</Hint>

      <button
        onClick={() => setTick((n) => n + 1)}
        className="kit-press"
        title={t("tryIt", lang)}
        aria-label={t("tryIt", lang)}
        style={{
          position: "relative",
          height: 88,
          borderRadius: 8,
          border: `1px solid ${p.border}`,
          background: p.groupBox,
          cursor: "pointer",
          overflow: "hidden",
          padding: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <motion.span
          key={`${theme.motion}:${tick}`}
          initial={{ x: -110, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={transition}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: p.primary,
            display: "grid",
            placeItems: "center",
            color: p.primaryForeground,
          }}
        >
          <Icon name="arrow-right" size={20} />
        </motion.span>
      </button>
    </div>
  );
}
