import type { CSSProperties } from "react";
import {
  BREADCRUMB_TRAIL,
  CHART_SERIES,
  DESCRIPTION_ITEMS,
  FORM_FIELDS,
  KIND_TEXT,
  LIST_ROWS,
  MENU_ITEMS,
  SIDEBAR_ITEMS,
  TAB_LABELS,
  TABLE_COLUMNS,
  TABLE_ROWS,
  TREE_NODES,
  getLang,
  t,
  translateDefault,
  translateFrameName,
  translateKindText,
} from "./i18n";
import type { Lang } from "./i18n";
import { KIT_PALETTES } from "./kit-themes.gen";

/* ---------- geometry ----------
 * Every number is a CSS pixel, which is what gpui-kit's `px(...)` means: the
 * theme's base font size is 16px, so 1rem is 16px and the spacing scale below
 * is the one the Design Guides call semantic. The control heights come from
 * gpui-kit itself (crates/component/src/sizing.rs). */

/** medium control height: `input_h(Size::Medium)` and a medium Button are both h_8 */
export const H = 32;
/** the heights the other density tiers give a control */
export const H_BY_DENSITY: Record<Density, number> = { compact: 24, default: 32, comfortable: 44 };
/** fused controls in a ButtonGroup share one hairline instead of a gap */
export const GAP = 0;
/** theme.radius and theme.radius_lg */
export const R = 6;
export const R_LG = 8;
/** the inner corner where two controls fuse; gpui-kit squares it off */
export const R_INNER = 0;
/** a pill: gpui-kit spells this `radius_full()` */
export const R_FULL = 9999;

/** the semantic spacing scale, xxs to xxl */
export const SPACING = [2, 4, 8, 12, 16, 24, 32] as const;

/** magnetic field size, along the run and across it */
export const SNAP_MAIN = 28;
export const SNAP_CROSS = 14;
/** how sharply the pull ramps up (higher = gentler at the edge) */
export const PULL_EXP = 2.2;
/** ms allowed for the landing animation before the item is committed */
export const SETTLE_MS = 340;

/** the window the "window" canvas mode draws, and the sizes it offers */
export const WINDOW_W = 1280;
export const WINDOW_H = 800;
/** a desktop window's own corner, outside the app's own radius scale */
export const WINDOW_R = 10;
export const WINDOW_SIZES: { w: number; h: number; label: string }[] = [
  { w: 1024, h: 640, label: "1024 × 640" },
  { w: 1280, h: 800, label: "1280 × 800" },
  { w: 1440, h: 900, label: "1440 × 900" },
  { w: 1680, h: 1050, label: "1680 × 1050" },
];

/** gpui-kit's `TITLE_BAR_HEIGHT`, and a StatusBar's resolved height */
export const TITLE_BAR_H = 34;
export const STATUS_BAR_H = 28;
/** Sidebar's `DEFAULT_WIDTH` and `COLLAPSED_WIDTH` */
export const SIDEBAR_W = 255;
export const SIDEBAR_COLLAPSED_W = 48;
/** the traffic lights sit 9px in from the top-left corner on macOS */
export const TRAFFIC_INSET = 9;

/** the `lg` step: what a panel spends at its own boundary */
export const WINDOW_MARGIN = 16;
/** width of a part that spans a window of this width, with a margin on both sides */
export const contentWidth = (w: number) => w - WINDOW_MARGIN * 2;
/** width of one of two parts sharing a row in a window of this width, with a margin-sized gutter between them */
export const halfWidth = (w: number) => (contentWidth(w) - WINDOW_MARGIN) / 2;
/** width of a part that spans the window with a margin on both sides */
export const CONTENT_W = contentWidth(WINDOW_W);
/** width of one of two parts sharing a row, with a margin-sized gutter between them */
export const HALF_W = halfWidth(WINDOW_W);
/** width presets offered in the inspector: sidebar, two columns, with margins, edge to edge */
export const WIDTH_PRESETS = [SIDEBAR_W, HALF_W, CONTENT_W, WINDOW_W];
/** height presets for free-form panels: half the window, the whole window */
export const HEIGHT_PRESETS = [WINDOW_H / 2, WINDOW_H];
/** desktop windows have no bezel; the frame is the window itself */
export const BEZEL = 0;
export const FRAME_LABEL_H = 44;
/** horizontal distance between newly added frames */
export const FRAME_GAP = 120;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const uid = () => Math.random().toString(36).slice(2, 10);

export type Radii = { tl: number; tr: number; bl: number; br: number };
export const uniformRadii = (r: number): Radii => ({ tl: r, tr: r, bl: r, br: r });

/* ---------- color ----------
 * The canvas paints with gpui-kit's own semantic tokens, so a sketch names the
 * same roles the generated `cx.theme()` calls will read. `lib/kit-themes.gen.ts`
 * resolves them out of a gpui-kit checkout; see script/gen-kit-themes.mjs. */
export type Palette = {
  key: string;
  label: string;
  /** the theme set the palette belongs to, which pairs its light and dark modes */
  set: string;
  dark: boolean;
  /** theme.radius and theme.radius_lg, as the theme file declares them */
  radius: number;
  radiusLg: number;

  background: string;
  foreground: string;
  border: string;
  /** input.border */
  input: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  secondaryForeground: string;
  secondaryHover: string;
  secondaryActive: string;
  success: string;
  successForeground: string;
  info: string;
  infoForeground: string;
  warning: string;
  warningForeground: string;
  danger: string;
  dangerForeground: string;
  accent: string;
  accentForeground: string;
  groupBox: string;
  groupBoxForeground: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  link: string;
  list: string;
  listActive: string;
  listActiveBorder: string;
  listEven: string;
  listHead: string;
  listHover: string;
  popover: string;
  popoverForeground: string;
  progressBar: string;
  ring: string;
  scrollbarThumb: string;
  selection: string;
  sidebar: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  skeleton: string;
  sliderBar: string;
  sliderThumb: string;
  switchBg: string;
  switchThumb: string;
  tab: string;
  tabActive: string;
  tabActiveForeground: string;
  tabBar: string;
  tabBarSegmented: string;
  tabForeground: string;
  table: string;
  tableActive: string;
  tableActiveBorder: string;
  tableEven: string;
  tableHead: string;
  tableHeadForeground: string;
  tableRowBorder: string;
  tableHover: string;
  titleBar: string;
  titleBarBorder: string;
  statusBar: string;
  statusBarBorder: string;
  overlay: string;
  windowBorder: string;
};

/** the gpui-kit theme name for each palette field, for the prompt to quote */
export const TOKEN_NAMES: Partial<Record<keyof Palette, string>> = {
  background: "background",
  foreground: "foreground",
  border: "border",
  input: "input.border",
  muted: "muted.background",
  mutedForeground: "muted.foreground",
  primary: "primary.background",
  primaryForeground: "primary.foreground",
  secondary: "secondary.background",
  secondaryForeground: "secondary.foreground",
  accent: "accent.background",
  accentForeground: "accent.foreground",
  danger: "danger.background",
  warning: "warning.background",
  success: "success.background",
  info: "info.background",
  groupBox: "group_box.background",
  popover: "popover.background",
  sidebar: "sidebar.background",
  titleBar: "title_bar.background",
  statusBar: "status_bar.background",
  tabBar: "tab_bar.background",
  list: "list.background",
  table: "table.background",
  ring: "ring",
  link: "link.foreground",
  sidebarForeground: "sidebar.foreground",
  sidebarBorder: "sidebar.border",
  sidebarAccent: "sidebar.accent.background",
  sidebarAccentForeground: "sidebar.accent.foreground",
  titleBarBorder: "title_bar.border",
  statusBarBorder: "status_bar.border",
  tab: "tab.background",
  tabActive: "tab.active.background",
  tabActiveForeground: "tab.active.foreground",
  listActive: "list.active.background",
  listActiveBorder: "list.active.border",
  listEven: "list.even.background",
  listHead: "list.head.background",
  tableHead: "table.head.background",
  tableHeadForeground: "table.head.foreground",
  tableRowBorder: "table.row.border",
  selection: "selection.background",
  switchBg: "switch.background",
  sliderBar: "slider.background",
  progressBar: "progress.bar.background",
  skeleton: "skeleton.background",
  overlay: "overlay",
  windowBorder: "window.border",
  groupBoxForeground: "group_box.foreground",
  popoverForeground: "popover.foreground",
  primaryHover: "primary.hover.background",
  secondaryHover: "secondary.hover.background",
  dangerForeground: "danger.foreground",
  warningForeground: "warning.foreground",
  successForeground: "success.foreground",
  infoForeground: "info.foreground",
  chart1: "chart.1",
  chart2: "chart.2",
  chart3: "chart.3",
  chart4: "chart.4",
  chart5: "chart.5",
};

export const PALETTES: Palette[] = KIT_PALETTES;

/** the theme sets, each pairing whichever modes gpui-kit ships for it */
export const PALETTE_SETS: { set: string; light?: Palette; dark?: Palette }[] = (() => {
  const out: { set: string; light?: Palette; dark?: Palette }[] = [];
  for (const p of PALETTES) {
    let entry = out.find((e) => e.set === p.set);
    if (!entry) {
      entry = { set: p.set };
      out.push(entry);
    }
    if (p.dark) entry.dark ??= p;
    else entry.light ??= p;
  }
  return out;
})();

/* ---------- theme: the axes a gpui-kit ThemeConfig exposes ---------- */
export type RadiusScale = "square" | "default" | "round";
export type FontKey = "system" | "inter" | "roboto" | "mono";
export type Density = "compact" | "default" | "comfortable";
export type MotionScheme = "default" | "reduced";

export type Theme = {
  dark: boolean;
  /** the app follows the system setting; the canvas shows the mode chosen in `dark` */
  bothModes: boolean;
  /** theme.radius / theme.radius_lg, as a coarse scale */
  radius: RadiusScale;
  font: FontKey;
  /** the default component `Size`, which the guides call the density tier */
  density: Density;
  /** theme.shadow */
  shadow: boolean;
  /** theme.focus_ring */
  focusRing: boolean;
  motion: MotionScheme;
};

export const DEFAULT_THEME: Theme = {
  dark: false,
  bothModes: true,
  radius: "default",
  font: "system",
  density: "default",
  shadow: true,
  focusRing: true,
  motion: "default",
};

export const RADII: { key: RadiusScale; label: string; icon: string; radius: number }[] = [
  { key: "square", label: "Square", icon: "frame", radius: 0 },
  { key: "default", label: "Default", icon: "panel-bottom", radius: R },
  { key: "round", label: "Round", icon: "circle-check", radius: 10 },
];

export const DENSITIES: { key: Density; label: string; size: string }[] = [
  { key: "compact", label: "Compact", size: "small" },
  { key: "default", label: "Default", size: "medium" },
  { key: "comfortable", label: "Comfortable", size: "large" },
];

export const MOTIONS: { key: MotionScheme; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "reduced", label: "Reduced" },
];

export const FONTS: {
  key: FontKey;
  label: string;
  family: string;
  /** what the generated theme's `font.family` should say */
  themeValue: string;
  /** Google Fonts family to fetch for the canvas, if any */
  google?: string;
}[] = [
  { key: "system", label: "System UI", family: "system-ui, -apple-system, 'Segoe UI', sans-serif", themeValue: ".SystemUIFont" },
  { key: "inter", label: "Inter", family: "Inter, system-ui, sans-serif", themeValue: "Inter", google: "Inter:wght@400;500;600;700" },
  { key: "roboto", label: "Roboto", family: "Roboto, system-ui, sans-serif", themeValue: "Roboto", google: "Roboto:wght@400;500;600;700" },
  { key: "mono", label: "Monospace", family: "'JetBrains Mono', Menlo, Consolas, monospace", themeValue: "JetBrains Mono", google: "JetBrains+Mono:wght@400;500;600;700" },
];

export const fontFamilyOf = (f: FontKey) => FONTS.find((x) => x.key === f)?.family ?? FONTS[0].family;

/** a stored theme with any missing or unknown field replaced by its default */
export function normalizeTheme(x: Partial<Theme> | undefined): Theme {
  const d = DEFAULT_THEME;
  if (!x) return d;
  return {
    dark: typeof x.dark === "boolean" ? x.dark : d.dark,
    bothModes: typeof x.bothModes === "boolean" ? x.bothModes : d.bothModes,
    radius: RADII.some((r) => r.key === x.radius) ? (x.radius as RadiusScale) : d.radius,
    font: FONTS.some((f) => f.key === x.font) ? (x.font as FontKey) : d.font,
    density: DENSITIES.some((r) => r.key === x.density) ? (x.density as Density) : d.density,
    shadow: typeof x.shadow === "boolean" ? x.shadow : d.shadow,
    focusRing: typeof x.focusRing === "boolean" ? x.focusRing : d.focusRing,
    motion: x.motion === "reduced" || x.motion === "default" ? x.motion : d.motion,
  };
}

/* the radius scale and density that rendering helpers read outside React;
 * the page sets both once per render */
let curRadius: RadiusScale = "default";
let curDensity: Density = "default";
export const setGlobalShape = (r: RadiusScale) => {
  curRadius = r;
};
export const setGlobalDensity = (d: Density) => {
  curDensity = d;
};
export const getShape = () => curRadius;
export const getDensity = () => curDensity;
/** the height a medium-sized control takes under the document's density */
export const densityH = () => H_BY_DENSITY[curDensity];

/** a default corner radius under the document's radius scale. `R_FULL` is a
 *  pill, which stays a pill however square the rest of the theme becomes. */
export function scaleR(r: number): number {
  if (r >= R_FULL) return r;
  if (curRadius === "square") return 0;
  if (curRadius === "round") return r + 4;
  return r;
}

/** The palette the document renders with. A theme set pairs a light and a dark
 *  palette, so switching mode moves to the set's other side where it has one. */
export function paletteOf(key: string, custom?: Palette | null, theme?: Theme): Palette {
  const base = (key === "custom" && custom) || PALETTES.find((p) => p.key === key) || PALETTES[0];
  if (!theme || base.dark === theme.dark) return base;
  if (key === "custom") return base;
  const sibling = PALETTES.find((p) => p.set === base.set && p.dark === theme.dark);
  return sibling ?? base;
}

/* ---------- the variants a gpui-kit control can take ---------- */
export type Variant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "link"
  | "danger"
  | "warning"
  | "success"
  | "info";

export const VARIANTS: { key: Variant; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "outline", label: "Outline" },
  { key: "ghost", label: "Ghost" },
  { key: "link", label: "Link" },
  { key: "danger", label: "Danger" },
  { key: "warning", label: "Warning" },
  { key: "success", label: "Success" },
  { key: "info", label: "Info" },
];

/** the semantic variants an Alert, Badge or Tag offers */
export const STATUS_VARIANTS: Variant[] = ["default", "primary", "secondary", "info", "success", "warning", "danger"];

export function variantStyle(v: Variant, p: Palette): CSSProperties {
  switch (v) {
    case "primary":
      return { background: p.primary, color: p.primaryForeground, border: "none" };
    case "secondary":
      return { background: p.secondary, color: p.secondaryForeground, border: "none" };
    case "outline":
      return { background: "transparent", color: p.foreground, border: `1px solid ${p.border}` };
    case "ghost":
      return { background: "transparent", color: p.foreground, border: "none" };
    case "link":
      return { background: "transparent", color: p.link, border: "none", textDecoration: "underline" };
    case "danger":
      return { background: p.danger, color: p.dangerForeground, border: "none" };
    case "warning":
      return { background: p.warning, color: p.warningForeground, border: "none" };
    case "success":
      return { background: p.success, color: p.successForeground, border: "none" };
    case "info":
      return { background: p.info, color: p.infoForeground, border: "none" };
    case "default":
      return { background: p.background, color: p.foreground, border: `1px solid ${p.border}` };
  }
}

/** gpui-kit gives a solid control a hairline shadow while `theme.shadow` is on */
export function variantShadow(v: Variant): string {
  if (v === "ghost" || v === "link") return "none";
  return "0 1px 2px rgba(0,0,0,0.06)";
}

/* ---------- component kinds ---------- */
export type Kind =
  | "titleBar"
  | "sidebar"
  | "toolbar"
  | "statusBar"
  | "breadcrumb"
  | "button"
  | "iconButton"
  | "buttonGroup"
  | "menu"
  | "input"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "switch"
  | "slider"
  | "label"
  | "panel"
  | "groupBox"
  | "tabs"
  | "resizable"
  | "dialog"
  | "sheet"
  | "popover"
  | "notification"
  | "list"
  | "dataTable"
  | "tree"
  | "text"
  | "icon"
  | "image"
  | "separator"
  | "badge"
  | "tag"
  | "alert"
  | "progress"
  | "spinner"
  | "skeleton"
  | "combobox"
  | "colorPicker"
  | "datePicker"
  | "calendar"
  | "form"
  | "rating"
  | "settings"
  | "avatar"
  | "kbd"
  | "link"
  | "marker"
  | "clipboard"
  | "shimmer"
  | "descriptionList"
  | "accordion"
  | "collapsible"
  | "pagination"
  | "stepper"
  | "dock"
  | "scrollbar"
  | "tooltip"
  | "hoverCard"
  | "command"
  | "chart"
  | "message"
  | "bubble"
  | "attachment"
  | "messageScroller";

export type Axis = "x" | "y";
/** kinds that fuse into a run: buttons side by side inside one ButtonGroup */
export type ConnectSpec = { axis: Axis; outer: number; inner: number; family: string };

/** `presets` are quick picks shown as chips; values outside min..max are hidden */
export type SizeSpec = { min: number; max: number; step: number; icon: string; presets?: number[] };

export type Category = "shell" | "actions" | "inputs" | "containment" | "overlays" | "data" | "content" | "feedback" | "chat";

export const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "shell", label: "Shell", icon: "layout-dashboard" },
  { key: "actions", label: "Actions", icon: "square-terminal" },
  { key: "inputs", label: "Inputs", icon: "case-sensitive" },
  { key: "containment", label: "Containment", icon: "frame" },
  { key: "overlays", label: "Overlays", icon: "gallery-vertical-end" },
  { key: "data", label: "Data", icon: "chart-pie" },
  { key: "content", label: "Content", icon: "file-text" },
  { key: "feedback", label: "Feedback", icon: "info" },
  { key: "chat", label: "Chat", icon: "bot" },
];

export type KindSpec = {
  label: string;
  /** the `gpui_kit::component` path the prompt names, e.g. "button::Button" */
  api: string;
  category: Category;
  paletteIcon: string;
  /** intrinsic size; measured kinds size to their content, sized kinds use `size` */
  w: number;
  h: number;
  radius: number;
  hasVariant: boolean;
  hasLabel: boolean;
  hasSupporting: boolean;
  hasIcon: boolean;
  hasChecked?: boolean;
  /** carries a list of icon + label entries (sidebar, tabs, menu, toolbar, list) */
  hasTabs?: boolean;
  /** carries table columns as well as rows */
  hasColumns?: boolean;
  /** second dimension (height) for free-form containers */
  size2?: SizeSpec;
  hasFill?: boolean;
  hasValue?: boolean;
  /** the value is a count in this range, not the default 0..100 percentage */
  valueSpec?: { min: number; max: number };
  hasCircle?: boolean;
  hasDisabled?: boolean;
  hasCollapsed?: boolean;
  hasSide?: boolean;
  hasControls?: boolean;
  /** the part is a region of the window shell, so tidy pins it to an edge */
  region?: "top" | "bottom" | "left" | "right";
  /** the part can parent other groups, the way a GPUI element nests children */
  container?: boolean;
  connect?: ConnectSpec;
  size?: SizeSpec;
  defLabel: string;
  defIcon: string | null;
  defSupporting?: string;
  defIcon2?: string;
  defSize?: number;
  defVariant?: Variant;
};

/** row heights gpui-kit resolves for its data views */
export const LIST_ROW_H = 28;
export const TREE_ROW_H = 26;
export const TABLE_ROW_H = 32;
export const MENU_ROW_H = 28;

export const KIND_SPEC: Record<Kind, KindSpec> = {
  /* ---- shell ---- */
  titleBar: {
    label: "Title Bar",
    api: "TitleBar",
    category: "shell",
    paletteIcon: "panel-bottom",
    w: WINDOW_W,
    h: TITLE_BAR_H,
    radius: 0,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: true,
    hasControls: true,
    region: "top",
    defLabel: "App",
    defIcon: null,
    defIcon2: "ellipsis",
  },
  sidebar: {
    label: "Sidebar",
    api: "sidebar::Sidebar",
    category: "shell",
    paletteIcon: "panel-left",
    w: SIDEBAR_W,
    h: WINDOW_H - TITLE_BAR_H,
    radius: 0,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: true,
    hasTabs: true,
    hasCollapsed: true,
    region: "left",
    container: true,
    size: { min: SIDEBAR_COLLAPSED_W, max: 420, step: 1, icon: "panel-left", presets: [SIDEBAR_COLLAPSED_W, 200, SIDEBAR_W, 320] },
    size2: { min: 120, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: HEIGHT_PRESETS },
    defLabel: "Navigation",
    defIcon: "layout-dashboard",
    defSize: SIDEBAR_W,
  },
  toolbar: {
    label: "Toolbar",
    api: "h_flex() of ghost button::Button",
    category: "shell",
    paletteIcon: "settings-2",
    w: 0,
    h: 40,
    radius: 0,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    defLabel: "",
    defIcon: null,
  },
  statusBar: {
    label: "Status Bar",
    api: "status_bar::StatusBar",
    category: "shell",
    paletteIcon: "panel-bottom-open",
    w: WINDOW_W,
    h: STATUS_BAR_H,
    radius: 0,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: true,
    region: "bottom",
    defLabel: "Ready",
    defIcon: "circle-check",
    defSupporting: "3 items",
  },
  breadcrumb: {
    label: "Breadcrumb",
    api: "breadcrumb::Breadcrumb",
    category: "shell",
    paletteIcon: "chevron-right",
    w: 0,
    h: 24,
    radius: 0,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    defLabel: "",
    defIcon: null,
  },

  /* ---- actions ---- */
  button: {
    label: "Button",
    api: "button::Button",
    category: "actions",
    paletteIcon: "square-terminal",
    w: 0,
    h: H,
    radius: R,
    hasVariant: true,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: true,
    hasDisabled: true,
    connect: { axis: "x", outer: R, inner: R_INNER, family: "button" },
    defLabel: "Button",
    defIcon: null,
    defVariant: "default",
  },
  iconButton: {
    label: "Icon Button",
    api: "button::Button, icon only",
    category: "actions",
    paletteIcon: "ellipsis",
    w: H,
    h: H,
    radius: R,
    hasVariant: true,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: true,
    hasDisabled: true,
    connect: { axis: "x", outer: R, inner: R_INNER, family: "button" },
    size: { min: 20, max: 44, step: 2, icon: "maximize", presets: [20, 24, 32, 44] },
    defLabel: "",
    defIcon: "settings",
    defSize: H,
    defVariant: "ghost",
  },
  buttonGroup: {
    label: "Button Group",
    api: "button::ButtonGroup",
    category: "actions",
    paletteIcon: "gallery-vertical-end",
    w: 0,
    h: H,
    radius: R,
    hasVariant: true,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    defLabel: "",
    defIcon: null,
    defVariant: "outline",
  },
  menu: {
    label: "Menu",
    api: "menu::PopupMenu",
    category: "actions",
    paletteIcon: "menu",
    w: 220,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    size: { min: 140, max: 360, step: 4, icon: "maximize", presets: [180, 220, 280] },
    defLabel: "",
    defIcon: null,
    defSize: 220,
  },

  /* ---- inputs ---- */
  input: {
    label: "Input",
    api: "input::{Input, InputState}",
    category: "inputs",
    paletteIcon: "case-sensitive",
    w: 280,
    h: H,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: true,
    hasDisabled: true,
    size: { min: 120, max: WINDOW_W, step: 4, icon: "maximize", presets: [200, 280, HALF_W, CONTENT_W] },
    defLabel: "Label",
    defIcon: null,
    defSupporting: "Enter a value",
  },
  textarea: {
    label: "Textarea",
    api: "input::{Textarea, TextareaState}",
    category: "inputs",
    paletteIcon: "file-text",
    w: 320,
    h: 84,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: false,
    hasDisabled: true,
    size: { min: 160, max: WINDOW_W, step: 4, icon: "maximize", presets: [280, 320, HALF_W, CONTENT_W] },
    size2: { min: 48, max: 480, step: 4, icon: "panel-bottom", presets: [84, 140, 220] },
    defLabel: "Description",
    defIcon: null,
    defSupporting: "Add the details",
  },
  select: {
    label: "Select",
    api: "select::{Select, SelectState}",
    category: "inputs",
    paletteIcon: "chevrons-up-down",
    w: 220,
    h: H,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: true,
    hasTabs: true,
    hasDisabled: true,
    size: { min: 120, max: WINDOW_W, step: 4, icon: "maximize", presets: [180, 220, 280, HALF_W] },
    defLabel: "Choose one",
    defIcon: null,
  },
  checkbox: {
    label: "Checkbox",
    api: "checkbox::Checkbox",
    category: "inputs",
    paletteIcon: "check",
    w: 0,
    h: 16,
    radius: 4,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasChecked: true,
    hasDisabled: true,
    defLabel: "I agree",
    defIcon: null,
  },
  radio: {
    label: "Radio Group",
    api: "radio::{Radio, RadioGroup}",
    category: "inputs",
    paletteIcon: "circle-check",
    w: 200,
    h: 0,
    radius: R_FULL,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasValue: true,
    hasDisabled: true,
    size: { min: 120, max: 420, step: 4, icon: "maximize", presets: [160, 200, 280] },
    defLabel: "",
    defIcon: null,
    defSize: 200,
  },
  switch: {
    label: "Switch",
    api: "switch::Switch",
    category: "inputs",
    paletteIcon: "circle-check",
    w: 0,
    h: 20,
    radius: R_FULL,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasChecked: true,
    hasDisabled: true,
    defLabel: "Notifications",
    defIcon: null,
  },
  slider: {
    label: "Slider",
    api: "slider::{Slider, SliderState}",
    category: "inputs",
    paletteIcon: "dash",
    w: 220,
    h: 20,
    radius: R_FULL,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasValue: true,
    hasDisabled: true,
    size: { min: 120, max: WINDOW_W, step: 4, icon: "maximize", presets: [180, 220, 320, HALF_W] },
    defLabel: "Volume",
    defIcon: null,
  },
  label: {
    label: "Label",
    api: "label::Label",
    category: "inputs",
    paletteIcon: "a-large-small",
    w: 0,
    h: 20,
    radius: 0,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    defLabel: "Label",
    defIcon: null,
  },

  /* ---- containment ---- */
  panel: {
    label: "Panel",
    api: "div() with a cx.theme() background",
    category: "containment",
    paletteIcon: "frame",
    w: CONTENT_W,
    h: 200,
    radius: R,
    container: true,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasFill: true,
    size: { min: 40, max: WINDOW_W, step: 4, icon: "maximize", presets: WIDTH_PRESETS },
    size2: { min: 24, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: HEIGHT_PRESETS },
    defLabel: "",
    defIcon: null,
    defSize: CONTENT_W,
  },
  groupBox: {
    label: "Group Box",
    api: "group_box::GroupBox",
    category: "containment",
    paletteIcon: "panel-left-close",
    w: 320,
    h: 160,
    radius: R_LG,
    container: true,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: false,
    size: { min: 160, max: WINDOW_W, step: 4, icon: "maximize", presets: [280, 320, HALF_W, CONTENT_W] },
    size2: { min: 80, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: [120, 160, 240] },
    defLabel: "Settings",
    defIcon: null,
    defSupporting: "",
  },
  tabs: {
    label: "Tabs",
    api: "tab::{Tab, TabBar}",
    category: "containment",
    paletteIcon: "gallery-vertical-end",
    w: 420,
    h: H,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasValue: true,
    size: { min: 160, max: WINDOW_W, step: 4, icon: "maximize", presets: [320, 420, CONTENT_W, WINDOW_W] },
    defLabel: "",
    defIcon: null,
    defSize: 420,
  },
  resizable: {
    label: "Resizable",
    api: "resizable::{h_resizable, resizable_panel}",
    category: "containment",
    paletteIcon: "panel-right-open",
    w: CONTENT_W,
    h: 260,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasValue: true,
    hasSide: true,
    size: { min: 200, max: WINDOW_W, step: 4, icon: "maximize", presets: WIDTH_PRESETS },
    size2: { min: 80, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: HEIGHT_PRESETS },
    defLabel: "",
    defIcon: null,
    defSize: CONTENT_W,
  },

  /* ---- overlays ---- */
  dialog: {
    label: "Dialog",
    api: "dialog::Dialog via window.open_dialog()",
    category: "overlays",
    paletteIcon: "square-terminal",
    w: 420,
    h: 0,
    radius: R_LG,
    container: true,
    hasVariant: true,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: false,
    size: { min: 280, max: 720, step: 4, icon: "maximize", presets: [360, 420, 560] },
    defLabel: 'Delete "Roadmap"?',
    defIcon: null,
    defSupporting: "This cannot be undone.",
    defSize: 420,
    defVariant: "danger",
  },
  sheet: {
    label: "Sheet",
    api: "sheet::Sheet via window.open_sheet()",
    category: "overlays",
    paletteIcon: "panel-right-open",
    w: 380,
    h: WINDOW_H - TITLE_BAR_H,
    radius: 0,
    container: true,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: false,
    hasSide: true,
    size: { min: 240, max: 720, step: 4, icon: "maximize", presets: [320, 380, 480] },
    size2: { min: 160, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: HEIGHT_PRESETS },
    defLabel: "Details",
    defIcon: null,
    defSupporting: "",
    defSize: 380,
  },
  popover: {
    label: "Popover",
    api: "popover::Popover",
    category: "overlays",
    paletteIcon: "gallery-vertical-end",
    w: 260,
    h: 0,
    radius: R_LG,
    container: true,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: false,
    size: { min: 160, max: 480, step: 4, icon: "maximize", presets: [220, 260, 320] },
    defLabel: "Popover",
    defIcon: null,
    defSupporting: "Supporting copy goes here.",
    defSize: 260,
  },
  notification: {
    label: "Notification",
    api: "notification::Notification via window.push_notification()",
    category: "overlays",
    paletteIcon: "bell",
    w: 360,
    h: 0,
    radius: R_LG,
    hasVariant: true,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: true,
    size: { min: 240, max: 480, step: 4, icon: "maximize", presets: [320, 360, 420] },
    defLabel: "Saved",
    defIcon: "circle-check",
    defSupporting: "Every change is in place.",
    defSize: 360,
    defVariant: "success",
  },

  /* ---- data ---- */
  list: {
    label: "List",
    api: "list::{List, ListState, ListDelegate}",
    category: "data",
    paletteIcon: "menu",
    w: 280,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasValue: true,
    size: { min: 160, max: WINDOW_W, step: 4, icon: "maximize", presets: [240, 280, HALF_W, CONTENT_W] },
    size2: { min: 60, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: [120, 200, 320] },
    defLabel: "",
    defIcon: null,
    defSize: 280,
  },
  dataTable: {
    label: "Data Table",
    api: "table::{DataTable, TableState, TableDelegate}",
    category: "data",
    paletteIcon: "layout-dashboard",
    w: 640,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasColumns: true,
    size: { min: 240, max: WINDOW_W, step: 4, icon: "maximize", presets: [480, 640, CONTENT_W, WINDOW_W] },
    size2: { min: 80, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: [160, 240, 400] },
    defLabel: "",
    defIcon: null,
    defSize: 640,
  },
  tree: {
    label: "Tree",
    api: "tree::{Tree, TreeState, TreeItem}",
    category: "data",
    paletteIcon: "folder-open",
    w: 260,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasValue: true,
    size: { min: 160, max: 480, step: 4, icon: "maximize", presets: [220, 260, 320] },
    size2: { min: 60, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: [120, 200, 320] },
    defLabel: "",
    defIcon: null,
    defSize: 260,
  },

  /* ---- content ---- */
  text: {
    label: "Text",
    api: "text::TextView, or a styled div()",
    category: "content",
    paletteIcon: "a-large-small",
    w: 0,
    h: 20,
    radius: 0,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    size: { min: 11, max: 48, step: 1, icon: "a-large-small", presets: [12, 14, 16, 18, 20] },
    defLabel: "Headline",
    defIcon: null,
    defSize: 20,
  },
  icon: {
    label: "Icon",
    api: "{Icon, IconName}",
    category: "content",
    paletteIcon: "star",
    w: 16,
    h: 16,
    radius: 0,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: true,
    size: { min: 12, max: 48, step: 2, icon: "maximize", presets: [12, 16, 20, 24, 32] },
    defLabel: "",
    defIcon: "star",
    defSize: 16,
  },
  image: {
    label: "Image",
    api: "gpui_kit::{img, ImageSource}",
    category: "content",
    paletteIcon: "frame",
    w: 200,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    size: { min: 24, max: WINDOW_W, step: 4, icon: "maximize", presets: [120, 200, 320] },
    size2: { min: 24, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: [120, 200, 320] },
    defLabel: "",
    defIcon: null,
    defSize: 200,
  },
  separator: {
    label: "Separator",
    api: "separator::Separator",
    category: "content",
    paletteIcon: "dash",
    w: CONTENT_W,
    h: 1,
    radius: 0,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    size: { min: 40, max: WINDOW_W, step: 4, icon: "maximize", presets: WIDTH_PRESETS },
    defLabel: "",
    defIcon: null,
    defSize: CONTENT_W,
  },
  badge: {
    label: "Badge",
    api: "badge::Badge",
    category: "content",
    paletteIcon: "asterisk",
    w: 0,
    h: 16,
    radius: R_FULL,
    hasVariant: true,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    defLabel: "3",
    defIcon: null,
    defVariant: "primary",
  },
  tag: {
    label: "Tag",
    api: "tag::Tag",
    category: "content",
    paletteIcon: "star",
    w: 0,
    h: 20,
    radius: 4,
    hasVariant: true,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasChecked: true,
    defLabel: "Tag",
    defIcon: null,
    defVariant: "secondary",
  },

  /* ---- feedback ---- */
  alert: {
    label: "Alert",
    api: "alert::Alert",
    category: "feedback",
    paletteIcon: "triangle-alert",
    w: CONTENT_W,
    h: 0,
    radius: R,
    hasVariant: true,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: true,
    size: { min: 200, max: WINDOW_W, step: 4, icon: "maximize", presets: [320, HALF_W, CONTENT_W] },
    defLabel: "Check this first",
    defIcon: "triangle-alert",
    defSupporting: "Review the input before continuing.",
    defSize: CONTENT_W,
    defVariant: "warning",
  },
  progress: {
    label: "Progress",
    api: "progress::{Progress, ProgressCircle}",
    category: "feedback",
    paletteIcon: "loader",
    w: 220,
    h: 6,
    radius: R_FULL,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasValue: true,
    hasCircle: true,
    size: { min: 80, max: WINDOW_W, step: 4, icon: "maximize", presets: [160, 220, 320] },
    defLabel: "",
    defIcon: null,
    defSize: 220,
  },
  spinner: {
    label: "Spinner",
    api: "spinner::Spinner",
    category: "feedback",
    paletteIcon: "loader-circle",
    w: 20,
    h: 20,
    radius: R_FULL,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    size: { min: 12, max: 64, step: 2, icon: "maximize", presets: [16, 20, 24, 32] },
    defLabel: "",
    defIcon: null,
    defSize: 20,
  },
  skeleton: {
    label: "Skeleton",
    api: "skeleton::Skeleton",
    category: "feedback",
    paletteIcon: "dash",
    w: 200,
    h: 16,
    radius: 4,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    size: { min: 40, max: WINDOW_W, step: 4, icon: "maximize", presets: [120, 200, 320, CONTENT_W] },
    size2: { min: 8, max: 240, step: 2, icon: "panel-bottom", presets: [12, 16, 24, 48] },
    defLabel: "",
    defIcon: null,
    defSize: 200,
  },

  /* ---- inputs, continued ---- */
  combobox: {
    label: "Combobox",
    api: "combobox::{Combobox, ComboboxState}",
    category: "inputs",
    paletteIcon: "search",
    w: 220,
    h: H,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: true,
    hasTabs: true,
    hasDisabled: true,
    size: { min: 120, max: WINDOW_W, step: 4, icon: "maximize", presets: [180, 220, 280, HALF_W] },
    defLabel: "Search or pick",
    defIcon: "search",
  },
  colorPicker: {
    label: "Color Picker",
    api: "color_picker::ColorPicker",
    category: "inputs",
    paletteIcon: "palette",
    w: 180,
    h: H,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasDisabled: true,
    size: { min: 120, max: 360, step: 4, icon: "maximize", presets: [140, 180, 240] },
    defLabel: "#3b82f6",
    defIcon: null,
  },
  datePicker: {
    label: "Date Picker",
    api: "date_picker::{DatePicker, DatePickerState}",
    category: "inputs",
    paletteIcon: "calendar",
    w: 200,
    h: H,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasDisabled: true,
    size: { min: 140, max: 360, step: 4, icon: "maximize", presets: [180, 200, 260] },
    defLabel: "2026-09-04",
    defIcon: null,
  },
  calendar: {
    label: "Calendar",
    api: "calendar::Calendar",
    category: "inputs",
    paletteIcon: "calendar",
    w: 280,
    h: 260,
    radius: R_LG,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasValue: true,
    valueSpec: { min: 1, max: 30 },
    size: { min: 240, max: 420, step: 4, icon: "maximize", presets: [260, 280, 320] },
    defLabel: "September 2026",
    defIcon: null,
    defSize: 280,
  },
  form: {
    label: "Form",
    api: "form::{v_form, field}",
    category: "inputs",
    paletteIcon: "case-sensitive",
    w: 360,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    size: { min: 240, max: WINDOW_W, step: 4, icon: "maximize", presets: [320, 360, HALF_W, CONTENT_W] },
    defLabel: "",
    defIcon: null,
    defSize: 360,
  },
  rating: {
    label: "Rating",
    api: "rating::Rating",
    category: "inputs",
    paletteIcon: "star",
    w: 108,
    h: 20,
    radius: 0,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasValue: true,
    hasDisabled: true,
    valueSpec: { min: 0, max: 5 },
    defLabel: "",
    defIcon: null,
  },
  settings: {
    label: "Settings",
    api: "setting::{Settings, SettingGroup, SettingItem}",
    category: "inputs",
    paletteIcon: "settings",
    w: 420,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    size: { min: 280, max: WINDOW_W, step: 4, icon: "maximize", presets: [360, 420, CONTENT_W] },
    defLabel: "General",
    defIcon: null,
    defSize: 420,
  },

  /* ---- content, continued ---- */
  avatar: {
    label: "Avatar",
    api: "avatar::{Avatar, AvatarGroup}",
    category: "content",
    paletteIcon: "circle-user",
    w: 32,
    h: 32,
    radius: R_FULL,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    size: { min: 20, max: 96, step: 2, icon: "maximize", presets: [24, 32, 40, 64] },
    defLabel: "AB",
    defIcon: null,
    defSize: 32,
  },
  kbd: {
    label: "Kbd",
    api: "kbd::Kbd",
    category: "content",
    paletteIcon: "square-terminal",
    w: 0,
    h: 20,
    radius: 4,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    defLabel: "cmd-s",
    defIcon: null,
  },
  link: {
    label: "Link",
    api: "link::Link",
    category: "content",
    paletteIcon: "external-link",
    w: 0,
    h: 20,
    radius: 0,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: false,
    defLabel: "gpui-kit.com",
    defIcon: null,
    defSupporting: "https://gpui-kit.com",
  },
  marker: {
    label: "Marker",
    api: "marker::{Marker, MarkerVariant}",
    category: "content",
    paletteIcon: "info",
    w: 0,
    h: 20,
    radius: R_FULL,
    hasVariant: true,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    defLabel: "Running",
    defIcon: null,
    defVariant: "info",
  },
  clipboard: {
    label: "Clipboard",
    api: "clipboard::Clipboard",
    category: "content",
    paletteIcon: "copy",
    w: 0,
    h: H,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    defLabel: "npm run deploy",
    defIcon: null,
  },
  shimmer: {
    label: "Shimmer",
    api: "shimmer::{ShimmerText, ShimmerStyle}",
    category: "content",
    paletteIcon: "a-large-small",
    w: 0,
    h: 20,
    radius: 0,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    defLabel: "Thinking…",
    defIcon: null,
  },
  descriptionList: {
    label: "Description List",
    api: "description_list::{DescriptionList, DescriptionItem}",
    category: "content",
    paletteIcon: "file-text",
    w: 320,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    size: { min: 200, max: WINDOW_W, step: 4, icon: "maximize", presets: [280, 320, HALF_W] },
    defLabel: "",
    defIcon: null,
    defSize: 320,
  },

  /* ---- containment, continued ---- */
  accordion: {
    label: "Accordion",
    api: "accordion::{Accordion, AccordionItem}",
    category: "containment",
    paletteIcon: "chevron-down",
    w: 360,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasValue: true,
    size: { min: 240, max: WINDOW_W, step: 4, icon: "maximize", presets: [320, 360, HALF_W, CONTENT_W] },
    defLabel: "",
    defIcon: null,
    defSize: 360,
  },
  collapsible: {
    label: "Collapsible",
    api: "collapsible::Collapsible",
    category: "containment",
    paletteIcon: "chevron-right",
    w: 320,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: false,
    hasChecked: true,
    size: { min: 200, max: WINDOW_W, step: 4, icon: "maximize", presets: [280, 320, HALF_W] },
    defLabel: "Advanced",
    defIcon: null,
    defSupporting: "Two more options live in here.",
    defSize: 320,
  },
  pagination: {
    label: "Pagination",
    api: "pagination::Pagination",
    category: "containment",
    paletteIcon: "ellipsis",
    w: 240,
    h: H,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasValue: true,
    valueSpec: { min: 1, max: 9 },
    size: { min: 160, max: 480, step: 4, icon: "maximize", presets: [200, 240, 320] },
    defLabel: "",
    defIcon: null,
    defSize: 240,
  },
  stepper: {
    label: "Stepper",
    api: "stepper::{Stepper, StepperItem}",
    category: "containment",
    paletteIcon: "sort-ascending",
    w: 420,
    h: 40,
    radius: 0,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasValue: true,
    size: { min: 240, max: WINDOW_W, step: 4, icon: "maximize", presets: [360, 420, CONTENT_W] },
    defLabel: "",
    defIcon: null,
    defSize: 420,
  },
  dock: {
    label: "Dock Area",
    api: "dock::{DockArea, DockAreaState}",
    category: "containment",
    paletteIcon: "layout-dashboard",
    w: CONTENT_W,
    h: 280,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasValue: true,
    size: { min: 240, max: WINDOW_W, step: 4, icon: "maximize", presets: WIDTH_PRESETS },
    size2: { min: 120, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: HEIGHT_PRESETS },
    defLabel: "",
    defIcon: null,
    defSize: CONTENT_W,
  },
  scrollbar: {
    label: "Scrollbar",
    api: "scroll::{Scrollbar, ScrollbarHandle}",
    category: "containment",
    paletteIcon: "panel-right",
    w: 8,
    h: 200,
    radius: R_FULL,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasValue: true,
    hasSide: true,
    size2: { min: 60, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: [160, 200, 320] },
    defLabel: "",
    defIcon: null,
  },

  /* ---- overlays, continued ---- */
  tooltip: {
    label: "Tooltip",
    api: "tooltip::Tooltip",
    category: "overlays",
    paletteIcon: "info",
    w: 0,
    h: 24,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    defLabel: "Save the project",
    defIcon: null,
  },
  hoverCard: {
    label: "Hover Card",
    api: "hover_card::HoverCard",
    category: "overlays",
    paletteIcon: "gallery-vertical-end",
    w: 280,
    h: 0,
    radius: R_LG,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: true,
    size: { min: 200, max: 420, step: 4, icon: "maximize", presets: [240, 280, 320] },
    defLabel: "Ada Lovelace",
    defIcon: "circle-user",
    defSupporting: "Joined in 1843 · 12 projects",
    defSize: 280,
  },
  command: {
    label: "Command",
    api: "command::{Command, CommandState, CommandGroup}",
    category: "overlays",
    paletteIcon: "search",
    w: 420,
    h: 0,
    radius: R_LG,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasValue: true,
    size: { min: 280, max: 640, step: 4, icon: "maximize", presets: [360, 420, 520] },
    defLabel: "Type a command…",
    defIcon: null,
    defSize: 420,
  },

  /* ---- data, continued ---- */
  chart: {
    label: "Chart",
    api: "chart::{BarChart, LineChart, AreaChart, PieChart}",
    category: "data",
    paletteIcon: "chart-pie",
    w: 360,
    h: 220,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    hasCircle: true,
    size: { min: 200, max: WINDOW_W, step: 4, icon: "maximize", presets: [320, 360, HALF_W, CONTENT_W] },
    size2: { min: 120, max: 640, step: 4, icon: "panel-bottom", presets: [180, 220, 320] },
    defLabel: "Builds per day",
    defIcon: null,
    defSize: 360,
  },

  /* ---- chat ---- */
  message: {
    label: "Message",
    api: "message::{Message, MessageContent, MessageAlignment}",
    category: "chat",
    paletteIcon: "bot",
    w: 420,
    h: 0,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: true,
    hasSide: true,
    size: { min: 240, max: WINDOW_W, step: 4, icon: "maximize", presets: [360, 420, HALF_W, CONTENT_W] },
    defLabel: "Ada",
    defIcon: "circle-user",
    defSupporting: "The build finished in 42 seconds.",
    defSize: 420,
  },
  bubble: {
    label: "Bubble",
    api: "bubble::{Bubble, BubbleContent, BubbleVariant}",
    category: "chat",
    paletteIcon: "inbox",
    w: 0,
    h: 0,
    radius: R_LG,
    hasVariant: true,
    hasLabel: true,
    hasSupporting: false,
    hasIcon: false,
    hasSide: true,
    size: { min: 120, max: 520, step: 4, icon: "maximize", presets: [220, 300, 380] },
    defLabel: "Can you rerun it on main?",
    defIcon: null,
    defSize: 300,
    defVariant: "primary",
  },
  attachment: {
    label: "Attachment",
    api: "attachment::{Attachment, AttachmentContent}",
    category: "chat",
    paletteIcon: "file",
    w: 280,
    h: 56,
    radius: R,
    hasVariant: false,
    hasLabel: true,
    hasSupporting: true,
    hasIcon: true,
    size: { min: 200, max: 480, step: 4, icon: "maximize", presets: [240, 280, 360] },
    defLabel: "build-log.txt",
    defIcon: "file-text",
    defSupporting: "18 KB",
    defSize: 280,
  },
  messageScroller: {
    label: "Message Scroller",
    api: "message_scroller::{MessageScroller, MessageScrollerState}",
    category: "chat",
    paletteIcon: "gallery-vertical-end",
    w: 420,
    h: 240,
    radius: R,
    hasVariant: false,
    hasLabel: false,
    hasSupporting: false,
    hasIcon: false,
    hasTabs: true,
    size: { min: 240, max: WINDOW_W, step: 4, icon: "maximize", presets: [360, 420, HALF_W] },
    size2: { min: 120, max: WINDOW_H, step: 4, icon: "panel-bottom", presets: [200, 240, 360] },
    defLabel: "",
    defIcon: null,
    defSize: 420,
  },
};

export const KIND_ORDER: Kind[] = [
  "titleBar",
  "sidebar",
  "toolbar",
  "statusBar",
  "breadcrumb",
  "button",
  "iconButton",
  "buttonGroup",
  "menu",
  "input",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "switch",
  "slider",
  "label",
  "panel",
  "groupBox",
  "tabs",
  "resizable",
  "dialog",
  "sheet",
  "popover",
  "notification",
  "list",
  "dataTable",
  "tree",
  "text",
  "icon",
  "image",
  "separator",
  "badge",
  "tag",
  "alert",
  "progress",
  "spinner",
  "skeleton",
  "combobox",
  "colorPicker",
  "datePicker",
  "calendar",
  "form",
  "rating",
  "settings",
  "avatar",
  "kbd",
  "link",
  "marker",
  "clipboard",
  "shimmer",
  "descriptionList",
  "accordion",
  "collapsible",
  "pagination",
  "stepper",
  "dock",
  "scrollbar",
  "tooltip",
  "hoverCard",
  "command",
  "chart",
  "message",
  "bubble",
  "attachment",
  "messageScroller",
];

/* ---------- window data ---------- */
export type NavTab = { icon: string; label: string };
/** a data table column; `numeric` right-aligns it, as comparable numbers want */
export type Column = { label: string; numeric?: boolean };

export type Item = {
  id: string;
  kind: Kind;
  label: string;
  icon: string | null;
  icon2?: string | null;
  variant: Variant;
  supporting?: string;
  size?: number;
  radiusTop?: number;
  radiusBottom?: number;
  tabs?: NavTab[];
  columns?: Column[];
  /** on/off state for switches, checkboxes and tags */
  checked?: boolean;
  /** the control renders in its disabled state */
  disabled?: boolean;
  /** 0..100 for sliders and determinate progress; undefined = indeterminate.
   *  For tabs, lists and trees it is the index of the selected row instead. */
  value?: number;
  /** a Progress drawn as a ProgressCircle */
  circle?: boolean;
  /** a Sidebar or Sheet collapsed to icon width */
  collapsed?: boolean;
  /** which edge a Sheet or a Resizable's fixed pane sits on */
  side?: Side;
  /** the window controls a title bar draws */
  controls?: Controls;
  /** free text the author writes about what this part does */
  note?: string;
  /** what `note` said before the AI rewrote it, so the rewrite can be undone */
  noteHistory?: string[];
  bold?: boolean;
  /** height for free-form containers */
  size2?: number;
  /** palette token used as background (panels, list rows) */
  fill?: ColorToken;
  /** data URL of a user-picked image */
  src?: string;
  /** click navigation to another window */
  action?: Action;
  /** per-slot click navigation: "icon" / "icon2" on a title bar, "tab:N" on a
   *  sidebar, tab bar, toolbar, menu or list */
  actions?: Record<string, Action>;
  /** the keybinding the prompt asks for, e.g. "cmd-s" */
  shortcut?: string;
  /** the verb on a dialog's commit button; the guides want it named */
  confirm?: string;
  /** the look a toggle button takes once clicked; undefined = not a toggle */
  toggle?: ToggleLook;
};

export type Side = "left" | "right" | "top" | "bottom";
export const SIDES: { key: Side; icon: string }[] = [
  { key: "left", icon: "panel-left" },
  { key: "right", icon: "panel-right" },
  { key: "top", icon: "panel-bottom-open" },
  { key: "bottom", icon: "panel-bottom" },
];

export type Controls = "mac" | "windows" | "none";
export const CONTROLS: { key: Controls; label: string }[] = [
  { key: "mac", label: "macOS" },
  { key: "windows", label: "Windows" },
  { key: "none", label: "None" },
];

export type ToggleLook = { icon?: string | null; variant?: Variant; label?: string };

/** kinds that can be turned into a two-state toggle */
export const TOGGLEABLE: Kind[] = ["button", "iconButton"];

export const BACK_TARGET = "back";

/** the shells the Design Guides name; the prompt states the chosen one first */
export type Shell = "single" | "sidebar" | "masterDetail" | "document" | "utility";
export const SHELLS: { key: Shell; icon: string }[] = [
  { key: "single", icon: "frame" },
  { key: "sidebar", icon: "panel-left" },
  { key: "masterDetail", icon: "panel-right-open" },
  { key: "document", icon: "gallery-vertical-end" },
  { key: "utility", icon: "window-restore" },
];
export const DEFAULT_SHELL: Shell = "sidebar";
export const isShell = (v: unknown): v is Shell => SHELLS.some((s) => s.key === v);

export const SLIDE_SPEC: Partial<Record<Transition, { axis: "x" | "y"; enter: number; exit: number }>> = {
  slide: { axis: "x", enter: 1, exit: -0.25 },
  slideLeft: { axis: "x", enter: -1, exit: 0.25 },
  slideUp: { axis: "y", enter: 1, exit: -0.25 },
  slideDown: { axis: "y", enter: -1, exit: 0.25 },
};

export type Transition = "slide" | "slideLeft" | "slideUp" | "slideDown" | "fade" | "expand" | "none";
export type Action = { to: string; transition: Transition };

/** Desktop views replace one another; they do not slide in from an edge the way
 *  a phone screen does, so only the transitions a desktop app really uses are
 *  offered. The wider union stays so an older project still opens. */
export const TRANSITIONS: { key: Transition; label: string; icon: string }[] = [
  { key: "none", label: "None", icon: "replace" },
  { key: "fade", label: "Fade", icon: "eye" },
  { key: "expand", label: "Expand", icon: "maximize" },
];

export function actionSlotsOf(it: Item): IconSlot[] {
  if (it.kind === "titleBar")
    return [
      { key: "icon", label: t("leading"), value: it.icon },
      { key: "icon2", label: t("trailing"), value: it.icon2 ?? null },
    ];
  if (KIND_SPEC[it.kind].hasTabs)
    return (it.tabs ?? []).map((tab, i) => ({ key: `tab:${i}`, label: tab.label || `${i + 1}`, value: tab.icon || null }));
  return [];
}

export const toggleIcon = (it: Item): string | null => (it.toggle && it.toggle.icon !== undefined ? it.toggle.icon : it.icon);

export function collapseFree(g: Group, widths: Record<string, number>): Group {
  const placed = layoutOf(g, widths);
  const pos: Record<string, { x: number; y: number }> = {};
  for (const pl of placed) pos[pl.item.id] = { x: pl.x - g.x, y: pl.y - g.y };
  return { ...g, free: true, pos };
}

export function actionsOf(it: Item): { slot: string; action: Action }[] {
  const out: { slot: string; action: Action }[] = [];
  if (it.action) out.push({ slot: "self", action: it.action });
  for (const [slot, action] of Object.entries(it.actions ?? {})) {
    if (action) out.push({ slot, action });
  }
  return out;
}

/** kinds whose own body is clickable, so they can carry a navigation target */
export const TAPPABLE: Kind[] = ["button", "iconButton", "tag", "text", "icon", "image", "label"];

/** palette roles a user may pick as a background */
export type ColorToken =
  | "background"
  | "muted"
  | "accent"
  | "secondary"
  | "sidebar"
  | "groupBox"
  | "popover"
  | "titleBar"
  | "statusBar"
  | "tabBar"
  | "list"
  | "primary";

export const COLOR_TOKENS: { key: ColorToken; label: string }[] = [
  { key: "background", label: "background" },
  { key: "muted", label: "muted" },
  { key: "accent", label: "accent" },
  { key: "secondary", label: "secondary" },
  { key: "sidebar", label: "sidebar" },
  { key: "groupBox", label: "group_box" },
  { key: "popover", label: "popover" },
  { key: "titleBar", label: "title_bar" },
  { key: "statusBar", label: "status_bar" },
  { key: "tabBar", label: "tab_bar" },
  { key: "list", label: "list" },
  { key: "primary", label: "primary" },
];

/** readable foreground for a chosen background token */
export function onToken(tok: ColorToken, p: Palette): string {
  switch (tok) {
    case "primary":
      return p.primaryForeground;
    case "secondary":
      return p.secondaryForeground;
    case "accent":
      return p.accentForeground;
    case "sidebar":
      return p.sidebarForeground;
    case "groupBox":
      return p.groupBoxForeground;
    case "popover":
      return p.popoverForeground;
    case "muted":
      return p.mutedForeground;
    default:
      return p.foreground;
  }
}

export type Frame = {
  id: string;
  name: string;
  x: number;
  y: number;
  /** the window's own size; older projects fall back to the default */
  w?: number;
  h?: number;
  /** the shell this window uses, which the prompt states before the parts */
  shell?: Shell;
  bg?: ColorToken;
  /** what this window is for, in the author's words; goes into the prompt */
  note?: string;
  /** what `note` said before the AI rewrote it */
  noteHistory?: string[];
};

export const frameW = (f: Frame) => f.w ?? WINDOW_W;
export const frameH = (f: Frame) => f.h ?? WINDOW_H;
export const frameRect = (f: Frame) => ({ l: f.x, t: f.y, r: f.x + frameW(f), b: f.y + frameH(f) });

/** the window edge a part owns, when it is a region of the shell rather than content */
export const regionOf = (kind: Kind) => KIND_SPEC[kind].region;

/* Whether a part's `size` / `size2` is a width or a height is asked of `sizeOf`
 * itself rather than kept as a list here, so the answer can never drift from it:
 * nudge the number and see which extent moves. An icon button's square moves both,
 * a text size moves only the height, and a sheet opening from the top carries its
 * width in `size2`. */
const probe = (it: Item, key: "size" | "size2", widths: Record<string, number>) => {
  const cur = key === "size" ? (it.size ?? KIND_SPEC[it.kind].defSize ?? KIND_SPEC[it.kind].w) : (it.size2 ?? KIND_SPEC[it.kind].h);
  const a = sizeOf({ ...it, [key]: cur }, widths);
  const b = sizeOf({ ...it, [key]: cur + 8 }, widths);
  return { cur, isWidth: b.w !== a.w && b.h === a.h, isHeight: b.h !== a.h && b.w === a.w };
};

/** A part carried from one window size to another: a part that owns the top or
 *  bottom edge takes the new width, a part sized to the old window or content width
 *  takes the new one, one that shared a row keeps sharing it, and a panel as tall as
 *  the old window — or as the old window below its title bar — takes the new height.
 *  Nothing ends up wider than the new content area or taller than the new window. */
export function carryItemSize(it: Item, from: { w: number; h: number }, to: { w: number; h: number }, widths: Record<string, number>): Item {
  const region = regionOf(it.kind);
  const patch: Partial<Item> = {};

  const w = probe(it, "size", widths);
  if (w.isWidth) {
    if (region === "top" || region === "bottom") {
      /* a bar the author narrowed on purpose stays narrow; one that spanned the window still does */
      if (w.cur === from.w || w.cur > to.w) patch.size = to.w;
    } else if (w.cur === from.w) patch.size = to.w;
    else if (w.cur === contentWidth(from.w)) patch.size = contentWidth(to.w);
    else if (w.cur === halfWidth(from.w)) patch.size = halfWidth(to.w);
    else if (w.cur > to.w) patch.size = to.w;
    else if (w.cur > contentWidth(to.w)) patch.size = contentWidth(to.w);
  }

  const h = probe(it, "size2", widths);
  if (h.isHeight) {
    if (h.cur === from.h) patch.size2 = to.h;
    /* a sidebar or a sheet down an edge fills the window under the title bar */
    else if (h.cur === from.h - TITLE_BAR_H) patch.size2 = to.h - TITLE_BAR_H;
    else if (h.cur > to.h) patch.size2 = to.h;
  } else if (h.isWidth) {
    /* a sheet opening from the top or bottom spans the window's width in `size2` */
    if (h.cur === from.w || h.cur > to.w) patch.size2 = to.w;
  }

  return Object.keys(patch).length ? { ...it, ...patch } : it;
}

export type Placed = { item: Item; index: number; x: number; y: number; w: number; h: number };

/** where each part of a run sits in world space: a connected run lays its parts
 *  out along its axis, a free group keeps the offsets it was grouped with */
export function layoutOf(g: Group, widths: Record<string, number>): Placed[] {
  if (g.free) {
    return g.items.map((item, index) => {
      const { w, h } = sizeOf(item, widths);
      const at = g.pos?.[item.id] ?? { x: 0, y: 0 };
      return { item, index, x: g.x + at.x, y: g.y + at.y, w, h };
    });
  }
  let x = g.x;
  let y = g.y;
  return g.items.map((item, index) => {
    const { w, h } = sizeOf(item, widths);
    const at = { item, index, x, y, w, h };
    if (g.axis === "x") x += w + GAP;
    else y += h + GAP;
    return at;
  });
}

export function groupBounds(g: Group, widths: Record<string, number>) {
  const placed = layoutOf(g, widths);
  if (placed.length === 0) return { l: g.x, t: g.y, r: g.x, b: g.y, w: 0, h: 0 };
  const l = Math.min(...placed.map((p) => p.x));
  const t = Math.min(...placed.map((p) => p.y));
  const r = Math.max(...placed.map((p) => p.x + p.w));
  const b = Math.max(...placed.map((p) => p.y + p.h));
  return { l, t, r, b, w: r - l, h: b - t };
}

export function explodeGroup(g: Group, widths: Record<string, number>): Group[] {
  return layoutOf(g, widths).map((pl) => ({
    id: uid(),
    x: pl.x,
    y: pl.y,
    axis: g.axis,
    items: [pl.item],
  }));
}

export function runCorners(axis: Axis, first: boolean, last: boolean, outer: number, inner: number): Radii {
  const s = first ? outer : inner;
  const e = last ? outer : inner;
  if (axis === "x") return { tl: s, bl: s, tr: e, br: e };
  return { tl: s, tr: s, bl: e, br: e };
}

export function freeRadii(g: Group, widths: Record<string, number>): Map<string, Radii> {
  const out = new Map<string, Radii>();
  for (const pl of layoutOf(g, widths)) out.set(pl.item.id, baseRadii(pl.item));
  return out;
}

export function frameOfGroup(g: Group, frames: Frame[], widths: Record<string, number>): Frame | undefined {
  const b = groupBounds(g, widths);
  const cx = (b.l + b.r) / 2;
  const cy = (b.t + b.b) / 2;
  return frames.find((f) => {
    const r = frameRect(f);
    return cx >= r.l && cx <= r.r && cy >= r.t && cy <= r.b;
  });
}

export const groupsInFrame = (groups: Group[], f: Frame, frames: Frame[], widths: Record<string, number>) =>
  groups.filter((g) => frameOfGroup(g, frames, widths)?.id === f.id);

export type Group = {
  id: string;
  x: number;
  y: number;
  axis: Axis;
  items: Item[];
  /** a hand-made group: parts keep their own offsets (in `pos`) and move as one layer */
  free?: boolean;
  pos?: Record<string, { x: number; y: number }>;
  /** groups nested inside this one, the way a GPUI element nests children;
   *  their x/y are relative to this group's origin, so they move with it */
  children?: Group[];
};

/** a group whose first part is a container kind can parent other groups */
export const isContainerGroup = (g: Group) => !!g.items[0] && !!KIND_SPEC[g.items[0].kind]?.container;

export type GroupVisit = {
  group: Group;
  /** the group whose `children` holds this one; undefined at the top level */
  parent?: Group;
  /** this group's origin in world space: its own x/y plus every ancestor's */
  wx: number;
  wy: number;
};

/** depth-first walk of the group tree, in paint order */
export function visitGroups(groups: Group[], fn: (v: GroupVisit) => void, parent?: Group, ox = 0, oy = 0) {
  for (const g of groups) {
    const wx = ox + g.x;
    const wy = oy + g.y;
    fn({ group: g, parent, wx, wy });
    if (g.children) visitGroups(g.children, fn, g, wx, wy);
  }
}

/** every group in the tree as a flat visit list */
export const flattenGroups = (groups: Group[]): GroupVisit[] => {
  const out: GroupVisit[] = [];
  visitGroups(groups, (v) => out.push(v));
  return out;
};

/** the group with this id, anywhere in the tree, and its parent */
export function findGroup(groups: Group[], id: string): GroupVisit | undefined {
  let hit: GroupVisit | undefined;
  visitGroups(groups, (v) => {
    if (v.group.id === id) hit = v;
  });
  return hit;
}

/** detaches the group with this id from wherever it sits in the tree */
export function removeGroup(groups: Group[], id: string): Group | undefined {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].id === id) return groups.splice(i, 1)[0];
  }
  for (const g of groups) {
    if (g.children) {
      const hit = removeGroup(g.children, id);
      if (hit) {
        if (g.children.length === 0) delete g.children;
        return hit;
      }
    }
  }
  return undefined;
}

/** nests `child` inside `parent`; `wx`/`wy` are the child's world-space origin,
 *  stored relative to the parent's origin so it rides along with the parent */
export function insertChild(parent: Group, child: Group, wx: number, wy: number, pwx: number, pwy: number) {
  child.x = wx - pwx;
  child.y = wy - pwy;
  (parent.children ??= []).push(child);
}

/** applies `fn` to every group in the tree, returning a new tree. A null result
 *  drops the group and hoists its children to the parent level, their origins
 *  re-based so they stay where they were on the canvas. Children are normally
 *  owned by the recursion, but when `fn` hands back a different `children`
 *  reference (appending a nested group, reordering them) that rewrite wins. */
export function mapGroups(groups: Group[], fn: (g: Group) => Group | null): Group[] {
  const out: Group[] = [];
  for (const g of groups) {
    const mapped = fn(g);
    if (!mapped) {
      if (g.children) {
        const hoisted = mapGroups(g.children, fn);
        out.push(...hoisted.map((c) => ({ ...c, x: c.x + g.x, y: c.y + g.y })));
      }
      continue;
    }
    const next = { ...mapped };
    if (mapped.children !== g.children) {
      if (!next.children?.length) delete next.children;
    } else if (g.children) {
      const children = mapGroups(g.children, fn);
      if (children.length) next.children = children;
      else delete next.children;
    } else {
      delete next.children;
    }
    out.push(next);
  }
  return out;
}

/** swaps the group with this id for zero or more groups in the same slot,
 *  at whatever level of the tree it sits */
export function replaceGroup(groups: Group[], id: string, next: Group[]): Group[] {
  const out: Group[] = [];
  for (const g of groups) {
    if (g.id === id) {
      out.push(...next);
      continue;
    }
    out.push(g.children ? { ...g, children: replaceGroup(g.children, id, next) } : g);
  }
  return out;
}

/** a deep copy with fresh ids everywhere: items, children, and the pos map */
export function cloneGroup(g: Group, dx = 0, dy = 0): Group {
  const idMap = new Map(g.items.map((it) => [it.id, uid()]));
  const pos = g.pos
    ? Object.fromEntries(Object.entries(g.pos).map(([id, o]) => [idMap.get(id) ?? id, { ...o }]))
    : undefined;
  return {
    ...g,
    id: uid(),
    x: g.x + dx,
    y: g.y + dy,
    pos,
    items: g.items.map((it) => ({ ...it, id: idMap.get(it.id)!, tabs: it.tabs?.map((t) => ({ ...t })) })),
    children: g.children?.map((c) => cloneGroup(c)),
  };
}

/** bounds of a group including everything nested inside it; `wx`/`wy` is the
 *  group's own world-space origin */
export function subtreeBounds(g: Group, widths: Record<string, number>, wx = g.x, wy = g.y) {
  const own = groupBounds({ ...g, x: wx, y: wy }, widths);
  let { l, t, r, b } = own;
  for (const c of g.children ?? []) {
    const cb = subtreeBounds(c, widths, wx + c.x, wy + c.y);
    l = Math.min(l, cb.l);
    t = Math.min(t, cb.t);
    r = Math.max(r, cb.r);
    b = Math.max(b, cb.b);
  }
  return { l, t, r, b, w: r - l, h: b - t };
}

export type FrameMode = "blank" | "window";

export type Doc = {
  groups: Group[];
  frames: Frame[];
  paletteKey: string;
  /** the author's own scheme, used when paletteKey is "custom" */
  customPalette?: Palette;
  frame: FrameMode;
  title: string;
  brief: string;
  /** the prompt as the author rewrote it by hand; undefined means the generated one */
  promptEdit?: string;
  /** radius, type, density, motion and the light / dark switch */
  theme?: Theme;
  /** the language the built-in defaults in this document were written in, so
   *  starter content can follow the interface while the author's text stays */
  lang?: Lang;
};

/* ---------- reading starter content back in another language ---------- */

/** `it` with every string that is still a built-in default read in `to`.
 *  Anything the author typed does not match a default, so it is left alone. */
export function localizeItem(it: Item, to: Lang): Item {
  /* a kind's own default wins over the flat table, which cannot choose between
   * two kinds whose defaults happen to be spelled the same */
  const text = (field: "label" | "supporting", value: string) =>
    translateKindText(it.kind, field, value, to) ?? translateDefault(value, to);
  const next: Item = { ...it, label: text("label", it.label) };
  if (it.supporting !== undefined) next.supporting = text("supporting", it.supporting);
  if (it.confirm !== undefined) next.confirm = translateDefault(it.confirm, to);
  if (it.tabs) next.tabs = it.tabs.map((tab) => ({ ...tab, label: translateDefault(tab.label, to) }));
  if (it.columns) next.columns = it.columns.map((c) => ({ ...c, label: translateDefault(c.label, to) }));
  if (it.toggle?.label !== undefined) next.toggle = { ...it.toggle, label: translateDefault(it.toggle.label, to) };
  return next;
}

export const localizeGroups = (groups: Group[], to: Lang): Group[] =>
  groups.map((g) => ({
    ...g,
    items: g.items.map((it) => localizeItem(it, to)),
    children: g.children ? localizeGroups(g.children, to) : undefined,
  }));

export const localizeFrames = (frames: Frame[], to: Lang): Frame[] =>
  frames.map((f) => ({ ...f, name: translateFrameName(f.name, to) }));

export const defaultTabs = (): NavTab[] => SIDEBAR_ITEMS[getLang()].map((x) => ({ ...x }));

const TOOLBAR_ICONS = ["undo", "redo", "copy", "search", "settings-2", "ellipsis"];
const BUTTON_GROUP_LABELS = ["Day", "Week", "Month"];
/** a settings page's rows reuse the sidebar's own wording */
const SETTING_ROWS: Record<string, string[]> = {
  ja: ["通知", "自動保存", "テーマ"],
  en: ["Notifications", "Autosave", "Theme"],
  zh: ["通知", "自动保存", "主题"],
};
const SELECT_OPTIONS = ["Small", "Medium", "Large"];

/** the entries a kind starts with, also used to fill in rows the author adds */
export function defaultTabsFor(kind: Kind): NavTab[] {
  const lang = getLang();
  switch (kind) {
    case "tabs":
      return TAB_LABELS[lang].map((label) => ({ icon: "", label }));
    case "menu":
      return MENU_ITEMS[lang].map((x) => ({ ...x }));
    case "toolbar":
      return TOOLBAR_ICONS.map((icon) => ({ icon, label: "" }));
    case "breadcrumb":
      return BREADCRUMB_TRAIL[lang].map((label) => ({ icon: "", label }));
    case "list":
      return LIST_ROWS[lang].map((x) => ({ ...x }));
    case "tree":
      return TREE_NODES[lang].map((x) => ({ icon: x.icon, label: `${"  ".repeat(x.depth)}${x.label}` }));
    case "dataTable":
      return TABLE_ROWS[lang].map((label) => ({ icon: "", label }));
    case "buttonGroup":
      return BUTTON_GROUP_LABELS.map((label) => ({ icon: "", label }));
    case "combobox":
      return SELECT_OPTIONS.map((label) => ({ icon: "", label }));
    case "form":
      return FORM_FIELDS[lang].map((label) => ({ icon: "", label }));
    case "settings":
      return SETTING_ROWS[lang].map((label) => ({ icon: "", label }));
    case "descriptionList":
      return DESCRIPTION_ITEMS[lang].map((label) => ({ icon: "", label }));
    case "accordion":
    case "stepper":
    case "dock":
      return TAB_LABELS[lang].map((label) => ({ icon: "", label }));
    case "command":
      return MENU_ITEMS[lang].map((x) => ({ ...x }));
    case "chart":
      return CHART_SERIES[lang].map((label) => ({ icon: "", label }));
    case "messageScroller":
      return LIST_ROWS[lang].map((x) => ({ icon: "", label: x.label }));
    case "select":
      return SELECT_OPTIONS.map((label) => ({ icon: "", label }));
    case "radio":
      return SELECT_OPTIONS.map((label) => ({ icon: "", label }));
    default:
      return defaultTabs();
  }
}

/** a data table's rows are one cell per column, joined by `ROW_SEP` so one
 *  NavTab can carry a whole row without a second shape in the document */
export const ROW_SEP = "\t";

export function defaultColumnsFor(kind: Kind): Column[] {
  if (kind !== "dataTable") return [];
  return TABLE_COLUMNS[getLang()].map((c) => ({ ...c }));
}

export function makeItem(kind: Kind): Item {
  const s = KIND_SPEC[kind];
  const text = KIND_TEXT[getLang()][kind];
  const it: Item = {
    id: uid(),
    kind,
    label: text?.label ?? s.defLabel,
    icon: s.defIcon,
    variant: s.defVariant ?? "default",
  };
  if (s.defSupporting !== undefined) it.supporting = text?.supporting ?? s.defSupporting;
  if (s.defIcon2 !== undefined) it.icon2 = s.defIcon2;
  if (s.defSize !== undefined) it.size = s.defSize;
  if (s.hasChecked) it.checked = kind !== "tag";
  if (s.hasTabs) it.tabs = defaultTabsFor(kind);
  if (s.hasColumns) it.columns = defaultColumnsFor(kind);
  if (s.hasControls) it.controls = "mac";
  if (kind === "dialog") it.confirm = t("deleteVerb");
  if (s.hasSide)
    it.side = kind === "sheet" || kind === "scrollbar" || kind === "bubble" ? "right" : "left";
  switch (kind) {
    case "panel":
      it.size2 = 200;
      it.radiusTop = R;
      it.radiusBottom = R;
      it.fill = "muted";
      break;
    case "groupBox":
      it.size2 = 160;
      break;
    case "textarea":
      it.size2 = 84;
      break;
    case "resizable":
      it.size2 = 260;
      it.value = 30;
      break;
    case "sheet":
      it.size2 = WINDOW_H - TITLE_BAR_H;
      break;
    case "image":
      it.size2 = 200;
      break;
    case "skeleton":
      it.size2 = 16;
      break;
    case "slider":
      it.value = 40;
      break;
    case "progress":
      it.value = 60;
      break;
    case "tabs":
    case "radio":
    case "accordion":
    case "stepper":
    case "dock":
    case "command":
      it.value = 0;
      break;
    case "rating":
    case "calendar":
      it.value = 4;
      break;
    case "pagination":
      it.value = 1;
      break;
    case "scrollbar":
      it.value = 20;
      it.size2 = 200;
      break;
    case "chart":
      it.value = 0;
      it.size2 = 220;
      break;
    case "messageScroller":
      it.size2 = 240;
      break;
    case "list":
      it.value = 0;
      it.size2 = 8 + (it.tabs?.length ?? 0) * LIST_ROW_H;
      break;
    case "tree":
      it.value = 0;
      it.size2 = 8 + (it.tabs?.length ?? 0) * TREE_ROW_H;
      break;
    case "dataTable":
      it.size2 = TABLE_ROW_H * ((it.tabs?.length ?? 0) + 1) + 1;
      break;
    case "toolbar":
      it.tabs = defaultTabsFor(kind).slice(0, 4);
      break;
    case "sidebar":
      it.size2 = WINDOW_H - TITLE_BAR_H;
      break;
  }
  return it;
}

/** Content-sized kinds are measured in the DOM; the rest derive from spec + size. */
export const MEASURED: Kind[] = [
  "button",
  "checkbox",
  "switch",
  "text",
  "label",
  "badge",
  "tag",
  "breadcrumb",
  "buttonGroup",
  "kbd",
  "link",
  "marker",
  "shimmer",
  "tooltip",
  "rating",
  "clipboard",
];

/** the row heights the added data views resolve to */
export const SETTING_ROW_H = 40;
export const ACCORDION_ROW_H = 36;
export const DESCRIPTION_ROW_H = 28;
export const STEP_DOT = 20;

/** the rows a data table draws, split into cells */
export const tableRowsOf = (it: Item): string[][] => (it.tabs ?? []).map((r) => r.label.split(ROW_SEP));

/** a toolbar hugs its icon buttons: 32px each with 4px between, 4px at the ends */
export const toolbarWidth = (it: Item) => {
  const n = Math.max(1, it.tabs?.length ?? 0);
  return 8 + n * H + (n - 1) * 4;
};

/** the row a part has selected, or null when it has none */
const selectedIndexOf = (it: Item) => (typeof it.value === "number" && it.value >= 0 ? it.value : null);

export function sizeOf(it: Item, widths: Record<string, number>) {
  const s = KIND_SPEC[it.kind];
  const n = it.size ?? s.defSize ?? s.w;
  const rows = it.tabs?.length ?? 0;
  const hasSupporting = !!it.supporting?.trim();
  switch (it.kind) {
    case "button":
    case "checkbox":
    case "switch":
    case "label":
    case "tag":
    case "breadcrumb":
    case "buttonGroup":
    case "kbd":
    case "link":
    case "marker":
    case "shimmer":
    case "tooltip":
    case "clipboard":
    case "rating":
      return { w: widths[it.id] ?? 96, h: s.h };
    case "badge":
      return { w: widths[it.id] ?? 16, h: it.label.trim() ? s.h : 8 };
    case "text":
      return { w: widths[it.id] ?? 120, h: Math.round(n * 1.4) };
    case "toolbar":
      return { w: toolbarWidth(it), h: s.h };
    case "titleBar":
    case "statusBar":
      return { w: n, h: s.h };
    case "iconButton":
    case "spinner":
      return { w: n, h: n };
    case "icon":
      return { w: n, h: n };
    case "sidebar":
      return { w: it.collapsed ? SIDEBAR_COLLAPSED_W : n, h: it.size2 ?? s.h };
    case "sheet":
      return it.side === "top" || it.side === "bottom" ? { w: it.size2 ?? WINDOW_W, h: n } : { w: n, h: it.size2 ?? s.h };
    case "menu":
      return { w: n, h: 8 + rows * MENU_ROW_H };
    case "list":
      return { w: n, h: it.size2 ?? 8 + rows * LIST_ROW_H };
    case "tree":
      return { w: n, h: it.size2 ?? 8 + rows * TREE_ROW_H };
    case "dataTable":
      return { w: n, h: it.size2 ?? TABLE_ROW_H * (rows + 1) + 1 };
    case "radio":
      return { w: n, h: rows * 24 + Math.max(0, rows - 1) * 4 };
    case "dialog":
      return { w: n, h: 16 + 22 + (hasSupporting ? 8 + 20 : 0) + 12 + H + 16 };
    case "popover":
    case "notification":
    case "hoverCard":
      return { w: n, h: 12 + 20 + (hasSupporting ? 4 + 18 : 0) + 12 };
    case "form":
      /* a label above each field, on the md step between rows */
      return { w: n, h: rows * (18 + 4 + H) + Math.max(0, rows - 1) * 12 };
    case "settings":
      return { w: n, h: 8 + 20 + rows * SETTING_ROW_H + 8 };
    case "descriptionList":
      return { w: n, h: rows * DESCRIPTION_ROW_H + 8 };
    case "accordion":
      /* the open section shows a body; the rest are just their headers */
      return { w: n, h: rows * ACCORDION_ROW_H + (selectedIndexOf(it) === null ? 0 : 44) };
    case "collapsible":
      return { w: n, h: H + (it.checked && hasSupporting ? 8 + 20 : 0) };
    case "command":
      return { w: n, h: 40 + 1 + rows * MENU_ROW_H + 8 };
    case "message":
      return { w: n, h: 12 + 18 + 4 + 20 + 12 };
    case "bubble":
      return { w: n, h: 8 + 20 + 8 };
    case "messageScroller":
      /* a scroller is a free-form box: the author sets both extents */
      return { w: n, h: it.size2 ?? s.h };
    case "chart":
      return { w: n, h: it.size2 ?? s.h };
    case "dock":
      return { w: n, h: it.size2 ?? s.h };
    case "scrollbar":
      return { w: 8, h: it.size2 ?? s.h };
    case "calendar":
      return { w: n, h: s.h };
    case "attachment":
      return { w: n, h: s.h };
    case "avatar":
      return { w: n, h: n };
    case "combobox":
    case "colorPicker":
    case "datePicker":
    case "pagination":
      return { w: n, h: s.h };
    case "stepper":
      return { w: n, h: s.h };
    case "alert":
      return { w: n, h: 12 + 20 + (hasSupporting ? 4 + 18 : 0) + 12 };
    case "progress":
      return it.circle ? { w: 32, h: 32 } : { w: n, h: s.h };
    case "input":
      return { w: n, h: s.h + (hasSupporting ? 18 : 0) };
    case "textarea":
      return { w: n, h: (it.size2 ?? s.h) + (hasSupporting ? 18 : 0) };
    case "select":
    case "slider":
    case "separator":
    case "tabs":
      return { w: n, h: s.h };
    case "panel":
    case "groupBox":
    case "resizable":
    case "image":
    case "skeleton":
      return { w: n, h: it.size2 ?? s.h };
    default:
      return { w: s.w, h: s.h };
  }
}

/** Corners for a part that is not part of a connected run. Defaults follow the
 *  document's radius scale; a radius the author typed in is kept as is. */
export function baseRadii(it: Item): Radii {
  const s = KIND_SPEC[it.kind];
  switch (it.kind) {
    case "panel":
    case "titleBar":
    case "statusBar":
    case "sidebar":
    case "sheet": {
      const top = it.radiusTop ?? 0;
      const bottom = it.radiusBottom ?? 0;
      return { tl: top, tr: top, bl: bottom, br: bottom };
    }
    case "spinner":
    case "progress":
      return uniformRadii(R_FULL);
    case "image":
      return uniformRadii(it.radiusTop ?? scaleR(s.radius));
    case "badge":
    case "switch":
    case "slider":
    case "radio":
    case "avatar":
    case "scrollbar":
    case "marker":
      return uniformRadii(s.radius);
    default:
      return uniformRadii(scaleR(s.radius));
  }
}

export const connectSpecOf = (it: Item): ConnectSpec | undefined => {
  const c = KIND_SPEC[it.kind].connect;
  return c && { ...c, outer: scaleR(c.outer), inner: scaleR(c.inner) };
};
export const connectable = (it: Item) => !!KIND_SPEC[it.kind].connect;
/** two parts fuse when they share an axis and a family (buttons and icon buttons mix) */
export const canJoin = (a: Item, b: Item) => {
  const sa = connectSpecOf(a);
  const sb = connectSpecOf(b);
  return !!sa && !!sb && sa.axis === sb.axis && sa.family === sb.family;
};

/* ---------- icon slots ---------- */
export type IconSlot = { key: string; label: string; value: string | null };

export function iconSlotsOf(it: Item): IconSlot[] {
  switch (it.kind) {
    case "titleBar":
    case "statusBar":
      return [
        { key: "icon", label: t("leading"), value: it.icon },
        { key: "icon2", label: t("trailing"), value: it.icon2 ?? null },
      ];
    case "toolbar":
    case "sidebar":
    case "menu":
    case "list":
    case "tree":
      return (it.tabs ?? []).map((tab, i) => ({
        key: `tab:${i}`,
        label: tab.label || `${i + 1}`,
        value: tab.icon || null,
      }));
    default:
      return KIND_SPEC[it.kind].hasIcon ? [{ key: "icon", label: t("icon"), value: it.icon }] : [];
  }
}

export function setIconSlot(it: Item, key: string, v: string | null): Partial<Item> {
  if (key === "icon") return { icon: v };
  if (key === "icon2") return { icon2: v };
  if (key === "toggle") return { toggle: { ...(it.toggle ?? {}), icon: v } };
  if (key.startsWith("tab:")) {
    const i = Number(key.slice(4));
    const tabs = (it.tabs ?? []).map((tab, j) => (j === i ? { ...tab, icon: v ?? "" } : tab));
    return { tabs };
  }
  return {};
}
