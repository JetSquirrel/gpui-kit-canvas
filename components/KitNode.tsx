"use client";

import { motion } from "motion/react";
import {
  H,
  Item,
  Kind,
  KIND_SPEC,
  LIST_ROW_H,
  MENU_ROW_H,
  MEASURED,
  Palette,
  Radii,
  ROW_SEP,
  SIDEBAR_COLLAPSED_W,
  STATUS_BAR_H,
  TABLE_ROW_H,
  TITLE_BAR_H,
  TRAFFIC_INSET,
  TREE_ROW_H,
  baseRadii,
  onToken,
  sizeOf,
  tableRowsOf,
  variantShadow,
  variantStyle,
} from "@/lib/tokens";
import { KIT_ICON_BY_NAME } from "@/lib/kit-icons.gen";
import { withAlpha } from "@/lib/color";
import { t, useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/* ---------- icons ----------
 * The canvas draws the very icons gpui-kit ships, so a sketch can only name an
 * icon the generated app can render. See script/gen-kit-icons.mjs. */

export function Icon({
  name,
  size = 16,
  color,
  strokeWidth,
  className,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const icon = KIT_ICON_BY_NAME[name];
  if (!icon) {
    /* an unknown name draws nothing but still holds its slot, so a row's other
     * columns do not shift while the author is picking an icon */
    return <span aria-hidden style={{ display: "inline-block", width: size, height: size, ...style }} />;
  }
  return (
    <svg
      aria-hidden
      className={className}
      viewBox={icon.view}
      width={size}
      height={size}
      fill={icon.fill === "currentColor" ? "currentColor" : "none"}
      stroke={icon.stroke === "none" ? "none" : "currentColor"}
      strokeWidth={strokeWidth ?? Number(icon.width)}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flex: "0 0 auto", color, ...style }}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}

/* ---------- shared bits ---------- */

const ellipsis = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/** kinds that paint their own parts, so the wrapper stays transparent */
const NO_BOX: Kind[] = [
  "switch",
  "checkbox",
  "radio",
  "slider",
  "text",
  "label",
  "divider",
  "breadcrumb",
  "toolbar",
  "spinner",
  "progress",
  "icon",
  "buttonGroup",
];

/** the colour a semantic variant carries, for an Alert or a Notification icon */
function statusColor(item: Item, p: Palette): string {
  switch (item.variant) {
    case "danger":
      return p.danger;
    case "warning":
      return p.warning;
    case "success":
      return p.success;
    case "info":
      return p.info;
    case "primary":
      return p.primary;
    default:
      return p.mutedForeground;
  }
}

const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap, minWidth: 0 });
const col = (gap = 4): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap, minWidth: 0 });

/** a medium Button: h_8, px_2p5, an 8px gap and text_base */
export function ButtonContent({ item }: { item: Item }) {
  const hasIcon = !!item.icon;
  const hasLabel = item.label.trim().length > 0;
  return (
    <span
      style={{
        ...row(hasIcon && hasLabel ? 8 : 0),
        justifyContent: "center",
        padding: hasLabel ? "0 10px" : 0,
        minWidth: hasLabel ? undefined : H,
        height: "100%",
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
      }}
    >
      {hasIcon && <Icon name={item.icon!} size={16} />}
      {hasLabel && <span>{item.label}</span>}
    </span>
  );
}

function CheckboxContent({ item, p }: { item: Item; p: Palette }) {
  const on = !!item.checked;
  return (
    <span style={{ ...row(8), height: 16 }}>
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          flex: "0 0 auto",
          boxSizing: "border-box",
          background: on ? p.primary : p.background,
          border: on ? "none" : `1px solid ${p.input}`,
          color: p.primaryForeground,
          display: "grid",
          placeItems: "center",
        }}
      >
        {on && <Icon name="check" size={12} strokeWidth={3} />}
      </span>
      {item.label.trim() && <span style={{ fontSize: 14, color: p.foreground, whiteSpace: "nowrap" }}>{item.label}</span>}
    </span>
  );
}

function SwitchContent({ item, p }: { item: Item; p: Palette }) {
  const on = !!item.checked;
  return (
    <span style={{ ...row(8), height: 20 }}>
      <span
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          flex: "0 0 auto",
          background: on ? p.primary : p.switchBg,
          position: "relative",
          transition: "background 140ms",
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
      {item.label.trim() && <span style={{ fontSize: 14, color: p.foreground, whiteSpace: "nowrap" }}>{item.label}</span>}
    </span>
  );
}

function TextContent({ item, p }: { item: Item; p: Palette }) {
  return (
    <span
      style={{
        fontSize: item.size ?? 20,
        fontWeight: item.bold ? 700 : 400,
        lineHeight: 1.4,
        color: p.foreground,
        whiteSpace: "nowrap",
      }}
    >
      {item.label}
    </span>
  );
}

function LabelContent({ item, p }: { item: Item; p: Palette }) {
  return (
    <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: p.foreground, whiteSpace: "nowrap" }}>
      {item.label}
    </span>
  );
}

function BadgeContent({ item }: { item: Item }) {
  const text = item.label.trim();
  if (!text) return <span style={{ display: "block", width: 8, height: 8 }} />;
  return (
    <span style={{ padding: "0 6px", fontSize: 11, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" }}>{text}</span>
  );
}

function TagContent({ item }: { item: Item }) {
  return (
    <span style={{ ...row(4), padding: "0 6px", height: "100%", fontSize: 12, whiteSpace: "nowrap" }}>
      <span>{item.label}</span>
      {item.checked && <Icon name="close" size={11} />}
    </span>
  );
}

function BreadcrumbContent({ item, p }: { item: Item; p: Palette }) {
  const trail = item.tabs ?? [];
  return (
    <span style={{ ...row(4), height: 24, fontSize: 14 }}>
      {trail.map((crumb, i) => (
        <span key={i} style={{ ...row(4) }}>
          {i > 0 && <Icon name="chevron-right" size={14} color={p.mutedForeground} />}
          <span style={{ color: i === trail.length - 1 ? p.foreground : p.mutedForeground, whiteSpace: "nowrap" }}>
            {crumb.label}
          </span>
        </span>
      ))}
    </span>
  );
}

function ButtonGroupContent({ item, p }: { item: Item; p: Palette }) {
  const segments = item.tabs ?? [];
  const selected = item.value ?? -1;
  const base = variantStyle(item.variant, p);
  return (
    <span style={{ ...row(0), height: H }}>
      {segments.map((seg, i) => {
        const active = i === selected;
        return (
          <span
            key={i}
            style={{
              ...row(6),
              height: "100%",
              padding: "0 10px",
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: "nowrap",
              boxSizing: "border-box",
              background: active ? p.accent : base.background,
              color: active ? p.accentForeground : base.color,
              border: base.border === "none" ? "none" : `1px solid ${p.border}`,
              borderLeftWidth: i === 0 || base.border === "none" ? undefined : 0,
              borderTopLeftRadius: i === 0 ? 6 : 0,
              borderBottomLeftRadius: i === 0 ? 6 : 0,
              borderTopRightRadius: i === segments.length - 1 ? 6 : 0,
              borderBottomRightRadius: i === segments.length - 1 ? 6 : 0,
            }}
          >
            {seg.icon && <Icon name={seg.icon} size={14} />}
            {seg.label && <span>{seg.label}</span>}
          </span>
        );
      })}
    </span>
  );
}

/** Content for kinds that size to their text; rendered again offscreen to measure. */
export function MeasuredContent({ item, p }: { item: Item; p: Palette }) {
  switch (item.kind) {
    case "button":
      return <ButtonContent item={item} />;
    case "checkbox":
      return <CheckboxContent item={item} p={p} />;
    case "switch":
      return <SwitchContent item={item} p={p} />;
    case "text":
      return <TextContent item={item} p={p} />;
    case "label":
      return <LabelContent item={item} p={p} />;
    case "badge":
      return <BadgeContent item={item} />;
    case "tag":
      return <TagContent item={item} />;
    case "breadcrumb":
      return <BreadcrumbContent item={item} p={p} />;
    case "buttonGroup":
      return <ButtonGroupContent item={item} p={p} />;
    default:
      return null;
  }
}

/* ---------- window shell ---------- */

function TrafficLights() {
  const dots = ["#ff5f57", "#febc2e", "#28c840"];
  return (
    <span style={{ ...row(8), paddingLeft: TRAFFIC_INSET - 8 }}>
      {dots.map((c) => (
        <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
      ))}
    </span>
  );
}

function WindowButtons({ p }: { p: Palette }) {
  return (
    <span style={{ ...row(2) }}>
      {["window-minimize", "window-maximize", "window-close"].map((name) => (
        <span key={name} style={{ display: "grid", placeItems: "center", width: 32, height: TITLE_BAR_H }}>
          <Icon name={name} size={14} color={p.mutedForeground} />
        </span>
      ))}
    </span>
  );
}

function TitleBarBody({ item, p }: { item: Item; p: Palette }) {
  const mac = item.controls === "mac";
  const win = item.controls === "windows";
  return (
    <div style={{ ...row(8), height: "100%", padding: `0 ${win ? 0 : 8}px 0 ${mac ? 8 : 12}px` }}>
      {mac && <TrafficLights />}
      {item.icon && <Icon name={item.icon} size={16} color={p.foreground} />}
      <span style={{ fontSize: 13, fontWeight: 500, color: p.foreground, ...ellipsis }}>{item.label}</span>
      <span style={{ flex: 1 }} />
      {item.icon2 && (
        <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: 4 }}>
          <Icon name={item.icon2} size={16} color={p.mutedForeground} />
        </span>
      )}
      {win && <WindowButtons p={p} />}
    </div>
  );
}

function SidebarBody({ item, p }: { item: Item; p: Palette }) {
  const collapsed = !!item.collapsed;
  const entries = item.tabs ?? [];
  const selected = item.value ?? 0;
  return (
    <div style={{ ...col(2), height: "100%", padding: 8 }}>
      <div style={{ ...row(8), height: 32, padding: collapsed ? 0 : "0 8px", justifyContent: collapsed ? "center" : undefined }}>
        {item.icon && <Icon name={item.icon} size={16} color={p.sidebarForeground} />}
        {!collapsed && (
          <span style={{ fontSize: 13, fontWeight: 600, color: p.sidebarForeground, ...ellipsis }}>{item.label}</span>
        )}
      </div>
      <div style={{ height: 8 }} />
      {entries.map((entry, i) => {
        const active = i === selected;
        return (
          <div
            key={i}
            style={{
              ...row(8),
              height: 32,
              flex: "0 0 auto",
              padding: collapsed ? 0 : "0 8px",
              justifyContent: collapsed ? "center" : undefined,
              borderRadius: 6,
              background: active ? p.sidebarAccent : "transparent",
              color: active ? p.sidebarAccentForeground : p.sidebarForeground,
              fontSize: 14,
              fontWeight: active ? 500 : 400,
            }}
          >
            {entry.icon && <Icon name={entry.icon} size={16} />}
            {!collapsed && <span style={ellipsis}>{entry.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function ToolbarBody({ item, p }: { item: Item; p: Palette }) {
  return (
    <div style={{ ...row(4), height: "100%", padding: "0 4px" }}>
      {(item.tabs ?? []).map((entry, i) => (
        <span
          key={i}
          style={{ display: "grid", placeItems: "center", width: H, height: H, borderRadius: 6, color: p.foreground }}
        >
          {entry.icon && <Icon name={entry.icon} size={16} />}
        </span>
      ))}
    </div>
  );
}

function StatusBarBody({ item, p }: { item: Item; p: Palette }) {
  return (
    <div style={{ ...row(8), height: "100%", padding: "0 8px", fontSize: 12, color: p.mutedForeground }}>
      {item.icon && <Icon name={item.icon} size={12} />}
      <span style={ellipsis}>{item.label}</span>
      <span style={{ flex: 1 }} />
      {item.supporting?.trim() && <span style={ellipsis}>{item.supporting}</span>}
      {item.icon2 && <Icon name={item.icon2} size={12} />}
    </div>
  );
}

/* ---------- inputs ---------- */

function InputBox({ item, p, multiline }: { item: Item; p: Palette; multiline?: boolean }) {
  const help = item.supporting?.trim();
  const boxH = multiline ? (item.size2 ?? 84) - (help ? 18 : 0) : H;
  return (
    <div style={{ ...col(4), height: "100%" }}>
      <div
        style={{
          ...row(6),
          height: boxH,
          flex: "0 0 auto",
          boxSizing: "border-box",
          padding: "0 8px",
          alignItems: multiline ? "flex-start" : "center",
          paddingTop: multiline ? 6 : 0,
          background: p.background,
          border: `1px solid ${p.input}`,
          borderRadius: 6,
          color: p.mutedForeground,
          fontSize: 14,
          opacity: item.disabled ? 0.5 : 1,
        }}
      >
        {item.icon && <Icon name={item.icon} size={14} />}
        <span style={{ ...ellipsis, flex: 1 }}>{item.label}</span>
      </div>
      {help && <span style={{ fontSize: 12, color: p.mutedForeground, ...ellipsis }}>{help}</span>}
    </div>
  );
}

function SelectBody({ item, p }: { item: Item; p: Palette }) {
  return (
    <div
      style={{
        ...row(6),
        height: "100%",
        padding: "0 8px",
        fontSize: 14,
        color: p.foreground,
        opacity: item.disabled ? 0.5 : 1,
      }}
    >
      {item.icon && <Icon name={item.icon} size={14} color={p.mutedForeground} />}
      <span style={{ ...ellipsis, flex: 1 }}>{item.label}</span>
      <Icon name="chevrons-up-down" size={14} color={p.mutedForeground} />
    </div>
  );
}

function RadioBody({ item, p }: { item: Item; p: Palette }) {
  const selected = item.value ?? 0;
  return (
    <div style={{ ...col(4), opacity: item.disabled ? 0.5 : 1 }}>
      {(item.tabs ?? []).map((option, i) => {
        const on = i === selected;
        return (
          <div key={i} style={{ ...row(8), height: 20 }}>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                flex: "0 0 auto",
                boxSizing: "border-box",
                border: `1px solid ${on ? p.primary : p.input}`,
                display: "grid",
                placeItems: "center",
              }}
            >
              {on && <span style={{ width: 8, height: 8, borderRadius: 4, background: p.primary }} />}
            </span>
            <span style={{ fontSize: 14, color: p.foreground, ...ellipsis }}>{option.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SliderBody({ item, p }: { item: Item; p: Palette }) {
  const value = Math.min(100, Math.max(0, item.value ?? 40));
  const label = item.label.trim();
  return (
    <div style={{ ...row(8), height: "100%", opacity: item.disabled ? 0.5 : 1 }}>
      {label && <span style={{ fontSize: 12, color: p.mutedForeground, whiteSpace: "nowrap" }}>{label}</span>}
      <span style={{ position: "relative", flex: 1, height: 4, borderRadius: 2, background: p.secondary }}>
        <span style={{ position: "absolute", inset: 0, right: `${100 - value}%`, borderRadius: 2, background: p.sliderBar }} />
        <span
          style={{
            position: "absolute",
            top: -6,
            left: `calc(${value}% - 8px)`,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: p.sliderThumb,
            border: `1px solid ${p.border}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.16)",
          }}
        />
      </span>
    </div>
  );
}

/* ---------- containment ---------- */

function GroupBoxBody({ item, p }: { item: Item; p: Palette }) {
  return (
    <div style={{ ...col(4), height: "100%", padding: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: p.groupBoxForeground, ...ellipsis }}>{item.label}</span>
      {item.supporting?.trim() && (
        <span style={{ fontSize: 12, color: p.mutedForeground, ...ellipsis }}>{item.supporting}</span>
      )}
    </div>
  );
}

function TabsBody({ item, p }: { item: Item; p: Palette }) {
  const tabs = item.tabs ?? [];
  const selected = item.value ?? 0;
  return (
    <div style={{ ...row(0), height: "100%" }}>
      {tabs.map((tab, i) => {
        const active = i === selected;
        return (
          <span
            key={i}
            style={{
              ...row(6),
              height: "100%",
              padding: "0 12px",
              fontSize: 14,
              fontWeight: active ? 500 : 400,
              background: active ? p.tabActive : p.tab,
              color: active ? p.tabActiveForeground : p.tabForeground,
              boxShadow: active ? `inset 0 -2px 0 0 ${p.primary}` : "none",
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon && <Icon name={tab.icon} size={14} />}
            {tab.label && <span>{tab.label}</span>}
          </span>
        );
      })}
    </div>
  );
}

function ResizableBody({ item, p }: { item: Item; p: Palette }) {
  const split = Math.min(90, Math.max(10, item.value ?? 30));
  const vertical = item.side === "top" || item.side === "bottom";
  const first = <span style={{ flex: `0 0 ${split}%`, background: p.sidebar }} />;
  const second = <span style={{ flex: 1, background: p.background }} />;
  const flip = item.side === "right" || item.side === "bottom";
  return (
    <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", height: "100%", width: "100%" }}>
      {flip ? second : first}
      <span
        style={{
          flex: "0 0 auto",
          width: vertical ? "100%" : 1,
          height: vertical ? 1 : "100%",
          background: p.border,
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: vertical ? 24 : 3,
            height: vertical ? 3 : 24,
            borderRadius: 2,
            background: p.mutedForeground,
            opacity: 0.6,
          }}
        />
      </span>
      {flip ? first : second}
    </div>
  );
}

/* ---------- overlays ---------- */

function DialogBody({ item, p }: { item: Item; p: Palette }) {
  const lang = useLang();
  const confirmStyle = variantStyle(item.variant === "default" ? "primary" : item.variant, p);
  return (
    <div style={{ ...col(8), height: "100%", padding: 16 }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: p.foreground, ...ellipsis }}>{item.label}</span>
      {item.supporting?.trim() && (
        <span style={{ fontSize: 14, color: p.mutedForeground, ...ellipsis }}>{item.supporting}</span>
      )}
      <span style={{ flex: 1 }} />
      <div style={{ ...row(8), justifyContent: "flex-end" }}>
        <span
          style={{
            ...row(0),
            justifyContent: "center",
            height: H,
            padding: "0 10px",
            borderRadius: 6,
            fontSize: 14,
            background: "transparent",
            color: p.foreground,
            border: `1px solid ${p.border}`,
            whiteSpace: "nowrap",
          }}
        >
          {t("cancel", lang)}
        </span>
        <span
          style={{
            ...row(0),
            justifyContent: "center",
            height: H,
            padding: "0 10px",
            borderRadius: 6,
            fontSize: 14,
            whiteSpace: "nowrap",
            ...confirmStyle,
          }}
        >
          {item.confirm?.trim() || t("ok", lang)}
        </span>
      </div>
    </div>
  );
}

function SheetBody({ item, p }: { item: Item; p: Palette }) {
  return (
    <div style={{ ...col(0), height: "100%" }}>
      <div style={{ ...row(8), height: 44, padding: "0 12px 0 16px", borderBottom: `1px solid ${p.border}` }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: p.foreground, ...ellipsis }}>{item.label}</span>
        <span style={{ flex: 1 }} />
        <Icon name="close" size={16} color={p.mutedForeground} />
      </div>
      {item.supporting?.trim() && (
        <div style={{ padding: 16, fontSize: 14, color: p.mutedForeground }}>{item.supporting}</div>
      )}
    </div>
  );
}

function PopoverBody({ item, p }: { item: Item; p: Palette }) {
  return (
    <div style={{ ...col(4), height: "100%", padding: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: p.popoverForeground, ...ellipsis }}>{item.label}</span>
      {item.supporting?.trim() && (
        <span style={{ fontSize: 12, color: p.mutedForeground, ...ellipsis }}>{item.supporting}</span>
      )}
    </div>
  );
}

function NotificationBody({ item, p }: { item: Item; p: Palette }) {
  return (
    <div style={{ ...row(12), height: "100%", padding: "0 16px" }}>
      {item.icon && <Icon name={item.icon} size={16} color={statusColor(item, p)} />}
      <div style={{ ...col(4), flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: p.popoverForeground, ...ellipsis }}>{item.label}</span>
        {item.supporting?.trim() && (
          <span style={{ fontSize: 12, color: p.mutedForeground, ...ellipsis }}>{item.supporting}</span>
        )}
      </div>
      <Icon name="close" size={14} color={p.mutedForeground} />
    </div>
  );
}

function MenuBody({ item, p }: { item: Item; p: Palette }) {
  const selected = item.value ?? -1;
  return (
    <div style={{ ...col(0), padding: 4 }}>
      {(item.tabs ?? []).map((entry, i) => (
        <div
          key={i}
          style={{
            ...row(8),
            height: MENU_ROW_H,
            padding: "0 8px",
            borderRadius: 4,
            fontSize: 14,
            background: i === selected ? p.accent : "transparent",
            color: i === selected ? p.accentForeground : p.popoverForeground,
          }}
        >
          {entry.icon && <Icon name={entry.icon} size={14} />}
          <span style={ellipsis}>{entry.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- data ---------- */

function ListBody({ item, p }: { item: Item; p: Palette }) {
  const selected = item.value ?? -1;
  return (
    <div style={{ ...col(0), padding: 4 }}>
      {(item.tabs ?? []).map((entry, i) => {
        const active = i === selected;
        return (
          <div
            key={i}
            style={{
              ...row(8),
              height: LIST_ROW_H,
              padding: "0 8px",
              fontSize: 14,
              boxSizing: "border-box",
              background: active ? p.listActive : i % 2 === 1 ? p.listEven : "transparent",
              borderLeft: active ? `2px solid ${p.listActiveBorder}` : "2px solid transparent",
              color: p.foreground,
            }}
          >
            {entry.icon && <Icon name={entry.icon} size={14} color={p.mutedForeground} />}
            <span style={ellipsis}>{entry.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TreeBody({ item, p }: { item: Item; p: Palette }) {
  const nodes = item.tabs ?? [];
  const selected = item.value ?? -1;
  /** two leading spaces is one level of nesting, so a NavTab can carry depth */
  const depthOf = (label: string) => Math.floor((label.match(/^ */)?.[0].length ?? 0) / 2);
  return (
    <div style={{ ...col(0), padding: 4 }}>
      {nodes.map((node, i) => {
        const depth = depthOf(node.label);
        const open = depthOf(nodes[i + 1]?.label ?? "") > depth;
        return (
          <div
            key={i}
            style={{
              ...row(4),
              height: TREE_ROW_H,
              paddingLeft: 4 + depth * 16,
              paddingRight: 8,
              fontSize: 14,
              borderRadius: 4,
              background: i === selected ? p.listActive : "transparent",
              color: p.foreground,
            }}
          >
            <Icon
              name={open ? "chevron-down" : node.icon === "folder-closed" ? "chevron-right" : "dash"}
              size={12}
              color={node.icon === "file" || node.icon === "file-text" ? "transparent" : p.mutedForeground}
            />
            {node.icon && <Icon name={node.icon} size={14} color={p.mutedForeground} />}
            <span style={ellipsis}>{node.label.trim()}</span>
          </div>
        );
      })}
    </div>
  );
}

function DataTableBody({ item, p }: { item: Item; p: Palette }) {
  const columns = item.columns ?? [];
  const rows = tableRowsOf(item);
  const cell = (text: string, numeric?: boolean): React.CSSProperties => ({
    flex: 1,
    minWidth: 0,
    padding: "0 8px",
    textAlign: numeric ? "right" : "left",
    ...ellipsis,
  });
  return (
    <div style={{ ...col(0), height: "100%" }}>
      <div
        style={{
          ...row(0),
          height: TABLE_ROW_H,
          flex: "0 0 auto",
          background: p.tableHead,
          borderBottom: `1px solid ${p.tableRowBorder}`,
          fontSize: 12,
          fontWeight: 600,
          color: p.tableHeadForeground,
        }}
      >
        {columns.map((column, i) => (
          <span key={i} style={cell(column.label, column.numeric)}>
            {column.label}
          </span>
        ))}
      </div>
      {rows.map((cells, r) => (
        <div
          key={r}
          style={{
            ...row(0),
            height: TABLE_ROW_H,
            flex: "0 0 auto",
            fontSize: 14,
            color: p.foreground,
            background: r % 2 === 1 ? p.tableEven : "transparent",
            borderBottom: r === rows.length - 1 ? "none" : `1px solid ${p.tableRowBorder}`,
          }}
        >
          {columns.map((column, i) => (
            <span key={i} style={cell(cells[i] ?? "", column.numeric)}>
              {cells[i] ?? ""}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- content and feedback ---------- */

function ImageBody({ item, p }: { item: Item; p: Palette }) {
  if (item.src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
      <Icon name="frame" size={24} color={p.mutedForeground} />
    </div>
  );
}

function AlertBody({ item, p }: { item: Item; p: Palette }) {
  const tint = statusColor(item, p);
  return (
    <div style={{ ...row(12), height: "100%", padding: "0 12px" }}>
      {item.icon && <Icon name={item.icon} size={16} color={tint} />}
      <div style={{ ...col(4), flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: p.foreground, ...ellipsis }}>{item.label}</span>
        {item.supporting?.trim() && (
          <span style={{ fontSize: 12, color: p.mutedForeground, ...ellipsis }}>{item.supporting}</span>
        )}
      </div>
    </div>
  );
}

function ProgressBody({ item, p }: { item: Item; p: Palette }) {
  const determinate = item.value !== undefined;
  const value = Math.min(100, Math.max(0, item.value ?? 0));
  if (item.circle) {
    const size = 32;
    const stroke = 3;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    return (
      <svg width={size} height={size} style={{ display: "block" }} className={determinate ? undefined : "kit-spin"}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={p.secondary} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={p.progressBar}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (determinate ? value / 100 : 0.25))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    );
  }
  return (
    <div style={{ width: "100%", height: 6, borderRadius: 3, background: p.secondary, overflow: "hidden" }}>
      <div
        className={determinate ? undefined : "kit-slide"}
        style={{
          height: "100%",
          width: determinate ? `${value}%` : "40%",
          borderRadius: 3,
          background: p.progressBar,
        }}
      />
    </div>
  );
}

function SpinnerBody({ item, p }: { item: Item; p: Palette }) {
  return (
    <span className="kit-spin" style={{ display: "block" }}>
      <Icon name="loader-circle" size={item.size ?? 20} color={p.mutedForeground} />
    </span>
  );
}

function SkeletonBody({ p }: { p: Palette }) {
  return <div className="kit-shimmer" style={{ width: "100%", height: "100%", background: p.skeleton }} />;
}

/* ---------- the switch ---------- */

function Body({ item, p }: { item: Item; p: Palette }) {
  switch (item.kind) {
    case "button":
    case "checkbox":
    case "switch":
    case "text":
    case "label":
    case "badge":
    case "tag":
    case "breadcrumb":
    case "buttonGroup":
      return <MeasuredContent item={item} p={p} />;
    case "titleBar":
      return <TitleBarBody item={item} p={p} />;
    case "sidebar":
      return <SidebarBody item={item} p={p} />;
    case "toolbar":
      return <ToolbarBody item={item} p={p} />;
    case "statusBar":
      return <StatusBarBody item={item} p={p} />;
    case "iconButton":
      return (
        <div style={{ display: "grid", placeItems: "center", height: "100%", opacity: item.disabled ? 0.5 : 1 }}>
          {item.icon && <Icon name={item.icon} size={Math.round((item.size ?? H) * 0.5)} />}
        </div>
      );
    case "menu":
      return <MenuBody item={item} p={p} />;
    case "input":
      return <InputBox item={item} p={p} />;
    case "textarea":
      return <InputBox item={item} p={p} multiline />;
    case "select":
      return <SelectBody item={item} p={p} />;
    case "radio":
      return <RadioBody item={item} p={p} />;
    case "slider":
      return <SliderBody item={item} p={p} />;
    case "groupBox":
      return <GroupBoxBody item={item} p={p} />;
    case "tabs":
      return <TabsBody item={item} p={p} />;
    case "resizable":
      return <ResizableBody item={item} p={p} />;
    case "dialog":
      return <DialogBody item={item} p={p} />;
    case "sheet":
      return <SheetBody item={item} p={p} />;
    case "popover":
      return <PopoverBody item={item} p={p} />;
    case "notification":
      return <NotificationBody item={item} p={p} />;
    case "list":
      return <ListBody item={item} p={p} />;
    case "tree":
      return <TreeBody item={item} p={p} />;
    case "dataTable":
      return <DataTableBody item={item} p={p} />;
    case "icon":
      return (
        <div style={{ display: "grid", placeItems: "center", height: "100%", color: p.foreground }}>
          {item.icon && <Icon name={item.icon} size={item.size ?? 16} />}
        </div>
      );
    case "image":
      return <ImageBody item={item} p={p} />;
    case "alert":
      return <AlertBody item={item} p={p} />;
    case "progress":
      return <ProgressBody item={item} p={p} />;
    case "spinner":
      return <SpinnerBody item={item} p={p} />;
    case "skeleton":
      return <SkeletonBody p={p} />;
    case "panel":
    case "divider":
      return null;
  }
}

/** The wrapper's own background and border, by kind. */
function boxStyle(item: Item, p: Palette): React.CSSProperties {
  if (NO_BOX.includes(item.kind)) return { background: "transparent", border: "none" };
  switch (item.kind) {
    case "button":
    case "iconButton":
      return { ...variantStyle(item.variant, p), opacity: item.disabled ? 0.5 : 1 };
    case "badge":
    case "tag":
      return variantStyle(item.variant, p);
    case "titleBar":
      return { background: p.titleBar, borderBottom: `1px solid ${p.titleBarBorder}`, color: p.foreground };
    case "statusBar":
      return { background: p.statusBar, borderTop: `1px solid ${p.statusBarBorder}`, color: p.mutedForeground };
    case "sidebar":
      return { background: p.sidebar, borderRight: `1px solid ${p.sidebarBorder}`, color: p.sidebarForeground };
    case "sheet": {
      const edge = item.side === "left" ? "Right" : item.side === "top" ? "Bottom" : item.side === "bottom" ? "Top" : "Left";
      return { background: p.background, [`border${edge}`]: `1px solid ${p.border}`, color: p.foreground };
    }
    case "panel": {
      const token = item.fill ?? "muted";
      return { background: p[token], color: onToken(token, p), border: `1px solid ${p.border}` };
    }
    case "groupBox":
      return { background: p.groupBox, border: `1px solid ${p.border}`, color: p.groupBoxForeground };
    case "menu":
    case "popover":
    case "notification":
      return { background: p.popover, border: `1px solid ${p.border}`, color: p.popoverForeground };
    case "dialog":
      return { background: p.popover, border: `1px solid ${p.border}`, color: p.popoverForeground };
    case "input":
    case "textarea":
      /* the field paints its own frame so its help text can sit outside it */
      return { background: "transparent", border: "none" };
    case "select":
      return {
        background: p.background,
        border: `1px solid ${p.input}`,
        color: p.foreground,
        opacity: item.disabled ? 0.5 : 1,
      };
    case "tabs":
      return { background: p.tabBar, border: "none", color: p.tabForeground };
    case "list":
      return { background: p.list, border: `1px solid ${p.border}`, color: p.foreground };
    case "dataTable":
      return { background: p.table, border: `1px solid ${p.border}`, color: p.foreground };
    case "tree":
      return { background: p.background, border: `1px solid ${p.border}`, color: p.foreground };
    case "resizable":
      return { background: p.background, border: `1px solid ${p.border}` };
    case "alert": {
      const tint = statusColor(item, p);
      return item.variant === "default"
        ? { background: p.muted, border: `1px solid ${p.border}`, color: p.foreground }
        : { background: withAlpha(tint, 0.12), border: `1px solid ${withAlpha(tint, 0.4)}`, color: p.foreground };
    }
    case "image":
      return { background: p.muted, border: `1px solid ${p.border}` };
    case "skeleton":
      return { background: "transparent", border: "none" };
    case "divider":
      return { background: p.border, border: "none" };
    default:
      return { background: p.background, border: `1px solid ${p.border}`, color: p.foreground };
  }
}

/** gpui-kit only draws a shadow while `theme.shadow` is on. */
function shadowOf(item: Item, shadow: boolean): string {
  if (!shadow || NO_BOX.includes(item.kind)) return "none";
  switch (item.kind) {
    case "button":
    case "iconButton":
      return variantShadow(item.variant);
    case "dialog":
      return "0 10px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)";
    case "sheet":
      return "0 4px 24px rgba(0,0,0,0.14)";
    case "menu":
    case "popover":
    case "notification":
      return "0 4px 16px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)";
    default:
      return "none";
  }
}

export type { Radii };

/** Corner radii are driven continuously by the magnet; a stiff spring keeps them on the pointer. */
const RADIUS_TWEEN = { type: "spring" as const, stiffness: 900, damping: 48, mass: 0.4 };

export function KitNode({
  item,
  palette,
  radii,
  widths,
  pressed,
  dragging,
  selected,
  interactive = true,
  onPointerDown,
}: {
  item: Item;
  palette: Palette;
  radii?: Radii;
  widths: Record<string, number>;
  pressed?: boolean;
  dragging?: boolean;
  selected?: boolean;
  interactive?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}) {
  const theme = useTheme();
  const r = radii ?? baseRadii(item);
  const size = sizeOf(item, widths);
  const measured = MEASURED.includes(item.kind);
  const clips = !NO_BOX.includes(item.kind) && item.kind !== "input" && item.kind !== "textarea";

  return (
    <motion.div
      data-node={item.id}
      data-kind={item.kind}
      onPointerDown={onPointerDown}
      initial={false}
      animate={{
        borderTopLeftRadius: r.tl,
        borderBottomLeftRadius: r.bl,
        borderTopRightRadius: r.tr,
        borderBottomRightRadius: r.br,
        scale: pressed ? 0.98 : 1,
      }}
      transition={{
        borderTopLeftRadius: RADIUS_TWEEN,
        borderBottomLeftRadius: RADIUS_TWEEN,
        borderTopRightRadius: RADIUS_TWEEN,
        borderBottomRightRadius: RADIUS_TWEEN,
        scale: { type: "spring", stiffness: 700, damping: 30, mass: 0.5 },
      }}
      style={{
        ...boxStyle(item, palette),
        width: measured ? undefined : size.w,
        height: size.h,
        display: measured ? "inline-flex" : "block",
        alignItems: "center",
        overflow: clips ? "hidden" : "visible",
        cursor: !interactive ? "default" : dragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        boxSizing: "border-box",
        boxShadow: shadowOf(item, theme.shadow),
        outline: selected ? `2px solid ${palette.ring}` : "2px solid transparent",
        outlineOffset: 3,
        transition: "outline-color 120ms",
        flex: "0 0 auto",
      }}
    >
      <Body item={item} p={palette} />
    </motion.div>
  );
}

/** Plain (non-animated) rendering of a part; used where frames must be deterministic. */
export function KitStatic({
  item,
  palette,
  radii,
  style,
  shadow = true,
}: {
  item: Item;
  palette: Palette;
  radii?: Radii;
  style?: React.CSSProperties;
  shadow?: boolean;
}) {
  const r = radii ?? baseRadii(item);
  const size = sizeOf(item, {});
  const measured = MEASURED.includes(item.kind);
  const clips = !NO_BOX.includes(item.kind) && item.kind !== "input" && item.kind !== "textarea";
  return (
    <div
      style={{
        ...boxStyle(item, palette),
        width: measured ? undefined : size.w,
        height: size.h,
        display: measured ? "inline-flex" : "block",
        alignItems: "center",
        overflow: clips ? "hidden" : "visible",
        boxSizing: "border-box",
        boxShadow: shadowOf(item, shadow),
        borderTopLeftRadius: r.tl,
        borderTopRightRadius: r.tr,
        borderBottomLeftRadius: r.bl,
        borderBottomRightRadius: r.br,
        flex: "0 0 auto",
        ...style,
      }}
    >
      <Body item={item} p={palette} />
    </div>
  );
}
