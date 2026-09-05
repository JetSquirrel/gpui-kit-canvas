"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { toPng } from "html-to-image";
import { buildPrompt, effectivePrompt } from "@/lib/prompt";
import {
  Action,
  actionsOf,
  Axis,
  BACK_TARGET,
  baseRadii,
  explodeGroup,
  findGroup,
  flattenGroups,
  freeRadii,
  canJoin,
  clamp,
  cloneGroup,
  connectSpecOf,
  Doc,
  Frame,
  FRAME_GAP,
  FRAME_LABEL_H,
  FrameMode,
  frameOfGroup,
  frameRect,
  GAP,
  Group,
  groupBounds,
  isContainerGroup,
  Item,
  Kind,
  KIND_ORDER,
  KIND_SPEC,
  collapseFree,
  layoutOf,
  lerp,
  makeItem,
  mapGroups,
  replaceGroup,
  subtreeBounds,
  DEFAULT_THEME,
  Theme,
  fontFamilyOf,
  normalizeTheme,
  localizeFrames,
  localizeGroups,
  setGlobalDensity,
  setGlobalShape,
  MEASURED,
  Palette,
  paletteOf,
  DEFAULT_SHELL,
  TITLE_BAR_H,
  WINDOW_H,
  WINDOW_MARGIN,
  WINDOW_R,
  WINDOW_W,
  frameH,
  frameW,
  PULL_EXP,
  Radii,
  SETTLE_MS,
  sizeOf,
  SNAP_CROSS,
  SNAP_MAIN,
  Transition,
  TRANSITIONS,
  uid,
  uniformRadii,
} from "@/lib/tokens";
import { Icon, KitNode, KitStatic, MeasuredContent } from "@/components/KitNode";
import { LayersPanel } from "@/components/Layers";
import { FrameInspector, Inspector } from "@/components/Inspector";
import { Preview } from "@/components/Preview";
import { Logo } from "@/components/Logo";
import { PartsPalette } from "@/components/PartsPalette";
import { PromptPanel } from "@/components/PromptPanel";
import { GitHubLink, Mode, Toolbar } from "@/components/Toolbar";
import { LangMenu } from "@/components/Menus";
import { AiActionKey, AiPanel, aiErrorText } from "@/components/AiPanel";
import { TidyState } from "@/components/ui";
import { AiSettings, DEFAULT_AI, hasKey, isSecureUrl, loadAiSettings, proposeBehavior, proposeDescription, pushHistory, saveAiSettings } from "@/lib/ai";
import { carryFrame, tidyFrame } from "@/lib/tidy";
import { migrateKinds, readProject, saveProject } from "@/lib/project";
import { ColorPanel } from "@/components/ColorPanel";
import { MotionPanel, ShapePanel, TypePanel } from "@/components/ThemePanel";
import { ThemeContext, ensureFontLoaded } from "@/lib/theme";
import { BottomSheet, MobileActionBar, MobileInspector, MobileLang, MobileSettings } from "@/components/Mobile";
import { ConfirmDialog, IconBtn, Segmented } from "@/components/ui";
import { DEFAULT_LANG, Lang, LangContext, isLang, setGlobalLang, t } from "@/lib/i18n";

/** the dragged part's own travel: a little lag reads as weight */
const CARRY = {
  type: "spring" as const,
  stiffness: 620,
  damping: 38,
  mass: 0.7,
};
/** the gap opening and the run's counter-shift; identical configs so they cancel */
const OPEN = {
  type: "spring" as const,
  stiffness: 700,
  damping: 42,
  mass: 0.55,
};
const INSTANT = { duration: 0 };

/** the icon rail on the left edge of the parts / layers panel */
const RAIL_W = 52;
const MIN_Z = 0.25;
const MAX_Z = 3;
const HISTORY_MAX = 100;
const DOC_KEY = "gpui-kit-canvas:doc";
const UI_KEY = "gpui-kit-canvas:ui";

type View = { x: number; y: number; z: number };
type Snap = { groupId: string; index: number; pull: number };

/** alignment guide: the snapped position plus the line to draw */
type Guide = { x?: number; y?: number; gx?: number; gy?: number };
const GUIDE_PX = 7;
const FRAME_MARGIN = WINDOW_MARGIN;

type DragState = {
  item: Item;
  guide: Guide | null;
  offX: number;
  offY: number;
  startX: number;
  startY: number;
  px: number;
  py: number;
  active: boolean;
  fromPalette: boolean;
  overBin: boolean;
  snap: Snap | null;
  /** the container group the dragged part would nest into on drop */
  nest: string | null;
  settling: boolean;
};

type Gesture =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
  | {
      kind: "marquee";
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      moved: boolean;
    }
  | {
      kind: "frame";
      id: string;
      sx: number;
      sy: number;
      fx: number;
      fy: number;
      groups: { id: string; x: number; y: number }[];
      moved: boolean;
    }
  | { kind: "group"; id: string; sx: number; sy: number; gx: number; gy: number; moved: boolean; overBin: boolean };

type ResizeEdge = "e" | "s" | "se";

/** a canvas resize gesture on one part: which edge, where the pointer started
 *  (world coords) and the sizes it started from */
type PartResize = {
  id: string;
  edge: ResizeEdge;
  sx: number;
  sy: number;
  size0: number;
  size20: number;
};

type Snapshot = { groups: Group[]; frames: Frame[] };

/** Seed ids are deterministic so server and client render the same markup, and
 *  so is the name: `t` reads the module's default language until the browser's
 *  is known. `localizeSeed` rebuilds it once that happens. */
const seedFrames = (): Frame[] => [{ id: "seedF1", name: t("home"), x: 0, y: 0, shell: DEFAULT_SHELL }];

/** Seed ids are deterministic so server and client render the same markup.
 *  The starter is the sidebar workspace the Design Guides put first: a title
 *  bar across the top, navigation down the leading edge, a toolbar band, a
 *  table in the work area and a status bar along the bottom. */
const seed = (): Group[] => {
  let n = 0;
  const sid = () => `seed${++n}`;
  const mk = (k: Kind) => ({ ...makeItem(k), id: sid() });
  const bar = mk("titleBar");
  const side = mk("sidebar");
  const tools = mk("toolbar");
  const crumbs = mk("breadcrumb");
  const table = mk("dataTable");
  const status = mk("statusBar");
  const contentX = KIND_SPEC.sidebar.w + WINDOW_MARGIN;
  const contentTop = TITLE_BAR_H;
  table.size = WINDOW_W - contentX - WINDOW_MARGIN;
  side.size2 = WINDOW_H - TITLE_BAR_H;
  return [
    { id: sid(), x: 0, y: 0, axis: "x", items: [bar] },
    { id: sid(), x: 0, y: contentTop, axis: "x", items: [side] },
    { id: sid(), x: contentX, y: contentTop + WINDOW_MARGIN, axis: "x", items: [tools] },
    { id: sid(), x: contentX, y: contentTop + WINDOW_MARGIN + 48, axis: "x", items: [crumbs] },
    { id: sid(), x: contentX, y: contentTop + WINDOW_MARGIN + 88, axis: "x", items: [table] },
    { id: sid(), x: 0, y: WINDOW_H - KIND_SPEC.statusBar.h, axis: "x", items: [status] },
  ];
};

/** The phone version of the editor starts with buttons only: that is all it edits. */
const mobileSeed = (): Group[] => {
  const mk = (k: Kind) => makeItem(k);
  const a = mk("button");
  const b = mk("button");
  const c = mk("button");
  a.label = "Save";
  a.icon = "check";
  a.variant = "primary";
  b.label = "Cancel";
  c.label = "Open";
  c.icon = "folder-open";
  return [
    { id: uid(), x: WINDOW_MARGIN, y: 120, axis: "x", items: [a, b] },
    { id: uid(), x: WINDOW_MARGIN, y: 200, axis: "x", items: [c] },
  ];
};

/** While the model works on a window, the theme's colours sweep its border. */
function ThinkingRing({ p, w, h }: { p: Palette; w: number; h: number }) {
  const still = useReducedMotion();
  const d = Math.ceil(Math.hypot(w, h)) + 80;
  const stops = [p.primary, p.muted, p.primaryHover, p.secondary, p.accent, p.primary];
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <motion.div
        animate={still ? undefined : { rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "linear" }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: d,
          height: d,
          marginLeft: -d / 2,
          marginTop: -d / 2,
          background: `conic-gradient(from 0deg, ${stops.join(", ")})`,
          filter: "blur(22px)",
        }}
      />
    </motion.div>
  );
}

type LeftTab = "parts" | "layers" | "color" | "shape" | "type" | "motion" | "ai";
/** the left rail: parts and layers, then the four theme axes of the whole design */
const LEFT_TABS: { key: LeftTab; icon: string; title: "parts" | "layers" | "colors" | "shape" | "typography" | "motion" | "ai" }[] = [
  { key: "parts", icon: "plus", title: "parts" },
  { key: "layers", icon: "gallery-vertical-end", title: "layers" },
  { key: "color", icon: "palette", title: "colors" },
  { key: "shape", icon: "frame", title: "shape" },
  { key: "type", icon: "case-sensitive", title: "typography" },
  { key: "motion", icon: "play", title: "motion" },
  { key: "ai", icon: "bot", title: "ai" },
];

export default function Page() {
  const still = useReducedMotion();
  /* ---------- document ---------- */
  const [groups, setGroups] = useState<Group[]>(seed);
  const [frames, setFrames] = useState<Frame[]>(seedFrames);
  const [paletteKey, setPaletteKey] = useState("purple");
  const [customPalette, setCustomPalette] = useState<Palette | null>(null);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const patchTheme = (patch: Partial<Theme>) => setTheme((t) => ({ ...t, ...patch }));
  const [frame, setFrame] = useState<FrameMode>("window");
  const [lang, setLang] = useState<Lang>("ja");
  const [isMobile, setIsMobile] = useState(false);
  const [sheet, setSheet] = useState<"edit" | "settings" | "lang" | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  /** frame being rendered offscreen for the PNG export */
  const [exportFrame, setExportFrame] = useState<Frame | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [promptEdit, setPromptEdit] = useState<string | undefined>(undefined);
  /** a project file waiting for the author to confirm replacing the canvas */
  const [pendingImport, setPendingImport] = useState<Doc | null>(null);

  /* ---------- editor ui ---------- */
  const [view, setView] = useState<View>({ x: 0, y: 0, z: 1 });
  const [mode, setMode] = useState<Mode>("select");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftW, setLeftW] = useState(RAIL_W + 268);
  const [leftTab, setLeftTab] = useState<LeftTab>("parts");
  /** pointer over the collapsed rail: the logo becomes the open button */
  const [railHover, setRailHover] = useState(false);
  /** the screen whose layers are listed when nothing on a screen is selected */
  const [layersFrameId, setLayersFrameId] = useState<string | null>(null);
  const [rightW, setRightW] = useState(320);
  const [rightTab, setRightTab] = useState<"edit" | "prompt">("edit");
  const [favorites, setFavorites] = useState<Kind[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [partResize, setPartResize] = useState<{ id: string; edge: ResizeEdge } | null>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<"left" | "right" | null>(null);
  const [, bumpHistory] = useState(0);
  /* ---------- tidy and ai ---------- */
  /** the groups before and after the last tidy; "undo" is offered only while the after-state is still current */
  const tidyRef = useRef<{ frameId: string; before: Group[]; after: Group[] } | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI);
  const [aiBusy, setAiBusy] = useState(false);
  /** the screen the model is working on, which wears the animated ring meanwhile */
  const [aiFrameId, setAiFrameId] = useState<string | null>(null);
  /** the "applied" confirmation beside the tidy button */
  const [aiNote, setAiNote] = useState<{ text: string; icon: string } | null>(null);
  const projectFileRef = useRef<HTMLInputElement>(null);
  const aiNoteTimer = useRef<number | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  const p = paletteOf(paletteKey, customPalette, theme);
  /* corner and size helpers read these outside React; keep them current before anything renders */
  setGlobalShape(theme.radius);
  setGlobalDensity(theme.density);

  const canvasRef = useRef<HTMLDivElement>(null);
  const measureEls = useRef<Map<string, HTMLElement>>(new Map());
  const dragRef = useRef<DragState | null>(null);
  const partResizeRef = useRef<PartResize | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const pendingRef = useRef<{ timer: number; commit: () => void } | null>(null);
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const framesRef = useRef(frames);
  framesRef.current = frames;
  const widthsRef = useRef(widths);
  widthsRef.current = widths;
  const viewRef = useRef(view);
  viewRef.current = view;
  const leftOpenRef = useRef(leftOpen);
  leftOpenRef.current = leftOpen;
  const leftWRef = useRef(leftW);
  leftWRef.current = leftW;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const spaceRef = useRef(spaceHeld);
  spaceRef.current = spaceHeld;
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const mobileRef = useRef(isMobile);
  mobileRef.current = isMobile;
  /** active touch points, for pinch zoom */
  const touchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    d0: number;
    z0: number;
    mx: number;
    my: number;
    vx: number;
    vy: number;
  } | null>(null);
  /** groups that must reposition without animating on the next render */
  const instantRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);
  /** whether a saved document existed, so the phone seed only applies to a fresh start */
  const hadDocRef = useRef(false);

  /* ---------- history ---------- */
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const lastPatchRef = useRef<{ key: string; at: number }>({ key: "", at: 0 });

  const snapshot = useCallback(() => {
    pastRef.current.push({
      groups: groupsRef.current,
      frames: framesRef.current,
    });
    if (pastRef.current.length > HISTORY_MAX) pastRef.current.shift();
    futureRef.current = [];
    bumpHistory((v) => v + 1);
  }, []);

  /** consecutive edits of the same field collapse into one undo step */
  const snapshotFor = useCallback(
    (key: string) => {
      const now = Date.now();
      const last = lastPatchRef.current;
      if (last.key !== key || now - last.at > 800) snapshot();
      lastPatchRef.current = { key, at: now };
    },
    [snapshot],
  );

  const restore = (snap: Snapshot) => {
    for (const g of snap.groups) instantRef.current.add(g.id);
    setGroups(snap.groups);
    setFrames(snap.frames);
    bumpHistory((v) => v + 1);
  };

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push({
      groups: groupsRef.current,
      frames: framesRef.current,
    });
    restore(prev);
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push({
      groups: groupsRef.current,
      frames: framesRef.current,
    });
    restore(next);
  }, []);

  useEffect(() => {
    instantRef.current.clear();
  });

  /* ---------- persistence ---------- */
  /** Puts a stored or opened document into the editor. Fields a partial document
   *  leaves out keep their current value, or go back to the default when `reset`. */
  /** the language the open document's built-in defaults are written in; an older
   *  document that never recorded one was written with the module default */
  const docLangRef = useRef<Lang>(DEFAULT_LANG);

  const applyDoc = (doc: Partial<Doc>, reset: boolean) => {
    docLangRef.current = isLang(doc.lang) ? doc.lang : DEFAULT_LANG;
    /* a kind renamed to match gpui-kit's own name still opens */
    if (Array.isArray(doc.groups)) doc = { ...doc, groups: doc.groups.map(migrateKinds) };
    if (Array.isArray(doc.groups)) setGroups(doc.groups);
    if (Array.isArray(doc.frames)) setFrames(doc.frames);
    if (typeof doc.paletteKey === "string" && doc.paletteKey) setPaletteKey(doc.paletteKey);
    else if (reset) setPaletteKey("default:light");
    if (doc.customPalette && typeof doc.customPalette.primary === "string") setCustomPalette(doc.customPalette);
    else if (reset) setCustomPalette(null);
    if (doc.theme && typeof doc.theme === "object") setTheme(normalizeTheme(doc.theme));
    else if (reset) setTheme(normalizeTheme(undefined));
    if (typeof doc.title === "string") setTitle(doc.title);
    else if (reset) setTitle("");
    if (typeof doc.brief === "string") setBrief(doc.brief);
    else if (reset) setBrief("");
    if (typeof doc.promptEdit === "string") setPromptEdit(doc.promptEdit);
    else if (reset) setPromptEdit(undefined);
  };

  useEffect(() => {
    // React's development double-run would otherwise read back its own first save
    if (loadedRef.current) return;
    let resolved: Lang = DEFAULT_LANG;
    try {
      const d = localStorage.getItem(DOC_KEY);
      if (d) {
        hadDocRef.current = true;
        applyDoc(JSON.parse(d) as Partial<Doc>, false);
        // frame mode is decided by the device (media-query effect), not restored
      }
      const u = localStorage.getItem(UI_KEY);
      if (u) {
        const ui = JSON.parse(u);
        if (ui.view) setView(ui.view);
        if (typeof ui.leftOpen === "boolean") setLeftOpen(ui.leftOpen);
        if (typeof ui.rightOpen === "boolean") setRightOpen(ui.rightOpen);
        if (ui.leftW) setLeftW(Math.max(RAIL_W + 244, ui.leftW));
        if (ui.rightW) setRightW(ui.rightW);
        if (Array.isArray(ui.favorites)) setFavorites(ui.favorites);
        if (ui.mode) setMode(ui.mode);
        if (isLang(ui.lang)) {
          setLang(ui.lang);
          resolved = ui.lang;
        }
      } else {
        const nl = (navigator.language ?? "").toLowerCase();
        resolved = nl.startsWith("zh") ? "zh" : nl.startsWith("ja") ? "ja" : "en";
        setLang(resolved);
        queueMicrotask(() => fitRef.current());
      }
      /* The seed is built while rendering, before the browser's language is
       * known, because the server and the client have to agree on the markup.
       * Now that the language is settled, rebuild the starter content in it. A
       * restored document is the author's own and is left exactly as saved. */
      if (!hadDocRef.current && resolved !== DEFAULT_LANG) {
        setGlobalLang(resolved);
        docLangRef.current = resolved;
        setGroups(seed());
        setFrames(seedFrames());
        setWidths({});
      }
    } catch {}
    setAiSettings(loadAiSettings());
    loadedRef.current = true;
  }, []);

  /** Every part stores the text it was created with, so a document written before
   *  the language was known — or saved by someone using another one — carries
   *  that language's defaults. Move the starter content onto `to`; anything the
   *  author typed does not match a default and is left exactly as it is. */
  const localizeDoc = (to: Lang) => {
    if (docLangRef.current === to) return;
    docLangRef.current = to;
    setGroups((gs) => localizeGroups(gs, to));
    setFrames((fs) => localizeFrames(fs, to));
    setWidths({});
  };
  const localizeDocRef = useRef(localizeDoc);
  localizeDocRef.current = localizeDoc;

  useEffect(() => {
    setGlobalLang(lang);
    document.documentElement.lang = lang;
    localizeDocRef.current(lang);
  }, [lang]);

  useEffect(() => {
    /* an empty width map makes every measured part read its width again in the new face */
    ensureFontLoaded(theme.font, () => setWidths({}));
  }, [theme.font]);

  /* the page background outside the app root follows the scheme, so dark mode has no white edges */
  useEffect(() => {
    document.body.style.background = p.background;
    document.body.style.color = p.foreground;
  }, [p.background, p.foreground]);

  /* in-app browsers size the page behind their own toolbars and may ignore dvh,
     so the measured inner height wins over the CSS height (innerHeight, not the
     visual viewport, so pinch-zoom and the keyboard leave the layout alone) */
  useEffect(() => {
    const apply = () => {
      const h = Math.round(window.innerHeight);
      if (h > 0) document.documentElement.style.setProperty("--app-h", `${h}px`);
    };
    /* in-app browsers (X, Instagram, LINE...) keep their own action bar over the
       page bottom, so the controls sit one button higher there. App names in the
       user agent are unreliable; the embedded web view itself is not: iOS web
       views omit the Safari token and Android ones carry "wv" */
    const ua = navigator.userAgent;
    const iosWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari\//.test(ua);
    const androidWebView = /Android/.test(ua) && /(?:^|\W)wv(?:\W|$)/.test(ua);
    if (iosWebView || androidWebView || /Twitter|Instagram|FBAN|FBAV|Line\//i.test(ua)) {
      document.documentElement.style.setProperty("--bottom-ui", "64px");
    }
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  /* everyone works on phone screens; a phone gets one fixed screen and the select tool only */
  useEffect(() => {
    const mq = window.matchMedia(
      "(max-width: 840px), (pointer: coarse) and (max-width: 1024px)",
    );
    const apply = () => {
      const m = mq.matches;
      setIsMobile(m);
      mobileRef.current = m;
      if (m) {
        setMode("select");
        setSheet(null);
        if (!hadDocRef.current) {
          hadDocRef.current = true;
          setGroups(mobileSeed());
          setFrames([{ id: uid(), name: t("home"), x: 0, y: 0, shell: DEFAULT_SHELL }]);
        }
      }
      if (frameRef.current !== "window") {
        setFrame("window");
        frameRef.current = "window";
      }
      ensureFrameRef.current();
      queueMicrotask(() => fitRef.current());
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* On a phone the fit is driven by the window's width, so it has to run again
   * once that width is actually known: the refs `fit` reads settle a render
   * after the state that created the window does. */
  const fitW = frames.length ? Math.max(...frames.map((f) => f.x + frameW(f))) : 0;
  useEffect(() => {
    if (!isMobile) return;
    fitRef.current();
  }, [isMobile, fitW]);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(
        DOC_KEY,
        JSON.stringify({ groups, frames, paletteKey, frame, title, brief, promptEdit, customPalette: customPalette ?? undefined, theme, lang }),
      );
    } catch {}
  }, [groups, frames, paletteKey, frame, title, brief, promptEdit, customPalette, theme, lang]);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(
        UI_KEY,
        JSON.stringify({
          view,
          leftOpen,
          rightOpen,
          leftW,
          rightW,
          favorites,
          mode,
          lang,
        }),
      );
    } catch {}
  }, [
    view,
    leftOpen,
    rightOpen,
    leftW,
    rightW,
    favorites,
    mode,
    lang,
  ]);

  /* ---------- measurement (text-sized kinds) ---------- */
  const allItems = useMemo(() => {
    const map = new Map<string, Item>();
    for (const v of flattenGroups(groups)) for (const it of v.group.items) map.set(it.id, it);
    if (drag) map.set(drag.item.id, drag.item);
    return [...map.values()];
  }, [groups, drag]);

  useLayoutEffect(() => {
    const next: Record<string, number> = {};
    measureEls.current.forEach((el, id) => {
      next[id] = Math.ceil(el.getBoundingClientRect().width);
    });
    const keys = Object.keys(next);
    const changed =
      keys.length !== Object.keys(widthsRef.current).length ||
      keys.some((k) => widthsRef.current[k] !== next[k]);
    if (changed) setWidths(next);
  });

  useEffect(() => {
    document.fonts?.ready.then(() => setWidths({}));
  }, []);

  const sizeRef = useCallback((it: Item) => sizeOf(it, widthsRef.current), []);
  const alongRef = useCallback(
    (it: Item, axis: Axis) => (axis === "x" ? sizeRef(it).w : sizeRef(it).h),
    [sizeRef],
  );
  const prefixOf = useCallback(
    (g: Group, k: number) =>
      g.items.slice(0, k).reduce((s, it) => s + alongRef(it, g.axis) + GAP, 0),
    [alongRef],
  );

  /* ---------- coordinates ---------- */
  const canvasRect = () => canvasRef.current?.getBoundingClientRect();
  const toWorld = (clientX: number, clientY: number) => {
    const r = canvasRect();
    const v = viewRef.current;
    return {
      x: (clientX - (r?.left ?? 0) - v.x) / v.z,
      y: (clientY - (r?.top ?? 0) - v.y) / v.z,
    };
  };
  const inBin = (clientX: number) =>
    !mobileRef.current && clientX >= 0 && clientX <= (leftOpenRef.current ? leftWRef.current : RAIL_W);

  const setZoomAt = useCallback((nz: number, cx?: number, cy?: number) => {
    const r = canvasRect();
    const v = viewRef.current;
    const z = clamp(nz, MIN_Z, MAX_Z);
    const px = cx === undefined ? (r?.width ?? 0) / 2 : cx - (r?.left ?? 0);
    const py = cy === undefined ? (r?.height ?? 0) / 2 : cy - (r?.top ?? 0);
    setView({
      x: px - ((px - v.x) * z) / v.z,
      y: py - ((py - v.y) * z) / v.z,
      z,
    });
  }, []);

  const fit = useCallback(() => {
    const r = canvasRect();
    if (!r) return;
    const gs = groupsRef.current;
    let x0 = 0;
    let y0 = -FRAME_LABEL_H;
    let x1 = WINDOW_W;
    let y1 = WINDOW_H;
    const fs = framesRef.current;
    if (frameRef.current === "window" && fs.length > 0) {
      x0 = Math.min(...fs.map((f) => f.x));
      y0 = Math.min(...fs.map((f) => f.y)) - FRAME_LABEL_H;
      x1 = Math.max(...fs.map((f) => f.x + frameW(f)));
      y1 = Math.max(...fs.map((f) => f.y + frameH(f)));
    }
    if (frameRef.current === "blank") {
      if (gs.length === 0) {
        setView({ x: 48, y: 48, z: 1 });
        return;
      }
      x0 = Infinity;
      y0 = Infinity;
      x1 = -Infinity;
      y1 = -Infinity;
      for (const g of gs) {
        for (const pl of layoutOf(g, widthsRef.current)) {
          x0 = Math.min(x0, pl.x);
          y0 = Math.min(y0, pl.y);
          x1 = Math.max(x1, pl.x + pl.w);
          y1 = Math.max(y1, pl.y + pl.h);
        }
      }
    }
    const mobile = mobileRef.current;
    const pad = mobile ? 14 : 40;
    const top = mobile ? 96 : 84; // keep the floating toolbar clear of the frame
    const bottom = mobile ? 96 : pad;
    if (mobile) {
      // a phone zooms to the window's width and starts at its top; the rest scrolls
      const z = clamp((r.width - pad * 2) / (x1 - x0), MIN_Z, MAX_Z);
      setView({ x: (r.width - (x1 - x0) * z) / 2 - x0 * z, y: top - y0 * z, z });
      return;
    }
    const z = clamp(
      Math.min(
        (r.width - pad * 2) / (x1 - x0),
        (r.height - top - bottom) / (y1 - y0),
        1,
      ),
      MIN_Z,
      MAX_Z,
    );
    setView({
      x: (r.width - (x1 - x0) * z) / 2 - x0 * z,
      y: top + (r.height - top - bottom - (y1 - y0) * z) / 2 - y0 * z,
      z,
    });
  }, []);
  const fitRef = useRef(fit);
  fitRef.current = fit;

  /* touch: two fingers pinch-zoom and pan, cancelling whatever one finger started */
  const onTouchCapture = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchesRef.current.size === 2) {
      const [a, b] = [...touchesRef.current.values()];
      const v = viewRef.current;
      pinchRef.current = {
        d0: Math.hypot(a.x - b.x, a.y - b.y),
        z0: v.z,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
        vx: v.x,
        vy: v.y,
      };
      dragRef.current = null;
      setDrag(null);
      setPressedId(null);
      gestureRef.current = null;
      setGesture(null);
    }
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !touchesRef.current.has(e.pointerId))
        return;
      touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pinch = pinchRef.current;
      if (!pinch || touchesRef.current.size < 2) return;
      const [a, b] = [...touchesRef.current.values()];
      const r = canvasRef.current?.getBoundingClientRect();
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const z = clamp((pinch.z0 * d) / Math.max(1, pinch.d0), MIN_Z, MAX_Z);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const px = pinch.mx - (r?.left ?? 0);
      const py = pinch.my - (r?.top ?? 0);
      setView({
        x: px - ((px - pinch.vx) * z) / pinch.z0 + (mx - pinch.mx),
        y: py - ((py - pinch.vy) * z) / pinch.z0 + (my - pinch.my),
        z,
      });
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touchesRef.current.delete(e.pointerId);
      if (touchesRef.current.size < 2) pinchRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  /* wheel: pan, or zoom with ctrl / pinch */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        setZoomAt(
          viewRef.current.z * Math.exp(-e.deltaY * 0.0022),
          e.clientX,
          e.clientY,
        );
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setZoomAt]);

  /* ---------- rest positions and the magnet ---------- */
  const restPos = useCallback(
    (g: Group, wx: number, wy: number, k: number, sz: { w: number; h: number }) =>
      g.axis === "x"
        ? { left: k === 0 ? wx - sz.w - GAP : wx + prefixOf(g, k), top: wy }
        : { left: wx, top: k === 0 ? wy - sz.h - GAP : wy + prefixOf(g, k) },
    [prefixOf],
  );

  /** Nearest slot inside the magnetic field with an attraction that ramps
   *  from 0 at the edge to 1 on target. A part only fuses with its own kind. */
  const findSnap = useCallback(
    (item: Item, left: number, top: number): Snap | null => {
      const spec = connectSpecOf(item);
      if (!spec) return null;
      const sz = sizeRef(item);
      let best: Snap | null = null;
      let bestD = 1;
      for (const v of flattenGroups(groupsRef.current)) {
        const g = v.group;
        if (g.free || g.axis !== spec.axis || !g.items[0] || !canJoin(g.items[0], item))
          continue;
        for (let k = 0; k <= g.items.length; k++) {
          const r = restPos(g, v.wx, v.wy, k, sz);
          const dx = left - r.left;
          const dy = top - r.top;
          const nMain = (spec.axis === "x" ? dx : dy) / SNAP_MAIN;
          const nCross = (spec.axis === "x" ? dy : dx) / SNAP_CROSS;
          if (Math.abs(nMain) >= 1 || Math.abs(nCross) >= 1) continue;
          const d = Math.hypot(nMain, nCross);
          if (d < bestD) {
            bestD = d;
            best = { groupId: g.id, index: k, pull: Math.pow(1 - d, PULL_EXP) };
          }
        }
      }
      return best;
    },
    [restPos, sizeRef],
  );

  const sx = useSpring(0, CARRY);
  const sy = useSpring(0, CARRY);

  /** Canva-style alignment: edges and centres of neighbours and of the frame
   *  pull the part gently into line and draw a guide while they do. */
  const findGuide = useCallback(
    (item: Item, left: number, top: number): Guide | null => {
      const sz = sizeRef(item);
      const tol = GUIDE_PX / viewRef.current.z;
      const xs: number[] = [];
      const ys: number[] = [];
      for (const v of flattenGroups(groupsRef.current)) {
        for (const pl of layoutOf({ ...v.group, x: v.wx, y: v.wy }, widthsRef.current)) {
          if (pl.item.id === item.id) continue;
          xs.push(pl.x, pl.x + pl.w / 2, pl.x + pl.w);
          ys.push(pl.y, pl.y + pl.h / 2, pl.y + pl.h);
        }
      }
      if (frameRef.current === "window") {
        for (const f of framesRef.current) {
          xs.push(
            f.x,
            f.x + FRAME_MARGIN,
            f.x + frameW(f) / 2,
            f.x + frameW(f) - FRAME_MARGIN,
            f.x + frameW(f),
          );
          ys.push(
            f.y,
            f.y + FRAME_MARGIN,
            f.y + frameH(f) / 2,
            f.y + frameH(f) - FRAME_MARGIN,
            f.y + frameH(f),
          );
        }
      }
      const mine = (pos: number, len: number) => [
        pos,
        pos + len / 2,
        pos + len,
      ];
      let best: Guide = {};
      let bx = tol;
      for (const c of xs)
        for (const m of mine(left, sz.w)) {
          const d = Math.abs(c - m);
          if (d < bx) {
            bx = d;
            best = { ...best, x: left + (c - m), gx: c };
          }
        }
      let by = tol;
      for (const c of ys)
        for (const m of mine(top, sz.h)) {
          const d = Math.abs(c - m);
          if (d < by) {
            by = d;
            best = { ...best, y: top + (c - m), gy: c };
          }
        }
      return best.x === undefined && best.y === undefined ? null : best;
    },
    [sizeRef],
  );

  /** the container group whose surface the dragged part's centre is over: the
   *  smallest one wins, so a panel inside a sidebar catches the drop first */
  const findNest = useCallback(
    (item: Item, left: number, top: number): string | null => {
      const sz = sizeRef(item);
      const cx = left + sz.w / 2;
      const cy = top + sz.h / 2;
      let best: { id: string; area: number } | null = null;
      for (const v of flattenGroups(groupsRef.current)) {
        const g = v.group;
        if (!isContainerGroup(g) || g.items.some((it) => it.id === item.id)) continue;
        const bb = groupBounds({ ...g, x: v.wx, y: v.wy }, widthsRef.current);
        if (cx < bb.l || cx > bb.r || cy < bb.t || cy > bb.b) continue;
        const a = (bb.r - bb.l) * (bb.b - bb.t);
        if (!best || a < best.area) best = { id: g.id, area: a };
      }
      return best?.id ?? null;
    },
    [sizeRef],
  );

  /* ---------- pointer: parts ---------- */
  const flushPending = useCallback(() => {
    const pend = pendingRef.current;
    if (!pend) return;
    clearTimeout(pend.timer);
    pendingRef.current = null;
    pend.commit();
  }, []);
  useEffect(() => () => flushPending(), [flushPending]);

  const startPan = (clientX: number, clientY: number) => {
    const g: Gesture = {
      kind: "pan",
      sx: clientX,
      sy: clientY,
      vx: viewRef.current.x,
      vy: viewRef.current.y,
    };
    gestureRef.current = g;
    setGesture(g);
  };

  const onItemPointerDown = (
    e: React.PointerEvent,
    g: Group,
    index: number,
    item: Item,
  ) => {
    if (e.button === 1 || modeRef.current === "hand" || spaceRef.current) {
      e.preventDefault();
      e.stopPropagation();
      startPan(e.clientX, e.clientY);
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    flushPending();
    if (g.free) {
      setSelectedIds((cur) => (e.shiftKey ? [...cur.filter((x) => !g.items.some((it) => it.id === x)), ...g.items.map((it) => it.id)] : g.items.map((it) => it.id)));
      setSelectedFrameId(null);
      setSelectedLinkId(null);
      setRightTab("edit");
      const gg: Gesture = { kind: "group", id: g.id, sx: e.clientX, sy: e.clientY, gx: g.x, gy: g.y, moved: false, overBin: false };
      gestureRef.current = gg;
      setGesture(gg);
      return;
    }
    /* dragging a container's own part carries everything nested inside it */
    if (g.children?.length && index === 0 && isContainerGroup(g)) {
      const ids: string[] = [];
      const collect = (gr: Group) => {
        for (const it of gr.items) ids.push(it.id);
        gr.children?.forEach(collect);
      };
      collect(g);
      setSelectedIds((cur) => (e.shiftKey ? [...cur.filter((x) => !ids.includes(x)), ...ids] : ids));
      setSelectedFrameId(null);
      setSelectedLinkId(null);
      setRightTab("edit");
      const gg: Gesture = { kind: "group", id: g.id, sx: e.clientX, sy: e.clientY, gx: g.x, gy: g.y, moved: false, overBin: false };
      gestureRef.current = gg;
      setGesture(gg);
      return;
    }
    const pt = toWorld(e.clientX, e.clientY);
    const origin = findGroup(groupsRef.current, g.id);
    const wx = origin?.wx ?? g.x;
    const wy = origin?.wy ?? g.y;
    const off = prefixOf(g, index);
    const left = g.axis === "x" ? wx + off : wx;
    const top = g.axis === "x" ? wy : wy + off;
    sx.jump(left);
    sy.jump(top);
    setSelectedIds((cur) =>
      e.shiftKey ? [...cur.filter((x) => x !== item.id), item.id] : [item.id],
    );
    setSelectedFrameId(null);
    setSelectedLinkId(null);
    setRightTab("edit");
    setPressedId(item.id);
    const d: DragState = {
      item,
      offX: pt.x - left,
      offY: pt.y - top,
      startX: pt.x,
      startY: pt.y,
      px: pt.x,
      py: pt.y,
      active: false,
      fromPalette: false,
      overBin: false,
      snap: null,
      nest: null,
      settling: false,
      guide: null,
    };
    dragRef.current = d;
    setDrag({ ...d });
  };

  const onPartPointerDown = (e: React.PointerEvent, kind: Kind) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    flushPending();
    const item = makeItem(kind);
    const pt = toWorld(e.clientX, e.clientY);
    const sz = sizeOf(item, widthsRef.current);
    const offX = Math.min(sz.w / 2, 90);
    const offY = Math.min(sz.h / 2, 40);
    sx.jump(pt.x - offX);
    sy.jump(pt.y - offY);
    setSelectedIds([item.id]);
    setRightTab("edit");
    const d: DragState = {
      item,
      offX,
      offY,
      startX: pt.x,
      startY: pt.y,
      px: pt.x,
      py: pt.y,
      active: true,
      fromPalette: true,
      overBin: false,
      snap: null,
      nest: null,
      settling: false,
      guide: null,
    };
    dragRef.current = d;
    setDrag({ ...d });
  };

  const isDragging = drag !== null;

  useEffect(() => {
    if (!isDragging) return;

    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const pt = toWorld(e.clientX, e.clientY);
      d.px = pt.x;
      d.py = pt.y;

      if (!d.active) {
        if (
          Math.hypot(pt.x - d.startX, pt.y - d.startY) * viewRef.current.z <
          5
        ) {
          setDrag({ ...d });
          return;
        }
        d.active = true;
        d.snap = null;
        const id = d.item.id;
        snapshot();
        setGroups((prev) =>
          mapGroups(prev, (g) => {
            const idx = g.items.findIndex((it) => it.id === id);
            if (idx < 0) return g;
            const rest = g.items.filter((it) => it.id !== id);
            if (rest.length === 0) return null;
            const sz = sizeOf(g.items[idx], widthsRef.current);
            const back = idx === 0;
            // The anchor moves to the new first item; that jump must not animate,
            // otherwise the remaining run springs sideways for a frame.
            if (back) instantRef.current.add(g.id);
            return {
              ...g,
              x: back && g.axis === "x" ? g.x + sz.w + GAP : g.x,
              y: back && g.axis === "y" ? g.y + sz.h + GAP : g.y,
              items: rest,
            };
          }),
        );
        setPressedId(null);
        setDrag({ ...d });
        return;
      }

      d.overBin = inBin(e.clientX);
      d.snap = d.overBin
        ? null
        : findSnap(d.item, pt.x - d.offX, pt.y - d.offY);
      d.nest =
        d.overBin || d.snap
          ? null
          : findNest(d.item, pt.x - d.offX, pt.y - d.offY);
      d.guide =
        d.overBin || d.snap || d.nest
          ? null
          : findGuide(d.item, pt.x - d.offX, pt.y - d.offY);
      setDrag({ ...d });
    };

    const up = () => {
      const d = dragRef.current;
      dragRef.current = null;
      setPressedId(null);
      if (!d) return;
      if (!d.active) {
        setDrag(null);
        return;
      }

      const item = d.item;
      const sz = sizeRef(item);

      if (d.overBin) {
        setSelectedIds((cur) => cur.filter((x) => x !== item.id));
        setDrag(null);
        return;
      }

      if (d.snap) {
        const t = d.snap;
        setDrag({ ...d, snap: { ...t, pull: 1 }, settling: true });
        const commit = () => {
          setGroups((prev) => {
            if (flattenGroups(prev).some((v) => v.group.items.some((it) => it.id === item.id)))
              return prev;
            return mapGroups(prev, (g) => {
              if (g.id !== t.groupId) return g;
              const front = t.index === 0;
              return {
                ...g,
                x: front && g.axis === "x" ? g.x - sz.w - GAP : g.x,
                y: front && g.axis === "y" ? g.y - sz.h - GAP : g.y,
                items: [
                  ...g.items.slice(0, t.index),
                  item,
                  ...g.items.slice(t.index),
                ],
              };
            });
          });
          setDrag(null);
        };
        const timer = window.setTimeout(() => {
          pendingRef.current = null;
          commit();
        }, SETTLE_MS);
        pendingRef.current = { timer, commit };
        return;
      }

      const rect = canvasRect();
      const v = viewRef.current;
      const rawX = d.guide?.x ?? d.px - d.offX;
      const rawY = d.guide?.y ?? d.py - d.offY;
      const screenL = (rawX + sz.w) * v.z + v.x;
      const screenT = (rawY + sz.h) * v.z + v.y;
      const screenR = rawX * v.z + v.x;
      const screenB = rawY * v.z + v.y;
      const cw = rect?.width ?? 0;
      const ch = rect?.height ?? 0;
      if (
        d.fromPalette &&
        (screenL < 0 || screenT < 0 || screenR > cw || screenB > ch)
      ) {
        setSelectedIds((cur) => cur.filter((x) => x !== item.id));
        setDrag(null);
        return;
      }
      if (d.fromPalette) snapshot();
      const ng: Group = {
        id: uid(),
        x: Math.round(rawX),
        y: Math.round(rawY),
        axis: connectSpecOf(item)?.axis ?? "x",
        items: [item],
      };
      setGroups((prev) => {
        if (flattenGroups(prev).some((v) => v.group.items.some((it) => it.id === item.id)))
          return prev;
        /* over a container the part nests into it, positioned relative to the
         * container's origin, the way a GPUI child sits inside its parent */
        if (d.nest) {
          const target = findGroup(prev, d.nest);
          if (target && isContainerGroup(target.group)) {
            const child: Group = { ...ng, x: ng.x - target.wx, y: ng.y - target.wy };
            return mapGroups(prev, (g) =>
              g.id === target.group.id ? { ...g, children: [...(g.children ?? []), child] } : g,
            );
          }
        }
        return [...prev, ng];
      });
      setDrag(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // handlers read live state through refs, so this binds once per drag
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  /* the overlay sits between the cursor and the slot, weighted by attraction */
  useEffect(() => {
    if (!drag?.active) return;
    const cursorL = drag.px - drag.offX;
    const cursorT = drag.py - drag.offY;
    if (drag.snap) {
      const v = findGroup(groupsRef.current, drag.snap.groupId);
      if (v) {
        const r = restPos(v.group, v.wx, v.wy, drag.snap.index, sizeRef(drag.item));
        sx.set(lerp(cursorL, r.left, drag.snap.pull));
        sy.set(lerp(cursorT, r.top, drag.snap.pull));
        return;
      }
    }
    sx.set(drag.guide?.x ?? cursorL);
    sy.set(drag.guide?.y ?? cursorT);
  }, [drag, restPos, sizeRef, sx, sy]);

  /* ---------- pointer: canvas (pan / marquee) ---------- */
  const itemRects = useCallback(() => {
    const out: { id: string; l: number; t: number; r: number; b: number }[] =
      [];
    for (const v of flattenGroups(groupsRef.current)) {
      for (const pl of layoutOf({ ...v.group, x: v.wx, y: v.wy }, widthsRef.current)) {
        out.push({ id: pl.item.id, l: pl.x, t: pl.y, r: pl.x + pl.w, b: pl.y + pl.h });
      }
    }
    return out;
  }, []);

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectedFrameId(null);
    setSelectedLinkId(null);
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (mobileRef.current && e.pointerType === "touch") {
      e.preventDefault();
      clearSelection();
      startPan(e.clientX, e.clientY);
      return;
    }
    if (e.button === 1 || modeRef.current === "hand" || spaceRef.current) {
      e.preventDefault();
      startPan(e.clientX, e.clientY);
      return;
    }
    if (e.button !== 0) return;
    const pt = toWorld(e.clientX, e.clientY);
    const g: Gesture = {
      kind: "marquee",
      x0: pt.x,
      y0: pt.y,
      x1: pt.x,
      y1: pt.y,
      moved: false,
    };
    gestureRef.current = g;
    setGesture(g);
    if (!e.shiftKey) setSelectedIds([]);
    setSelectedFrameId(null);
    setSelectedLinkId(null);
  };

  /** grab a phone frame by its bezel or label: it carries everything on it;
   *  on a phone the screen stays put and a tap on it just clears the selection */
  const onFramePointerDown = (e: React.PointerEvent, f: Frame) => {
    if (mobileRef.current) {
      e.preventDefault();
      e.stopPropagation();
      clearSelection();
      startPan(e.clientX, e.clientY);
      return;
    }
    if (e.button === 1 || modeRef.current === "hand" || spaceRef.current) {
      e.preventDefault();
      e.stopPropagation();
      startPan(e.clientX, e.clientY);
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedFrameId(f.id);
    setSelectedIds([]);
    setSelectedLinkId(null);
    setRightTab("edit");
    const carried = groupsRef.current
      .filter(
        (g) =>
          frameOfGroup(g, framesRef.current, widthsRef.current)?.id === f.id,
      )
      .map((g) => ({ id: g.id, x: g.x, y: g.y }));
    const g: Gesture = {
      kind: "frame",
      id: f.id,
      sx: e.clientX,
      sy: e.clientY,
      fx: f.x,
      fy: f.y,
      groups: carried,
      moved: false,
    };
    gestureRef.current = g;
    setGesture(g);
  };

  const isGesturing = gesture !== null;
  useEffect(() => {
    if (!isGesturing) return;
    const move = (e: PointerEvent) => {
      const g = gestureRef.current;
      if (!g) return;
      if (g.kind === "pan") {
        setView((v) => ({
          ...v,
          x: g.vx + (e.clientX - g.sx),
          y: g.vy + (e.clientY - g.sy),
        }));
        return;
      }
      if (g.kind === "group") {
        const z = viewRef.current.z;
        const dx = (e.clientX - g.sx) / z;
        const dy = (e.clientY - g.sy) / z;
        if (!g.moved) {
          if (Math.hypot(dx, dy) * z < 4) return;
          g.moved = true;
          snapshot();
        }
        instantRef.current.add(g.id);
        g.overBin = inBin(e.clientX);
        setGesture({ ...g });
        setGroups((gs) => mapGroups(gs, (gr) => (gr.id === g.id ? { ...gr, x: Math.round(g.gx + dx), y: Math.round(g.gy + dy) } : gr)));
        return;
      }
      if (g.kind === "frame") {
        const z = viewRef.current.z;
        const dx = (e.clientX - g.sx) / z;
        const dy = (e.clientY - g.sy) / z;
        if (!g.moved) {
          if (Math.hypot(dx, dy) * z < 4) return;
          g.moved = true;
          snapshot();
        }
        const ids = new Map(g.groups.map((o) => [o.id, o]));
        for (const o of g.groups) instantRef.current.add(o.id);
        setFrames((fs) =>
          fs.map((f) =>
            f.id === g.id
              ? { ...f, x: Math.round(g.fx + dx), y: Math.round(g.fy + dy) }
              : f,
          ),
        );
        setGroups((gs) =>
          gs.map((gr) => {
            const o = ids.get(gr.id);
            return o
              ? { ...gr, x: Math.round(o.x + dx), y: Math.round(o.y + dy) }
              : gr;
          }),
        );
        return;
      }
      const pt = toWorld(e.clientX, e.clientY);
      g.x1 = pt.x;
      g.y1 = pt.y;
      if (
        !g.moved &&
        Math.hypot(pt.x - g.x0, pt.y - g.y0) * viewRef.current.z > 4
      )
        g.moved = true;
      if (g.moved) {
        const l = Math.min(g.x0, g.x1);
        const r = Math.max(g.x0, g.x1);
        const t = Math.min(g.y0, g.y1);
        const b = Math.max(g.y0, g.y1);
        const hit = itemRects()
          .filter((it) => it.l < r && it.r > l && it.t < b && it.b > t)
          .map((it) => it.id);
        setSelectedIds(hit);
      }
      setGesture({ ...g });
    };
    const up = (e: PointerEvent) => {
      const g = gestureRef.current;
      gestureRef.current = null;
      setGesture(null);
      // a group dragged onto the parts panel is deleted, like a single part
      if (g?.kind === "group" && g.moved && inBin(e.clientX)) {
        setGroups((gs) => mapGroups(gs, (x) => (x.id === g.id ? null : x)));
        setSelectedIds([]);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGesturing]);

  /* ---------- panel resize ---------- */
  useEffect(() => {
    if (!resizing) return;
    const move = (e: PointerEvent) => {
      if (resizing === "left") setLeftW(clamp(e.clientX, RAIL_W + 244, 480));
      else setRightW(clamp(window.innerWidth - e.clientX, 280, 480));
    };
    const up = () => setResizing(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [resizing]);

  /* ---------- editing ---------- */
  const primaryId = selectedIds[selectedIds.length - 1] ?? null;
  const selected = useMemo(() => {
    for (const v of flattenGroups(groups)) {
      const it = v.group.items.find((i) => i.id === primaryId);
      if (it) return it;
    }
    return drag?.item.id === primaryId ? (drag?.item ?? null) : null;
  }, [groups, primaryId, drag]);

  useEffect(() => {
    if (!selected && sheet === "edit") setSheet(null);
  }, [selected, sheet]);

  /** Resizing a lone part keeps whatever it was lined up with on the frame:
   *  its centre on the centre line, or its far edge on the margin or screen edge.
   *  Otherwise the near (left / top) edge stays put, as the sliders always did. */
  const resizeShift = (g: Group, before: Item, after: Item) => {
    const none = { dx: 0, dy: 0 };
    if (g.items.length !== 1 || frameRef.current !== "window") return none;
    const f = frameOfGroup(g, framesRef.current, widthsRef.current);
    if (!f) return none;
    const a = sizeOf(before, widthsRef.current);
    const b = sizeOf(after, widthsRef.current);
    const shift = (pos: number, len: number, next: number, f0: number, fLen: number) => {
      const d = next - len;
      if (d === 0) return 0;
      const near = (v: number, target: number) => Math.abs(v - target) <= 1;
      if (near(pos + len / 2, f0 + fLen / 2)) return -Math.round(d / 2);
      if (near(pos + len, f0 + fLen - FRAME_MARGIN) || near(pos + len, f0 + fLen)) return -d;
      return 0;
    };
    return {
      dx: shift(g.x, a.w, b.w, f.x, frameW(f)),
      dy: shift(g.y, a.h, b.h, f.y, frameH(f)),
    };
  };

  const applyPatch = (id: string, patch: Partial<Item>) => {
    const resizes = "size" in patch || "size2" in patch;
    setGroups((prev) => {
      /* the resize re-centring trick only makes sense for a top-level group,
       * whose coordinates are the world's; a nested group stays put relative
       * to its container */
      const host = resizes ? flattenGroups(prev).find((v) => v.group.items.some((it) => it.id === id)) : undefined;
      const topLevel = host && !host.parent ? host.group.id : null;
      return mapGroups(prev, (g) => {
        const idx = g.items.findIndex((it) => it.id === id);
        if (idx < 0) return g;
        const next = { ...g.items[idx], ...patch };
        const { dx, dy } = resizes && g.id === topLevel ? resizeShift(g, g.items[idx], next) : { dx: 0, dy: 0 };
        if (dx || dy) instantRef.current.add(g.id);
        return {
          ...g,
          x: g.x + dx,
          y: g.y + dy,
          items: g.items.map((it, i) => (i === idx ? next : it)),
        };
      });
    });
    if (dragRef.current?.item.id === id) {
      dragRef.current.item = { ...dragRef.current.item, ...patch };
    }
  };

  const patchSelected = (patch: Partial<Item>) => {
    if (!primaryId) return;
    const id = primaryId;
    snapshotFor(id + ":" + Object.keys(patch).join(","));
    applyPatch(id, patch);
  };

  /* ---------- canvas resize handles ---------- */
  /** kinds whose `size` sets both edges at once (square parts) */
  const SQUARE_KINDS: Kind[] = ["iconButton", "icon", "spinner"];

  const resizeEdgesOf = (item: Item): ResizeEdge[] => {
    const spec = KIND_SPEC[item.kind];
    if (item.kind === "text") return [];
    if (SQUARE_KINDS.includes(item.kind)) return spec.size ? ["se"] : [];
    const edges: ResizeEdge[] = [];
    if (spec.size) edges.push("e");
    if (spec.size2) edges.push("s");
    if (spec.size && spec.size2) edges.push("se");
    return edges;
  };

  const onResizeHandleDown = (e: React.PointerEvent, edge: ResizeEdge) => {
    if (e.button !== 0 || modeRef.current === "hand" || spaceRef.current) return;
    const target = resizeTargetRef.current;
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    flushPending();
    const item = target.item;
    const spec = KIND_SPEC[item.kind];
    const pt = toWorld(e.clientX, e.clientY);
    snapshot();
    const r: PartResize = {
      id: item.id,
      edge,
      sx: pt.x,
      sy: pt.y,
      size0: item.size ?? spec.defSize ?? spec.w,
      size20: item.size2 ?? sizeOf(item, widthsRef.current).h,
    };
    partResizeRef.current = r;
    setPartResize({ id: r.id, edge });
  };

  useEffect(() => {
    if (!partResize) return;
    const move = (e: PointerEvent) => {
      const r = partResizeRef.current;
      if (!r) return;
      const g = flattenGroups(groupsRef.current).find((v) => v.group.items.some((it) => it.id === r.id))?.group;
      const item = g?.items.find((it) => it.id === r.id);
      if (!item) return;
      const spec = KIND_SPEC[item.kind];
      const snap = (v: number, s: { min: number; max: number; step: number }) =>
        clamp(Math.round(v / s.step) * s.step, s.min, s.max);
      const pt = toWorld(e.clientX, e.clientY);
      const dx = pt.x - r.sx;
      const dy = pt.y - r.sy;
      const patch: Partial<Item> = {};
      if (SQUARE_KINDS.includes(item.kind)) {
        if (spec.size) patch.size = snap(r.size0 + Math.max(dx, dy), spec.size);
      } else {
        if ((r.edge === "e" || r.edge === "se") && spec.size) patch.size = snap(r.size0 + dx, spec.size);
        if ((r.edge === "s" || r.edge === "se") && spec.size2) patch.size2 = snap(r.size20 + dy, spec.size2);
      }
      if (Object.keys(patch).length) applyPatch(r.id, patch);
    };
    const up = () => {
      partResizeRef.current = null;
      setPartResize(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partResize]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const ids = new Set(selectedIds);
    snapshot();
    setGroups((prev) =>
      mapGroups(prev, (g) => {
        if (g.free) {
          const rest = collapseFree({ ...g, items: g.items.filter((it) => !ids.has(it.id)) }, widthsRef.current);
          return rest.items.length ? rest : null;
        }
        let x = g.x;
        let y = g.y;
        let items = g.items;
        while (items.length && ids.has(items[0].id)) {
          const sz = sizeOf(items[0], widthsRef.current);
          if (g.axis === "x") x += sz.w + GAP;
          else y += sz.h + GAP;
          items = items.slice(1);
        }
        items = items.filter((it) => !ids.has(it.id));
        if (!items.length) return null;
        if (x !== g.x || y !== g.y) instantRef.current.add(g.id);
        return { ...g, x, y, items };
      }),
    );
    setSelectedIds([]);
  }, [selectedIds, snapshot]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    /* a selected hand-made group is copied whole, keeping its layout */
    const fgVisit = flattenGroups(groupsRef.current).find((v) => v.group.free && v.group.items.some((it) => it.id === selected.id));
    const fg = fgVisit?.group;
    if (fg && fgVisit && fg.items.every((it) => selectedIds.includes(it.id))) {
      const copyG = cloneGroup(fg);
      copyG.x = fgVisit.wx + 24;
      copyG.y = fgVisit.wy + 24;
      snapshot();
      setGroups((prev) => [...prev, copyG]);
      setSelectedIds(copyG.items.map((it) => it.id));
      return;
    }
    const rect = itemRects().find((r) => r.id === selected.id);
    if (!rect) return;
    const copy: Item = {
      ...selected,
      id: uid(),
      tabs: selected.tabs?.map((t) => ({ ...t })),
    };
    snapshot();
    setGroups((prev) => [
      ...prev,
      {
        id: uid(),
        x: rect.l + 24,
        y: rect.t + 24,
        axis: connectSpecOf(copy)?.axis ?? "x",
        items: [copy],
      },
    ]);
    setSelectedIds([copy.id]);
  }, [selected, selectedIds, itemRects, snapshot]);

  /** the free group the whole selection belongs to, if it is exactly one */
  const selectedGroup = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const g = flattenGroups(groups).find((v) => v.group.free && v.group.items.some((it) => it.id === selectedIds[0]))?.group;
    if (!g) return null;
    const ids = new Set(g.items.map((it) => it.id));
    return selectedIds.every((id) => ids.has(id)) && selectedIds.length === g.items.length ? g : null;
  }, [groups, selectedIds]);

  /** Pull the selected parts out of their runs into one free group that keeps
   *  their positions. It takes the layer slot of the topmost run involved. */
  const groupSelected = useCallback(() => {
    const ids = new Set(selectedIds);
    if (ids.size < 2) return;
    const rects = new Map(itemRects().map((r) => [r.id, r]));
    const visits = flattenGroups(groupsRef.current);
    const picked: Item[] = [];
    let top = -1;
    /* the picked parts must all sit in the same level of the tree: grouping
     * across containers would tear them out of their parents */
    let parentId: string | null | undefined;
    let shared = true;
    groupsRef.current.forEach((g, i) => {
      for (const it of g.items) if (ids.has(it.id)) {
        picked.push(it);
        top = i;
        if (parentId === undefined) parentId = null;
        else if (parentId !== null) shared = false;
      }
    });
    for (const v of visits) {
      if (!v.parent) continue;
      for (const it of v.group.items) if (ids.has(it.id)) {
        picked.push(it);
        if (parentId === undefined) parentId = v.parent.id;
        else if (parentId !== v.parent.id) shared = false;
      }
    }
    if (picked.length < 2 || !shared) return;
    const l = Math.min(...picked.map((it) => rects.get(it.id)!.l));
    const t = Math.min(...picked.map((it) => rects.get(it.id)!.t));
    const pos: Record<string, { x: number; y: number }> = {};
    for (const it of picked) pos[it.id] = { x: rects.get(it.id)!.l - l, y: rects.get(it.id)!.t - t };
    snapshot();
    setGroups((prev) => {
      /* remove the picked items tree-aware: same run-shift as deleteSelected */
      const stripped = mapGroups(prev, (g) => {
        if (g.free) {
          const rest = g.items.filter((it) => !ids.has(it.id));
          return rest.length ? collapseFree({ ...g, items: rest }, widthsRef.current) : null;
        }
        let x = g.x;
        let y = g.y;
        let items = g.items;
        while (items.length && ids.has(items[0].id)) {
          const sz = sizeOf(items[0], widthsRef.current);
          if (g.axis === "x") x += sz.w + GAP;
          else y += sz.h + GAP;
          items = items.slice(1);
        }
        items = items.filter((it) => !ids.has(it.id));
        if (!items.length) return null;
        if (x !== g.x || y !== g.y) instantRef.current.add(g.id);
        return { ...g, x, y, items };
      });
      if (parentId) {
        /* the items came from a container's children, so the new group lands
         * there too, its origin counted from the container's world origin */
        const pv = findGroup(stripped, parentId);
        if (!pv) return stripped;
        const ng: Group = { id: uid(), x: l - pv.wx, y: t - pv.wy, axis: "x", items: picked, free: true, pos };
        return mapGroups(stripped, (g) =>
          g.id === parentId ? { ...g, children: [...(g.children ?? []), ng] } : g,
        );
      }
      const ng: Group = { id: uid(), x: l, y: t, axis: "x", items: picked, free: true, pos };
      /* the new free group takes the layer slot of the topmost run involved */
      const out: Group[] = [];
      stripped.forEach((g, i) => {
        out.push(g);
        if (i === top) out.push(ng);
      });
      return out;
    });
    setSelectedIds(picked.map((it) => it.id));
  }, [selectedIds, itemRects, snapshot]);

  /** Split a free group back into single runs at their current positions, in the same layer slot. */
  const ungroupSelected = useCallback(() => {
    const g = selectedGroup;
    if (!g) return;
    snapshot();
    const singles: Group[] = explodeGroup(g, widthsRef.current).map((run) => ({ ...run, id: uid() }));
    for (const sg of singles) instantRef.current.add(sg.id);
    setGroups((prev) => replaceGroup(prev, g.id, singles));
  }, [selectedGroup, snapshot]);

  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (selectedIds.length === 0 && selectedFrameId) {
        const f = framesRef.current.find((x) => x.id === selectedFrameId);
        if (!f) return;
        snapshotFor("nudge:frame:" + f.id);
        const carried = new Set(
          groupsRef.current
            .filter(
              (g) =>
                frameOfGroup(g, framesRef.current, widthsRef.current)?.id ===
                f.id,
            )
            .map((g) => g.id),
        );
        for (const id of carried) instantRef.current.add(id);
        setFrames((fs) =>
          fs.map((x) =>
            x.id === f.id ? { ...x, x: x.x + dx, y: x.y + dy } : x,
          ),
        );
        setGroups((gs) =>
          gs.map((g) =>
            carried.has(g.id) ? { ...g, x: g.x + dx, y: g.y + dy } : g,
          ),
        );
        return;
      }
      if (selectedIds.length === 0) return;
      const ids = new Set(selectedIds);
      snapshotFor("nudge:" + selectedIds.join(","));
      /* the groups to shift, minus any whose ancestor is also shifting:
       * children ride along with their container, so both moving would
       * double the step */
      const visits = flattenGroups(groupsRef.current);
      const parentOf = new Map(visits.filter((v) => v.parent).map((v) => [v.group.id, v.parent!.id]));
      const moving = new Set(
        visits.filter((v) => v.group.items.some((it) => ids.has(it.id))).map((v) => v.group.id),
      );
      for (const v of visits) {
        let a = parentOf.get(v.group.id);
        while (a !== undefined) {
          if (moving.has(a)) {
            moving.delete(v.group.id);
            break;
          }
          a = parentOf.get(a);
        }
      }
      for (const id of moving) instantRef.current.add(id);
      setGroups((prev) =>
        mapGroups(prev, (g) =>
          moving.has(g.id) ? { ...g, x: g.x + dx, y: g.y + dy } : g,
        ),
      );
    },
    [selectedIds, selectedFrameId, snapshotFor],
  );

  const clearAll = () => {
    setConfirmClear(false);
    if (groupsRef.current.length === 0 && framesRef.current.length === 0)
      return;
    snapshot();
    setGroups([]);
    setFrames([]);
    setSelectedIds([]);
    setSelectedFrameId(null);
  };

  /** Opening a project file replaces the canvas with the same restore path the saved
   *  document goes through, then starts the editor fresh on it. */
  const importDoc = (next: Doc) => {
    hadDocRef.current = true;
    applyDoc(next, true);
    if (!mobileRef.current) {
      const nextFrame = next.frame === "blank" ? "blank" : "window";
      setFrame(nextFrame);
      frameRef.current = nextFrame;
    }
    localizeDoc(lang);
    setSelectedIds([]);
    setSelectedFrameId(null);
    setSelectedLinkId(null);
    setWidths({});
    pastRef.current = [];
    futureRef.current = [];
    lastPatchRef.current = { key: "", at: 0 };
    bumpHistory((v) => v + 1);
    queueMicrotask(() => fitRef.current());
  };

  const selectedFrame = useMemo(
    () => frames.find((f) => f.id === selectedFrameId) ?? null,
    [frames, selectedFrameId],
  );

  /** the screen the tidy button works on: the selected one, or the one under the selected part */
  const tidyTarget = useMemo((): Frame | null => {
    if (frame !== "window" || isMobile) return null;
    if (selectedFrame) return selectedFrame;
    if (!primaryId) return null;
    const v = flattenGroups(groups).find((v) => v.group.items.some((it) => it.id === primaryId));
    /* a nested group's frame is decided by its world position, not its
     * container-relative one */
    return v ? (frameOfGroup({ ...v.group, x: v.wx, y: v.wy }, frames, widths) ?? null) : null;
  }, [frame, isMobile, selectedFrame, primaryId, groups, frames, widths]);

  const nextFrameX = () =>
    framesRef.current.length
      ? Math.max(...framesRef.current.map((f) => f.x + frameW(f))) + FRAME_GAP
      : 0;

  /** Entering phone mode with no frames wraps the existing parts in one. */
  const ensureFrame = () => {
    if (framesRef.current.length > 0) return;
    const gs = groupsRef.current;
    let x = 0;
    let y = 0;
    if (gs.length) {
      const bbs = gs.map((g) => groupBounds(g, widthsRef.current));
      const l = Math.min(...bbs.map((b) => b.l));
      const t = Math.min(...bbs.map((b) => b.t));
      const r = Math.max(...bbs.map((b) => b.r));
      x = Math.round(Math.max(l - 24, r - WINDOW_W + 24 > l ? l : l - 24));
      y = Math.round(t - 72);
      x = Math.min(x, l);
      y = Math.min(y, t);
    }
    const f: Frame = { id: uid(), name: t("home"), x, y };
    setFrames([f]);
  };

  const ensureFrameRef = useRef(() => {});
  ensureFrameRef.current = ensureFrame;

  /** phone UI: the plus button drops a new button where the view is looking,
   *  kept inside the screen, and nudged down when that spot is already taken */
  const addButton = () => {
    const r = canvasRect();
    const v = viewRef.current;
    const item = makeItem("button");
    const sz = sizeOf(item, widthsRef.current);
    const f = framesRef.current[0];
    let x = ((r?.width ?? 0) / 2 - v.x) / v.z - sz.w / 2;
    let y = ((r?.height ?? 0) / 2 - v.y) / v.z - sz.h / 2;
    if (f) {
      const lx = f.x + Math.min(FRAME_MARGIN, (frameW(f) - sz.w) / 2);
      const ly = f.y + Math.min(FRAME_MARGIN, (frameH(f) - sz.h) / 2);
      x = clamp(x, lx, Math.max(lx, f.x + frameW(f) - FRAME_MARGIN - sz.w));
      y = clamp(y, ly, Math.max(ly, f.y + frameH(f) - FRAME_MARGIN - sz.h));
      const taken = (yy: number) =>
        itemRects().some((o) => o.l < x + sz.w && o.r > x && o.t < yy + sz.h && o.b > yy);
      let tries = 0;
      while (taken(y) && y + sz.h * 2 < f.y + frameH(f) && tries++ < 12) y += sz.h + 12;
    }
    snapshot();
    setGroups((gs) => [
      ...gs,
      {
        id: uid(),
        x: Math.round(x),
        y: Math.round(y),
        axis: "x",
        items: [item],
      },
    ]);
    setSelectedIds([item.id]);
    setSelectedFrameId(null);
    setSheet(null);
  };

  const changeFrame = (f: FrameMode) => {
    if (f === frame) return;
    snapshot();
    setFrame(f);
    frameRef.current = f;
    if (f === "window") ensureFrame();
    setSelectedFrameId(null);
    setSelectedLinkId(null);
    queueMicrotask(() => fitRef.current());
  };

  const addFrame = () => {
    snapshot();
    const base = framesRef.current[0];
    const f: Frame = {
      id: uid(),
      name: `${t("screenN")} ${framesRef.current.length + 1}`,
      x: nextFrameX(),
      y: base?.y ?? 0,
    };
    setFrames((fs) => [...fs, f]);
    setSelectedFrameId(f.id);
    setSelectedIds([]);
    const r = canvasRect();
    if (r) {
      const z = viewRef.current.z;
      setView({
        x: r.width / 2 - (f.x + frameW(f) / 2) * z,
        y: r.height / 2 - (f.y + frameH(f) / 2) * z,
        z,
      });
    }
  };

  const patchFrame = (id: string, patch: Partial<Frame>) => {
    snapshotFor("frame:" + id + ":" + Object.keys(patch).join(","));
    const f = framesRef.current.find((x) => x.id === id);
    const resized = !!f && ((patch.w !== undefined && patch.w !== frameW(f)) || (patch.h !== undefined && patch.h !== frameH(f)));
    if (f && resized) {
      /* a window changing size carries its parts across rather than leaving them
       * hanging over the new edge: see carryFrame in lib/tidy.ts */
      const carried = carryFrame(groupsRef.current, f, { ...f, ...patch }, framesRef.current, widthsRef.current);
      setFrames(carried.frames);
      setGroups(carried.groups);
      return;
    }
    setFrames((fs) => fs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  /** the tidy button's state for the screen in play; the layout pass runs only when the document changes */
  const tidyState = useMemo((): TidyState | null => {
    if (!tidyTarget) return null;
    const last = tidyRef.current;
    if (last && last.frameId === tidyTarget.id && last.after === groups) return "undo";
    return tidyFrame(groups, tidyTarget, frames, widths) ? "tidy" : "done";
  }, [tidyTarget, groups, frames, widths]);

  const tidy = (f: Frame) => {
    const last = tidyRef.current;
    if (last && last.frameId === f.id && last.after === groupsRef.current) {
      snapshot();
      setGroups(last.before);
      tidyRef.current = null;
      return;
    }
    const after = tidyFrame(groupsRef.current, f, framesRef.current, widthsRef.current);
    if (!after) return;
    snapshot();
    tidyRef.current = { frameId: f.id, before: groupsRef.current, after };
    setGroups(after);
  };

  const toastTimer = useRef<number | null>(null);
  /** the desktop's message pill beside the tidy button; the phone keeps its centered toast */
  const showAiNote = (text: string, icon = "check", ms = 2200) => {
    setAiNote({ text, icon });
    if (aiNoteTimer.current) window.clearTimeout(aiNoteTimer.current);
    aiNoteTimer.current = window.setTimeout(() => setAiNote(null), ms);
  };

  const showToast = (msg: string, ms = 2200, icon = "info") => {
    if (!mobileRef.current) {
      showAiNote(msg, icon, ms);
      return;
    }
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  };

  const updateAiSettings = (s: AiSettings) => {
    setAiSettings(s);
    saveAiSettings(s);
  };

  const aiReady = hasKey(aiSettings) && aiSettings.model.trim().length > 0 && isSecureUrl(aiSettings.baseUrl);
  const aiReason = !aiReady ? t("aiNoKey", lang) : !tidyTarget ? t("aiSelectScreen", lang) : undefined;

  /** Writes one field with the model: a part's behavior note, or a screen's description.
   *  The result goes straight in; the field remembers what it said so the rewrite can be undone. */
  const runAi = async (action: AiActionKey, f: Frame, itemId?: string) => {
    if (!aiReady) {
      showToast(t("aiNoKey", lang));
      return;
    }
    const curDoc = doc;
    aiAbortRef.current?.abort();
    const ac = new AbortController();
    aiAbortRef.current = ac;
    setAiBusy(true);
    setAiFrameId(f.id);
    try {
      if (action === "describe") {
        const r = await proposeDescription(aiSettings, curDoc, widthsRef.current, f, lang, ac.signal);
        if (ac.signal.aborted) return;
        snapshot();
        setFrames((fs) => fs.map((x) => (x.id === f.id ? { ...x, note: r.note, noteHistory: pushHistory(x.noteHistory, x.note), name: r.name ?? x.name } : x)));
        showAiNote(t("aiApplied", lang));
        return;
      }
      if (!itemId) return;
      const note = await proposeBehavior(aiSettings, curDoc, widthsRef.current, f, lang, itemId, ac.signal);
      if (ac.signal.aborted) return;
      if (!note) {
        showToast(t("aiErrorJson", lang));
        return;
      }
      snapshot();
      setGroups((gs) => mapGroups(gs, (g) => (g.items.some((it) => it.id === itemId) ? { ...g, items: g.items.map((it) => (it.id === itemId ? { ...it, note, noteHistory: pushHistory(it.noteHistory, it.note) } : it)) } : g)));
      showAiNote(t("aiApplied", lang));
    } catch (e) {
      if (!ac.signal.aborted) showToast(aiErrorText(e, lang), 4000, "danger");
    } finally {
      if (aiAbortRef.current === ac) {
        aiAbortRef.current = null;
        setAiBusy(false);
        setAiFrameId(null);
      }
    }
  };

  const cancelAi = () => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setAiBusy(false);
    setAiFrameId(null);
  };

  useEffect(
    () => () => {
      aiAbortRef.current?.abort();
      if (aiNoteTimer.current) window.clearTimeout(aiNoteTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  /** a screen takes everything on it along, and links into it are dropped */
  const deleteFrame = useCallback(
    (id: string) => {
      snapshot();
      const gone = new Set(
        groupsRef.current
          .filter((g) => frameOfGroup(g, framesRef.current, widthsRef.current)?.id === id)
          .map((g) => g.id),
      );
      setFrames((fs) => fs.filter((f) => f.id !== id));
      setGroups((gs) =>
        mapGroups(
          gs.filter((g) => !gone.has(g.id)),
          (g) => ({
            ...g,
            items: g.items.map((it) => {
              const next = { ...it };
              if (next.action?.to === id) next.action = undefined;
              if (next.actions) {
                const actions = Object.fromEntries(Object.entries(next.actions).filter(([, a]) => a.to !== id));
                next.actions = Object.keys(actions).length ? actions : undefined;
              }
              return next;
            }),
          }),
        ),
      );
      setSelectedFrameId(null);
      setSelectedIds((cur) => cur.filter((x) => !groupsRef.current.some((g) => gone.has(g.id) && g.items.some((it) => it.id === x))));
    },
    [snapshot],
  );

  const duplicateFrame = (id: string) => {
    const f = framesRef.current.find((x) => x.id === id);
    if (!f) return;
    snapshot();
    const nf: Frame = {
      ...f,
      id: uid(),
      name: `${f.name}${t("copySuffix")}`,
      x: nextFrameX(),
    };
    const dx = nf.x - f.x;
    const copies = groupsRef.current
      .filter(
        (g) => frameOfGroup(g, framesRef.current, widthsRef.current)?.id === id,
      )
      .map((g) => cloneGroup(g, dx));
    setFrames((fs) => [...fs, nf]);
    setGroups((gs) => [...gs, ...copies]);
    setSelectedFrameId(nf.id);
  };
  const duplicateFrameRef = useRef(duplicateFrame);
  duplicateFrameRef.current = duplicateFrame;

  /** The screen is re-rendered offscreen at 1:1 with static parts, so the
   *  canvas zoom, selection outlines and in-flight animations never leak into the PNG. */
  const saveFrameImage = async (f: Frame) => {
    setExportFrame(f);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
    try {
      await document.fonts?.ready;
      const el = document.querySelector<HTMLElement>(`[data-export="${f.id}"]`);
      if (!el) return;
      const url = await toPng(el, { pixelRatio: 2, cacheBust: true, width: frameW(f), height: frameH(f) });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${f.name || "window"}.png`;
      a.click();
    } finally {
      setExportFrame(null);
    }
  };

  /** the runs of one screen drawn with plain divs: the export layer */
  const renderExport = (f: Frame) => {
    const gs = groups.filter((g) => frameOfGroup(g, frames, widths)?.id === f.id);
    /* one group, placed relative to (ox, oy); children carry their own
     * container-relative coordinates, so they render at a zero offset */
    const renderExportGroup = (g: Group, ox: number, oy: number): React.ReactNode =>
      g.free ? (
        <div key={g.id} style={{ position: "absolute", left: g.x - ox, top: g.y - oy }}>
          {((corners) =>
          layoutOf(g, widths).map((pl) => (
            <div key={pl.item.id} style={{ position: "absolute", left: pl.x - g.x, top: pl.y - g.y }}>
              <KitStatic
                item={pl.item}
                palette={p}
                radii={corners.get(pl.item.id)}
                style={MEASURED.includes(pl.item.kind) ? undefined : { width: pl.w, height: pl.h }}
              />
            </div>
          )))(freeRadii(g, widths))}
          {g.children?.map((c) => renderExportGroup(c, 0, 0))}
        </div>
      ) : (
        <div
          key={g.id}
          style={{
            position: "absolute",
            left: g.x - ox,
            top: g.y - oy,
            display: "flex",
            flexDirection: g.axis === "x" ? "row" : "column",
            alignItems: g.axis === "x" ? "center" : "stretch",
            gap: GAP,
          }}
        >
          {g.items.map((it, i) => {
            const conn = connectSpecOf(it);
            const n = g.items.length;
            const radii =
              conn && n > 1
                ? runRadii(g.axis, i === 0, i === n - 1, false, false, 0, conn.outer, conn.inner)
                : conn
                  ? uniformRadii(conn.outer)
                  : baseRadii(it);
            return (
              <KitStatic
                key={it.id}
                item={it}
                palette={p}
                radii={radii}
                style={MEASURED.includes(it.kind) ? undefined : { width: sizeOf(it, widths).w, height: sizeOf(it, widths).h }}
              />
            );
          })}
          {g.children?.map((c) => renderExportGroup(c, 0, 0))}
        </div>
      );
    return (
      <div
        data-export={f.id}
        style={{
          position: "relative",
          width: frameW(f),
          height: frameH(f),
          background: p[f.bg ?? "background"],
          overflow: "hidden",
        }}
      >
        {gs.map((g) => renderExportGroup(g, f.x, f.y))}
      </div>
    );
  };

  const openPreview = (startId?: string | null) => {
    if (frame !== "window") {
      changeFrame("window");
    }
    queueMicrotask(() =>
      setPreviewId(
        startId ?? selectedFrameId ?? framesRef.current[0]?.id ?? null,
      ),
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (typing) return;
      // the confirm dialog and the preview own the keyboard while they are up
      if (confirmClear || previewId !== null) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedIds.length === 0 && selectedFrameId) duplicateFrameRef.current(selectedFrameId);
        else duplicateSelected();
        return;
      }
      if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) ungroupSelected();
        else groupSelected();
        return;
      }
      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedIds.length === 0 && selectedFrameId)
          deleteFrame(selectedFrameId);
        else deleteSelected();
        return;
      }
      if (e.key === "Escape") {
        setSelectedIds([]);
        setSelectedFrameId(null);
        setSelectedLinkId(null);
        return;
      }
      if (e.key === "p" || e.key === "P") {
        openPreviewRef.current();
        return;
      }
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const s = e.shiftKey ? 10 : 1;
        nudge(
          e.key === "ArrowLeft" ? -s : e.key === "ArrowRight" ? s : 0,
          e.key === "ArrowUp" ? -s : e.key === "ArrowDown" ? s : 0,
        );
        return;
      }
      if (mod) return;
      if (e.key === "v" || e.key === "V") setMode("select");
      if (e.key === "h" || e.key === "H") setMode("hand");
      if (e.key === "=" || e.key === "+") setZoomAt(viewRef.current.z * 1.2);
      if (e.key === "-" || e.key === "_") setZoomAt(viewRef.current.z / 1.2);
      if (e.key === "0") fitRef.current();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deleteSelected,
    duplicateSelected,
    groupSelected,
    ungroupSelected,
    nudge,
    redo,
    undo,
    setZoomAt,
    selectedIds,
    selectedFrameId,
    deleteFrame,
    confirmClear,
    previewId,
  ]);
  const openPreviewRef = useRef(openPreview);
  openPreviewRef.current = openPreview;

  /* ---------- render ---------- */
  const dragSize = drag ? sizeOf(drag.item, widths) : { w: 0, h: 0 };
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const doc: Doc = useMemo(
    () => ({ groups, frames, paletteKey, frame, title, brief, promptEdit, customPalette: customPalette ?? undefined, theme, lang }),
    [groups, frames, paletteKey, frame, title, brief, promptEdit, customPalette, theme, lang],
  );

  /** arrows from tappable parts to the frames they open */
  const links = useMemo(() => {
    if (frame !== "window") return [];
    const rects = itemRects();
    const out: {
      id: string;
      d: string;
      mx: number;
      my: number;
      tx: number;
      ty: number;
      ang: number;
      t: Transition;
    }[] = [];
    for (const v of flattenGroups(groups)) {
      for (const it of v.group.items) {
        for (const { slot, action } of actionsOf(it)) {
        if (action.to === BACK_TARGET) continue;
        const f = frames.find((x) => x.id === action.to);
        const r = rects.find((x) => x.id === it.id);
        if (!f || !r) continue;
        const fr = frameRect(f);
        const rightward = (fr.l + fr.r) / 2 >= (r.l + r.r) / 2;
        const sx = rightward ? r.r : r.l;
        const sy = (r.t + r.b) / 2;
        const tx = rightward ? fr.l : fr.r;
        const ty = clamp(sy, fr.t + 40, fr.b - 40);
        const dx = Math.max(60, Math.abs(tx - sx) * 0.5);
        const c1x = sx + (rightward ? dx : -dx);
        const c2x = tx + (rightward ? -dx : dx);
        const d = `M${sx} ${sy} C${c1x} ${sy} ${c2x} ${ty} ${tx} ${ty}`;
        // midpoint of the cubic at t = 0.5
        const mx = 0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * tx;
        const my = 0.125 * sy + 0.375 * sy + 0.375 * ty + 0.125 * ty;
        out.push({
          id: `${it.id}|${slot}`,
          d,
          mx,
          my,
          tx,
          ty,
          ang: rightward ? 0 : 180,
          t: action.transition,
        });
        }
      }
    }
    return out;
  }, [groups, frames, frame, itemRects, widths]);

  /** apply a change to the action behind a link id ("itemId|slot") */
  const patchLink = (linkId: string, fn: (a: Action) => Action | undefined) => {
    const [itemId, slot] = linkId.split("|");
    setGroups((gs) =>
      mapGroups(gs, (g) => ({
        ...g,
        items: g.items.map((it) => {
          if (it.id !== itemId) return it;
          if (!slot) return { ...it, action: it.action ? fn(it.action) : undefined };
          const cur = it.actions?.[slot];
          if (!cur) return it;
          const next = fn(cur);
          const actions = { ...(it.actions ?? {}) };
          if (next) actions[slot] = next;
          else delete actions[slot];
          return { ...it, actions: Object.keys(actions).length ? actions : undefined };
        }),
      })),
    );
  };

  const setLinkTransition = (linkId: string, transition: Transition) => {
    snapshotFor("link:" + linkId);
    patchLink(linkId, (a) => ({ ...a, transition }));
  };
  const removeLink = (linkId: string) => {
    snapshot();
    patchLink(linkId, () => undefined);
    setSelectedLinkId(null);
  };

  const runRadii = (
    axis: Axis,
    first: boolean,
    last: boolean,
    prevPh: boolean,
    nextPh: boolean,
    pull: number,
    outer: number,
    inner: number,
  ): Radii => {
    const soft = lerp(outer, inner, pull);
    const s = first ? outer : prevPh ? soft : inner;
    const e = last ? outer : nextPh ? soft : inner;
    return axis === "x"
      ? { tl: s, bl: s, tr: e, br: e }
      : { tl: s, tr: s, bl: e, br: e };
  };

  /** which frame each run sits on (phone mode only) */
  const frameOf = useMemo(() => {
    const m = new Map<string, string>();
    if (frame !== "window") return m;
    /* a nested group inherits its top-level ancestor's frame: its own
     * coordinates are relative to the container, so they say nothing */
    const walk = (g: Group, fid?: string) => {
      if (fid) m.set(g.id, fid);
      else {
        const f = frameOfGroup(g, frames, widths);
        if (f) {
          m.set(g.id, f.id);
          fid = f.id;
        }
      }
      for (const c of g.children ?? []) walk(c, fid);
    };
    for (const g of groups) walk(g);
    return m;
  }, [groups, frames, frame, widths]);

  /** the screen whose layers the panel lists: the selection's, else the chosen one */
  const layersFrame = useMemo(() => {
    if (frame !== "window") return null;
    if (primaryId) {
      const g = flattenGroups(groups).find((v) => v.group.items.some((it) => it.id === primaryId))?.group;
      const fid = g ? frameOf.get(g.id) : undefined;
      if (fid) return frames.find((f) => f.id === fid) ?? null;
    }
    if (selectedFrameId) return frames.find((f) => f.id === selectedFrameId) ?? null;
    return frames.find((f) => f.id === layersFrameId) ?? frames[0] ?? null;
  }, [frame, primaryId, groups, frameOf, frames, selectedFrameId, layersFrameId]);
  const layerGroups = useMemo(
    () => (layersFrame ? groups.filter((g) => frameOf.get(g.id) === layersFrame.id) : []),
    [groups, frameOf, layersFrame],
  );
  const reorderLayers = (topFirst: string[]) => {
    const inFrame = new Set(topFirst);
    const byId = new Map(groupsRef.current.map((g) => [g.id, g]));
    const ordered = [...topFirst].reverse().map((id) => byId.get(id)).filter((g): g is Group => !!g);
    if (ordered.length !== inFrame.size) return;
    snapshotFor("layers:" + (layersFrame?.id ?? ""));
    for (const id of inFrame) instantRef.current.add(id);
    setGroups((gs) => [...gs.filter((g) => !inFrame.has(g.id)), ...ordered]);
  };

  const renderGroup = (g: Group, ox: number, oy: number) => {
    if (g.free) {
      const instantG = instantRef.current.has(g.id);
      const allOn = g.items.every((it) => selectedSet.has(it.id));
      const corners = freeRadii(g, widths);
      /* the selection box covers nested children too */
      const sb = subtreeBounds(g, widths);
      const nestHi = drag?.active && drag.nest === g.id;
      const bb = nestHi ? groupBounds(g, widths) : null;
      return (
        <motion.div
          key={g.id}
          initial={false}
          animate={{ x: g.x - ox, y: g.y - oy }}
          transition={instantG ? INSTANT : OPEN}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {layoutOf(g, widths).map((pl) => (
            <div key={pl.item.id} style={{ position: "absolute", left: pl.x - g.x, top: pl.y - g.y }}>
              <KitNode
                item={pl.item}
                palette={p}
                widths={widths}
                radii={corners.get(pl.item.id)}
                pressed={false}
                selected={selectedSet.has(pl.item.id)}
                interactive={!handMode}
                onPointerDown={(e) => onItemPointerDown(e, g, pl.index, pl.item)}
              />
            </div>
          ))}
          {/* child coordinates are relative to this group's origin */}
          {g.children?.map((c) => renderGroup(c, 0, 0))}
          {allOn && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: sb.l - g.x - 6,
                top: sb.t - g.y - 6,
                width: sb.w + 12,
                height: sb.h + 12,
                border: `${1.5 / view.z}px dashed ${p.primary}`,
                borderRadius: 10,
                pointerEvents: "none",
              }}
            />
          )}
          {bb && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: bb.l - g.x - 4,
                top: bb.t - g.y - 4,
                width: bb.w + 8,
                height: bb.h + 8,
                border: `1.5px solid ${p.primary}`,
                borderRadius: 10,
                pointerEvents: "none",
              }}
            />
          )}
        </motion.div>
      );
    }
    const snap = drag?.active && drag.snap?.groupId === g.id ? drag.snap : null;
    const pull = snap?.pull ?? 0;
    const phMain = snap ? (g.axis === "x" ? dragSize.w : dragSize.h) * pull : 0;
    const shift = snap && snap.index === 0 ? -(phMain + GAP) : 0;
    const conn = g.items[0] ? connectSpecOf(g.items[0]) : undefined;

    type Cell = { ph: true } | { ph: false; item: Item; index: number };
    const cells: Cell[] = [];
    for (let i = 0; i <= g.items.length; i++) {
      if (snap && snap.index === i) cells.push({ ph: true });
      if (i < g.items.length)
        cells.push({ ph: false, item: g.items[i], index: i });
    }
    const m = cells.length;
    const instant = instantRef.current.has(g.id);
    const nestHi = drag?.active && drag.nest === g.id;
    const bb = nestHi ? groupBounds(g, widths) : null;

    return (
      <motion.div
        key={g.id}
        initial={false}
        animate={{
          x: g.x - ox + (g.axis === "x" ? shift : 0),
          y: g.y - oy + (g.axis === "y" ? shift : 0),
        }}
        transition={instant ? INSTANT : OPEN}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          display: "flex",
          flexDirection: g.axis === "x" ? "row" : "column",
          alignItems: g.axis === "x" ? "center" : "stretch",
          gap: GAP,
        }}
      >
        {cells.map((c, r) => {
          if (c.ph) {
            return (
              <motion.div
                key="__gap"
                initial={g.axis === "x" ? { width: 0 } : { height: 0 }}
                animate={
                  g.axis === "x" ? { width: phMain } : { height: phMain }
                }
                transition={OPEN}
                style={{
                  flex: "0 0 auto",
                  height: g.axis === "x" ? dragSize.h : undefined,
                  width: g.axis === "y" ? dragSize.w : undefined,
                }}
              />
            );
          }
          const ic = connectSpecOf(c.item);
          const radii =
            conn && ic
              ? runRadii(
                  g.axis,
                  r === 0,
                  r === m - 1,
                  r > 0 && cells[r - 1].ph,
                  r < m - 1 && cells[r + 1].ph,
                  pull,
                  ic.outer,
                  ic.inner,
                )
              : baseRadii(c.item);
          return (
            <KitNode
              key={c.item.id}
              item={c.item}
              palette={p}
              widths={widths}
              radii={radii}
              pressed={pressedId === c.item.id}
              selected={selectedSet.has(c.item.id)}
              interactive={!handMode}
              onPointerDown={(e) => onItemPointerDown(e, g, c.index, c.item)}
            />
          );
        })}
        {/* child coordinates are relative to this group's origin */}
        {g.children?.map((c) => renderGroup(c, 0, 0))}
        {bb && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: bb.l - g.x - 4,
              top: bb.t - g.y - 4,
              width: bb.w + 8,
              height: bb.h + 8,
              border: `1.5px solid ${p.primary}`,
              borderRadius: 10,
              pointerEvents: "none",
            }}
          />
        )}
      </motion.div>
    );
  };

  const handMode = !isMobile && (mode === "hand" || spaceHeld);
  /** the single selected part, with its world rect, that the canvas resize handles stick to */
  const resizeTarget = useMemo(() => {
    if (isMobile || handMode || drag?.active) return null;
    if (selectedIds.length !== 1) return null;
    const id = selectedIds[0];
    for (const v of flattenGroups(groups)) {
      const g = v.group;
      const idx = g.items.findIndex((it) => it.id === id);
      if (idx < 0) continue;
      const item = g.items[idx];
      if (!resizeEdgesOf(item).length) return null;
      let x: number;
      let y: number;
      if (g.free) {
        /* handles stick to world coordinates, not container-relative ones */
        const pl = layoutOf({ ...g, x: v.wx, y: v.wy }, widths).find((q) => q.item.id === id);
        if (!pl) return null;
        x = pl.x;
        y = pl.y;
      } else {
        const off = prefixOf(g, idx);
        x = g.axis === "x" ? v.wx + off : v.wx;
        y = g.axis === "x" ? v.wy : v.wy + off;
      }
      const sz = sizeOf(item, widths);
      return { item, x, y, w: sz.w, h: sz.h };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, widths, selectedIds, isMobile, handMode, drag]);
  const resizeTargetRef = useRef(resizeTarget);
  resizeTargetRef.current = resizeTarget;
  const panning = gesture?.kind === "pan";
  const marquee = gesture?.kind === "marquee" && gesture.moved ? gesture : null;
  const canvasBg = frame === "window" ? p.muted : "#ffffff";

  const panelStyle: React.CSSProperties = {
    background: p.background,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    flex: "0 0 auto",
  };

  const showRight = rightOpen && !isMobile;
  const guide = drag?.active ? drag.guide : null;
  const visibleWorld = (() => {
    const r = canvasRef.current?.getBoundingClientRect();
    return {
      l: -view.x / view.z,
      t: -view.y / view.z,
      w: (r?.width ?? 0) / view.z,
      h: (r?.height ?? 0) / view.z,
    };
  })();

  return (
    <LangContext.Provider value={lang}>
    <ThemeContext.Provider value={theme}>
      <div
        className="app-root"
        style={{
          display: "flex",
          overflow: "hidden",
          background: p.muted,
          cursor: partResize
            ? partResize.edge === "e"
              ? "ew-resize"
              : partResize.edge === "s"
                ? "ns-resize"
                : "nwse-resize"
            : resizing
              ? "col-resize"
              : undefined,
          userSelect: resizing || partResize ? "none" : undefined,
          ["--sb" as string]: p.border,
          ["--ring" as string]: p.primary,
        }}
      >
        {/* hidden measuring layer for text-sized kinds */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            visibility: "hidden",
            pointerEvents: "none",
            fontFamily: fontFamilyOf(theme.font),
          }}
        >
          {allItems
            .filter((it) => MEASURED.includes(it.kind))
            .map((it) => (
              <div
                key={it.id}
                ref={(el) => {
                  if (el) measureEls.current.set(it.id, el);
                  else measureEls.current.delete(it.id);
                }}
                style={{
                  display: "inline-flex",
                  boxSizing: "border-box",
                  border:
                    (it.variant === "outline" || it.variant === "default") && it.kind === "button"
                      ? "1px solid transparent"
                      : "none",
                }}
              >
                <MeasuredContent item={it} p={p} />
              </div>
            ))}
        </div>

        {exportFrame && (
          <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", fontFamily: fontFamilyOf(theme.font) }}>
            {renderExport(exportFrame)}
          </div>
        )}

        {/* ---- left: rail + parts / layers ---- */}
        {!isMobile && (
          <aside style={{ ...panelStyle, width: leftOpen ? leftW : RAIL_W, flexDirection: "row", transition: "width 200ms cubic-bezier(0.2, 0, 0, 1)" }}>
            <div
              onPointerEnter={() => setRailHover(true)}
              onPointerLeave={() => setRailHover(false)}
              onClick={(e) => {
                // a click on the rail's empty background opens the panel
                if (!leftOpen && e.target === e.currentTarget) setLeftOpen(true);
              }}
              style={{
                width: RAIL_W,
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "10px 0",
                background: p.muted,
                cursor: leftOpen ? undefined : "pointer",
              }}
            >
              {!leftOpen && railHover ? (
                <IconBtn icon="panel-left-open" p={p} on onClick={() => setLeftOpen(true)} title={t("openPanel", lang)} size={40} />
              ) : (
                <div
                  onClick={() => !leftOpen && setLeftOpen(true)}
                  style={{ width: 40, height: 40, display: "grid", placeItems: "center", cursor: leftOpen ? "default" : "pointer" }}
                >
                  <Logo size={32} color={p.primary} glyph={p.primaryForeground} />
                </div>
              )}
              <div style={{ height: 6 }} />
              {LEFT_TABS.map((tab, i) => (
                <div key={tab.key} style={{ marginTop: i === 2 || i === 6 ? 10 : 0 }}>
                  <IconBtn
                    icon={tab.icon}
                    p={p}
                    on={leftOpen && leftTab === tab.key}
                    onClick={() => {
                      setLeftTab(tab.key);
                      setLeftOpen(true);
                    }}
                    title={t(tab.title, lang)}
                    size={44}
                  />
                </div>
              ))}
              <div style={{ flex: 1 }} onClick={() => !leftOpen && setLeftOpen(true)} />
              <LangMenu p={p} onLang={setLang} side="right" size={44} />
              <GitHubLink p={p} size={44} />
            </div>
            {leftOpen && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 10px 0 14px",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: p.foreground,
                    flex: 1,
                  }}
                >
                  {t(LEFT_TABS.find((x) => x.key === leftTab)?.title ?? "parts", lang)}
                </span>
                <IconBtn
                  icon="panel-left-close"
                  p={p}
                  onClick={() => setLeftOpen(false)}
                  title={t("closePanel", lang)}
                />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={leftTab}
                    initial={still ? { opacity: 0 } : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={still ? { opacity: 0 } : { opacity: 0, x: 8 }}
                    transition={{ duration: 0.12 }}
                    style={{ height: "100%" }}
                  >
                {leftTab === "parts" ? (
                  <PartsPalette
                    palette={p}
                    favorites={favorites}
                    onToggleFavorite={(k) =>
                      setFavorites((f) =>
                        f.includes(k) ? f.filter((x) => x !== k) : [...f, k],
                      )
                    }
                    onPartPointerDown={onPartPointerDown}
                    overBin={(!!drag?.active && drag.overBin) || (gesture?.kind === "group" && gesture.overBin)}
                  />
                ) : leftTab === "color" ? (
                  <ColorPanel
                    p={p}
                    paletteKey={paletteKey}
                    onPalette={setPaletteKey}
                    custom={customPalette}
                    onCustom={setCustomPalette}
                    theme={theme}
                    onTheme={patchTheme}
                  />
                ) : leftTab === "shape" ? (
                  <ShapePanel p={p} theme={theme} onChange={patchTheme} />
                ) : leftTab === "type" ? (
                  <TypePanel p={p} theme={theme} onChange={patchTheme} />
                ) : leftTab === "motion" ? (
                  <MotionPanel p={p} theme={theme} onChange={patchTheme} />
                ) : leftTab === "ai" ? (
                  <AiPanel p={p} settings={aiSettings} onSettings={updateAiSettings} />
                ) : (
                  <LayersPanel
                    p={p}
                    frames={frames}
                    frameId={layersFrame?.id ?? null}
                    onFrame={(id) => {
                      setLayersFrameId(id);
                      setSelectedIds([]);
                      setSelectedFrameId(id);
                    }}
                    groups={layerGroups}
                    selectedIds={selectedIds}
                    onSelect={(ids, add) => {
                      setSelectedIds((cur) => (add ? [...cur.filter((x) => !ids.includes(x)), ...ids] : ids));
                      setSelectedFrameId(null);
                      setSelectedLinkId(null);
                      setRightTab("edit");
                    }}
                    onReorder={reorderLayers}
                    /* reorder one container's children to match the panel's order */
                    onReorderChildren={(parentId, orderedIds) => {
                      snapshotFor("layers:" + parentId);
                      setGroups((prev) =>
                        mapGroups(prev, (g) => {
                          if (g.id !== parentId || !g.children) return g;
                          const byId = new Map(g.children.map((c) => [c.id, c]));
                          const next = orderedIds.map((id) => byId.get(id)).filter((c): c is Group => !!c);
                          return next.length === g.children.length ? { ...g, children: next } : g;
                        }),
                      );
                    }}
                  />
                )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            )}
            {leftOpen && (
            <div
              onPointerDown={(e) => {
                e.preventDefault();
                setResizing("left");
              }}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: -3,
                width: 6,
                cursor: "col-resize",
                zIndex: 5,
              }}
            />
            )}
          </aside>
        )}

        {/* ---- canvas ---- */}
        <main
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
            padding: isMobile ? 6 : 8,
          }}
        >
          <div
            ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
            onPointerDownCapture={onTouchCapture}
            style={{
              position: "absolute",
              inset: isMobile ? 6 : 8,
              overflow: "hidden",
              borderRadius: 24,
              background: canvasBg,
              cursor: panning ? "grabbing" : handMode ? "grab" : "default",
              touchAction: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
                transformOrigin: "0 0",
                willChange: "transform",
                fontFamily: fontFamilyOf(theme.font),
              }}
            >
              {frame === "window" &&
                frames.map((f) => {
                  const on = f.id === selectedFrameId;
                  const bg = p[f.bg ?? "background"];
                  return (
                    <div
                      key={f.id}
                      data-frame={f.id}
                      style={{ position: "absolute", left: f.x, top: f.y }}
                    >
                      <div
                        onPointerDown={(e) => onFramePointerDown(e, f)}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: -FRAME_LABEL_H,
                          height: FRAME_LABEL_H,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "0 8px",
                          fontSize: 15,
                          fontWeight: 600,
                          color: on ? p.primary : p.mutedForeground,
                          cursor: handMode ? "grab" : "move",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                          fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                      >
                        <Icon name="window-restore" size={20} />
                        {f.name || t("screen", lang)}
                      </div>
                      <div
                        onPointerDown={(e) => onFramePointerDown(e, f)}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          overflow: "hidden",
                          width: frameW(f),
                          height: frameH(f),
                          borderRadius: WINDOW_R,
                          boxSizing: "border-box",
                          border: `1px solid ${p.windowBorder}`,
                          background: bg,
                          boxShadow: on
                            ? `0 0 0 2px ${p.ring}, 0 16px 44px rgba(0,0,0,0.14)`
                            : "0 16px 44px rgba(0,0,0,0.12)",
                          cursor: handMode ? "grab" : "move",
                          transition: "box-shadow 120ms",
                        }}
                      >
                        <AnimatePresence>{aiFrameId === f.id && <ThinkingRing key="ring" p={p} w={frameW(f)} h={frameH(f)} />}</AnimatePresence>
                        <div
                          data-screen={f.id}
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "100%",
                            borderRadius: WINDOW_R,
                            overflow: "hidden",
                          }}
                        >
                          {groups
                            .filter((g) => frameOf.get(g.id) === f.id)
                            .map((g) => renderGroup(g, f.x, f.y))}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {groups
                .filter((g) => !frameOf.has(g.id))
                .map((g) => renderGroup(g, 0, 0))}

              {/* resize handles on the single selected part */}
              {resizeTarget && (
                <div
                  style={{
                    position: "absolute",
                    left: resizeTarget.x,
                    top: resizeTarget.y,
                    width: resizeTarget.w,
                    height: resizeTarget.h,
                    pointerEvents: "none",
                    zIndex: 40,
                  }}
                >
                  {resizeEdgesOf(resizeTarget.item).map((edge) => {
                    const hs = 10 / view.z;
                    const pos: React.CSSProperties =
                      edge === "e"
                        ? { left: resizeTarget.w, top: resizeTarget.h / 2 }
                        : edge === "s"
                          ? { left: resizeTarget.w / 2, top: resizeTarget.h }
                          : { left: resizeTarget.w, top: resizeTarget.h };
                    return (
                      <div
                        key={edge}
                        onPointerDown={(e) => onResizeHandleDown(e, edge)}
                        style={{
                          position: "absolute",
                          ...pos,
                          transform: "translate(-50%, -50%)",
                          width: hs,
                          height: hs,
                          boxSizing: "border-box",
                          borderRadius: 2 / view.z,
                          background: p.primary,
                          border: `${1.5 / view.z}px solid ${p.background}`,
                          boxShadow: `0 0 0 ${1 / view.z}px rgba(0,0,0,0.08)`,
                          cursor: edge === "e" ? "ew-resize" : edge === "s" ? "ns-resize" : "nwse-resize",
                          pointerEvents: "auto",
                          touchAction: "none",
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* the part in flight */}
              {drag?.active && (
                <motion.div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    x: sx,
                    y: sy,
                    pointerEvents: "none",
                    zIndex: 50,
                  }}
                  animate={{
                    opacity: drag.overBin ? 0.4 : 1,
                    scale: drag.overBin ? 0.84 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 34,
                    mass: 0.6,
                  }}
                >
                  <KitNode
                    item={drag.item}
                    palette={p}
                    widths={widths}
                    dragging
                    radii={(() => {
                      const conn = connectSpecOf(drag.item);
                      if (!conn || !drag.snap) return baseRadii(drag.item);
                      const g = findGroup(groupsRef.current, drag.snap!.groupId)?.group;
                      const mm = (g?.items.length ?? 0) + 1;
                      const k = drag.snap.index;
                      return runRadii(
                        conn.axis,
                        k === 0,
                        k === mm - 1,
                        k > 0,
                        k < mm - 1,
                        drag.snap.pull,
                        conn.outer,
                        conn.inner,
                      );
                    })()}
                  />
                </motion.div>
              )}

              {links.length > 0 && (
                <svg
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    overflow: "visible",
                    pointerEvents: "none",
                  }}
                  width={1}
                  height={1}
                >
                  <defs>
                    <marker
                      id="kit-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="8"
                      markerHeight="8"
                      orient="auto"
                    >
                      <path d="M0 0 L10 5 L0 10 z" fill={p.primary} />
                    </marker>
                  </defs>
                  {links.map((l) => {
                    const on = l.id === selectedLinkId;
                    return (
                      <g key={l.id}>
                        <path
                          d={l.d}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={18 / view.z}
                          style={{ pointerEvents: "stroke", cursor: "pointer" }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setSelectedLinkId(l.id);
                            setSelectedIds([]);
                            setSelectedFrameId(null);
                          }}
                        />
                        <path
                          d={l.d}
                          fill="none"
                          stroke={p.primary}
                          strokeWidth={on ? 3 : 2}
                          strokeDasharray={on ? undefined : "6 6"}
                          strokeLinecap="round"
                          markerEnd="url(#kit-arrow)"
                          opacity={on ? 1 : 0.7}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {links
                .filter((l) => l.id === selectedLinkId)
                .map((l) => (
                  <div
                    key={l.id}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      left: l.mx,
                      top: l.my,
                      transform: `translate(-50%, 14px) scale(${1 / view.z})`,
                      transformOrigin: "50% 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: 6,
                      borderRadius: 26,
                      background: p.muted,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
                      zIndex: 60,
                    }}
                  >
                    <Segmented<Transition>
                      options={TRANSITIONS.map((t) => ({
                        key: t.key,
                        icon: t.icon,
                        title: t.label,
                      }))}
                      value={l.t}
                      onChange={(t) => setLinkTransition(l.id, t)}
                      p={p}
                      height={36}
                      grow={false}
                    />
                    <IconBtn
                      icon="circle-x"
                      p={p}
                      danger
                      onClick={() => removeLink(l.id)}
                      title={t("removeLink", lang)}
                      size={36}
                    />
                  </div>
                ))}

              {guide?.gx !== undefined && (
                <div
                  style={{
                    position: "absolute",
                    left: guide.gx,
                    top: visibleWorld.t,
                    width: 1.5 / view.z,
                    height: visibleWorld.h,
                    background: p.primary,
                    pointerEvents: "none",
                  }}
                />
              )}
              {guide?.gy !== undefined && (
                <div
                  style={{
                    position: "absolute",
                    top: guide.gy,
                    left: visibleWorld.l,
                    height: 1.5 / view.z,
                    width: visibleWorld.w,
                    background: p.primary,
                    pointerEvents: "none",
                  }}
                />
              )}

              {marquee && (
                <div
                  style={{
                    position: "absolute",
                    left: Math.min(marquee.x0, marquee.x1),
                    top: Math.min(marquee.y0, marquee.y1),
                    width: Math.abs(marquee.x1 - marquee.x0),
                    height: Math.abs(marquee.y1 - marquee.y0),
                    border: `${1 / view.z}px solid ${p.primary}`,
                    background: `${p.primary}14`,
                    borderRadius: 4 / view.z,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </div>

          <Toolbar
            p={p}
            mode={mode}
            onMode={setMode}
            frame={frame}
            onFrame={changeFrame}
            zoom={view.z}
            onZoom={(z) => setZoomAt(z)}
            onFit={fit}
            canUndo={pastRef.current.length > 0}
            canRedo={futureRef.current.length > 0}
            onUndo={undo}
            onRedo={redo}
            onClear={() => {
              if (groupsRef.current.length || framesRef.current.length) setConfirmClear(true);
            }}
            onAddFrame={addFrame}
            onPreview={() => openPreview()}
            tidy={tidyState ?? undefined}
            onTidy={tidyTarget ? () => tidy(tidyTarget) : undefined}
            note={aiNote}
            onSaveProject={() => saveProject(doc)}
            onOpenProject={() => projectFileRef.current?.click()}
            rightInset={showRight ? rightW : 0}
            mobile={isMobile}
            onSettings={() => setSheet(sheet === "settings" ? null : "settings")}
            onLangSheet={() => setSheet(sheet === "lang" ? null : "lang")}
            onPrompt={async () => {
              try {
                await navigator.clipboard.writeText(effectivePrompt(doc, widths, lang));
                showToast(t("copied", lang), 1400, "check");
              } catch {}
            }}
          />

          {isMobile && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 80,
                textAlign: "center",
                fontSize: 11,
                lineHeight: 1.4,
                color: p.mutedForeground,
                pointerEvents: "none",
                zIndex: 40,
              }}
            >
              {t("mobileNote", lang)}
            </div>
          )}

          {isMobile && sheet === null && (
            <button
              onClick={addButton}
              title={t("addButton", lang)}
              aria-label={t("addButton", lang)}
              className="kit-press"
              style={{
                position: "absolute",
                right: 16,
                bottom: "calc(16px + var(--bottom-ui, 0px) + env(safe-area-inset-bottom))",
                width: 64,
                height: 64,
                borderRadius: 20,
                border: "none",
                background: p.primary,
                color: p.primaryForeground,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                zIndex: 46,
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              }}
            >
              <Icon name="plus" size={32} />
            </button>
          )}

          {isMobile && selected && sheet === null && (
            <MobileActionBar
              p={p}
              onEdit={() => setSheet("edit")}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
            />
          )}

          <AnimatePresence>
            {isMobile && sheet === "edit" && selected && (
              <BottomSheet key="edit" p={p} onClose={() => setSheet(null)}>
                <MobileInspector
                  item={selected}
                  palette={p}
                  onChange={patchSelected}
                  onDelete={() => {
                    deleteSelected();
                    setSheet(null);
                  }}
                  onDuplicate={duplicateSelected}
                  onClose={() => setSheet(null)}
                />
              </BottomSheet>
            )}
            {isMobile && sheet === "settings" && (
              <BottomSheet key="settings" p={p} onClose={() => setSheet(null)}>
                <MobileSettings palette={p} paletteKey={paletteKey} onPalette={setPaletteKey} theme={theme} onTheme={patchTheme} />
              </BottomSheet>
            )}
            {isMobile && sheet === "lang" && (
              <BottomSheet key="lang" p={p} onClose={() => setSheet(null)}>
                <MobileLang
                  palette={p}
                  lang={lang}
                  onLang={(l) => {
                    setLang(l);
                    setSheet(null);
                  }}
                />
              </BottomSheet>
            )}
          </AnimatePresence>

          {toast && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 96,
                transform: "translateX(-50%)",
                padding: "10px 18px",
                borderRadius: 20,
                background: p.foreground,
                color: p.background,
                fontSize: 13,
                fontWeight: 600,
                zIndex: 47,
                pointerEvents: "none",
              }}
            >
              {toast}
            </div>
          )}

          {!rightOpen && !isMobile && (
            <div
              style={{ position: "absolute", right: 20, top: 20, zIndex: 45 }}
            >
              <IconBtn
                icon="panel-right-open"
                p={p}
                on
                onClick={() => setRightOpen(true)}
                title={t("edit", lang)}
                size={44}
              />
            </div>
          )}
        </main>

        {/* ---- right: inspector / prompt ---- */}
        {showRight && (
          <aside style={{ ...panelStyle, width: rightW }}>
            <div
              onPointerDown={(e) => {
                e.preventDefault();
                setResizing("right");
              }}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: -3,
                width: 6,
                cursor: "col-resize",
                zIndex: 5,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 10px 6px 12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Segmented<"edit" | "prompt">
                  options={[
                    { key: "edit", icon: "settings-2", title: t("edit", lang), grow: false, wide: true },
                    { key: "prompt", icon: "bot", label: t("prompt", lang), title: t("prompt", lang), grow: true },
                  ]}
                  value={rightTab}
                  onChange={setRightTab}
                  p={p}
                  height={40}
                />
              </div>
              <IconBtn
                icon="panel-right-close"
                p={p}
                onClick={() => setRightOpen(false)}
                title={t("closePanel", lang)}
              />
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={rightTab}
                  initial={still ? { opacity: 0 } : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={still ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  transition={{ duration: 0.12 }}
                  style={{ height: "100%", display: "flex", flexDirection: "column" }}
                >
              {rightTab === "edit" && selectedFrame && !selected ? (
                <FrameInspector
                  frame={selectedFrame}
                  palette={p}
                  onChange={(patch) => patchFrame(selectedFrame.id, patch)}
                  onDelete={() => deleteFrame(selectedFrame.id)}
                  onDuplicate={() => duplicateFrame(selectedFrame.id)}
                  onPreview={() => openPreview(selectedFrame.id)}
                  prompt={buildPrompt(doc, widths, selectedFrame.id, lang)}
                  onSaveImage={() => saveFrameImage(selectedFrame)}
                  frames={frames}
                  tidy={tidyState ?? "done"}
                  onTidy={() => tidy(selectedFrame)}
                  ai={{ ready: aiReady, reason: aiReason, busy: aiBusy && aiFrameId === selectedFrame.id, onRun: () => runAi("describe", selectedFrame), onCancel: cancelAi }}
                />
              ) : rightTab === "edit" ? (
                <Inspector
                  ai={{
                    ready: aiReady && !!tidyTarget,
                    reason: aiReason,
                    busy: aiBusy,
                    onRun: () => {
                      if (tidyTarget && selected) runAi("behavior", tidyTarget, selected.id);
                    },
                    onCancel: cancelAi,
                  }}
                  item={selectedIds.length > 1 ? null : selected}
                  palette={p}
                  frames={frame === "window" ? frames : []}
                  onChange={patchSelected}
                  onDelete={deleteSelected}
                  onDuplicate={duplicateSelected}
                  multi={selectedIds.length}
                  grouped={!!selectedGroup}
                  onGroup={groupSelected}
                  onUngroup={ungroupSelected}
                />
              ) : (
                <PromptPanel
                  doc={doc}
                  widths={widths}
                  palette={p}
                  onDoc={(patch) => {
                    if (patch.title !== undefined) setTitle(patch.title);
                    if (patch.brief !== undefined) setBrief(patch.brief);
                    if ("promptEdit" in patch) setPromptEdit(patch.promptEdit);
                  }}
                />
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </aside>
        )}

        <input
          ref={projectFileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void readProject(file).then((next) => (next ? setPendingImport(next) : showToast(t("invalidProject", lang), 3000, "danger")));
          }}
        />

        <ConfirmDialog
          open={pendingImport !== null}
          icon="folder-open"
          title={t("replaceProjectTitle", lang)}
          body={t("replaceProject", lang)}
          p={p}
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            if (pendingImport) importDoc(pendingImport);
            setPendingImport(null);
          }}
        />

        <ConfirmDialog
          open={confirmClear}
          title={t("clearAllTitle", lang)}
          body={t("clearAllBody", lang)}
          p={p}
          onCancel={() => setConfirmClear(false)}
          onConfirm={clearAll}
        />

        {previewId !== null && frames.length > 0 && (
          <Preview
            doc={doc}
            widths={widths}
            palette={p}
            startId={previewId}
            onClose={() => setPreviewId(null)}
          />
        )}
      </div>
    </ThemeContext.Provider>
    </LangContext.Provider>
  );
}
