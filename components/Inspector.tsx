"use client";

import { useEffect, useRef, useState } from "react";
import {
  Action,
  BACK_TARGET,
  CONTENT_W,
  Frame,
  HALF_W,
  Item,
  KIND_SPEC,
  Kind,
  NavTab,
  Palette,
  SHELLS,
  SIDEBAR_W,
  SIDES,
  STATUS_VARIANTS,
  Shell,
  Side,
  TAPPABLE,
  TOGGLEABLE,
  TRANSITIONS,
  Transition,
  VARIANTS,
  Variant,
  WINDOW_H,
  WINDOW_SIZES,
  WINDOW_W,
  AlignKind,
  Place,
  R_INNER,
  actionSlotsOf,
  defaultColumnsFor,
  defaultTabsFor,
  frameH,
  frameW,
  toggleIcon,
  iconSlotsOf,
  setIconSlot,
  sizeOf,
  variantStyle,
} from "@/lib/tokens";
import { IconPicker } from "./IconPicker";
import { Icon } from "./KitNode";
import { ButtonRun, CornerIcon, Field, IconBtn, Section, Segmented, SizePresets, Slider, TidyButton, TidyState, Toggle, TokenChips } from "./ui";
import { AiWriteBtn } from "./AiPanel";
import { popHistory } from "@/lib/ai";
import { Lang, UIKey, t, useLang } from "@/lib/i18n";

/** The variants a kind really offers. A Button takes the whole `ButtonVariant`
 *  set; an Alert, Badge, Tag, Notification or Dialog only carries the semantic
 *  ones, because a status colour is for its meaning and not for decoration. */
export function variantsOf(kind: Kind): { key: Variant; label: string }[] {
  switch (kind) {
    case "alert":
    case "badge":
    case "tag":
    case "notification":
    case "dialog":
      return VARIANTS.filter((v) => STATUS_VARIANTS.includes(v.key));
    default:
      return VARIANTS;
  }
}

export function VariantSwatch({
  v,
  label,
  p,
  on,
  onClick,
  small,
}: {
  v: Variant;
  label: string;
  p: Palette;
  on: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  const st = variantStyle(v, p);
  const h = small ? 32 : 40;
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={on}
      className="kit-press"
      style={{
        height: h,
        borderRadius: 6,
        cursor: "pointer",
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: small ? "0 10px" : "0 12px",
        ...st,
        boxShadow: "none",
        outline: on ? `2px solid ${p.primary}` : "2px solid transparent",
        outlineOffset: 2,
      }}
    >
      {on && <Icon name="check" size={small ? 14 : 16} />}
      {label}
    </button>
  );
}

/** the shells and edges, named in the interface language */
const shellLabel = (k: Shell, lang: Lang) =>
  k === "single"
    ? t("shellSingle", lang)
    : k === "masterDetail"
      ? t("shellMasterDetail", lang)
      : k === "document"
        ? t("shellDocument", lang)
        : k === "utility"
          ? t("shellUtility", lang)
          : t("shellSidebar", lang);

const sideLabel = (k: Side, lang: Lang) =>
  k === "left" ? t("sideLeft", lang) : k === "right" ? t("sideRight", lang) : k === "top" ? t("sideTop", lang) : t("sideBottom", lang);

const MAX_IMAGE_PX = 1200;

/** hover text for a width preset that comes from the window frame */
export const widthPresetLabel = (v: number): string | undefined =>
  v === WINDOW_W
    ? t("windowWidth")
    : v === CONTENT_W
      ? t("contentWidth")
      : v === HALF_W
        ? t("halfWidth")
        : v === SIDEBAR_W
          ? t("sidebarWidth")
          : undefined;

const heightPresetLabel = (v: number): string | undefined =>
  v === WINDOW_H ? t("windowHeight") : v === WINDOW_H / 2 ? t("halfHeight") : undefined;

/** Downscale a picked file so the document stays small enough for localStorage. */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, MAX_IMAGE_PX / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/webp", 0.86));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

function FrameChips({
  frames,
  value,
  onChange,
  p,
  back,
  small,
}: {
  frames: Frame[];
  value: string | null;
  onChange: (id: string | null) => void;
  p: Palette;
  /** offer "go back" as a target */
  back?: boolean;
  small?: boolean;
}) {
  const lang = useLang();
  const h = small ? 32 : 36;
  const chip = (id: string | null, label: string, icon: string) => {
    const on = value === id;
    return (
      <button
        key={id ?? "none"}
        onClick={() => onChange(id)}
        className="kit-press"
        style={{
          height: h,
          padding: "0 12px 0 8px",
          borderRadius: h / 2,
          border: "none",
          background: on ? p.primary : p.accent,
          color: on ? p.primaryForeground : p.mutedForeground,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          maxWidth: "100%",
        }}
      >
        <Icon name={icon} size={18} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </button>
    );
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {chip(null, t("none", lang), "block")}
      {back && chip(BACK_TARGET, t("goBack", lang), "arrow_back")}
      {frames.map((f) => chip(f.id, f.name || t("screen", lang), "smartphone"))}
    </div>
  );
}

function TransitionPicker({ value, onChange, p }: { value: Transition; onChange: (t: Transition) => void; p: Palette }) {
  return (
    <Segmented<Transition>
      options={TRANSITIONS.map((tr) => ({ key: tr.key, icon: tr.icon, title: tr.label }))}
      value={value}
      onChange={onChange}
      p={p}
      height={34}
    />
  );
}

/** target frame (or back) plus the transition, for one tap target */
function ActionEditor({
  frames,
  action,
  onChange,
  p,
}: {
  frames: Frame[];
  action: Action | undefined;
  onChange: (a: Action | undefined) => void;
  p: Palette;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <FrameChips
        frames={frames}
        value={action?.to ?? null}
        onChange={(to) => onChange(to ? { to, transition: action?.transition ?? "slide" } : undefined)}
        p={p}
        back
      />
      {action && action.to !== BACK_TARGET && (
        <TransitionPicker value={action.transition} onChange={(transition) => onChange({ ...action, transition })} p={p} />
      )}
    </div>
  );
}

/** what a field's AI button needs from the page; `reason` explains a disabled button */
export type AiHooks = { ready: boolean; reason?: string; busy: boolean; onRun: () => void; onCancel: () => void };

/** a multiline field with the AI button under it, fused with a button that swaps the AI text and the original once the AI has written it */
function AiField({ ai, history, onRestore, p, value, onChange, placeholder }: { ai: AiHooks; history?: string[]; onRestore: () => void; p: Palette; value: string; onChange: (v: string) => void; placeholder: string }) {
  const lang = useLang();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Field value={value} onChange={onChange} placeholder={placeholder} p={p} multiline rows={3} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ButtonRun>
          <AiWriteBtn p={p} busy={ai.busy} disabled={!ai.ready} onClick={ai.onRun} onCancel={ai.onCancel} label={t("aiWriteShort", lang)} title={ai.ready ? t("aiWrite", lang) : (ai.reason ?? t("aiNoKey", lang))} />
          {!!history?.length && <IconBtn icon="undo" p={p} size={40} on onClick={onRestore} title={t("aiRestore", lang)} />}
        </ButtonRun>
      </div>
    </div>
  );
}

export function FrameInspector({
  frame,
  palette: p,
  onChange,
  onDelete,
  onDuplicate,
  onPreview,
  prompt,
  onSaveImage,
  frames,
  tidy,
  onTidy,
  onPlace,
  ai,
}: {
  frame: Frame;
  palette: Palette;
  onChange: (patch: Partial<Frame>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  prompt: string;
  onSaveImage: () => Promise<void>;
  frames: Frame[];
  /** what the tidy button offers: tidy the screen, undo the last tidy, or nothing (already tidy) */
  tidy: TidyState;
  onTidy: () => void;
  /** sets where Tidy puts the body of this window, and tidies */
  onPlace: (place: Place) => void;
  ai: AiHooks;
}) {
  const lang = useLang();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);
  const actionBtn = (icon: string, label: string, onClick: () => void, busy?: boolean) => (
    <button
      onClick={onClick}
      disabled={busy}
      className="kit-press"
      style={{
        flex: 1,
        height: 44,
        borderRadius: 22,
        border: "none",
        background: p.secondary,
        color: p.secondaryForeground,
        fontSize: 13,
        fontWeight: 600,
        cursor: busy ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <Icon name={icon} size={20} />
      {label}
    </button>
  );
  return (
    <div className="no-scrollbar" style={{ padding: "12px 12px 20px", overflowY: "auto", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          padding: "6px 6px 6px 14px",
          borderRadius: 20,
          background: p.secondary,
          color: p.secondaryForeground,
        }}
      >
        <Icon name="window-restore" size={20} />
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }}>{t("screen", lang)}</span>
        <IconBtn icon="play" p={p} onClick={onPreview} title={t("previewFrom", lang)} size={32} />
        <IconBtn icon="copy" p={p} onClick={onDuplicate} title={t("duplicate", lang)} size={32} />
        <IconBtn icon="delete" p={p} danger onClick={onDelete} title={t("delete", lang)} size={32} />
      </div>
      <Section id="frame-name" icon="file-text" title={t("name", lang)} p={p}>
        <Field value={frame.name} onChange={(name) => onChange({ name })} placeholder={t("screenName", lang)} p={p} icon="window-restore" />
      </Section>
      <Section id="frame-note" icon="file-text" title={t("description", lang)} p={p}>
        <AiField ai={ai} history={frame.noteHistory} onRestore={() => onChange(popHistory(frame.note, frame.noteHistory, "note", "noteHistory"))} p={p} value={frame.note ?? ""} onChange={(note) => onChange({ note: note || undefined })} placeholder={t("screenDescription", lang)} />
      </Section>
      <Section id="frame-bg" icon="palette" title={t("background", lang)} p={p}>
        <TokenChips value={frame.bg ?? "background"} onChange={(bg) => onChange({ bg })} p={p} />
      </Section>
      <Section id="frame-tidy" icon="layout-dashboard" title={t("tidy", lang)} p={p}>
        <TidyButton state={tidy} onClick={onTidy} p={p} place={frame.place} onPlace={onPlace} />
      </Section>
      <Section id="frame-shell" icon="layout-dashboard" title={t("shell", lang)} p={p}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Segmented<Shell>
            options={SHELLS.map((sh) => ({ key: sh.key, icon: sh.icon, title: shellLabel(sh.key, lang) }))}
            value={frame.shell ?? "sidebar"}
            onChange={(shell) => onChange({ shell })}
            p={p}
            height={36}
          />
          <div style={{ fontSize: 11, lineHeight: 1.5, color: p.mutedForeground, padding: "0 4px" }}>{t("shellHint", lang)}</div>
        </div>
      </Section>
      <Section id="frame-size" icon="maximize" title={t("windowSize", lang)} p={p}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {WINDOW_SIZES.map((size) => {
            const on = frameW(frame) === size.w && frameH(frame) === size.h;
            return (
              <button
                key={size.label}
                onClick={() => onChange({ w: size.w, h: size.h })}
                aria-pressed={on}
                className="kit-press"
                style={{
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 6,
                  border: `1px solid ${on ? p.primary : p.border}`,
                  background: on ? p.accent : p.background,
                  color: on ? p.accentForeground : p.foreground,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      </Section>
      <Section id="frame-export" icon="external-link" title={t("export", lang)} p={p}>
        <ButtonRun>
          {actionBtn(
            copied ? "check" : "content_copy",
            copied ? t("copied", lang) : t("prompt", lang),
            async () => {
              try {
                await navigator.clipboard.writeText(prompt);
                setCopied(true);
              } catch {}
            },
          )}
          {actionBtn(
            "image",
            saving ? t("saving", lang) : t("saveImage", lang),
            async () => {
              setSaving(true);
              try {
                await onSaveImage();
              } finally {
                setSaving(false);
              }
            },
            saving,
          )}
        </ButtonRun>
        <div
          className="no-scrollbar"
          style={{
            marginTop: 10,
            maxHeight: 260,
            overflowY: "auto",
            borderRadius: 16,
            background: p.muted,
            padding: 12,
            fontSize: 12,
            lineHeight: 1.7,
            color: p.mutedForeground,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {prompt}
        </div>
      </Section>
    </div>
  );
}

/** A small picture of what an alignment does: a dashed box for the reference (the window's
 *  body for one part, the selection for several) and two bars placed the way the parts will
 *  be; spacing evenly shows three bars with equal gaps. gpui-kit ships no alignment icons,
 *  so these are drawn rather than named. */
function AlignGlyph({ kind, color, faint }: { kind: AlignKind; color: string; faint: string }) {
  const bars: [number, number, number, number][] =
    kind === "left" ? [[4, 7, 16, 6], [4, 15, 10, 6]]
    : kind === "centerH" ? [[12, 7, 16, 6], [15, 15, 10, 6]]
    : kind === "right" ? [[20, 7, 16, 6], [26, 15, 10, 6]]
    : kind === "distributeH" ? [[4, 8, 6, 12], [17, 8, 6, 12], [30, 8, 6, 12]]
    : kind === "top" ? [[12, 4, 6, 14], [22, 4, 6, 8]]
    : kind === "centerV" ? [[12, 7, 6, 14], [22, 10, 6, 8]]
    : kind === "bottom" ? [[12, 10, 6, 14], [22, 16, 6, 8]]
    : [[14, 4, 12, 4], [14, 12, 12, 4], [14, 20, 12, 4]];
  return (
    <svg width={40} height={28} viewBox="0 0 40 28" aria-hidden>
      <rect x={1} y={1} width={38} height={26} rx={3} fill="none" stroke={faint} strokeWidth={1} strokeDasharray="3 2" />
      {bars.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={1.5} fill={color} />
      ))}
    </svg>
  );
}

/** The alignment controls: one row for left / centre / right, one for top / middle / bottom,
 *  each ending in "space evenly", which needs at least two parts. One part lines up with the
 *  body of its window, or with its container when it sits inside one; several line up with
 *  each other. Each button draws its result. */
function AlignSection({ single, onAlign, p }: { single: boolean; onAlign: (kind: AlignKind) => void; p: Palette }) {
  const lang = useLang();
  const rows: [AlignKind, UIKey][][] = [
    [["left", "alignLeft"], ["centerH", "alignCenterH"], ["right", "alignRight"], ["distributeH", "distributeH"]],
    [["top", "alignTop"], ["centerV", "alignCenterV"], ["bottom", "alignBottom"], ["distributeV", "distributeV"]],
  ];
  return (
    <Section id="align" icon="layout-dashboard" title={t("align", lang)} p={p}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((row, i) => (
          <ButtonRun key={i}>
            {row.map(([kind, key], j) => {
              const off = single && kind.startsWith("distribute");
              const outer = 22;
              const inner = R_INNER;
              return (
                <button
                  key={kind}
                  onClick={() => onAlign(kind)}
                  disabled={off}
                  title={t(key, lang)}
                  aria-label={t(key, lang)}
                  className="kit-press"
                  style={{
                    flex: 1,
                    height: 44,
                    border: "none",
                    borderRadius: `${j === 0 ? outer : inner}px ${j === row.length - 1 ? outer : inner}px ${j === row.length - 1 ? outer : inner}px ${j === 0 ? outer : inner}px`,
                    background: p.accent,
                    cursor: off ? "default" : "pointer",
                    display: "grid",
                    placeItems: "center",
                    opacity: off ? 0.38 : 1,
                  }}
                >
                  <AlignGlyph kind={kind} color={off ? p.mutedForeground : p.primary} faint={p.border} />
                </button>
              );
            })}
          </ButtonRun>
        ))}
        <div style={{ fontSize: 12, lineHeight: 1.5, color: p.mutedForeground, padding: "2px 6px 0" }}>{t(single ? "alignHintOne" : "alignHintMany", lang)}</div>
      </div>
    </Section>
  );
}

export function Inspector({
  ai,
  item,
  palette: p,
  frames,
  onChange,
  onDelete,
  onDuplicate,
  multi,
  grouped,
  onGroup,
  onUngroup,
  onAlign,
}: {
  /** the AI button beside the behavior field */
  ai: AiHooks;
  item: Item | null;
  palette: Palette;
  frames: Frame[];
  onChange: (patch: Partial<Item>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  multi: number;
  /** the selection is exactly one hand-made group */
  grouped?: boolean;
  onGroup?: () => void;
  onUngroup?: () => void;
  /** lines the selected parts up with each other, or spaces them evenly */
  onAlign?: (kind: AlignKind) => void;
}) {
  const lang = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const slots = item ? iconSlotsOf(item) : [];
  const [slotKey, setSlotKey] = useState("icon");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [actionSlot, setActionSlot] = useState("");
  /** editing the "on" look of a toggle button instead of its normal look */
  const [onTab, setOnTab] = useState(false);

  useEffect(() => {
    setSlotKey(item ? (iconSlotsOf(item)[0]?.key ?? "icon") : "icon");
    setPickerOpen(false);
    setActionSlot("");
    setOnTab(false);
  }, [item?.id, item?.kind, item?.tabs?.length]);

  if (!item) {
    if (multi > 1) {
      const bigBtn = (icon: string, label: string, onClick?: () => void) => (
        <button
          onClick={onClick}
          className="kit-press"
          style={{
            height: 48,
            borderRadius: 24,
            border: "none",
            background: p.primary,
            color: p.primaryForeground,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
          }}
        >
          <Icon name={icon} size={22} />
          {label}
        </button>
      );
      return (
        <div className="no-scrollbar" style={{ padding: "12px 12px 20px", overflowY: "auto", height: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              padding: "6px 6px 6px 14px",
              borderRadius: 20,
              background: p.secondary,
              color: p.secondaryForeground,
            }}
          >
            <Icon name={grouped ? "group_work" : "select_all"} size={20} />
            <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }}>
              {grouped ? t("group", lang) : lang === "en" ? `${multi} ${t("selectedParts", lang)}` : `${multi}${t("selectedParts", lang)}`}
            </span>
            <IconBtn icon="delete" p={p} danger onClick={onDelete} title={t("deleteSelection", lang)} size={32} />
          </div>
          {onAlign && <AlignSection single={false} onAlign={onAlign} p={p} />}
          {grouped ? bigBtn("ungroup", t("ungroup", lang), onUngroup) : bigBtn("group_work", t("makeGroup", lang), onGroup)}
          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: p.mutedForeground, padding: "0 6px" }}>
            {grouped ? t("groupEditNote", lang) : `${t("groupHint", lang)} (Ctrl+G)`}
          </div>
        </div>
      );
    }
    return (
      <div
        style={{
          height: "100%",
          display: "grid",
          placeItems: "center",
          color: p.border,
          padding: 24,
          textAlign: "center",
        }}
      >
        <Icon name="external-link" size={44} />
      </div>
    );
  }

  const spec = KIND_SPEC[item.kind];
  const editOn = !!item.toggle && onTab;
  /* the on-state is edited through the same text / icon / style controls:
   * `shown` is what they display, `change` routes their patches into `toggle` */
  const shown: Item = editOn
    ? {
        ...item,
        label: item.toggle?.label ?? item.label,
        icon: toggleIcon(item),
        variant: item.toggle?.variant ?? item.variant,
      }
    : item;
  const change = (patch: Partial<Item>) => {
    if (!editOn) {
      onChange(patch);
      return;
    }
    const next = { ...(item.toggle ?? {}) };
    if ("label" in patch) next.label = patch.label;
    if ("icon" in patch) next.icon = patch.icon;
    if ("variant" in patch) next.variant = patch.variant;
    onChange({ toggle: next });
  };
  const activeSlot: { key: string; value: string | null } | undefined = (() => {
    const s = slots.find((x) => x.key === slotKey) ?? slots[0];
    return s && editOn && s.key === "icon" ? { ...s, value: shown.icon } : s;
  })();
  const actionSlots = actionSlotsOf(item);
  const slotBtn = (key: string, label: string | undefined, icon: string | null, on: boolean, onClick: () => void, dim?: boolean) => (
    <button
      key={key}
      onClick={onClick}
      title={label}
      className="kit-press"
      style={{
        height: 44,
        minWidth: 44,
        padding: label ? "0 14px 0 10px" : 0,
        borderRadius: 22,
        border: "none",
        background: on ? p.primary : p.accent,
        color: on ? p.primaryForeground : dim ? p.border : p.foreground,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <Icon name={icon ?? "block"} size={22} />
      {label && <span>{label}</span>}
    </button>
  );
  const tabs: NavTab[] = item.tabs ?? [];
  const variants = spec.hasVariant ? variantsOf(item.kind) : [];

  const setTabCount = (n: number) => {
    const next: NavTab[] = [];
    const defaults = defaultTabsFor(item.kind);
    for (let i = 0; i < n; i++) next.push(tabs[i] ? { ...tabs[i] } : { ...defaults[i % defaults.length] });
    onChange({ tabs: next });
  };
  /** a tab bar, breadcrumb, select and radio group carry labels only; a toolbar
   *  carries icons only; a sidebar, menu, list and tree carry both */
  const tabIcons = !["tabs", "breadcrumb", "select", "radio", "buttonGroup", "dataTable"].includes(item.kind);
  const tabLabels = item.kind !== "toolbar";
  const mainSlots = slots.filter((s) => !s.key.startsWith("tab:"));

  const setTabLabel = (i: number, label: string) =>
    onChange({ tabs: tabs.map((t, j) => (j === i ? { ...t, label } : t)) });

  /** a dropdown has as many options as the author wants, rather than a count to pick from */
  const isSelect = item.kind === "select";
  /** drops one option; a select carries no selected index, so only the list changes */
  const removeOption = (i: number) => onChange({ tabs: tabs.filter((_, j) => j !== i) });
  const addOption = () => {
    const defaults = defaultTabsFor(item.kind);
    onChange({ tabs: [...tabs, { ...defaults[tabs.length % defaults.length] }] });
  };

  const hasRadius =
    item.kind === "panel" ||
    item.kind === "titleBar" ||
    item.kind === "statusBar" ||
    item.kind === "sidebar" ||
    item.kind === "sheet" ||
    item.kind === "image";

  return (
    <div className="no-scrollbar" style={{ padding: "12px 12px 20px", overflowY: "auto", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          padding: "6px 6px 6px 14px",
          borderRadius: 20,
          background: p.secondary,
          color: p.secondaryForeground,
        }}
      >
        <Icon name={spec.paletteIcon} size={20} />
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }}>{spec.label}</span>
        <IconBtn icon="copy" p={p} onClick={onDuplicate} title={t("duplicateKey", lang)} size={32} />
        <IconBtn icon="delete" p={p} danger onClick={onDelete} title={t("delete", lang)} size={32} />
      </div>

      {TOGGLEABLE.includes(item.kind) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 4px 12px", marginBottom: 12 }}>
          <Toggle
            on={!!item.toggle}
            onChange={(on) => {
              onChange({ toggle: on ? {} : undefined });
              setOnTab(on);
              setPickerOpen(false);
            }}
            p={p}
            icon="replace"
            label={t("toggle", lang)}
            grow
          />
          {item.toggle && (
            <>
              <Segmented<"off" | "on">
                options={[
                  { key: "off", icon: "circle-check", label: t("normalState", lang) },
                  { key: "on", icon: "circle-check", label: t("onState", lang) },
                ]}
                value={onTab ? "on" : "off"}
                onChange={(k) => {
                  setOnTab(k === "on");
                  setPickerOpen(false);
                }}
                p={p}
                height={36}
              />
              {editOn && <div style={{ fontSize: 11, color: p.mutedForeground, padding: "0 4px" }}>{t("onStateHint", lang)}</div>}
            </>
          )}
        </div>
      )}

      {onAlign && !editOn && <AlignSection single onAlign={onAlign} p={p} />}

      {(spec.hasLabel || spec.hasSupporting) && (
        <Section id="text" icon="a-large-small" title={t("text", lang)} p={p}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {spec.hasLabel && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Field
                  value={shown.label}
                  onChange={(label) => change({ label })}
                  placeholder={t("label", lang)}
                  p={p}
                  icon="a-large-small"
                />
                {item.kind === "text" && (
                  <IconBtn
                    icon="a-large-small"
                    p={p}
                    size={44}
                    on={!!item.bold}
                    onClick={() => onChange({ bold: !item.bold })}
                    title={t("bold", lang)}
                  />
                )}
              </div>
            )}
            {spec.hasSupporting && !editOn && (
              <Field
                value={item.supporting ?? ""}
                onChange={(supporting) => onChange({ supporting })}
                placeholder={item.kind === "statusBar" ? t("trailing", lang) : t("supporting", lang)}
                p={p}
                icon="file-text"
              />
            )}
            {item.kind === "dialog" && !editOn && (
              <Field
                value={item.confirm ?? ""}
                onChange={(confirm) => onChange({ confirm })}
                placeholder={t("confirmVerb", lang)}
                p={p}
                icon="check"
              />
            )}
          </div>
        </Section>
      )}

      {/* a keybinding turns the part into a command the prompt declares as an action */}
      {(TAPPABLE.includes(item.kind) || spec.hasTabs) && !editOn && (
        <Section id="shortcut" icon="square-terminal" title={t("shortcut", lang)} p={p} defaultOpen={false}>
          <Field
            value={item.shortcut ?? ""}
            onChange={(shortcut) => onChange({ shortcut: shortcut || undefined })}
            placeholder="cmd-s"
            p={p}
            icon="square-terminal"
          />
          <div style={{ fontSize: 11, lineHeight: 1.5, color: p.mutedForeground, padding: "6px 4px 0" }}>{t("shortcutHint", lang)}</div>
        </Section>
      )}

      {spec.hasTabs && !editOn && (
        <Section id="tabs" icon="layout-dashboard" title={t(isSelect ? "options" : "tabs", lang)} p={p}>
          {!isSelect && (
            <Segmented
              options={(item.kind === "toolbar" ? [2, 3, 4, 5, 6] : [2, 3, 4, 5]).map((n) => ({ key: String(n), label: String(n) }))}
              value={String(tabs.length)}
              onChange={(k) => setTabCount(Number(k))}
              p={p}
              height={36}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {tabs.map((tab, i) => {
              const on = slotKey === `tab:${i}` && pickerOpen;
              return (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {tabIcons && (
                  <button
                    onClick={() => {
                      setSlotKey(`tab:${i}`);
                      setPickerOpen(true);
                    }}
                    title={t("changeIcon", lang)}
                    aria-label={t("changeIcon", lang)}
                    className="kit-press"
                    style={{
                      width: 40,
                      height: 40,
                      flex: "0 0 auto",
                      borderRadius: 20,
                      border: "none",
                      background: on ? p.primary : p.accent,
                      color: on ? p.primaryForeground : p.mutedForeground,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name={tab.icon || "add"} size={20} />
                  </button>
                  )}
                  {tabLabels && <Field value={tab.label} onChange={(v) => setTabLabel(i, v)} placeholder={t("label", lang)} p={p} height={40} />}
                  {tabIcons && tab.icon && (
                    <IconBtn icon="close" p={p} size={40} onClick={() => onChange(setIconSlot(item, `tab:${i}`, null))} title={t("noIcon", lang)} />
                  )}
                  {isSelect && tabs.length > 1 && (
                    <IconBtn icon="close" p={p} size={40} onClick={() => removeOption(i)} title={t("removeOption", lang)} />
                  )}
                </div>
              );
            })}
          </div>
          {isSelect && (
            <button
              onClick={addOption}
              className="kit-press"
              style={{ marginTop: 8, height: 40, width: "100%", borderRadius: 20, border: `1px solid ${p.border}`, background: "transparent", color: p.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon name="plus" size={18} />
              {t("addOption", lang)}
            </button>
          )}
        </Section>
      )}

      {spec.hasColumns && !editOn && (
        <Section id="columns" icon="layout-dashboard" title={t("columns", lang)} p={p}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(item.columns ?? []).map((column, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Field
                  value={column.label}
                  onChange={(label) =>
                    onChange({ columns: (item.columns ?? []).map((c, j) => (j === i ? { ...c, label } : c)) })
                  }
                  placeholder={t("label", lang)}
                  p={p}
                  height={40}
                />
                <IconBtn
                  icon="sort-descending"
                  p={p}
                  size={40}
                  on={!!column.numeric}
                  title={t("numeric", lang)}
                  onClick={() =>
                    onChange({
                      columns: (item.columns ?? []).map((c, j) => (j === i ? { ...c, numeric: c.numeric ? undefined : true } : c)),
                    })
                  }
                />
                {(item.columns ?? []).length > 1 && (
                  <IconBtn
                    icon="minus"
                    p={p}
                    size={40}
                    title={t("delete", lang)}
                    onClick={() => onChange({ columns: (item.columns ?? []).filter((_, j) => j !== i) })}
                  />
                )}
              </div>
            ))}
            <IconBtn
              icon="plus"
              p={p}
              size={40}
              title={t("addColumn", lang)}
              onClick={() => onChange({ columns: [...(item.columns ?? []), { label: t("label", lang) }] })}
            />
          </div>
        </Section>
      )}

      {item.kind === "image" && !editOn && (
        <Section id="image" icon="frame" title={t("image", lang)} p={p}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                onChange({ src: await readImage(f) });
              } catch {}
            }}
          />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => fileRef.current?.click()}
              className="kit-press"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 22,
                border: "none",
                background: p.primary,
                color: p.primaryForeground,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Icon name="arrow-up" size={20} />
              {t("pickImage", lang)}
            </button>
            {item.src && (
              <IconBtn icon="close" p={p} size={44} onClick={() => onChange({ src: undefined })} title={t("removeImage", lang)} />
            )}
          </div>
        </Section>
      )}

      {mainSlots.length > 0 && activeSlot && !item.src && (
        <Section id="icon" icon="star" title={t("icon", lang)} p={p}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {mainSlots.map((s) =>
              slotBtn(
                s.key,
                mainSlots.length > 1 ? s.label : undefined,
                editOn && s.key === "icon" ? shown.icon : s.value,
                s.key === activeSlot.key && pickerOpen,
                () => {
                  const on = s.key === activeSlot.key && pickerOpen;
                  setSlotKey(s.key);
                  setPickerOpen(!on);
                },
                !s.value,
              ),
            )}
            {activeSlot.value && !activeSlot.key.startsWith("tab:") && (
              <IconBtn
                icon="close"
                p={p}
                size={44}
                onClick={() => {
                  // a slot without an icon cannot be tapped, so its action goes too
                  const patch: Partial<Item> = setIconSlot(item, activeSlot.key, null);
                  if (!editOn && item.actions?.[activeSlot.key]) {
                    const actions = { ...item.actions };
                    delete actions[activeSlot.key];
                    patch.actions = Object.keys(actions).length ? actions : undefined;
                  }
                  change(patch);
                }}
                title={t("noIcon", lang)}
              />
            )}
          </div>
        </Section>
      )}

      {pickerOpen && activeSlot && (
        <div style={{ margin: "-4px 4px 12px" }}>
          <IconPicker
            value={activeSlot.value}
            onChange={(icon) => change(setIconSlot(item, activeSlot.key, icon))}
            palette={p}
          />
        </div>
      )}

      {variants.length > 0 && (
        <Section id="style" icon="palette" title={t("style", lang)} p={p}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {variants.map((v) => (
              <VariantSwatch
                key={v.key}
                v={v.key}
                label={v.label}
                p={p}
                on={shown.variant === v.key}
                onClick={() => change({ variant: v.key })}
              />
            ))}
          </div>
        </Section>
      )}

      {spec.hasFill && !editOn && (
        <Section id="fill" icon="palette" title={t("background", lang)} p={p}>
          <TokenChips value={item.fill ?? "muted"} onChange={(fill) => onChange({ fill })} p={p} />
        </Section>
      )}

      {(spec.hasChecked || spec.hasValue || spec.hasCircle || spec.hasCollapsed || spec.hasSide || spec.hasControls || spec.hasDisabled) && !editOn && (
        <Section id="state" icon="settings-2" title={t("state", lang)} p={p}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "2px 0" }}>
            {spec.hasChecked && (
              <Toggle
                on={!!item.checked}
                onChange={(checked) => onChange({ checked })}
                p={p}
                icon={item.kind === "tag" ? "close" : "check"}
                label={item.kind === "tag" ? t("selected", lang) : t("on", lang)}
                grow
              />
            )}
            {spec.hasDisabled && (
              <Toggle on={!!item.disabled} onChange={(disabled) => onChange({ disabled: disabled || undefined })} p={p} icon="circle-x" label={t("disabled", lang)} grow />
            )}
            {spec.hasCollapsed && (
              <Toggle on={!!item.collapsed} onChange={(collapsed) => onChange({ collapsed: collapsed || undefined })} p={p} icon="panel-left-close" label={t("collapsed", lang)} grow />
            )}
            {spec.hasCircle && (
              <Toggle on={!!item.circle} onChange={(circle) => onChange({ circle: circle || undefined })} p={p} icon="loader-circle" label={t("circle", lang)} grow />
            )}
            {spec.hasSide && (
              <Segmented<Side>
                options={SIDES.map((sd) => ({ key: sd.key, icon: sd.icon, title: sideLabel(sd.key, lang) }))}
                value={item.side ?? "right"}
                onChange={(side) => onChange({ side })}
                p={p}
                height={36}
              />
            )}
            {spec.hasControls && (
              <Segmented<"mac" | "windows" | "none">
                options={[
                  { key: "mac", label: t("controlsMac", lang) },
                  { key: "windows", label: t("controlsWin", lang) },
                  { key: "none", label: t("controlsNone", lang) },
                ]}
                value={item.controls ?? "mac"}
                onChange={(controls) => onChange({ controls })}
                p={p}
                height={36}
              />
            )}
            {spec.hasValue && item.kind === "progress" && (
              <Toggle
                on={item.value !== undefined}
                onChange={(on) => onChange({ value: on ? 60 : undefined })}
                p={p}
                icon="asterisk"
                label={t("determinate", lang)}
                grow
              />
            )}
            {/* a count, not a percentage: stars, a day of the month, a page */}
            {spec.valueSpec && (
              <Slider
                icon="asterisk"
                title={t("value", lang)}
                value={item.value ?? spec.valueSpec.min}
                min={spec.valueSpec.min}
                max={spec.valueSpec.max}
                step={1}
                onChange={(value) => onChange({ value })}
                p={p}
              />
            )}
            {spec.hasValue && !spec.valueSpec && (item.kind === "slider" || item.kind === "resizable" || item.kind === "scrollbar" || (item.kind === "progress" && item.value !== undefined)) && (
              <Slider
                icon="asterisk"
                value={item.value ?? 40}
                min={0}
                max={100}
                step={1}
                onChange={(value) => onChange({ value })}
                p={p}
                unit="%"
              />
            )}
            {/* a tab bar, list, tree, menu or radio group selects one of its rows */}
            {spec.hasValue && spec.hasTabs && !spec.valueSpec && item.kind !== "resizable" && (
              <Segmented
                options={(item.tabs ?? []).map((tab, i) => ({ key: String(i), label: tab.label.trim() || String(i + 1) }))}
                value={String(item.value ?? 0)}
                onChange={(k) => onChange({ value: Number(k) })}
                p={p}
                height={32}
                wrap
              />
            )}
          </div>
        </Section>
      )}

      {(spec.size || hasRadius) && !editOn && (
        <Section id="size" icon="dash" title={t("size", lang)} p={p}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {spec.size && (
              <>
                <Slider
                  icon={spec.size.icon}
                  title={
                    item.kind === "text"
                      ? t("fontSize", lang)
                      : spec.size.icon === "maximize"
                        ? t("width", lang)
                        : t("size", lang)
                  }
                  value={item.size ?? spec.defSize ?? spec.w}
                  min={spec.size.min}
                  max={spec.size.max}
                  step={spec.size.step}
                  onChange={(size) => onChange({ size })}
                  p={p}
                  unit={item.kind === "text" ? "px" : ""}
                />
                {spec.size.presets && (
                  <SizePresets
                    values={spec.size.presets}
                    value={item.size ?? spec.defSize ?? spec.w}
                    min={spec.size.min}
                    max={spec.size.max}
                    onChange={(size) => onChange({ size })}
                    p={p}
                    labelOf={item.kind === "text" ? undefined : widthPresetLabel}
                  />
                )}
              </>
            )}
            {spec.size2 && (
              <>
                <Slider
                  icon={spec.size2.icon}
                  title={t("height", lang)}
                  value={item.size2 ?? sizeOf(item, {}).h}
                  min={spec.size2.min}
                  max={spec.size2.max}
                  step={spec.size2.step}
                  onChange={(size2) => onChange({ size2 })}
                  p={p}
                />
                {spec.size2.presets && (
                  <SizePresets
                    values={spec.size2.presets}
                    value={item.size2 ?? sizeOf(item, {}).h}
                    min={spec.size2.min}
                    max={spec.size2.max}
                    onChange={(size2) => onChange({ size2 })}
                    p={p}
                    labelOf={heightPresetLabel}
                  />
                )}
              </>
            )}
            {hasRadius && item.kind === "image" && (
              <Slider
                icon="frame"
                title={t("cornerRadius", lang)}
                value={item.radiusTop ?? spec.radius}
                min={0}
                max={48}
                step={1}
                onChange={(radiusTop) => onChange({ radiusTop })}
                p={p}
              />
            )}
            {hasRadius && item.kind !== "image" && (
              <>
                <Slider
                  iconNode={<CornerIcon side="top" />}
                  title={t("cornerTop", lang)}
                  value={item.radiusTop ?? 0}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(radiusTop) => onChange({ radiusTop })}
                  p={p}
                />
                <Slider
                  iconNode={<CornerIcon side="bottom" />}
                  title={t("cornerBottom", lang)}
                  value={item.radiusBottom ?? 0}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(radiusBottom) => onChange({ radiusBottom })}
                  p={p}
                />
              </>
            )}
          </div>
        </Section>
      )}

      {(TAPPABLE.includes(item.kind) || actionSlots.length > 0) && frames.length > 0 && !editOn && (
        <Section id="action" icon="external-link" title={t("clickTo", lang)} p={p}>
          {actionSlots.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Segmented<string>
                options={actionSlots.map((s) => ({
                  key: s.key,
                  icon: s.value ?? undefined,
                  label: s.value ? undefined : s.label,
                  title: s.label,
                  dot: !!item.actions?.[s.key],
                }))}
                value={actionSlot || actionSlots[0].key}
                onChange={setActionSlot}
                p={p}
                height={40}
              />
              {(() => {
                const key = actionSlot || actionSlots[0].key;
                return (
                  <ActionEditor
                    frames={frames}
                    action={item.actions?.[key]}
                    onChange={(a) => {
                      const actions = { ...(item.actions ?? {}) };
                      if (a) actions[key] = a;
                      else delete actions[key];
                      onChange({ actions: Object.keys(actions).length ? actions : undefined });
                    }}
                    p={p}
                  />
                );
              })()}
            </div>
          ) : (
            <ActionEditor frames={frames} action={item.action} onChange={(action) => onChange({ action })} p={p} />
          )}
        </Section>
      )}

      {!editOn && (
      <Section id="note" icon="square-terminal" title={t("behavior", lang)} p={p}>
        <AiField
          ai={ai}
          history={item.noteHistory}
          onRestore={() => onChange(popHistory(item.note, item.noteHistory, "note", "noteHistory"))}
          p={p}
          value={item.note ?? ""}
          onChange={(note) => onChange({ note })}
          placeholder={item.kind === "button" || item.kind === "iconButton" || item.kind === "buttonGroup" ? t("whenPressed", lang) : t("whatItDoes", lang)}
        />
      </Section>
      )}
    </div>
  );
}
