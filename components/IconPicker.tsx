"use client";

import { useMemo, useState } from "react";
import { Palette } from "@/lib/tokens";
import { KIT_ICONS } from "@/lib/kit-icons.gen";
import { t, useLang } from "@/lib/i18n";
import { Icon } from "./KitNode";

/** The icons gpui-kit ships, and nothing else: a sketch can only name an icon
 *  the generated app can actually draw. The whole set is bundled, so there is
 *  no font to wait for and no glyph to probe. */
export function IconPicker({
  value,
  onChange,
  palette,
}: {
  value: string | null;
  onChange: (icon: string | null) => void;
  palette: Palette;
}) {
  const lang = useLang();
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/[\s_]+/g, "-");
    if (!s) return KIT_ICONS;
    return KIT_ICONS.filter((i) => i.name.includes(s) || i.pascal.toLowerCase().includes(s.replace(/-/g, "")));
  }, [q]);

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <span style={{ position: "absolute", left: 8, top: 8, color: palette.mutedForeground }}>
          <Icon name="search" size={16} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchIcons", lang)}
          style={{
            width: "100%",
            height: 32,
            paddingLeft: 30,
            paddingRight: 10,
            borderRadius: 6,
            border: `1px solid ${palette.input}`,
            background: palette.background,
            color: palette.foreground,
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      <div
        className="no-scrollbar"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))",
          gap: 2,
          height: 236,
          overflowY: "auto",
          overflowX: "hidden",
          padding: 4,
          borderRadius: 6,
          border: `1px solid ${palette.border}`,
          background: palette.background,
          alignContent: "start",
        }}
      >
        {visible.map((i) => {
          const on = value === i.name;
          return (
            <button
              key={i.name}
              /* the tooltip names the variant the prompt will quote */
              title={`IconName::${i.pascal}`}
              aria-label={i.name}
              aria-pressed={on}
              onClick={() => onChange(i.name)}
              style={{
                aspectRatio: "1",
                minWidth: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 4,
                border: "none",
                background: on ? palette.primary : "transparent",
                color: on ? palette.primaryForeground : palette.foreground,
                cursor: "pointer",
              }}
            >
              <Icon name={i.name} size={16} />
            </button>
          );
        })}
        {visible.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: 16, color: palette.mutedForeground, display: "grid", placeItems: "center" }}>
            <Icon name="eye-off" size={20} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.5, color: palette.mutedForeground, padding: "6px 4px 0" }}>
        {t("iconSetHint", lang)}
      </div>
    </div>
  );
}
