"use client";

import { useEffect, useState } from "react";
import { PALETTES, PALETTE_SETS, Palette, TOKEN_NAMES, Theme } from "@/lib/tokens";
import { isHex, onColorFor } from "@/lib/color";
import { t, useLang } from "@/lib/i18n";
import { Section, Segmented } from "./ui";
import { Icon } from "./KitNode";

/** the roles the author can override by hand; a foreground follows its surface */
type Role = keyof Palette;
const TUNABLE: { key: Role; on?: Role }[] = [
  { key: "background", on: "foreground" },
  { key: "border" },
  { key: "primary", on: "primaryForeground" },
  { key: "secondary", on: "secondaryForeground" },
  { key: "accent", on: "accentForeground" },
  { key: "muted", on: "mutedForeground" },
  { key: "sidebar", on: "sidebarForeground" },
  { key: "titleBar" },
  { key: "statusBar" },
  { key: "groupBox", on: "groupBoxForeground" },
  { key: "danger", on: "dangerForeground" },
  { key: "ring" },
];

/** a theme's key colours as overlapping dots, trailing-aligned in the row */
function Swatches({ pal, p }: { pal: Palette; p: Palette }) {
  const colors = [pal.background, pal.primary, pal.accent, pal.secondary, pal.border];
  return (
    <span style={{ display: "inline-flex", flex: "0 0 auto", marginLeft: "auto", paddingLeft: 8 }}>
      {colors.map((c, i) => (
        <span
          key={i}
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: c,
            marginLeft: i === 0 ? 0 : -6,
            boxShadow: `0 0 0 1.5px ${p.background}, inset 0 0 0 1px rgba(0,0,0,0.10)`,
            zIndex: colors.length - i,
            position: "relative",
          }}
        />
      ))}
    </span>
  );
}

function ColorField({
  value,
  onChange,
  p,
  label,
}: {
  value: string;
  onChange: (hex: string) => void;
  p: Palette;
  label: string;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, height: 32 }}>
      <span
        style={{
          position: "relative",
          width: 22,
          height: 22,
          borderRadius: 4,
          background: value,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.14)",
          flex: "0 0 auto",
          overflow: "hidden",
        }}
      >
        <input
          type="color"
          value={value.slice(0, 7)}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          aria-label={label}
          style={{ position: "absolute", inset: -8, width: 40, height: 40, opacity: 0, cursor: "pointer" }}
        />
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          fontFamily: "var(--mono, ui-monospace, monospace)",
          color: p.mutedForeground,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (isHex(e.target.value)) onChange(e.target.value.toLowerCase());
        }}
        onBlur={() => setText(value)}
        spellCheck={false}
        aria-label={label}
        style={{
          width: 84,
          height: 26,
          borderRadius: 6,
          border: `1px solid ${p.input}`,
          background: p.background,
          color: p.foreground,
          padding: "0 6px",
          fontSize: 12,
          fontFamily: "ui-monospace, monospace",
          flex: "0 0 auto",
        }}
      />
    </label>
  );
}

/** one row of the panel's own settings list */
function SettingRow({
  p,
  icon,
  label,
  onClick,
  pressed,
  children,
}: {
  p: Palette;
  icon: string;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      className="kit-press"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 40,
        padding: "0 12px",
        borderRadius: 8,
        border: `1px solid ${p.border}`,
        background: p.background,
        color: p.foreground,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <Icon name={icon} size={16} color={p.mutedForeground} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      {children}
    </button>
  );
}

/** the switch of a settings row, drawn without its own button */
function Knob({ on, p }: { on: boolean; p: Palette }) {
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        width: 36,
        height: 20,
        borderRadius: 10,
        background: on ? p.primary : p.switchBg,
        boxSizing: "border-box",
        transition: "background 140ms",
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: 8,
          background: p.switchThumb,
          boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
          transition: "left 140ms",
        }}
      />
    </span>
  );
}

/** The colour tab of the theme panel: light / dark, the themes gpui-kit ships,
 *  and a hand-tuned set of its semantic tokens. */
export function ColorPanel({
  p,
  paletteKey,
  onPalette,
  custom,
  onCustom,
  theme,
  onTheme,
}: {
  p: Palette;
  paletteKey: string;
  onPalette: (key: string) => void;
  custom: Palette | null;
  onCustom: (pal: Palette) => void;
  theme: Theme;
  onTheme: (patch: Partial<Theme>) => void;
}) {
  const lang = useLang();
  const [tab, setTab] = useState<"templates" | "custom">(paletteKey === "custom" ? "custom" : "templates");
  /* editing starts from whatever is on screen, so a tweak is a small step from it */
  const cur = custom ?? { ...p, key: "custom", label: t("customColor", lang), set: "Custom" };

  const tune = (role: Role, hex: string, on?: Role) => {
    const next: Palette = { ...cur, [role]: hex };
    if (on) (next as unknown as Record<string, string>)[on] = onColorFor(hex);
    onCustom(next);
    onPalette("custom");
  };

  return (
    <div className="no-scrollbar" style={{ height: "100%", overflowY: "auto", padding: "12px 12px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        <SettingRow
          p={p}
          icon={theme.dark ? "moon" : "sun"}
          label={t("brightness", lang)}
          onClick={() => onTheme({ dark: !theme.dark })}
          pressed={theme.dark}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, color: p.primary }}>
            {theme.dark ? t("dark", lang) : t("light", lang)}
            <Icon name="replace" size={14} />
          </span>
        </SettingRow>
        <SettingRow p={p} icon="sun" label={t("bothModes", lang)} onClick={() => onTheme({ bothModes: !theme.bothModes })} pressed={theme.bothModes}>
          <Knob on={theme.bothModes} p={p} />
        </SettingRow>
        <div style={{ fontSize: 11, lineHeight: 1.5, color: p.mutedForeground, padding: "0 4px" }}>{t("bothModesHint", lang)}</div>
      </div>

      <Segmented<"templates" | "custom">
        options={[
          { key: "templates", icon: "palette", label: t("templates", lang) },
          { key: "custom", icon: "settings-2", label: t("customColor", lang) },
        ]}
        value={tab}
        onChange={setTab}
        p={p}
        height={34}
      />

      {tab === "templates" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          <div style={{ fontSize: 11, lineHeight: 1.5, color: p.mutedForeground, padding: "0 4px 4px" }}>{t("themeHint", lang)}</div>
          {PALETTE_SETS.map((entry) => {
            /* a set may ship only one mode; the row picks the side that matches */
            const pal = (theme.dark ? entry.dark : entry.light) ?? entry.dark ?? entry.light!;
            const on = PALETTES.some((x) => x.set === entry.set && x.key === paletteKey);
            const both = !!entry.light && !!entry.dark;
            return (
              <button
                key={entry.set}
                onClick={() => onPalette(pal.key)}
                aria-pressed={on}
                className="kit-press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  height: 40,
                  padding: "0 10px",
                  borderRadius: 8,
                  border: `1px solid ${on ? p.primary : p.border}`,
                  background: on ? p.accent : p.background,
                  color: on ? p.accentForeground : p.foreground,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${pal.background} 50%, ${pal.primary} 50%)`,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
                    flex: "0 0 auto",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                  {entry.set}
                </span>
                {!both && (
                  <span style={{ fontSize: 10, color: p.mutedForeground, flex: "0 0 auto" }}>
                    {pal.dark ? t("dark", lang) : t("light", lang)}
                  </span>
                )}
                <Swatches pal={pal} p={p} />
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <div style={{ fontSize: 11, lineHeight: 1.5, color: p.mutedForeground, padding: "0 4px" }}>{t("themeHint", lang)}</div>
          {paletteKey !== "custom" && (
            <button
              onClick={() => {
                onCustom(cur);
                onPalette("custom");
              }}
              className="kit-press"
              style={{
                height: 32,
                padding: "0 10px",
                borderRadius: 6,
                border: "none",
                background: p.primary,
                color: p.primaryForeground,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >
              {t("useThis", lang)}
            </button>
          )}
          <Section id="color-tune" icon="settings-2" title={t("fineTune", lang)} p={p} defaultOpen>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {TUNABLE.map((role) => (
                <ColorField
                  key={role.key}
                  value={String(cur[role.key])}
                  label={TOKEN_NAMES[role.key] ?? role.key}
                  p={p}
                  onChange={(hex) => tune(role.key, hex, role.on)}
                />
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
