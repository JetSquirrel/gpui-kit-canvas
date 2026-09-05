import { Doc, Group, KIND_ORDER, Kind, VARIANTS, groupBounds, isContainerGroup, isShell } from "./tokens";
import { isLang } from "./i18n";

/* A project file is the Doc as JSON, nothing more. Reading one back only checks
 * the shape the editor relies on; the same migrations that run on a saved
 * document then bring an older file up to date. */

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const KINDS = new Set<string>(KIND_ORDER);

/** kinds that have been renamed since a document could have been saved with them */
export const KIND_ALIASES: Record<string, Kind> = { divider: "separator" };

const validTabs = (tabs: unknown) => tabs === undefined || (Array.isArray(tabs) && tabs.every((tab) => isRecord(tab) && typeof tab.label === "string" && typeof tab.icon === "string"));

const validItem = (item: unknown) =>
  isRecord(item) &&
  typeof item.id === "string" &&
  typeof item.kind === "string" &&
  (KINDS.has(item.kind as Kind) || item.kind in KIND_ALIASES) &&
  typeof item.label === "string" &&
  (typeof item.icon === "string" || item.icon === null) &&
  VARIANTS.some((variant) => variant.key === item.variant) &&
  (item.supporting === undefined || typeof item.supporting === "string") &&
  (item.note === undefined || typeof item.note === "string") &&
  validTabs(item.tabs);

const validGroup = (group: unknown): boolean =>
  isRecord(group) &&
  typeof group.id === "string" &&
  Number.isFinite(group.x) &&
  Number.isFinite(group.y) &&
  (group.axis === "x" || group.axis === "y") &&
  Array.isArray(group.items) &&
  group.items.length > 0 &&
  group.items.every(validItem) &&
  (group.children === undefined || (Array.isArray(group.children) && group.children.length > 0 && group.children.every(validGroup)));

const validFrame = (frame: unknown) =>
  isRecord(frame) &&
  typeof frame.id === "string" &&
  typeof frame.name === "string" &&
  Number.isFinite(frame.x) &&
  Number.isFinite(frame.y) &&
  (frame.w === undefined || Number.isFinite(frame.w)) &&
  (frame.h === undefined || Number.isFinite(frame.h)) &&
  (frame.shell === undefined || isShell(frame.shell)) &&
  (frame.note === undefined || typeof frame.note === "string");

/** whether a parsed file has the shape of a document the editor can open */
export const isProject = (value: unknown): value is Doc =>
  isRecord(value) &&
  Array.isArray(value.groups) &&
  Array.isArray(value.frames) &&
  value.groups.every(validGroup) &&
  value.frames.every(validFrame) &&
  (value.lang === undefined || isLang(value.lang));

/** the file name a project is saved under: gpui-kit-canvas, followed by the app's name when it has one */
export const projectFileName = (doc: Doc) => {
  const name = doc.title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name ? `gpui-kit-canvas ${name}.json` : "gpui-kit-canvas.json";
};

/** hands the document to the browser as a JSON download */
export function saveProject(doc: Doc) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = projectFileName(doc);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** reads a chosen file back into a document, or null when it is not one */
export async function readProject(file: File): Promise<Doc | null> {
  try {
    const next: unknown = JSON.parse(await file.text());
    if (!isProject(next)) return null;
    return { ...next, groups: nestContained(next.groups) };
  } catch {
    return null;
  }
}

/** A group whose parts use a kind's old name, read with its current one. */
export const migrateKinds = (group: Group): Group => ({
  ...group,
  items: group.items.map((item) => (item.kind in KIND_ALIASES ? { ...item, kind: KIND_ALIASES[item.kind] } : item)),
  children: group.children?.map(migrateKinds),
});

/* ---------- nesting flat documents ---------- */

type Rect = { l: number; t: number; r: number; b: number };

const rectArea = (r: Rect) => Math.max(0, r.r - r.l) * Math.max(0, r.b - r.t);
const rectContains = (o: Rect, i: Rect, tol = 2) => i.l >= o.l - tol && i.t >= o.t - tol && i.r <= o.r + tol && i.b <= o.b + tol;

/** a window region owns its edge, so it never nests inside another group */
const NEST_EXCLUDE: Kind[] = ["titleBar", "statusBar", "sidebar", "sheet"];

/** Brings a flat, world-space group list up to date with nesting: a group that
 *  sits fully inside an earlier, larger container group becomes that group's
 *  child, its coordinates re-based relative to the container. Mirrors the
 *  containment rules the prompt builder always inferred. */
export function nestContained(groups: Group[]): Group[] {
  const out: Group[] = [];
  const containers = (gs: Group[], ox: number, oy: number, into: { g: Group; wx: number; wy: number; bb: Rect }[]) => {
    for (const g of gs) {
      const wx = ox + g.x;
      const wy = oy + g.y;
      if (isContainerGroup(g)) into.push({ g, wx, wy, bb: groupBounds({ ...g, x: wx, y: wy }, {}) });
      if (g.children) containers(g.children, wx, wy, into);
    }
  };
  for (const g of groups) {
    if (g.free || NEST_EXCLUDE.includes(g.items[0].kind)) {
      out.push(g);
      continue;
    }
    const bb = groupBounds(g, {});
    const cands: { g: Group; wx: number; wy: number; bb: Rect }[] = [];
    containers(out, 0, 0, cands);
    let best: (typeof cands)[number] | null = null;
    for (const c of cands) {
      if (rectArea(c.bb) <= rectArea(bb) || !rectContains(c.bb, bb)) continue;
      if (!best || rectArea(c.bb) < rectArea(best.bb)) best = c;
    }
    if (!best) {
      out.push(g);
      continue;
    }
    (best.g.children ??= []).push({ ...g, x: g.x - best.wx, y: g.y - best.wy });
  }
  return out;
}
