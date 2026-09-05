"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/lib/tokens";
import { AnimatePresence, motion } from "motion/react";
import type { TargetAndTransition, Variants } from "motion/react";
import {
  Action,
  BACK_TARGET,
  Doc,
  Frame,
  GAP,
  Group,
  H,
  LIST_ROW_H,
  MENU_ROW_H,
  Palette,
  SLIDE_SPEC,
  TAPPABLE,
  TITLE_BAR_H,
  WINDOW_R,
  Transition,
  baseRadii,
  connectSpecOf,
  fontFamilyOf,
  frameH,
  frameW,
  freeRadii,
  groupsInFrame,
  normalizeTheme,
  toggleIcon,
  uniformRadii,
} from "@/lib/tokens";
import { Icon, KitNode } from "./KitNode";
import { IconBtn } from "./ui";
import { t, useLang } from "@/lib/i18n";

const EASE = [0.2, 0, 0, 1] as const;
const SLIDE_MS = 0.42;

type Anim = { t: Transition; back: boolean; /** the reduced motion scheme: views change with no animation at all */ reduced?: boolean };

/** how the current screen was reached, so "back" can play it in reverse */
type Entry = { id: string; t: Transition };

const pct = (v: number) => `${v * 100}%`;

/** offset along one axis, as a percentage of the screen */
const off = (axis: "x" | "y", v: number) => (axis === "x" ? { x: pct(v), y: 0 } : { x: 0, y: pct(v) });

type Pose = TargetAndTransition;

/** enter / leave poses for one screen change; the same spec drives forward and back */
function poses(c: Anim): { initial: Pose; animate: Pose; exit: Pose } {
  const zi = { zIndex: { duration: 0 } };
  const s = SLIDE_SPEC[c.t];
  if (s) {
    const tr = c.reduced ? { duration: 0, ...zi } : { duration: SLIDE_MS, ease: EASE, ...zi };
    return c.back
      ? {
          initial: { ...off(s.axis, s.exit), opacity: 0.6, scale: 1, zIndex: 1 },
          animate: { x: 0, y: 0, opacity: 1, scale: 1, zIndex: 1, transition: tr },
          exit: { ...off(s.axis, s.enter), opacity: 1, scale: 1, zIndex: 2, transition: tr },
        }
      : {
          initial: { ...off(s.axis, s.enter), opacity: 1, scale: 1, zIndex: 2 },
          animate: { x: 0, y: 0, opacity: 1, scale: 1, zIndex: 2, transition: tr },
          exit: { ...off(s.axis, s.exit), opacity: 0.6, scale: 1, zIndex: 1, transition: tr },
        };
  }
  if (c.t === "fade") {
    const tr = c.reduced ? { duration: 0, ...zi } : { duration: 0.3, ease: EASE, ...zi };
    return {
      initial: { x: 0, y: 0, opacity: 0, scale: 1, zIndex: 2 },
      animate: { x: 0, y: 0, opacity: 1, scale: 1, zIndex: 2, transition: tr },
      exit: { x: 0, y: 0, opacity: 0, scale: 1, zIndex: 1, transition: tr },
    };
  }
  if (c.t === "expand") {
    const tr = c.reduced ? { duration: 0, ...zi } : { duration: 0.36, ease: EASE, ...zi };
    return c.back
      ? {
          initial: { x: 0, y: 0, scale: 0.92, opacity: 0, zIndex: 1 },
          animate: { x: 0, y: 0, scale: 1, opacity: 1, zIndex: 1, transition: tr },
          exit: { x: 0, y: 0, scale: 1.06, opacity: 0, zIndex: 2, transition: tr },
        }
      : {
          initial: { x: 0, y: 0, scale: 0.92, opacity: 0, zIndex: 2 },
          animate: { x: 0, y: 0, scale: 1, opacity: 1, zIndex: 2, transition: tr },
          exit: { x: 0, y: 0, scale: 1.06, opacity: 0, zIndex: 1, transition: tr },
        };
  }
  const tr = { duration: 0, ...zi };
  return {
    initial: { x: 0, y: 0, opacity: 1, scale: 1, zIndex: 2 },
    animate: { x: 0, y: 0, opacity: 1, scale: 1, zIndex: 2, transition: tr },
    exit: { x: 0, y: 0, opacity: 1, scale: 1, zIndex: 1, transition: tr },
  };
}

const screenVariants: Variants = {
  initial: (c: Anim) => poses(c).initial,
  animate: (c: Anim) => poses(c).animate,
  exit: (c: Anim) => poses(c).exit,
};

/** kinds whose on/off state flips when tapped in the preview */
const TOGGLES = ["switch", "checkbox", "chip"] as const;
const flips = (it: Item) => (TOGGLES as readonly string[]).includes(it.kind) || !!it.toggle;

/** the look of a part after the visitor tapped it */
function flippedLook(it: Item): Item {
  if ((TOGGLES as readonly string[]).includes(it.kind)) return { ...it, checked: !it.checked };
  if (it.toggle) {
    return {
      ...it,
      label: it.toggle.label ?? it.label,
      icon: toggleIcon(it),
      variant: it.toggle.variant ?? it.variant,
    };
  }
  return it;
}

/** A part in the preview: presses down and shows a state layer while the
 *  pointer is on it, then fires its action on release, like a real widget. */
function Tappable({
  item,
  p,
  radii,
  widths,
  onTap,
  onSlot,
  onValue,
}: {
  item: Item;
  p: Palette;
  radii: ReturnType<typeof baseRadii>;
  widths: Record<string, number>;
  onTap?: () => void;
  /** per-slot targets on bars */
  onSlot?: (slot: string) => void;
  /** live value for sliders */
  onValue?: (v: number) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [hot, setHot] = useState<string | null>(null);
  const live = !!onTap || (TAPPABLE.includes(item.kind) && item.kind !== "text");
  const ref = useRef<HTMLDivElement>(null);

  const dragValue = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !onValue) return;
    onValue(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100));
  };

  /** hit areas for the slots a window navigates by: a title bar's icon buttons,
   *  and the rows of a sidebar, tab bar, toolbar, menu, list or breadcrumb */
  const slots: { key: string; style: React.CSSProperties }[] = [];
  const rows = item.tabs?.length ?? 0;
  if (onSlot && item.kind === "titleBar") {
    if (item.icon) slots.push({ key: "icon", style: { left: 4, top: 4, width: 26, height: 26, borderRadius: 4 } });
    if (item.icon2) slots.push({ key: "icon2", style: { right: 4, top: 4, width: 26, height: 26, borderRadius: 4 } });
  }
  if (onSlot && item.kind === "sidebar") {
    /* the header sits above the entries, so the first row starts below it */
    for (let i = 0; i < rows; i++)
      slots.push({ key: `tab:${i}`, style: { left: 8, right: 8, top: 8 + H + 8 + i * H, height: H, borderRadius: 6 } });
  }
  if (onSlot && (item.kind === "tabs" || item.kind === "buttonGroup")) {
    for (let i = 0; i < rows; i++)
      slots.push({ key: `tab:${i}`, style: { left: `${(i / rows) * 100}%`, width: `${100 / rows}%`, top: 0, bottom: 0, borderRadius: 6 } });
  }
  if (onSlot && item.kind === "toolbar") {
    for (let i = 0; i < rows; i++) slots.push({ key: `tab:${i}`, style: { left: 4 + i * (H + 4), width: H, top: 4, height: H, borderRadius: 6 } });
  }
  if (onSlot && item.kind === "menu") {
    for (let i = 0; i < rows; i++) slots.push({ key: `tab:${i}`, style: { left: 4, right: 4, top: 4 + i * MENU_ROW_H, height: MENU_ROW_H, borderRadius: 4 } });
  }
  if (onSlot && item.kind === "list") {
    for (let i = 0; i < rows; i++) slots.push({ key: `tab:${i}`, style: { left: 4, right: 4, top: 4 + i * LIST_ROW_H, height: LIST_ROW_H } });
  }
  if (onSlot && item.kind === "breadcrumb") {
    for (let i = 0; i < rows; i++)
      slots.push({ key: `tab:${i}`, style: { left: `${(i / rows) * 100}%`, width: `${100 / rows}%`, top: 0, bottom: 0, borderRadius: 4 } });
  }

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        if (onValue) {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          dragValue(e);
          setPressed(true);
          return;
        }
        if (live) setPressed(true);
      }}
      onPointerMove={(e) => {
        if (onValue && pressed) dragValue(e);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => !onValue && setPressed(false)}
      onClick={onTap}
      style={{ cursor: live || onValue ? "pointer" : "default", display: "flex", position: "relative", touchAction: "none" }}
    >
      <KitNode item={item} palette={p} widths={widths} radii={radii} interactive={false} pressed={pressed && !onValue} />
      {live && (
        <motion.div
          aria-hidden
          initial={false}
          animate={{ opacity: pressed ? 1 : 0, scale: pressed ? 0.97 : 1 }}
          transition={{ duration: pressed ? 0.08 : 0.24, ease: EASE }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `color-mix(in srgb, ${p.foreground} 12%, transparent)`,
            borderTopLeftRadius: radii.tl,
            borderTopRightRadius: radii.tr,
            borderBottomLeftRadius: radii.bl,
            borderBottomRightRadius: radii.br,
          }}
        />
      )}
      {slots.map((s) => (
        <div
          key={s.key}
          onPointerDown={(e) => {
            e.stopPropagation();
            setHot(s.key);
          }}
          onPointerUp={() => setHot(null)}
          onPointerCancel={() => setHot(null)}
          onPointerLeave={() => setHot(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSlot!(s.key);
          }}
          style={{
            position: "absolute",
            cursor: "pointer",
            background: hot === s.key ? `color-mix(in srgb, ${p.foreground} 12%, transparent)` : "transparent",
            transition: "background 120ms",
            ...s.style,
          }}
        />
      ))}
    </div>
  );
}

function Screen({
  frame,
  groups,
  widths,
  p,
  onAction,
  flipped,
  onFlip,
  values,
  onValue,
}: {
  frame: Frame;
  groups: Group[];
  widths: Record<string, number>;
  p: Palette;
  onAction: (a: Action) => void;
  /** ids of toggles the visitor has flipped since the preview opened */
  flipped: Set<string>;
  onFlip: (id: string) => void;
  values: Record<string, number>;
  onValue: (id: string, v: number) => void;
}) {
  /* one group, placed relative to (ox, oy); children carry their own
   * container-relative coordinates, so they render at a zero offset */
  const renderGroup = (g: Group, ox: number, oy: number): React.ReactNode => (
    <div
      key={g.id}
      style={
        g.free
          ? { position: "absolute", left: g.x - ox, top: g.y - oy }
          : {
              position: "absolute",
              left: g.x - ox,
              top: g.y - oy,
              display: "flex",
              flexDirection: g.axis === "x" ? "row" : "column",
              alignItems: g.axis === "x" ? "center" : "stretch",
              gap: GAP,
            }
      }
    >
      {((corners) => g.items.map((it, i) => {
        const conn = connectSpecOf(it);
        const n = g.free ? 1 : g.items.length;
        const radii = g.free
          ? (corners?.get(it.id) ?? baseRadii(it))
          : conn && n > 1
            ? g.axis === "x"
              ? {
                  tl: i === 0 ? conn.outer : conn.inner,
                  bl: i === 0 ? conn.outer : conn.inner,
                  tr: i === n - 1 ? conn.outer : conn.inner,
                  br: i === n - 1 ? conn.outer : conn.inner,
                }
              : {
                  tl: i === 0 ? conn.outer : conn.inner,
                  tr: i === 0 ? conn.outer : conn.inner,
                  bl: i === n - 1 ? conn.outer : conn.inner,
                  br: i === n - 1 ? conn.outer : conn.inner,
                }
            : conn
              ? uniformRadii(conn.outer)
              : baseRadii(it);
        const act = it.action;
        let shown = flipped.has(it.id) ? flippedLook(it) : it;
        if (it.kind === "slider" && values[it.id] !== undefined) shown = { ...shown, value: values[it.id] };
        const tap =
          act || flips(it)
            ? () => {
                if (flips(it)) onFlip(it.id);
                if (act) onAction(act);
              }
            : undefined;
        const slotActions = it.actions;
        const node = (
          <Tappable
            key={it.id}
            item={shown}
            p={p}
            radii={radii}
            widths={widths}
            onTap={tap}
            onSlot={slotActions ? (slot) => slotActions[slot] && onAction(slotActions[slot]) : undefined}
            onValue={it.kind === "slider" ? (v) => onValue(it.id, v) : undefined}
          />
        );
        if (!g.free) return node;
        const o = g.pos?.[it.id] ?? { x: 0, y: 0 };
        return (
          <div key={it.id} style={{ position: "absolute", left: o.x, top: o.y }}>
            {node}
          </div>
        );
      }))(g.free ? freeRadii(g, widths) : null)}
      {g.children?.map((c) => renderGroup(c, 0, 0))}
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: p[frame.bg ?? "background"], overflow: "hidden" }}>
      {groups.map((g) => renderGroup(g, frame.x, frame.y))}
    </div>
  );
}

export function Preview({
  doc,
  widths,
  palette: p,
  startId,
  onClose,
}: {
  doc: Doc;
  widths: Record<string, number>;
  palette: Palette;
  startId: string | null;
  onClose: () => void;
}) {
  const lang = useLang();
  const frames = doc.frames;
  const [stack, setStack] = useState<Entry[]>(() => [{ id: startId ?? frames[0]?.id ?? "", t: "none" }]);
  const [anim, setAnim] = useState<Anim>({ t: "none", back: false });
  const theme = normalizeTheme(doc.theme);
  const reduced = theme.motion === "reduced";
  const [scale, setScale] = useState(1);
  const [flipped, setFlipped] = useState<Set<string>>(() => new Set());
  const [values, setValues] = useState<Record<string, number>>({});
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const flip = (id: string) =>
    setFlipped((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const top = stack[stack.length - 1];
  const current = frames.find((f) => f.id === top?.id) ?? frames[0];
  /* each window carries its own size, so the preview scales the one on screen */
  const winW = current ? frameW(current) : 0;
  const winH = current ? frameH(current) : 0;

  /* on a wide browser window the controls stand in a column at the trailing edge,
   * clear of the app window; on a narrow one they stay along the bottom */
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const fit = () => {
      setWide(window.innerWidth >= 720);
      setScale(Math.min(1, (window.innerHeight - 96) / winH, (window.innerWidth - (window.innerWidth < 720 ? 24 : 260)) / winW));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [winW, winH]);

  const back = useCallback(() => {
    const s = stackRef.current;
    if (s.length < 2) return;
    setAnim({ t: s[s.length - 1].t, back: true, reduced });
    setStack(s.slice(0, -1));
  }, [reduced]);

  const go = useCallback(
    (a: Action) => {
      if (a.to === BACK_TARGET) {
        back();
        return;
      }
      if (!frames.some((f) => f.id === a.to)) return;
      setAnim({ t: a.transition, back: false, reduced });
      setStack((s) => [...s, { id: a.to, t: a.transition }]);
    },
    [frames, back, reduced],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Backspace" || e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, onClose]);

  const groupsFor = useCallback((f: Frame) => groupsInFrame(doc.groups, f, frames, widths), [doc.groups, frames, widths]);
  const groups = useMemo(() => (current ? groupsFor(current) : []), [current, groupsFor]);

  const [picker, setPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!picker) return;
    const onDown = (e: PointerEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPicker(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [picker]);

  if (!current) {
    return null;
  }

  const screenProps = {
    widths,
    p,
    onAction: go,
    flipped,
    onFlip: flip,
    values,
    onValue: (id: string, v: number) => setValues((m) => ({ ...m, [id]: v })),
  };

  const barBtn: React.CSSProperties = {
    height: 40,
    padding: "0 14px 0 10px",
    borderRadius: 20,
    border: "none",
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
    /* the column has a fixed width, so labels are cut with an ellipsis instead of widening it */
    width: wide ? "100%" : undefined,
    minWidth: 0,
  };
  const label: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: p.muted,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: winW * scale,
          height: winH * scale,
          position: "relative",
          marginBottom: 56,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: winW,
            height: winH,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            borderRadius: WINDOW_R,
            overflow: "hidden",
            boxSizing: "border-box",
            border: `1px solid ${p.windowBorder}`,
            background: p[current.bg ?? "background"],
            fontFamily: fontFamilyOf(theme.font),
            boxShadow: "0 24px 64px rgba(0,0,0,0.24)",
          }}
        >
          <AnimatePresence initial={false} mode="popLayout" custom={anim}>
            <motion.div
              key={current.id}
              custom={anim}
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ position: "absolute", inset: 0 }}
            >
              <Screen frame={current} groups={groups} {...screenProps} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div
        style={
          wide
            ? { position: "absolute", right: 20, bottom: 20, display: "flex", alignItems: "flex-end", pointerEvents: "none" }
            : { position: "absolute", left: 0, right: 0, bottom: 14, display: "flex", justifyContent: "center", pointerEvents: "none" }
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: wide ? "column" : "row",
            alignItems: wide ? "stretch" : "center",
            gap: 4,
            padding: 6,
            borderRadius: 28,
            background: p.background,
            boxShadow: "0 4px 18px rgba(0,0,0,0.14)",
            pointerEvents: "auto",
            width: wide ? 172 : undefined,
            maxWidth: "calc(100vw - 24px)",
          }}
        >
          <button
            onClick={back}
            disabled={stack.length < 2}
            title={t("back", lang)}
            className="kit-press"
            style={{
              ...barBtn,
              color: stack.length < 2 ? p.border : p.mutedForeground,
              cursor: stack.length < 2 ? "default" : "pointer",
            }}
          >
            <Icon name="arrow-left" size={20} />
            <span style={label}>{t("back", lang)}</span>
          </button>
          <div ref={pickerRef} style={{ position: "relative", minWidth: 0 }}>
            <button
              onClick={() => setPicker((v) => !v)}
              title={t("screens", lang)}
              aria-expanded={picker}
              className="kit-press"
              style={{
                ...barBtn,
                background: p.secondary,
                color: p.secondaryForeground,
                maxWidth: wide ? undefined : 200,
              }}
            >
              <Icon name="window-restore" size={20} />
              <span style={{ ...label, flex: wide ? 1 : undefined, textAlign: "left" }}>{current.name || t("screen", lang)}</span>
              <Icon name={wide ? (picker ? "chevron-right" : "chevron-left") : picker ? "chevron-down" : "chevron-up"} size={18} />
            </button>
            <AnimatePresence>
              {picker && (
                <motion.div
                  role="menu"
                  initial={wide ? { opacity: 0, x: 6, scale: 0.96 } : { opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, x: wide ? 0 : "-50%", y: 0, scale: 1 }}
                  exit={wide ? { opacity: 0, x: 6, scale: 0.96 } : { opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: EASE }}
                  style={{
                    position: "absolute",
                    ...(wide ? { right: "calc(100% + 14px)", bottom: 0 } : { bottom: 48, left: "50%" }),
                    minWidth: 160,
                    maxHeight: "50vh",
                    overflowY: "auto",
                    padding: 6,
                    borderRadius: 18,
                    background: p.muted,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    transformOrigin: wide ? "bottom right" : "bottom center",
                  }}
                >
                  {frames.map((f) => {
                    const on = f.id === current.id;
                    return (
                      <button
                        key={f.id}
                        role="menuitemradio"
                        aria-checked={on}
                        onClick={() => {
                          setPicker(false);
                          if (on) return;
                          setAnim({ t: "fade", back: false, reduced });
                          setStack([{ id: f.id, t: "fade" }]);
                        }}
                        className="kit-press"
                        style={{
                          height: 40,
                          padding: "0 14px 0 10px",
                          borderRadius: 12,
                          border: "none",
                          background: on ? p.secondary : "transparent",
                          color: on ? p.secondaryForeground : p.foreground,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          whiteSpace: "nowrap",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ width: 18, display: "inline-flex" }}>{on && <Icon name="check" size={18} />}</span>
                        {f.name || t("screen", lang)}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onClose} title={t("close", lang)} className="kit-press" style={{ ...barBtn, color: p.mutedForeground }}>
            <Icon name="close" size={20} />
            <span style={label}>{t("closeBtn", lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
