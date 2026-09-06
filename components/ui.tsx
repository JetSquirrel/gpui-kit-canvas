"use client";

import { useEffect, useRef, useState } from "react";
import { COLOR_TOKENS, ColorToken, PLACES, Palette, Place, R_INNER, clamp } from "@/lib/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { t, useLang } from "@/lib/i18n";
import { Icon } from "./KitNode";

export function IconBtn({
  icon,
  on,
  onClick,
  title,
  size = 36,
  p,
  danger,
  disabled,
}: {
  icon: string;
  on?: boolean;
  onClick?: () => void;
  title?: string;
  size?: number;
  p: Palette;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className="kit-press"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: "none",
        background: on ? (danger ? p.danger : p.secondary) : "transparent",
        color: disabled
          ? p.border
          : danger
            ? p.danger
            : on
              ? p.secondaryForeground
              : p.mutedForeground,
        cursor: disabled ? "default" : "pointer",
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.58)} />
    </button>
  );
}

export type SegOption<K extends string> = { key: K; icon?: string; label?: string; title?: string; /** small marker: this option carries something */ dot?: boolean; /** this option alone takes the spare width */ grow?: boolean; /** an icon-only option that should not shrink to a square */ wide?: boolean };

/** Connected-button group with the same fused corners as the canvas. */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  p,
  height = 40,
  grow = true,
  wrap = false,
}: {
  options: SegOption<K>[];
  value: K;
  onChange: (k: K) => void;
  p: Palette;
  height?: number;
  grow?: boolean;
  /** let options flow onto extra lines instead of squeezing them into one row */
  wrap?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexWrap: wrap ? "wrap" : "nowrap", gap: 3 }}>
      {options.map((o, i) => {
        const on = o.key === value;
        const first = i === 0;
        const last = i === options.length - 1;
        const outer = height / 2;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            title={o.title ?? o.label}
            aria-label={o.title ?? o.label}
            className="kit-press"
            style={{
              flex: (o.grow ?? grow) ? (wrap ? "1 1 auto" : 1) : "0 0 auto",
              minWidth: o.wide ? height * 1.4 : height,
              maxWidth: wrap ? "100%" : undefined,
              height,
              padding: o.label ? "0 14px" : 0,
              border: "none",
              cursor: "pointer",
              borderTopLeftRadius: first ? outer : R_INNER,
              borderBottomLeftRadius: first ? outer : R_INNER,
              borderTopRightRadius: last ? outer : R_INNER,
              borderBottomRightRadius: last ? outer : R_INNER,
              background: on ? p.primary : p.accent,
              color: on ? p.primaryForeground : p.mutedForeground,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: on ? 600 : 500,
              transition: "background 120ms, color 120ms, border-radius 160ms",
              position: "relative",
            }}
          >
            {o.icon && <Icon name={o.icon} size={Math.round(height * 0.5)} />}
            {o.label && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>}
            {o.dot && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 5,
                  right: 7,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: on ? p.primaryForeground : p.primary,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  value,
  onChange,
  placeholder,
  p,
  icon,
  multiline,
  rows = 3,
  height = 44,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  p: Palette;
  icon?: string;
  multiline?: boolean;
  rows?: number;
  height?: number;
}) {
  const lang = useLang();
  const filled = value.length > 0;
  const base: React.CSSProperties = {
    width: "100%",
    padding: multiline ? `12px ${filled ? 40 : 14}px 12px ${icon ? 42 : 14}px` : `0 ${filled ? 40 : 14}px 0 ${icon ? 42 : 14}px`,
    borderRadius: multiline ? 18 : height / 2,
    border: "none",
    background: p.accent,
    color: p.foreground,
    fontSize: 14,
    lineHeight: multiline ? 1.55 : undefined,
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "none",
  };
  return (
    <div style={{ position: "relative", width: "100%" }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            left: 12,
            top: multiline ? 12 : (height - 20) / 2,
            color: p.mutedForeground,
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          <Icon name={icon} size={20} />
        </span>
      )}
      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="kit-field"
          style={base}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="kit-field"
          style={{ ...base, height }}
        />
      )}
      {filled && (
        <button
          onClick={() => onChange("")}
          title={t("clear", lang)}
          aria-label={t("clear", lang)}
          style={{
            position: "absolute",
            right: 6,
            top: multiline ? 8 : (height - 30) / 2,
            width: 30,
            height: 30,
            borderRadius: 15,
            border: "none",
            background: "transparent",
            color: p.mutedForeground,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

/** Slider with a typed-in number beside it. The slider moves in `step`s; the
 *  field accepts any whole number and is clamped to min..max when it commits. */
/** A rectangle whose top or bottom corners are rounded: the corner-radius slider icons. */
export function CornerIcon({ side, size = 20 }: { side: "top" | "bottom"; size?: number }) {
  const d =
    side === "top"
      ? "M4 17 V9 a5 5 0 0 1 5 -5 h6 a5 5 0 0 1 5 5 v8"
      : "M4 3 v8 a5 5 0 0 0 5 5 h6 a5 5 0 0 0 5 -5 v-8";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function Slider({
  icon = "tune",
  iconNode,
  value,
  min,
  max,
  step,
  onChange,
  p,
  unit = "",
  title,
}: {
  icon?: string;
  /** custom glyph shown instead of the Material Symbol */
  iconNode?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  p: Palette;
  unit?: string;
  title?: string;
}) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);
  const commit = () => {
    const n = Math.round(Number(text));
    if (Number.isFinite(n) && text.trim() !== "") onChange(clamp(n, min, max));
    setEditing(false);
    setText(String(value));
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span title={title} style={{ color: p.mutedForeground, lineHeight: 1, flex: "0 0 auto", display: "inline-flex" }}>
        {iconNode ?? <Icon name={icon} size={20} />}
      </span>
      <input
        type="range"
        className="kit-range"
        aria-label={title}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--track": p.secondary, "--thumb": p.primary } as React.CSSProperties}
      />
      <span style={{ position: "relative", flex: "0 0 auto", display: "inline-flex", alignItems: "center" }}>
        <input
          type="number"
          inputMode="numeric"
          aria-label={title}
          min={min}
          max={max}
          value={editing ? text : String(value)}
          onFocus={(e) => {
            setEditing(true);
            setText(String(value));
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            // apply as you type once the number is already in range, so the canvas follows
            const n = Math.round(Number(e.target.value));
            if (e.target.value.trim() !== "" && Number.isFinite(n) && n >= min && n <= max) onChange(n);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setText(String(value));
              e.currentTarget.blur();
            }
          }}
          className="kit-number"
          style={{
            width: unit ? 56 : 52,
            height: 30,
            padding: unit ? "0 18px 0 6px" : "0 6px",
            borderRadius: 8,
            border: "none",
            background: p.accent,
            color: p.foreground,
            fontSize: 12,
            fontWeight: 600,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "inherit",
            outline: editing ? `2px solid ${p.primary}` : "none",
            outlineOffset: -1,
            boxSizing: "border-box",
          }}
        />
        {unit && (
          <span
            style={{
              position: "absolute",
              right: 6,
              fontSize: 11,
              color: p.mutedForeground,
              pointerEvents: "none",
            }}
          >
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

/** Quick picks for a size: the values the frame is built from (screen width,
 *  content width, half a row) or a component's standard sizes. */
export function SizePresets({
  values,
  value,
  min,
  max,
  onChange,
  p,
  labelOf,
}: {
  values: number[];
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  p: Palette;
  /** optional hover text for a value, e.g. "Screen width" for 412 */
  labelOf?: (v: number) => string | undefined;
}) {
  const shown = values.filter((v) => v >= min && v <= max);
  if (shown.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 30 }}>
      {shown.map((v) => {
        const on = v === value;
        const label = labelOf?.(v);
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            title={label}
            aria-label={label ? `${label}: ${v}` : String(v)}
            aria-pressed={on}
            className="kit-press"
            style={{
              height: 28,
              padding: "0 10px",
              borderRadius: 14,
              border: on ? "1px solid transparent" : `1px solid ${p.border}`,
              background: on ? p.secondary : "transparent",
              color: on ? p.secondaryForeground : p.mutedForeground,
              fontSize: 12,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  on,
  onChange,
  p,
  icon,
  label,
  grow,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  p: Palette;
  icon?: string;
  label?: string;
  /** fill the row and push the switch to the trailing edge */
  grow?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      title={label}
      aria-label={label}
      aria-pressed={on}
      style={{
        display: grow ? "flex" : "inline-flex",
        width: grow ? "100%" : undefined,
        alignItems: "center",
        gap: 10,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 0,
        color: p.mutedForeground,
      }}
    >
      {icon && <Icon name={icon} size={20} />}
      {label && <span style={{ fontSize: 13, color: p.foreground, flex: grow ? 1 : undefined, textAlign: "left" }}>{label}</span>}
      <span
        style={{
          position: "relative",
          width: 44,
          height: 26,
          borderRadius: 13,
          background: on ? p.primary : p.secondary,
          border: on ? "2px solid transparent" : `2px solid ${p.border}`,
          boxSizing: "border-box",
          transition: "background 160ms",
          flex: "0 0 auto",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: on ? 20 : 3,
            width: on ? 18 : 12,
            height: on ? 18 : 12,
            marginTop: on ? -9 : -6,
            borderRadius: 9,
            background: on ? p.primaryForeground : p.border,
            transition: "left 160ms, width 160ms, height 160ms, margin 160ms",
          }}
        />
      </span>
    </button>
  );
}

/** Collapsible section; collapsed state is remembered per key. */
export function Section({
  id,
  icon,
  title,
  p,
  children,
  right,
  defaultOpen = true,
}: {
  id: string;
  icon: string;
  title: string;
  p: Palette;
  children: React.ReactNode;
  right?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const still = useReducedMotion();
  useEffect(() => {
    try {
      const v = localStorage.getItem(`gpui-kit-canvas:sec:${id}`);
      if (v !== null) setOpen(v === "1");
    } catch {}
  }, [id]);
  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(`gpui-kit-canvas:sec:${id}`, o ? "0" : "1");
      } catch {}
      return !o;
    });
  };
  const dur = still ? 0 : 0.16;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 36 }}>
        <button
          onClick={toggle}
          aria-expanded={open}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 6px",
            border: "none",
            background: "transparent",
            color: p.mutedForeground,
            cursor: "pointer",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
            textAlign: "left",
          }}
        >
          <Icon name={icon} size={18} />
          <span style={{ flex: 1 }}>{title}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: dur }} style={{ display: "inline-flex", lineHeight: 1 }}>
            <Icon name="chevron-down" size={18} />
          </motion.span>
        </button>
        {right}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: dur, ease: [0.2, 0, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "6px 4px 14px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Tile({
  icon,
  label,
  p,
  onPointerDown,
  onClick,
  starred,
  onStar,
  active,
  compact,
}: {
  icon: string;
  label: string;
  p: Palette;
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: () => void;
  starred?: boolean;
  onStar?: () => void;
  active?: boolean;
  compact?: boolean;
}) {
  const lang = useLang();
  return (
    <div
      className="kit-tile"
      onPointerDown={onPointerDown}
      onClick={onClick}
      title={label}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: compact ? "row" : "column",
        alignItems: "center",
        justifyContent: compact ? "flex-start" : "center",
        gap: compact ? 10 : 6,
        padding: compact ? "8px 12px" : "12px 6px 10px",
        borderRadius: 16,
        background: active ? p.secondary : p.muted,
        color: active ? p.secondaryForeground : p.foreground,
        cursor: onPointerDown ? "grab" : "pointer",
        userSelect: "none",
        touchAction: "none",
        minHeight: compact ? 40 : 72,
        boxSizing: "border-box",
      }}
    >
      <Icon name={icon} size={compact ? 20 : 26} color={active ? p.secondaryForeground : p.primary} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.2,
          textAlign: "center",
          color: active ? p.secondaryForeground : p.mutedForeground,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {label}
      </span>
      {onStar && (
        <button
          className="kit-star"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onStar();
          }}
          title={starred ? t("removeFavorite", lang) : t("addFavorite", lang)}
          aria-label={starred ? t("removeFavorite", lang) : t("addFavorite", lang)}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 24,
            height: 24,
            borderRadius: 12,
            border: "none",
            background: "transparent",
            color: starred ? p.primary : p.border,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            opacity: starred ? 1 : undefined,
          }}
        >
          <Icon name={starred ? "star-fill" : "star"} size={16} />
        </button>
      )}
    </div>
  );
}

/** palette-role swatches; the dot shows the real color of the current theme */
export function TokenChips({
  value,
  onChange,
  p,
  none,
  noneOn,
  onNone,
}: {
  value: ColorToken;
  onChange: (t: ColorToken) => void;
  p: Palette;
  /** offer a "no background" chip */
  none?: boolean;
  noneOn?: boolean;
  onNone?: () => void;
}) {
  const lang = useLang();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {none && (
        <button
          onClick={onNone}
          title={t("noBackground", lang)}
          aria-label={t("noBackground", lang)}
          aria-pressed={noneOn}
          className="kit-press"
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            border: `1px solid ${p.border}`,
            padding: 0,
            cursor: "pointer",
            background: "transparent",
            color: p.mutedForeground,
            display: "grid",
            placeItems: "center",
            outline: noneOn ? `2px solid ${p.primary}` : "2px solid transparent",
            outlineOffset: 2,
          }}
        >
          <Icon name="circle-x" size={16} />
        </button>
      )}
      {COLOR_TOKENS.map((t) => {
        const on = !noneOn && t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            title={t.label}
            aria-label={t.label}
            aria-pressed={on}
            className="kit-press"
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              border: `1px solid ${p.border}`,
              padding: 0,
              cursor: "pointer",
              background: p[t.key],
              outline: on ? `2px solid ${p.primary}` : "2px solid transparent",
              outlineOffset: 2,
            }}
          />
        );
      })}
    </div>
  );
}

/** M3 basic dialog for a destructive confirmation. */
/** A run of buttons fused like the canvas's connected buttons: round outside, small corners where they meet. */
export function ButtonRun({ children }: { children: React.ReactNode }) {
  return <div className="kit-run" style={{ display: "flex", gap: 3 }}>{children}</div>;
}

export type TidyState = "tidy" | "undo" | "done";

/** A small picture of where Tidy puts the body: the window as a dashed box, with the
 *  rows drawn where they would land. gpui-kit ships no alignment icons, so this is drawn
 *  rather than named. */
export function PlaceGlyph({ place, size = 20 }: { place: Place; size?: number }) {
  /* [y, height] of each row inside a 24-unit window box */
  const bars: [number, number][] =
    place === "top" ? [[5, 4], [11, 4]]
    : place === "center" ? [[7, 4], [13, 4]]
    : place === "bottom" ? [[9, 4], [15, 4]]
    : [[4.5, 3], [10.5, 3], [16.5, 3]];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x={2.5} y={2.5} width={19} height={19} rx={3} stroke="currentColor" strokeWidth={1.25} opacity={0.45} />
      {bars.map(([y, h], i) => (
        <rect key={i} x={6} y={y} width={12} height={h} rx={1.25} fill="currentColor" />
      ))}
    </svg>
  );
}

/** One button that reads as "Tidy", turns into "Undo tidy" right after, and is
 *  disabled while the window is already tidy. With `onPlace` it becomes a split
 *  button whose trailing half opens the body placements. */
export function TidyButton({
  state,
  onClick,
  p,
  pill,
  place,
  onPlace,
}: {
  state: TidyState;
  onClick: () => void;
  p: Palette;
  /** the toolbar version next to the zoom pill */
  pill?: boolean;
  /** where the window's body goes; with `onPlace` the button gains a trailing menu to change it */
  place?: Place;
  onPlace?: (place: Place) => void;
}) {
  const lang = useLang();
  const done = state === "done";
  const label = state === "undo" ? t("tidyUndo", lang) : state === "done" ? t("tidyDone", lang) : t("tidy", lang);
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  /* the menu closes on a click anywhere else or on Escape */
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setMenu(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      /* the editor also clears its selection on Escape; closing the menu is enough here */
      e.stopPropagation();
      setMenu(false);
    };
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [menu]);
  const split = !!onPlace;
  const current = place ?? "top";
  const placeLabel = (k: Place) => t(k === "top" ? "placeTop" : k === "center" ? "placeCenter" : k === "bottom" ? "placeBottom" : "placeSpread", lang);
  const h = pill ? 40 : 44;
  const bg = done ? "transparent" : state === "undo" ? p.muted : p.secondary;
  const fg = done ? p.mutedForeground : state === "undo" ? p.mutedForeground : p.secondaryForeground;
  const main = (
    <button
      onClick={onClick}
      disabled={done}
      title={label}
      aria-label={label}
      className="kit-press"
      style={{
        width: pill ? (done ? 40 : undefined) : split ? undefined : "100%",
        flex: split && !pill ? 1 : undefined,
        height: h,
        padding: done ? 0 : pill ? "0 16px 0 12px" : "0 16px",
        borderRadius: split && !done ? `${h / 2}px ${R_INNER}px ${R_INNER}px ${h / 2}px` : h / 2,
        border: "none",
        background: bg,
        color: fg,
        fontSize: 13,
        fontWeight: 600,
        cursor: done ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: done ? 0.7 : 1,
        whiteSpace: "nowrap",
      }}
    >
      <Icon name={state === "undo" ? "undo" : state === "done" ? "check" : "layout-dashboard"} size={done ? 22 : 20} />
      {!done && label}
    </button>
  );
  if (!split) return main;
  /* a split button: tidy on the left, the placement menu behind the trailing half,
   * 3px apart like a connected run */
  return (
    <div ref={ref} style={{ position: "relative", display: "flex", gap: 3, alignItems: "center", width: pill ? undefined : "100%" }}>
      {main}
      <button
        onClick={() => setMenu((m) => !m)}
        title={t("placement", lang)}
        aria-label={t("placement", lang)}
        aria-expanded={menu}
        aria-haspopup="true"
        className="kit-press"
        style={{
          height: h,
          width: h,
          borderRadius: done ? h / 2 : `${R_INNER}px ${h / 2}px ${h / 2}px ${R_INNER}px`,
          border: "none",
          background: bg,
          color: fg,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          opacity: done ? 0.7 : 1,
        }}
      >
        <PlaceGlyph place={current} size={20} />
      </button>
      {menu && (
        /* the placement choices as one compact row, floating off the trailing half */
        <div
          role="group"
          aria-label={t("placement", lang)}
          style={{
            position: "absolute",
            ...(pill ? { bottom: "100%", marginBottom: 8 } : { top: "100%", marginTop: 8 }),
            right: 0,
            display: "flex",
            gap: 3,
            padding: 4,
            borderRadius: 24,
            background: p.popover,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 30,
          }}
        >
          {PLACES.map((k) => {
            const on = current === k;
            return (
              <button
                key={k}
                aria-pressed={on}
                title={placeLabel(k)}
                aria-label={placeLabel(k)}
                onClick={() => {
                  setMenu(false);
                  onPlace(k);
                }}
                className="kit-press"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  border: "none",
                  background: on ? p.secondary : "transparent",
                  color: on ? p.secondaryForeground : p.mutedForeground,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <PlaceGlyph place={k} size={22} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  icon = "delete_sweep",
  p,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  icon?: string;
  p: Palette;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const lang = useLang();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
      if (e.key === "Enter") {
        e.stopPropagation();
        onConfirm();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onCancel, onConfirm]);
  const btn = (label: string, primary: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className="kit-press"
      style={{
        height: 40,
        padding: "0 16px",
        borderRadius: 20,
        border: "none",
        background: primary ? p.primary : "transparent",
        color: primary ? p.primaryForeground : p.primary,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onCancel}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 600,
            background: "rgba(0,0,0,0.32)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal
            aria-label={title}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.7 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(100%, 340px)",
              padding: 24,
              borderRadius: 28,
              background: p.accent,
              color: p.foreground,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ textAlign: "center", color: p.danger }}>
              <Icon name={icon} size={28} />
            </div>
            <div style={{ fontSize: 22, textAlign: "center" }}>{title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: p.mutedForeground }}>{body}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {btn(t("cancel", lang), false, onCancel)}
              {btn(t("ok", lang), true, onConfirm)}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
