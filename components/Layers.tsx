"use client";

import { useMemo } from "react";
import { Reorder, useDragControls } from "motion/react";
import { Frame, Group, KIND_SPEC, Palette } from "@/lib/tokens";
import { Icon } from "./KitNode";
import { IconBtn } from "./ui";
import { t, useLang } from "@/lib/i18n";

function Row({
  g,
  p,
  on,
  onSelect,
  onUp,
  onDown,
  canUp,
  canDown,
}: {
  g: Group;
  p: Palette;
  on: boolean;
  onSelect: (add: boolean) => void;
  onUp: () => void;
  onDown: () => void;
  canUp: boolean;
  canDown: boolean;
}) {
  const lang = useLang();
  const controls = useDragControls();
  const first = g.items[0];
  const spec = KIND_SPEC[first.kind];
  const label =
    g.free
      ? `${t("group", lang)} × ${g.items.length}`
      : g.items.length > 1
      ? `${spec.label} × ${g.items.length}`
      : first.label.trim() || (first.kind === "iconButton" || first.kind === "icon" ? (first.icon ?? spec.label) : spec.label);
  return (
    <Reorder.Item
      value={g.id}
      dragListener={false}
      dragControls={controls}
      style={{
        listStyle: "none",
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 40,
        padding: "0 4px 0 2px",
        borderRadius: 14,
        background: on ? p.secondary : p.muted,
        color: on ? p.secondaryForeground : p.foreground,
        position: "relative",
        userSelect: "none",
      }}
    >
      <span
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        style={{ cursor: "grab", color: p.border, display: "grid", placeItems: "center", width: 24, height: 40, touchAction: "none" }}
      >
        <Icon name="ellipsis-vertical" size={18} />
      </span>
      <button
        onClick={(e) => onSelect(e.shiftKey)}
        style={{
          flex: 1,
          minWidth: 0,
          height: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "none",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
        }}
      >
        <span style={{ display: "inline-flex", gap: 2, color: on ? p.secondaryForeground : p.primary }}>
          {g.free ? <Icon name="gallery-vertical-end" size={18} /> : g.items.slice(0, 3).map((it, i) => <Icon key={i} name={KIND_SPEC[it.kind].paletteIcon} size={18} />)}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </button>
      <IconBtn icon="chevron-up" p={p} size={28} onClick={onUp} disabled={!canUp} title={t("layerUp", lang)} />
      <IconBtn icon="chevron-down" p={p} size={28} onClick={onDown} disabled={!canDown} title={t("layerDown", lang)} />
    </Reorder.Item>
  );
}

/** The z-order of one screen, top layer first. Drag the handle or use the arrows. */
export function LayersPanel({
  p,
  frames,
  frameId,
  onFrame,
  groups,
  selectedIds,
  onSelect,
  onReorder,
}: {
  p: Palette;
  frames: Frame[];
  frameId: string | null;
  onFrame: (id: string) => void;
  /** the runs on the chosen frame, in canvas order (bottom first) */
  groups: Group[];
  selectedIds: string[];
  /** `add` is set when Shift was held, to extend the selection */
  onSelect: (itemIds: string[], add: boolean) => void;
  /** new order, top layer first */
  onReorder: (topFirst: string[]) => void;
}) {
  const lang = useLang();
  const topFirst = useMemo(() => [...groups].reverse(), [groups]);
  const ids = topFirst.map((g) => g.id);
  const sel = new Set(selectedIds);
  const move = (i: number, d: number) => {
    const next = [...ids];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onReorder(next);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {frames.length > 1 && (
        <div className="no-scrollbar" style={{ display: "flex", gap: 6, padding: "12px 12px 4px", overflowX: "auto", flex: "0 0 auto" }}>
          {frames.map((f) => {
            const on = f.id === frameId;
            return (
              <button
                key={f.id}
                onClick={() => onFrame(f.id)}
                className="kit-press"
                style={{
                  height: 32,
                  padding: "0 12px 0 8px",
                  borderRadius: 16,
                  border: "none",
                  background: on ? p.primary : p.accent,
                  color: on ? p.primaryForeground : p.mutedForeground,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                }}
              >
                <Icon name="window-restore" size={16} />
                {f.name || t("screen", lang)}
              </button>
            );
          })}
        </div>
      )}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 10px 12px" }}>
        {topFirst.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: p.border, fontSize: 12 }}>
            <Icon name="circle-x" size={32} />
            <div style={{ marginTop: 8 }}>{t("noLayers", lang)}</div>
          </div>
        ) : (
          <Reorder.Group axis="y" values={ids} onReorder={onReorder} style={{ display: "flex", flexDirection: "column", gap: 4, padding: 0, margin: 0 }}>
            {topFirst.map((g, i) => (
              <Row
                key={g.id}
                g={g}
                p={p}
                on={g.items.some((it) => sel.has(it.id))}
                onSelect={(add) => onSelect(g.items.map((it) => it.id), add)}
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                canUp={i > 0}
                canDown={i < topFirst.length - 1}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
