import {
  Frame,
  Group,
  Item,
  Kind,
  WINDOW_MARGIN,
  canJoin,
  connectSpecOf,
  frameH,
  frameOfGroup,
  frameW,
  groupBounds,
} from "./tokens";

/* Rule-based layout for one desktop window. Nothing here is guessed by a model.
 *
 * 1. Parts of one connectable family that sit next to each other fuse into a
 *    connected run, the same way the magnetic drop does: buttons or icon
 *    buttons side by side in a row.
 * 2. The window's own regions take the edges they own, in the order the Design
 *    Guides give them: the title bar across the top, a sidebar down the leading
 *    edge, the status bar across the bottom, a sheet on the edge it opens from,
 *    a toolbar and breadcrumb as bands under the title bar. A dialog centres in
 *    the window and a notification sits in the bottom-trailing corner.
 * 3. Everything else flows from the top of what is left, on 16px panel padding,
 *    which is the `lg` step of the semantic spacing scale. Rows, hand-made
 *    groups and intentional overlaps are kept as one unit, and a part keeps the
 *    side it was on.
 * 4. A menu or popover belongs to whatever opened it, so it is left where the
 *    author put it.
 *
 * Only positions change and runs are joined; sizes, order and contents stay. */

type Rect = { l: number; t: number; r: number; b: number };

/** vertical distance between stacked rows: separate groups in one section */
const ROW_GAP = 16;
/** a tighter gap after a heading and between rows of one kind: one content group */
const TIGHT_GAP = 8;
/** horizontal distance between parts packed into one row: closely related controls */
const ROW_ITEM_GAP = 8;
/** the farthest two parts of one family may be apart and still be joined */
const JOIN_GAP_X = 16;
const JOIN_GAP_Y = 32;
/** parts of one family the author kept apart stay clearly apart, beyond the joining distance */
const APART_GAP_X = JOIN_GAP_X + 8;
const APART_GAP_Y = JOIN_GAP_Y + 8;

/** kinds that read as rows of one list, so they stack on the tighter gap */
const LIST_KINDS = new Set<Kind>(["input", "select", "checkbox", "radio", "switch", "slider", "label", "separator", "tag"]);

/** one movable unit: a group plus everything nested inside or overlapping it */
type Unit = { ids: string[]; bb: Rect; kind: Kind; side?: string; probe: Item };

const overlap = (a: Rect, b: Rect) => Math.min(a.r, b.r) > Math.max(a.l, b.l) && Math.min(a.b, b.b) > Math.max(a.t, b.t);
const union = (a: Rect, b: Rect): Rect => ({ l: Math.min(a.l, b.l), t: Math.min(a.t, b.t), r: Math.max(a.r, b.r), b: Math.max(a.b, b.b) });
/** how much of the smaller extent two spans share, 0..1 */
const share = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)) / Math.max(1, Math.min(a1 - a0, b1 - b0));

/* ---------- 1. join runs ---------- */

/** whether the whole run is one connectable family, so a neighbour can join it */
const runFamily = (g: Group): { axis: "x" | "y"; probe: Item } | null => {
  if (g.free) return null;
  const spec = connectSpecOf(g.items[0]);
  if (!spec) return null;
  if (!g.items.every((it) => canJoin(g.items[0], it))) return null;
  return { axis: spec.axis, probe: g.items[0] };
};

/** Neighbouring runs of one family fuse into a single run, in reading order. */
function joinRuns(groups: Group[], widths: Record<string, number>): Group[] {
  const out = [...groups];
  for (;;) {
    let joined = false;
    const bounds = new Map(out.map((g) => [g.id, groupBounds(g, widths)]));
    outer: for (let i = 0; i < out.length; i++) {
      const a = out[i];
      const fa = runFamily(a);
      if (!fa) continue;
      for (let j = 0; j < out.length; j++) {
        if (i === j) continue;
        const b = out[j];
        const fb = runFamily(b);
        if (!fb || fa.axis !== fb.axis || !canJoin(fa.probe, fb.probe)) continue;
        const ra = bounds.get(a.id)!;
        const rb = bounds.get(b.id)!;
        /* b must come right after a along the axis, and line up across it */
        const gap = fa.axis === "x" ? rb.l - ra.r : rb.t - ra.b;
        if (gap < -2 || gap > (fa.axis === "x" ? JOIN_GAP_X : JOIN_GAP_Y)) continue;
        const lined = fa.axis === "x" ? share(ra.t, ra.b, rb.t, rb.b) : share(ra.l, ra.r, rb.l, rb.r);
        if (lined < 0.5) continue;
        /* nothing else may sit between them */
        const between: Rect = fa.axis === "x" ? { l: ra.r, t: Math.min(ra.t, rb.t), r: rb.l, b: Math.max(ra.b, rb.b) } : { l: Math.min(ra.l, rb.l), t: ra.b, r: Math.max(ra.r, rb.r), b: rb.t };
        if (out.some((o) => o !== a && o !== b && overlap(bounds.get(o.id)!, between))) continue;
        const merged: Group = { ...a, axis: fa.axis, items: [...a.items, ...b.items] };
        /* the run keeps the later layer so the joined parts still draw above whatever they were over */
        const at = Math.max(i, j);
        out.splice(at, 1, merged);
        out.splice(Math.min(i, j), 1);
        joined = true;
        break outer;
      }
    }
    if (!joined) return out;
  }
}

/* ---------- 2 and 3. place ---------- */

const area = (r: Rect) => Math.max(0, r.r - r.l) * Math.max(0, r.b - r.t);

const isTopRegion = (u: Unit) => u.kind === "titleBar";
const isBottomRegion = (u: Unit) => u.kind === "statusBar";
const isSideRegion = (u: Unit) => u.kind === "sidebar" || u.kind === "sheet";
/** bands that sit under the title bar, in this order */
const BANDS: Kind[] = ["toolbar", "breadcrumb"];
const isBand = (u: Unit) => BANDS.includes(u.kind);
const isCentred = (u: Unit) => u.kind === "dialog";
const isCorner = (u: Unit) => u.kind === "notification";
/** a transient overlay belongs to its trigger, so tidying leaves it alone */
const isPinnedByAuthor = (u: Unit) => u.kind === "menu" || u.kind === "popover";
const isAnchored = (u: Unit) =>
  isTopRegion(u) || isBottomRegion(u) || isSideRegion(u) || isBand(u) || isCentred(u) || isCorner(u) || isPinnedByAuthor(u);

/** Groups that touch each other stay together, so a badge on an icon or parts on
 *  a panel move as one. A window region never joins a cluster: it has its own
 *  place and is often drawn over content. */
function clusters(groups: Group[], widths: Record<string, number>): Unit[] {
  const units: Unit[] = groups.map((g) => ({
    ids: [g.id],
    bb: groupBounds(g, widths),
    kind: g.items[0].kind,
    side: g.items[0].side,
    probe: g.items[0],
  }));
  for (;;) {
    let merged = false;
    outer: for (let i = 0; i < units.length; i++) {
      if (isAnchored(units[i])) continue;
      for (let j = i + 1; j < units.length; j++) {
        if (isAnchored(units[j]) || !overlap(units[i].bb, units[j].bb)) continue;
        /* the larger member names the cluster: it is the container, the rest sits on it */
        const big = area(units[i].bb) >= area(units[j].bb) ? units[i] : units[j];
        units[i] = { ...big, ids: [...units[i].ids, ...units[j].ids], bb: union(units[i].bb, units[j].bb) };
        units.splice(j, 1);
        merged = true;
        break outer;
      }
    }
    if (!merged) return units;
  }
}

/** Units whose vertical extents overlap and that sit side by side form one row. */
function rowsOf(units: Unit[]): Unit[][] {
  const sorted = [...units].sort((a, b) => a.bb.t - b.bb.t || a.bb.l - b.bb.l);
  const out: Unit[][] = [];
  for (const u of sorted) {
    const row = out[out.length - 1];
    if (row) {
      const rt = Math.min(...row.map((r) => r.bb.t));
      const rb = Math.max(...row.map((r) => r.bb.b));
      const cy = (u.bb.t + u.bb.b) / 2;
      const rcy = (rt + rb) / 2;
      const beside = row.every((r) => r.bb.r <= u.bb.l + 2 || r.bb.l >= u.bb.r - 2);
      if (beside && ((cy >= rt && cy <= rb) || (rcy >= u.bb.t && rcy <= u.bb.b))) {
        row.push(u);
        continue;
      }
    }
    out.push([u]);
  }
  for (const r of out) r.sort((a, b) => a.bb.l - b.bb.l);
  return out;
}

/** where a unit sits horizontally, so tidying keeps a trailing part trailing.
 *  Judged from the content edges, so a part already on the padding reads the
 *  same way after tidying. */
function align(bb: Rect, content: Rect): "left" | "center" | "right" | "fill" {
  const w = bb.r - bb.l;
  const inner = content.r - content.l - WINDOW_MARGIN * 2;
  if (w >= inner - 8) return "fill";
  const near = WINDOW_MARGIN + 12;
  const left = bb.l - content.l <= near;
  const right = content.r - bb.r <= near;
  if (left && !right) return "left";
  if (right && !left) return "right";
  return "center";
}

/** the gap above a row, from what came before it */
function gapBefore(prev: Unit[] | null, row: Unit[]): number {
  if (!prev) return 0;
  /* two stacked runs of one family were left separate on purpose: keep them beyond the joining distance */
  if (prev.length === 1 && row.length === 1 && canJoin(prev[0].probe, row[0].probe) && connectSpecOf(prev[0].probe)?.axis === "y") return APART_GAP_Y;
  const pk = prev.length === 1 ? prev[0].kind : null;
  const k = row.length === 1 ? row[0].kind : null;
  if (pk === "text" || pk === "label") return TIGHT_GAP;
  if (pk === "separator" || k === "separator") return TIGHT_GAP;
  if (pk && k && pk === k && LIST_KINDS.has(k)) return TIGHT_GAP;
  return ROW_GAP;
}

/** The tidied groups of the document, or null when `frame` is already tidy. */
export function tidyFrame(groups: Group[], frame: Frame, frames: Frame[], widths: Record<string, number>): Group[] | null {
  const fw = frameW(frame);
  const fh = frameH(frame);
  const fr: Rect = { l: frame.x, t: frame.y, r: frame.x + fw, b: frame.y + fh };
  const mineIds = new Set(groups.filter((g) => frameOfGroup(g, frames, widths)?.id === frame.id).map((g) => g.id));
  if (!mineIds.size) return null;

  /* joining rewrites the list; the other windows' groups keep their slots */
  const before = groups.filter((g) => mineIds.has(g.id));
  const mine = joinRuns(before, widths);
  const joined = mine.length !== before.length;

  const units = clusters(mine, widths);
  const target = new Map<Unit, { l: number; t: number }>();

  /* the regions claim their edges first, narrowing what is left for the content */
  const content: Rect = { ...fr };

  for (const u of units.filter(isTopRegion).sort((a, b) => a.bb.t - b.bb.t)) {
    target.set(u, { l: fr.l, t: content.t });
    content.t += u.bb.b - u.bb.t;
  }
  for (const u of units.filter(isBottomRegion).sort((a, b) => b.bb.t - a.bb.t)) {
    content.b -= u.bb.b - u.bb.t;
    target.set(u, { l: fr.l, t: content.b });
  }
  for (const u of units.filter(isSideRegion)) {
    const w = u.bb.r - u.bb.l;
    const h = u.bb.b - u.bb.t;
    const side = u.kind === "sidebar" ? "left" : (u.side ?? "right");
    if (side === "left") {
      target.set(u, { l: content.l, t: content.t });
      content.l += w;
    } else if (side === "right") {
      target.set(u, { l: content.r - w, t: content.t });
      content.r -= w;
    } else if (side === "top") {
      target.set(u, { l: content.l, t: content.t });
      content.t += h;
    } else {
      content.b -= h;
      target.set(u, { l: content.l, t: content.b });
    }
  }
  /* the bands run across the content, in the order the guides give them */
  for (const kind of BANDS) {
    for (const u of units.filter((x) => x.kind === kind).sort((a, b) => a.bb.t - b.bb.t)) {
      target.set(u, { l: content.l + WINDOW_MARGIN, t: content.t + (kind === "toolbar" ? 0 : TIGHT_GAP) });
      content.t += (u.bb.b - u.bb.t) + (kind === "toolbar" ? 0 : TIGHT_GAP);
    }
  }
  for (const u of units.filter(isCentred)) {
    target.set(u, {
      l: fr.l + Math.round((fw - (u.bb.r - u.bb.l)) / 2),
      t: fr.t + Math.round((fh - (u.bb.b - u.bb.t)) / 2),
    });
  }
  let cornerBottom = content.b;
  for (const u of units.filter(isCorner).sort((a, b) => b.bb.t - a.bb.t)) {
    const w = u.bb.r - u.bb.l;
    const h = u.bb.b - u.bb.t;
    cornerBottom -= WINDOW_MARGIN + h;
    target.set(u, { l: content.r - WINDOW_MARGIN - w, t: cornerBottom });
  }

  /* everything else flows from the top of the content area on the panel padding;
   * rows that would not fit are left where they are rather than pushed off the window */
  const flowing = units.filter((u) => !target.has(u) && !isPinnedByAuthor(u));
  const rows = rowsOf(flowing);
  const inner = content.r - content.l - WINDOW_MARGIN * 2;
  const limit = content.b - WINDOW_MARGIN;
  let y = content.t + WINDOW_MARGIN;
  let prev: Unit[] | null = null;
  for (const row of rows) {
    y += gapBefore(prev, row);
    const rowH = Math.max(...row.map((u) => u.bb.b - u.bb.t));
    if (y + rowH > limit) break;
    if (row.length === 1) {
      const u = row[0];
      const w = u.bb.r - u.bb.l;
      const a = align(u.bb, content);
      const l =
        a === "left" || a === "fill"
          ? content.l + WINDOW_MARGIN
          : a === "right"
            ? content.r - WINDOW_MARGIN - w
            : content.l + Math.round((content.r - content.l - w) / 2);
      target.set(u, { l, t: y });
    } else {
      const ws = row.map((u) => u.bb.r - u.bb.l);
      const total = ws.reduce((s, w) => s + w, 0);
      /* neighbours of one family that were not joined were kept apart on purpose */
      const gaps = row.slice(1).map((u, i) => (canJoin(row[i].probe, u.probe) ? APART_GAP_X : ROW_ITEM_GAP));
      const minPacked = total + gaps.reduce((s, g) => s + g, 0);
      const span = row[row.length - 1].bb.r - row[0].bb.l;
      const spread = span >= inner * 0.7 && minPacked <= inner;
      const packed = spread ? inner : minPacked;
      const extra = spread ? (inner - minPacked) / gaps.length : 0;
      const a = spread ? "left" : align({ l: row[0].bb.l, t: 0, r: row[row.length - 1].bb.r, b: 0 }, content);
      let x =
        a === "right"
          ? content.r - WINDOW_MARGIN - packed
          : a === "center"
            ? content.l + (content.r - content.l - packed) / 2
            : content.l + WINDOW_MARGIN;
      row.forEach((u, i) => {
        const h = u.bb.b - u.bb.t;
        target.set(u, { l: Math.round(x), t: y + Math.round((rowH - h) / 2) });
        x += ws[i] + (gaps[i] ?? 0) + extra;
      });
    }
    y += rowH;
    prev = row;
  }

  /* apply each unit's shift to every group it holds */
  const shift = new Map<string, { dx: number; dy: number }>();
  for (const [u, to] of target) {
    const dx = Math.round(to.l - u.bb.l);
    const dy = Math.round(to.t - u.bb.t);
    for (const id of u.ids) shift.set(id, { dx, dy });
  }
  let moved = joined;
  const placed = new Map(
    mine.map((g) => {
      const s = shift.get(g.id);
      if (!s || (s.dx === 0 && s.dy === 0)) return [g.id, g] as const;
      moved = true;
      return [g.id, { ...g, x: g.x + s.dx, y: g.y + s.dy }] as const;
    }),
  );
  if (!moved) return null;
  /* keep canvas order: a joined run takes the slot of its last original member */
  const survivorOf = new Map<string, Group>();
  for (const m of mine) for (const it of m.items) survivorOf.set(it.id, m);
  const lastSlot = new Map<string, number>();
  groups.forEach((g, i) => {
    if (mineIds.has(g.id)) lastSlot.set(survivorOf.get(g.items[0].id)!.id, i);
  });
  const out: Group[] = [];
  groups.forEach((g, i) => {
    if (!mineIds.has(g.id)) {
      out.push(g);
      return;
    }
    const m = survivorOf.get(g.items[0].id)!;
    if (lastSlot.get(m.id) === i) out.push(placed.get(m.id)!);
  });
  return out;
}
