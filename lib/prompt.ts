import { KIND_TEXT, Lang, TRANSITION_TEXT, getLang } from "./i18n";
import {
  Action,
  BACK_TARGET,
  Column,
  Density,
  Doc,
  FONTS,
  Frame,
  Group,
  Item,
  Kind,
  KIND_SPEC,
  Palette,
  RADII,
  Shell,
  DEFAULT_SHELL,
  Theme,
  TOKEN_NAMES,
  Variant,
  WINDOW_H,
  WINDOW_W,
  explodeGroup,
  frameH,
  frameOfGroup,
  frameW,
  groupBounds,
  normalizeTheme,
  paletteOf,
  tableRowsOf,
} from "./tokens";
import { iconVariant } from "./kit-icons.gen";

const VARIANT_TEXT: Record<Lang, Record<Variant, string>> = {
  ja: {
    default: "標準",
    primary: "プライマリ",
    secondary: "セカンダリ",
    outline: "アウトライン",
    ghost: "ゴースト",
    link: "リンク",
    danger: "デンジャー",
    warning: "ウォーニング",
    success: "サクセス",
    info: "インフォ",
  },
  en: {
    default: "default",
    primary: "primary",
    secondary: "secondary",
    outline: "outline",
    ghost: "ghost",
    link: "link",
    danger: "danger",
    warning: "warning",
    success: "success",
    info: "info",
  },
  zh: {
    default: "默认",
    primary: "主要",
    secondary: "次要",
    outline: "描边",
    ghost: "幽灵",
    link: "链接",
    danger: "危险",
    warning: "警告",
    success: "成功",
    info: "信息",
  },
};

const DENSITY_SIZE: Record<Density, string> = { compact: "Size::Small", default: "Size::Medium", comfortable: "Size::Large" };

const hasText = (s?: string | null) => !!s && s.trim().length > 0;
const qj = (s: string) => `「${s.trim()}」`;
const qe = (s: string) => `"${s.trim()}"`;
const qz = (s: string) => `“${s.trim()}”`;
const quote = (lang: Lang) => (lang === "ja" ? qj : lang === "zh" ? qz : qe);
const trimEnd = (s: string) => s.trim().replace(/[。.\s]+$/, "");

/** an icon as the `IconName` variant the generated code will use */
const ico = (name?: string | null) => (name ? `IconName::${iconVariant(name)}` : null);
/** the entries of a tabs / sidebar / menu / list part, as a readable list */
const labelsOf = (it: Item, lang: Lang) => {
  const q = quote(lang);
  const sep = lang === "en" ? ", " : "、";
  return (it.tabs ?? [])
    .map((tab) => {
      const label = tab.label.trim() ? q(tab.label.trim()) : lang === "en" ? "unlabeled" : lang === "zh" ? "无标签" : "ラベルなし";
      const icon = ico(tab.icon);
      return icon ? `${label} (${icon})` : label;
    })
    .join(sep);
};
const columnsText = (columns: Column[], lang: Lang) => {
  const q = quote(lang);
  const numeric = lang === "en" ? " (numeric, right-aligned)" : lang === "zh" ? "（数值，右对齐）" : "（数値・右寄せ）";
  return columns.map((c) => `${q(c.label)}${c.numeric ? numeric : ""}`).join(lang === "en" ? ", " : "、");
};
const selectedIndex = (it: Item) => (typeof it.value === "number" && it.value >= 0 ? it.value : null);
const selectedLabel = (it: Item, lang: Lang) => {
  const i = selectedIndex(it);
  const tab = i === null ? undefined : it.tabs?.[i];
  return tab?.label.trim() ? quote(lang)(tab.label.trim()) : null;
};

/* ================= single parts ================= */

function itemJa(it: Item): string {
  const q = qj;
  const v = VARIANT_TEXT.ja[it.variant];
  const noun = KIND_TEXT.ja[it.kind]?.noun ?? it.kind;
  const off = it.disabled ? "（無効状態）" : "";
  const sel = selectedLabel(it, "ja");
  switch (it.kind) {
    case "titleBar":
      return `タイトル${q(it.label)}のタイトルバー${it.controls === "windows" ? "（ウィンドウ操作ボタンは右）" : it.controls === "none" ? "（ウィンドウ操作ボタンなし）" : "（macOS 風に左へ信号機ボタン）"}${it.icon ? `。先頭に ${ico(it.icon)}` : ""}${it.icon2 ? `、末尾に ${ico(it.icon2)}` : ""}`;
    case "sidebar":
      return `見出し${q(it.label)}のサイドバー${it.collapsed ? "（アイコンだけの折りたたみ状態）" : `（幅 ${it.size ?? 255}px）`}。項目は ${labelsOf(it, "ja")}${sel ? `。${sel}が選択状態` : ""}`;
    case "toolbar":
      return `${(it.tabs ?? []).map((tab) => ico(tab.icon) ?? "空").join("・")} のゴーストボタンが並ぶツールバー`;
    case "statusBar":
      return `ステータスバー。左に${it.icon ? `${ico(it.icon)} と` : ""}${q(it.label)}${hasText(it.supporting) ? `、右に${q(it.supporting!)}` : ""}`;
    case "breadcrumb":
      return `${labelsOf(it, "ja")}のパンくずリスト（末尾が現在位置）`;
    case "button":
      return `${hasText(it.label) ? q(it.label) : "ラベルなし"}の${v}ボタン${it.icon ? `（${ico(it.icon)} 付き）` : ""}${off}`;
    case "iconButton":
      return `${ico(it.icon) ?? "空"} の${v}アイコンボタン${it.size && it.size !== 32 ? `（${it.size}px）` : ""}${off}`;
    case "buttonGroup":
      return `${labelsOf(it, "ja")}が連結した${v}のボタングループ${sel ? `（${sel}が選択状態）` : ""}`;
    case "menu":
      return `${labelsOf(it, "ja")}の項目を持つポップアップメニュー`;
    case "input":
      return `プレースホルダー${q(it.label)}の入力欄${it.icon ? `（先頭に ${ico(it.icon)}）` : ""}${hasText(it.supporting) ? `。補助テキストは${q(it.supporting!)}` : ""}${off}`;
    case "textarea":
      return `プレースホルダー${q(it.label)}の複数行入力（高さ ${it.size2 ?? 84}px）${hasText(it.supporting) ? `。補助テキストは${q(it.supporting!)}` : ""}${off}`;
    case "select":
      return `現在値${q(it.label)}のセレクト。選択肢は ${labelsOf(it, "ja")}${off}`;
    case "checkbox":
      return `${q(it.label)}のチェックボックス（初期状態は${it.checked ? "チェック済み" : "未チェック"}）${off}`;
    case "radio":
      return `${labelsOf(it, "ja")}のラジオグループ${sel ? `（${sel}が選択状態）` : ""}${off}`;
    case "switch":
      return `${q(it.label)}のスイッチ（初期状態は${it.checked ? "オン" : "オフ"}）${off}`;
    case "slider":
      return `${hasText(it.label) ? `${q(it.label)}の` : ""}スライダー（初期値 ${it.value ?? 40}%）${off}`;
    case "label":
      return `フォームラベル${q(it.label)}`;
    case "panel":
      return `${it.size ?? WINDOW_W}×${it.size2 ?? 200}px のパネル（背景 ${TOKEN_NAMES[it.fill ?? "muted"] ?? it.fill}、境界はヘアライン）`;
    case "groupBox":
      return `見出し${q(it.label)}のグループボックス（${it.size ?? 320}×${it.size2 ?? 160}px）${hasText(it.supporting) ? `。説明は${q(it.supporting!)}` : ""}`;
    case "tabs":
      return `${labelsOf(it, "ja")}の ${it.tabs?.length ?? 0} つのタブ${sel ? `（${sel}が選択状態）` : ""}`;
    case "resizable":
      return `${it.side === "top" || it.side === "bottom" ? "上下" : "左右"}に分かれたリサイズ可能な分割（${it.side}側のペインが ${it.value ?? 30}%、ドラッグで境界を動かせる）`;
    case "dialog":
      return `見出し${q(it.label)}のダイアログ${hasText(it.supporting) ? `、本文${q(it.supporting!)}` : ""}（キャンセルと${q(it.confirm || "OK")}の 2 ボタン。${q(it.confirm || "OK")}は${v}）`;
    case "sheet":
      return `${it.side} から開く見出し${q(it.label)}のシート（幅 ${it.size ?? 380}px、閉じるボタン付き）`;
    case "popover":
      return `見出し${q(it.label)}のポップオーバー${hasText(it.supporting) ? `、本文${q(it.supporting!)}` : ""}`;
    case "notification":
      return `${q(it.label)}の通知${hasText(it.supporting) ? `（本文${q(it.supporting!)}）` : ""}${it.icon ? `。${ico(it.icon)} アイコンは${v}色` : ""}`;
    case "list":
      return `${labelsOf(it, "ja")}の ${it.tabs?.length ?? 0} 行のリスト${sel ? `（${sel}が選択状態）` : ""}`;
    case "dataTable":
      return `列が ${columnsText(it.columns ?? [], "ja")} のデータテーブル（${tableRowsOf(it).length} 行のサンプル: ${tableRowsOf(it).map((r) => r.join(" / ")).join("、")}）`;
    case "tree":
      return `${(it.tabs ?? []).map((n) => q(n.label.trim())).join("、")}のツリー（先頭の空白 2 つで 1 段のネスト）`;
    case "text":
      return `${it.bold ? "太字の" : ""}テキスト${q(it.label)}（${it.size ?? 20}px）`;
    case "icon":
      return `${ico(it.icon) ?? "空"} のアイコン（${it.size ?? 16}px）`;
    case "image":
      return `${it.size ?? 200}×${it.size2 ?? 200}px の画像${it.src ? "（指定の画像を表示）" : "プレースホルダー"}`;
    case "divider":
      return "区切り線（ヘアライン）";
    case "badge":
      return hasText(it.label) ? `${q(it.label)}と表示する${v}バッジ` : `小さな点の${v}バッジ`;
    case "tag":
      return `${q(it.label)}の${v}タグ${it.checked ? "（閉じるボタン付き）" : ""}`;
    case "alert":
      return `${v}のアラート。見出し${q(it.label)}${hasText(it.supporting) ? `、本文${q(it.supporting!)}` : ""}${it.icon ? `、${ico(it.icon)} アイコン付き` : ""}`;
    case "progress":
      return `${it.circle ? "円形の" : ""}プログレス（${it.value === undefined ? "不確定" : `${it.value}%`}）`;
    case "spinner":
      return `スピナー（${it.size ?? 20}px）`;
    case "skeleton":
      return `${it.size ?? 200}×${it.size2 ?? 16}px のスケルトン`;
    default:
      return noun;
  }
}

function itemEn(it: Item): string {
  const q = qe;
  const v = VARIANT_TEXT.en[it.variant];
  const noun = KIND_TEXT.en[it.kind]?.noun ?? it.kind;
  const off = it.disabled ? ", disabled" : "";
  const sel = selectedLabel(it, "en");
  switch (it.kind) {
    case "titleBar":
      return `a title bar titled ${q(it.label)}${it.controls === "windows" ? " with the window controls on the right" : it.controls === "none" ? " with no window controls" : " with macOS traffic lights on the left"}${it.icon ? `, ${ico(it.icon)} leading` : ""}${it.icon2 ? `, ${ico(it.icon2)} trailing` : ""}`;
    case "sidebar":
      return `a sidebar headed ${q(it.label)}${it.collapsed ? ", collapsed to icon width" : `, ${it.size ?? 255}px wide`}, with the entries ${labelsOf(it, "en")}${sel ? `; ${sel} is selected` : ""}`;
    case "toolbar":
      return `a toolbar of ghost icon buttons: ${(it.tabs ?? []).map((tab) => ico(tab.icon) ?? "empty").join(", ")}`;
    case "statusBar":
      return `a status bar with ${it.icon ? `${ico(it.icon)} and ` : ""}${q(it.label)} leading${hasText(it.supporting) ? ` and ${q(it.supporting!)} trailing` : ""}`;
    case "breadcrumb":
      return `a breadcrumb: ${labelsOf(it, "en")} (the last crumb is the current place)`;
    case "button":
      return `a ${v} button labelled ${hasText(it.label) ? q(it.label) : "nothing"}${it.icon ? ` with ${ico(it.icon)}` : ""}${off}`;
    case "iconButton":
      return `a ${v} icon button showing ${ico(it.icon) ?? "no icon"}${it.size && it.size !== 32 ? ` at ${it.size}px` : ""}${off}`;
    case "buttonGroup":
      return `a ${v} button group of ${labelsOf(it, "en")}${sel ? `, with ${sel} selected` : ""}`;
    case "menu":
      return `a popup menu with the items ${labelsOf(it, "en")}`;
    case "input":
      return `an input placeholdered ${q(it.label)}${it.icon ? ` with a ${ico(it.icon)} prefix` : ""}${hasText(it.supporting) ? `, help text ${q(it.supporting!)}` : ""}${off}`;
    case "textarea":
      return `a textarea placeholdered ${q(it.label)}, ${it.size2 ?? 84}px tall${hasText(it.supporting) ? `, help text ${q(it.supporting!)}` : ""}${off}`;
    case "select":
      return `a select currently reading ${q(it.label)}, offering ${labelsOf(it, "en")}${off}`;
    case "checkbox":
      return `a checkbox labelled ${q(it.label)}, initially ${it.checked ? "checked" : "unchecked"}${off}`;
    case "radio":
      return `a radio group of ${labelsOf(it, "en")}${sel ? `, with ${sel} selected` : ""}${off}`;
    case "switch":
      return `a switch labelled ${q(it.label)}, initially ${it.checked ? "on" : "off"}${off}`;
    case "slider":
      return `a slider${hasText(it.label) ? ` labelled ${q(it.label)}` : ""} at ${it.value ?? 40}%${off}`;
    case "label":
      return `a form label reading ${q(it.label)}`;
    case "panel":
      return `a ${it.size ?? WINDOW_W}×${it.size2 ?? 200}px panel on ${TOKEN_NAMES[it.fill ?? "muted"] ?? it.fill} with a hairline boundary`;
    case "groupBox":
      return `a group box titled ${q(it.label)}, ${it.size ?? 320}×${it.size2 ?? 160}px${hasText(it.supporting) ? `, described as ${q(it.supporting!)}` : ""}`;
    case "tabs":
      return `${it.tabs?.length ?? 0} tabs: ${labelsOf(it, "en")}${sel ? `, with ${sel} selected` : ""}`;
    case "resizable":
      return `a ${it.side === "top" || it.side === "bottom" ? "vertical" : "horizontal"} resizable split whose ${it.side} pane starts at ${it.value ?? 30}% and can be dragged`;
    case "dialog":
      return `a dialog headed ${q(it.label)}${hasText(it.supporting) ? `, body ${q(it.supporting!)}` : ""}, with Cancel and a ${v} ${q(it.confirm || "OK")} button`;
    case "sheet":
      return `a sheet opening from the ${it.side}, headed ${q(it.label)}, ${it.size ?? 380}px wide, with a close affordance`;
    case "popover":
      return `a popover headed ${q(it.label)}${hasText(it.supporting) ? `, body ${q(it.supporting!)}` : ""}`;
    case "notification":
      return `a notification reading ${q(it.label)}${hasText(it.supporting) ? ` with the body ${q(it.supporting!)}` : ""}${it.icon ? `, its ${ico(it.icon)} icon in the ${v} colour` : ""}`;
    case "list":
      return `a list of ${it.tabs?.length ?? 0} rows: ${labelsOf(it, "en")}${sel ? `, with ${sel} selected` : ""}`;
    case "dataTable":
      return `a data table with the columns ${columnsText(it.columns ?? [], "en")} and ${tableRowsOf(it).length} sample rows: ${tableRowsOf(it).map((r) => r.join(" / ")).join("; ")}`;
    case "tree":
      return `a tree of ${(it.tabs ?? []).map((n) => q(n.label.trim())).join(", ")} (two leading spaces is one level of nesting)`;
    case "text":
      return `${it.bold ? "bold " : ""}text reading ${q(it.label)} at ${it.size ?? 20}px`;
    case "icon":
      return `a ${ico(it.icon) ?? "blank"} icon at ${it.size ?? 16}px`;
    case "image":
      return `a ${it.size ?? 200}×${it.size2 ?? 200}px image${it.src ? " showing the supplied picture" : " placeholder"}`;
    case "divider":
      return "a hairline divider";
    case "badge":
      return hasText(it.label) ? `a ${v} badge reading ${q(it.label)}` : `a small ${v} dot badge`;
    case "tag":
      return `a ${v} tag reading ${q(it.label)}${it.checked ? " with a close affordance" : ""}`;
    case "alert":
      return `a ${v} alert headed ${q(it.label)}${hasText(it.supporting) ? `, body ${q(it.supporting!)}` : ""}${it.icon ? `, with a ${ico(it.icon)} icon` : ""}`;
    case "progress":
      return `a ${it.circle ? "circular " : ""}progress indicator${it.value === undefined ? ", indeterminate" : ` at ${it.value}%`}`;
    case "spinner":
      return `a ${it.size ?? 20}px spinner`;
    case "skeleton":
      return `a ${it.size ?? 200}×${it.size2 ?? 16}px skeleton`;
    default:
      return noun;
  }
}

function itemZh(it: Item): string {
  const q = qz;
  const v = VARIANT_TEXT.zh[it.variant];
  const noun = KIND_TEXT.zh[it.kind]?.noun ?? it.kind;
  const off = it.disabled ? "（禁用状态）" : "";
  const sel = selectedLabel(it, "zh");
  switch (it.kind) {
    case "titleBar":
      return `标题为${q(it.label)}的标题栏${it.controls === "windows" ? "（窗口控件在右侧）" : it.controls === "none" ? "（无窗口控件）" : "（macOS 风格，左侧红黄绿按钮）"}${it.icon ? `，前置 ${ico(it.icon)}` : ""}${it.icon2 ? `，后置 ${ico(it.icon2)}` : ""}`;
    case "sidebar":
      return `标题为${q(it.label)}的侧边栏${it.collapsed ? "（折叠为仅图标）" : `（宽 ${it.size ?? 255}px）`}，条目为 ${labelsOf(it, "zh")}${sel ? `，${sel}为选中项` : ""}`;
    case "toolbar":
      return `由 ${(it.tabs ?? []).map((tab) => ico(tab.icon) ?? "空").join("、")} 幽灵按钮组成的工具栏`;
    case "statusBar":
      return `状态栏，左侧为${it.icon ? `${ico(it.icon)} 与` : ""}${q(it.label)}${hasText(it.supporting) ? `，右侧为${q(it.supporting!)}` : ""}`;
    case "breadcrumb":
      return `面包屑：${labelsOf(it, "zh")}（末项为当前位置）`;
    case "button":
      return `文字为${hasText(it.label) ? q(it.label) : "无标签"}的${v}按钮${it.icon ? `（带 ${ico(it.icon)}）` : ""}${off}`;
    case "iconButton":
      return `显示 ${ico(it.icon) ?? "空"} 的${v}图标按钮${it.size && it.size !== 32 ? `（${it.size}px）` : ""}${off}`;
    case "buttonGroup":
      return `由 ${labelsOf(it, "zh")} 相连组成的${v}按钮组${sel ? `（${sel}为选中项）` : ""}`;
    case "menu":
      return `包含 ${labelsOf(it, "zh")} 的弹出菜单`;
    case "input":
      return `占位文本为${q(it.label)}的输入框${it.icon ? `（前置 ${ico(it.icon)}）` : ""}${hasText(it.supporting) ? `，辅助文本为${q(it.supporting!)}` : ""}${off}`;
    case "textarea":
      return `占位文本为${q(it.label)}的多行输入框（高 ${it.size2 ?? 84}px）${hasText(it.supporting) ? `，辅助文本为${q(it.supporting!)}` : ""}${off}`;
    case "select":
      return `当前值为${q(it.label)}的下拉选择，选项为 ${labelsOf(it, "zh")}${off}`;
    case "checkbox":
      return `文字为${q(it.label)}的复选框（初始${it.checked ? "已勾选" : "未勾选"}）${off}`;
    case "radio":
      return `选项为 ${labelsOf(it, "zh")} 的单选组${sel ? `（${sel}为选中项）` : ""}${off}`;
    case "switch":
      return `文字为${q(it.label)}的开关（初始${it.checked ? "开" : "关"}）${off}`;
    case "slider":
      return `${hasText(it.label) ? `${q(it.label)}的` : ""}滑块（初始值 ${it.value ?? 40}%）${off}`;
    case "label":
      return `表单标签${q(it.label)}`;
    case "panel":
      return `${it.size ?? WINDOW_W}×${it.size2 ?? 200}px 的面板（背景 ${TOKEN_NAMES[it.fill ?? "muted"] ?? it.fill}，边界为发丝线）`;
    case "groupBox":
      return `标题为${q(it.label)}的分组框（${it.size ?? 320}×${it.size2 ?? 160}px）${hasText(it.supporting) ? `，说明为${q(it.supporting!)}` : ""}`;
    case "tabs":
      return `${it.tabs?.length ?? 0} 个标签页：${labelsOf(it, "zh")}${sel ? `（${sel}为选中项）` : ""}`;
    case "resizable":
      return `${it.side === "top" || it.side === "bottom" ? "上下" : "左右"}可调分栏（${it.side}侧面板初始占 ${it.value ?? 30}%，可拖动分隔条）`;
    case "dialog":
      return `标题为${q(it.label)}的对话框${hasText(it.supporting) ? `，正文${q(it.supporting!)}` : ""}（含取消与${q(it.confirm || "确定")}两个按钮，${q(it.confirm || "确定")}为${v}样式）`;
    case "sheet":
      return `从${it.side}侧打开、标题为${q(it.label)}的抽屉面板（宽 ${it.size ?? 380}px，带关闭按钮）`;
    case "popover":
      return `标题为${q(it.label)}的浮层${hasText(it.supporting) ? `，正文${q(it.supporting!)}` : ""}`;
    case "notification":
      return `内容为${q(it.label)}的通知${hasText(it.supporting) ? `（正文${q(it.supporting!)}）` : ""}${it.icon ? `，${ico(it.icon)} 图标使用${v}色` : ""}`;
    case "list":
      return `${it.tabs?.length ?? 0} 行的列表：${labelsOf(it, "zh")}${sel ? `（${sel}为选中行）` : ""}`;
    case "dataTable":
      return `列为 ${columnsText(it.columns ?? [], "zh")} 的数据表格（${tableRowsOf(it).length} 行示例：${tableRowsOf(it).map((r) => r.join(" / ")).join("；")}）`;
    case "tree":
      return `包含 ${(it.tabs ?? []).map((n) => q(n.label.trim())).join("、")} 的树（标签前每 2 个空格代表一级缩进）`;
    case "text":
      return `${it.bold ? "粗体" : ""}文本${q(it.label)}（${it.size ?? 20}px）`;
    case "icon":
      return `${ico(it.icon) ?? "空"} 图标（${it.size ?? 16}px）`;
    case "image":
      return `${it.size ?? 200}×${it.size2 ?? 200}px 的图片${it.src ? "（显示指定图片）" : "占位图"}`;
    case "divider":
      return "分割线（发丝线）";
    case "badge":
      return hasText(it.label) ? `显示${q(it.label)}的${v}徽标` : `小圆点${v}徽标`;
    case "tag":
      return `文字为${q(it.label)}的${v}标签块${it.checked ? "（带关闭按钮）" : ""}`;
    case "alert":
      return `${v}提示条，标题${q(it.label)}${hasText(it.supporting) ? `，正文${q(it.supporting!)}` : ""}${it.icon ? `，带 ${ico(it.icon)} 图标` : ""}`;
    case "progress":
      return `${it.circle ? "环形" : ""}进度条（${it.value === undefined ? "不确定" : `${it.value}%`}）`;
    case "spinner":
      return `加载指示器（${it.size ?? 20}px）`;
    case "skeleton":
      return `${it.size ?? 200}×${it.size2 ?? 16}px 的骨架屏`;
    default:
      return noun;
  }
}

const itemText = (it: Item, lang: Lang) => (lang === "ja" ? itemJa(it) : lang === "zh" ? itemZh(it) : itemEn(it));

/* ================= connected runs ================= */

function groupText(g: Group, lang: Lang): string {
  if (g.items.length === 1) return itemText(g.items[0], lang);
  const q = quote(lang);
  const kind = g.items[0].kind;
  const vt = VARIANT_TEXT[lang];
  const same = g.items.every((it) => it.variant === g.items[0].variant);
  const variant = vt[g.items[0].variant];
  if (lang === "ja") {
    if (kind === "iconButton") return `${g.items.map((it) => ico(it.icon) ?? "空").join("・")} のアイコンボタンが 1 つの ButtonGroup として連結`;
    const names = same
      ? g.items.map((it) => q(it.label || "ラベルなし")).join("")
      : g.items.map((it) => `${q(it.label || "ラベルなし")}(${vt[it.variant]})`).join("");
    return `${names}の ${g.items.length} つのボタンが 1 つの ButtonGroup として横に連結${same ? `（${variant}）` : ""}`;
  }
  if (lang === "zh") {
    if (kind === "iconButton") return `${g.items.map((it) => ico(it.icon) ?? "空").join("、")} 图标按钮相连组成一个 ButtonGroup`;
    const names = same
      ? g.items.map((it) => q(it.label || "无标签")).join("")
      : g.items.map((it) => `${q(it.label || "无标签")}(${vt[it.variant]})`).join("");
    return `${names}这 ${g.items.length} 个按钮横向相连组成一个 ButtonGroup${same ? `（${variant}）` : ""}`;
  }
  if (kind === "iconButton") return `one ButtonGroup of connected icon buttons: ${g.items.map((it) => ico(it.icon) ?? "empty").join(", ")}`;
  const names = same
    ? g.items.map((it) => q(it.label || "unlabeled")).join(", ")
    : g.items.map((it) => `${q(it.label || "unlabeled")} (${vt[it.variant]})`).join(", ");
  return `one ButtonGroup of ${g.items.length}${same ? ` ${variant}` : ""} connected buttons: ${names}`;
}

/** short name for a run when it is referred to again (as a container or a neighbour) */
function groupName(g: Group, lang: Lang): string {
  const it = g.items[0];
  const noun = KIND_TEXT[lang][it.kind]?.noun ?? it.kind;
  const q = quote(lang);
  if (g.items.length > 1) return lang === "en" ? `the ${noun} group` : lang === "zh" ? `${noun}组` : `${noun}のグループ`;
  if (hasText(it.label) && it.kind !== "text") return lang === "en" ? `the ${q(it.label)} ${noun}` : `${q(it.label)}${noun}`;
  return lang === "en" ? `the ${noun}` : noun;
}

/* ================= behavior notes ================= */

function actionText(a: Action, frames: Frame[], lang: Lang): string | null {
  const q = quote(lang);
  if (a.to === BACK_TARGET) {
    return lang === "ja"
      ? "前のビューに戻る"
      : lang === "zh"
        ? "返回上一个视图"
        : "goes back to the previous view";
  }
  const target = frames.find((f) => f.id === a.to);
  if (!target) return null;
  const tr = TRANSITION_TEXT[lang][a.transition];
  const name = q(target.name || (lang === "en" ? "window" : lang === "zh" ? "窗口" : "ウィンドウ"));
  if (lang === "ja") return `${name}のビューを開く${a.transition !== "none" ? `（${tr}）` : "（即座に切り替える）"}`;
  if (lang === "zh") return `打开${name}视图${a.transition !== "none" ? `（${tr}）` : "（立即切换）"}`;
  return `opens the ${name} view${a.transition !== "none" ? ` with ${tr}` : " immediately"}`;
}

function slotName(it: Item, slot: string, lang: Lang): string {
  if (slot.startsWith("tab:")) {
    const i = Number(slot.slice(4));
    const tab = it.tabs?.[i];
    const q = quote(lang);
    const label = tab?.label.trim() ? q(tab.label.trim()) : `#${i + 1}`;
    return lang === "ja" ? `${label}の項目` : lang === "zh" ? `${label}项` : `the ${label} entry`;
  }
  const icon = ico(slot === "icon2" ? it.icon2 : it.icon);
  if (lang === "ja") return `${slot === "icon2" ? "末尾" : "先頭"}の ${icon ?? ""} アイコンボタン`;
  if (lang === "zh") return `${slot === "icon2" ? "后置" : "前置"}的 ${icon ?? ""} 图标按钮`;
  return `the ${icon ?? ""} icon button at the ${slot === "icon2" ? "trailing" : "leading"} edge`;
}

function notes(g: Group, frames: Frame[], lang: Lang): string[] {
  const out: string[] = [];
  const q = quote(lang);
  for (const it of g.items) {
    const noun = KIND_TEXT[lang][it.kind]?.noun ?? it.kind;
    const name =
      hasText(it.label) && it.kind !== "text"
        ? lang === "en"
          ? `The ${q(it.label)} ${noun}`
          : `${q(it.label)}${noun}`
        : lang === "en"
          ? `The ${noun}`
          : hasText(it.label)
            ? lang === "ja"
              ? `テキスト${q(it.label)}`
              : `文本${q(it.label)}`
            : noun;
    const parts: string[] = [];
    if (it.action) {
      const a = actionText(it.action, frames, lang);
      if (a) parts.push(lang === "ja" ? `クリックすると${a}` : lang === "zh" ? `点击后${a}` : `${a} when clicked`);
    }
    for (const [slot, action] of Object.entries(it.actions ?? {})) {
      if (!action) continue;
      const a = actionText(action, frames, lang);
      if (!a) continue;
      const s = slotName(it, slot, lang);
      if (lang === "en") out.push(`Clicking ${s} of ${name.replace(/^The /, "the ")} ${a}.`);
      else parts.push(lang === "ja" ? `${s}をクリックすると${a}` : `点击${s}后${a}`);
    }
    if (hasText(it.shortcut)) {
      const key = it.shortcut!.trim();
      parts.push(
        lang === "ja"
          ? `キーバインドは ${key}（actions! で action を定義し、bind_keys で割り当て、ボタンの tooltip に Kbd で表示する）`
          : lang === "zh"
            ? `快捷键为 ${key}（用 actions! 定义 action，用 bind_keys 绑定，并在按钮 tooltip 中用 Kbd 显示）`
            : `is bound to ${key} (declare the action with actions!, bind it with bind_keys, and show it with Kbd in the button's tooltip)`,
      );
    }
    if (it.toggle) {
      const vt = VARIANT_TEXT[lang];
      const icon = it.toggle.icon; // undefined = same as off, null = no icon
      const variant = it.toggle.variant;
      const changes: string[] = [];
      const label = it.toggle.label !== undefined && it.toggle.label !== it.label ? it.toggle.label : undefined;
      if (lang === "ja") {
        if (label !== undefined) changes.push(`ラベルが${qj(label)}に変わる`);
        if (icon) changes.push(`アイコンが ${ico(icon)} に変わる`);
        else if (icon === null) changes.push("アイコンが消える");
        if (variant) changes.push(`スタイルが${vt[variant]}に変わる`);
        parts.push(`クリックごとにオン／オフが切り替わる Toggle にする${changes.length ? `（オンのときは${changes.join("、")}）` : ""}`);
      } else if (lang === "zh") {
        if (label !== undefined) changes.push(`文字变为${qz(label)}`);
        if (icon) changes.push(`图标变为 ${ico(icon)}`);
        else if (icon === null) changes.push("图标消失");
        if (variant) changes.push(`样式变为${vt[variant]}`);
        parts.push(`做成每次点击都切换开/关状态的 Toggle${changes.length ? `（开启时${changes.join("、")}）` : ""}`);
      } else {
        if (label !== undefined) changes.push(`the label becomes ${qe(label)}`);
        if (icon) changes.push(`the icon becomes ${ico(icon)}`);
        else if (icon === null) changes.push("the icon disappears");
        if (variant) changes.push(`the style becomes ${vt[variant]}`);
        parts.push(`is a Toggle that flips on / off with every click${changes.length ? ` (when on, ${changes.join(" and ")})` : ""}`);
      }
    }
    if (hasText(it.note)) parts.push(trimEnd(it.note!));
    if (!parts.length) continue;
    if (lang === "ja") out.push(`${name}は、${parts.join("。また、")}。`);
    else if (lang === "zh") out.push(`${name}：${parts.join("；")}。`);
    else out.push(`${name} ${parts.join(". It also ")}.`);
  }
  return out;
}

/* ================= layout: rows and layers ================= */

type Rect = { l: number; t: number; r: number; b: number };
type LNode = { g: Group; bb: Rect; children: LNode[] };

const area = (r: Rect) => Math.max(0, r.r - r.l) * Math.max(0, r.b - r.t);
const contains = (o: Rect, i: Rect, tol = 2) => i.l >= o.l - tol && i.t >= o.t - tol && i.r <= o.r + tol && i.b <= o.b + tol;
const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));

/** a window region owns its edge, so it never becomes another part's container */
const REGION_KINDS: Kind[] = ["titleBar", "statusBar", "sidebar", "sheet"];

/** Groups keep their canvas order (later = drawn on top). A run that sits fully inside an
 *  earlier, larger one is nested in it, so a panel with parts on it reads as one container. */
function layoutTree(groups: Group[], widths: Record<string, number>): LNode[] {
  const nodes: LNode[] = groups.map((g) => ({ g, bb: groupBounds(g, widths), children: [] }));
  const roots: LNode[] = [];
  nodes.forEach((n, i) => {
    let parent: LNode | null = null;
    for (let j = 0; j < i; j++) {
      const c = nodes[j];
      if (REGION_KINDS.includes(c.g.items[0].kind)) continue;
      if (contains(c.bb, n.bb) && area(c.bb) > area(n.bb) && (!parent || area(c.bb) < area(parent.bb))) parent = c;
    }
    (parent ? parent.children : roots).push(n);
  });
  return roots;
}

/** Siblings whose vertical extents overlap and that sit side by side form one
 *  row, except a window region, which owns its edge and stands on its own. */
function rowsOf(nodes: LNode[]): LNode[][] {
  const sorted = [...nodes].sort((a, b) => a.bb.t - b.bb.t || a.bb.l - b.bb.l);
  const out: LNode[][] = [];
  const isRegion = (n: LNode) => REGION_KINDS.includes(n.g.items[0].kind);
  for (const n of sorted) {
    const row = out[out.length - 1];
    if (row && !isRegion(n) && !row.some(isRegion)) {
      const rt = Math.min(...row.map((r) => r.bb.t));
      const rb = Math.max(...row.map((r) => r.bb.b));
      const cy = (n.bb.t + n.bb.b) / 2;
      const rcy = (rt + rb) / 2;
      const beside = row.every((r) => r.bb.r <= n.bb.l + 2 || r.bb.l >= n.bb.r - 2);
      if (beside && ((cy >= rt && cy <= rb) || (rcy >= n.bb.t && rcy <= n.bb.b))) {
        row.push(n);
        continue;
      }
    }
    out.push([n]);
  }
  for (const r of out) r.sort((a, b) => a.bb.l - b.bb.l);
  return out;
}

/** where a rect sits inside a container, in words. Leading and trailing are used
 *  rather than left and right, the way the Design Guides ask. */
function zone(bb: Rect, within: Rect, lang: Lang): string {
  const w = within.r - within.l;
  const h = within.b - within.t;
  const cy = (bb.t + bb.b) / 2 - within.t;
  const cx = (bb.l + bb.r) / 2 - within.l;
  const bw = bb.r - bb.l;
  const vert = cy < h * 0.28 ? 0 : cy > h * 0.72 ? 2 : 1;
  const horiz = bw >= w * 0.85 ? -1 : cx < w * 0.36 ? 0 : cx > w * 0.64 ? 2 : 1;
  if (lang === "ja") {
    const v = ["上部", "中央付近", "下部"][vert];
    if (horiz === 1) return `${v}の中央に`;
    const hh = horiz < 0 ? "" : ["先頭側に寄せて", "", "末尾側に寄せて"][horiz];
    return `${v}に${hh}`;
  }
  if (lang === "zh") {
    const v = ["上部", "中部", "下部"][vert];
    if (horiz === 1) return `${v}居中`;
    const hh = horiz < 0 ? "" : ["靠前置边", "", "靠后置边"][horiz];
    return `${v}${hh}`;
  }
  const v = ["Near the top", "In the middle", "Near the bottom"][vert];
  const hh = horiz < 0 ? "" : [", on the leading edge", ", centred", ", on the trailing edge"][horiz];
  return `${v}${hh}`;
}

/** the row phrase: a single part, or several parts side by side that must stay on one line */
function rowText(row: LNode[], where: string, lang: Lang, within: Rect): string {
  if (row.length === 1) {
    const d = groupText(row[0].g, lang);
    return lang === "ja" ? `${where}${d}を置きます。` : lang === "zh" ? `${where}放置${d}。` : `${where}: ${d}.`;
  }
  const last = row[row.length - 1];
  const fillsRight = last.bb.r >= within.r - 24;
  const descs = row.map((n) => groupText(n.g, lang));
  if (lang === "ja") {
    const stretch = fillsRight ? `。最後の${groupName(last.g, "ja")}は flex_1() と min_w_0() で残りの幅いっぱいに伸ばします` : "";
    return `${where}、先頭から ${descs.join("、")} を h_flex() で横一列に並べます（同じ行に収めて縦方向は中央揃え。折り返しません${stretch}）。`;
  }
  if (lang === "zh") {
    const stretch = fillsRight ? `，最后的${groupName(last.g, "zh")}用 flex_1() 与 min_w_0() 占满剩余宽度` : "";
    return `${where}，用 h_flex() 从前到后横向排成一行：${descs.join("、")}（保持同一行并垂直居中，不要换行${stretch}）。`;
  }
  const stretch = fillsRight ? `; ${groupName(last.g, "en")} takes the remaining width with flex_1() and min_w_0()` : "";
  return `${where}, in one h_flex() row: ${descs.join(", ")} (keep them on the same line, vertically centred; never wrap them${stretch}).`;
}

function describeNodes(lines: string[], nodes: LNode[], within: Rect | null, widths: Record<string, number>, lang: Lang, depth: number) {
  const rows = rowsOf(nodes);
  const pad = "  ".repeat(depth);
  const box: Rect = within ?? {
    l: Math.min(...nodes.map((n) => n.bb.l)),
    t: Math.min(...nodes.map((n) => n.bb.t)),
    r: Math.max(...nodes.map((n) => n.bb.r)),
    b: Math.max(...nodes.map((n) => n.bb.b)),
  };
  rows.forEach((row, i) => {
    const first = row[0];
    const rowRect: Rect = {
      l: Math.min(...row.map((n) => n.bb.l)),
      t: Math.min(...row.map((n) => n.bb.t)),
      r: Math.max(...row.map((n) => n.bb.r)),
      b: Math.max(...row.map((n) => n.bb.b)),
    };
    let where: string;
    if (within) where = zone(rowRect, box, lang);
    else where = lang === "ja" ? (i === 0 ? "まず" : "その下に") : lang === "zh" ? (i === 0 ? "首先" : "其下方") : i === 0 ? "First" : "Below that";
    /* a part that partly covers an earlier sibling is drawn on top of it */
    const overlaps: string[] = [];
    if (row.length === 1) {
      for (const other of nodes) {
        if (other === first || nodes.indexOf(other) > nodes.indexOf(first)) continue;
        const ov = overlapArea(other.bb, first.bb);
        if (ov > 0 && ov >= area(first.bb) * 0.25 && !contains(other.bb, first.bb)) overlaps.push(groupName(other.g, lang));
      }
    }
    let line = rowText(row, where, lang, box);
    if (overlaps.length) {
      const o = overlaps.join(lang === "en" ? " and " : "、");
      line =
        lang === "ja"
          ? `${line.replace(/。$/, "")}（${o}の上に一部重ねて前面に描画）。`
          : lang === "zh"
            ? `${line.replace(/。$/, "")}（部分覆盖在${o}之上，绘制在前面）。`
            : `${line.replace(/\.$/, "")} (partly overlapping ${o}, drawn on top).`;
    }
    lines.push(`${pad}- ${line}`);
    for (const n of row) {
      if (!n.children.length) continue;
      const name = groupName(n.g, lang);
      lines.push(
        `${pad}  - ${
          lang === "ja"
            ? `${name}の中には次を配置します（コンテナ側を背景にし、位置はコンテナ内での相対位置）:`
            : lang === "zh"
              ? `${name}内部放置以下内容（以容器为背景，位置为容器内的相对位置）：`
              : `Inside ${name} (the container is the background; positions are relative to it):`
        }`,
      );
      describeNodes(lines, n.children, n.bb, widths, lang, depth + 2);
    }
  });
}

function describeWindow(lines: string[], groups: Group[], rect: Rect | null, widths: Record<string, number>, lang: Lang) {
  if (!groups.length) return;
  const roots = layoutTree(groups, widths);
  describeNodes(lines, roots, rect, widths, lang, 0);
}

/* ---------- the theme ---------- */

/** the tokens worth stating outright; everything else follows gpui-kit's own
 *  fallbacks, which is how these values were resolved in the first place */
const STATED_TOKENS: (keyof Palette)[] = [
  "background",
  "foreground",
  "border",
  "input",
  "ring",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "danger",
  "warning",
  "success",
  "info",
  "popover",
  "groupBox",
  "sidebar",
  "sidebarForeground",
  "sidebarBorder",
  "sidebarAccent",
  "titleBar",
  "titleBarBorder",
  "statusBar",
  "tabBar",
  "tabActive",
  "list",
  "listActive",
  "tableHead",
  "tableRowBorder",
  "selection",
  "link",
];

/** the palette as a gpui-kit ThemeConfig, ready to drop into a theme file */
function themeJson(p: Palette, th: Theme): string[] {
  const radius = RADII.find((r) => r.key === th.radius)?.radius ?? p.radius;
  const font = FONTS.find((f) => f.key === th.font);
  const colors = STATED_TOKENS.map((field) => {
    const name = TOKEN_NAMES[field] ?? field;
    return `    "${name}": "${p[field]}"`;
  }).join(",\n");
  return [
    "```json",
    "{",
    `  "$schema": "https://github.com/longbridge/gpui-kit/raw/refs/heads/main/.theme-schema.json",`,
    `  "name": ${JSON.stringify(p.label)},`,
    `  "mode": "${p.dark ? "dark" : "light"}",`,
    `  "radius": ${radius},`,
    `  "radius.lg": ${radius + 2},`,
    ...(font && font.key !== "system" ? [`  "font.family": ${JSON.stringify(font.themeValue)},`] : []),
    `  "shadow": ${th.shadow},`,
    '  "colors": {',
    colors,
    "  }",
    "}",
    "```",
  ];
}

const THEME_NOTES: Record<
  Lang,
  {
    radius: (label: string, px: number) => string;
    font: (name: string, value: string) => string;
    density: (label: string, size: string) => string;
    shadow: (on: boolean) => string;
    focusRing: (on: boolean) => string;
    motion: (reduced: boolean) => string;
  }
> = {
  ja: {
    radius: (label, px) => `角丸は ${label}（theme.radius ${px}px / radius.lg ${px + 2}px）。丸みはテーマから読み、円やピルには radius_full() を使います。`,
    font: (name, value) => `書体は ${name}（theme の font.family は ${value}）。基準文字サイズは 16px です。`,
    density: (label, size) => `既定の密度は ${label}（コンポーネントの既定は ${size}）。ツールバーやデータ中心の領域はローカルにまとめて一段小さくします。`,
    shadow: (on) => (on ? "theme.shadow は有効です。最も強い影は最前面の決定レイヤーだけに使い、同一レイヤー内は背景とヘアラインで階層を示します。" : "theme.shadow は無効です。階層は背景とヘアラインだけで示します。"),
    focusRing: (on) => (on ? "theme.focus_ring は有効です。フォーカスリングが切り取られないようにしてください。" : "theme.focus_ring は無効ですが、キーボードのフォーカスが分かる別の表現を必ず用意してください。"),
    motion: (reduced) => (reduced ? "モーションは控えめです。ビューの切り替えは即座に行い、装飾的なアニメーションは入れません。" : "モーションは標準です。状態の変化が分かる程度の短いトランジションにとどめ、OS の「視差を減らす」設定を尊重します。"),
  },
  en: {
    radius: (label, px) => `Corners are ${label} (theme.radius ${px}px, radius.lg ${px + 2}px). Derive radii from the theme, and use radius_full() for circles and pills.`,
    font: (name, value) => `The typeface is ${name} (theme font.family ${value}); the base text size is 16px.`,
    density: (label, size) => `The default density is ${label} (components default to ${size}). Step a toolbar or a data-dense region down as a whole local context, never one isolated control.`,
    shadow: (on) => (on ? "theme.shadow is on. Reserve the strongest elevation for the topmost decision layer and show hierarchy inside a layer with background and hairlines." : "theme.shadow is off. Show hierarchy with background and hairlines alone."),
    focusRing: (on) => (on ? "theme.focus_ring is on; make sure no clipped region cuts a focus ring off." : "theme.focus_ring is off, so provide another visible treatment for keyboard focus."),
    motion: (reduced) => (reduced ? "Motion is reduced: switch views instantly and add no decorative animation." : "Motion is the default: keep transitions short enough to explain a state change, and honour the system's reduce-motion setting."),
  },
  zh: {
    radius: (label, px) => `圆角为${label}（theme.radius ${px}px、radius.lg ${px + 2}px）。圆角一律从主题读取，圆形与胶囊形使用 radius_full()。`,
    font: (name, value) => `字体为 ${name}（主题 font.family 为 ${value}），基准字号 16px。`,
    density: (label, size) => `默认密度为${label}（组件默认 ${size}）。工具栏和数据密集区域应整块下调一档，而不是单独调整某个控件。`,
    shadow: (on) => (on ? "theme.shadow 为开。最强的阴影只留给最上层的决策层，同层内用背景和发丝线表达层次。" : "theme.shadow 为关。层次仅用背景和发丝线表达。"),
    focusRing: (on) => (on ? "theme.focus_ring 为开，注意不要让裁剪区域切掉焦点环。" : "theme.focus_ring 为关，但必须另外提供可见的键盘焦点表现。"),
    motion: (reduced) => (reduced ? "动效为减弱：视图切换立即完成，不加装饰性动画。" : "动效为标准：过渡只需短到能说明状态变化，并遵循系统的“减少动态效果”设置。"),
  },
};

function themeLines(th: Theme, lang: Lang): string[] {
  const n = THEME_NOTES[lang];
  const radius = RADII.find((r) => r.key === th.radius)!;
  const font = FONTS.find((f) => f.key === th.font)!;
  const density = th.density;
  const densityLabel = lang === "ja" ? { compact: "コンパクト", default: "標準", comfortable: "ゆったり" }[density] : lang === "zh" ? { compact: "紧凑", default: "标准", comfortable: "宽松" }[density] : density;
  return [
    `- ${n.radius(radius.label, radius.radius)}`,
    `- ${n.font(font.label, font.themeValue)}`,
    `- ${n.density(densityLabel, DENSITY_SIZE[density])}`,
    `- ${n.shadow(th.shadow)}`,
    `- ${n.focusRing(th.focusRing)}`,
    `- ${n.motion(th.motion === "reduced")}`,
  ];
}

/* ---------- the shell ---------- */

const SHELL_TEXT: Record<Lang, Record<Shell, string>> = {
  ja: {
    single: "単一ワークスペース: タイトルバーまたはツールバーの下に 1 つの主ビューを置く骨格です。",
    sidebar: "サイドバーワークスペース: 変化しない左のナビゲーションと、切り替わる右の詳細ビューという骨格です。ナビゲーションは内容が変わっても動かしません。",
    masterDetail: "一覧と詳細: リサイズできる一覧ペインと詳細ペインの骨格です。一覧は走査しやすい幅を保ち、余った幅は詳細側に渡します。",
    document: "ドキュメントワークスペース: 長く開いておく複数の対象をタブまたは DockArea で扱う骨格です。",
    utility: "ユーティリティウィンドウ: 1 つの作業に絞り、操作の道筋を短く固定した骨格です。",
  },
  en: {
    single: "A single workspace: one primary view under a title bar or toolbar.",
    sidebar: "A sidebar workspace: persistent navigation beside a changing detail view. Keep the navigation stable while the content changes.",
    masterDetail: "A master–detail shell: resizable collection and detail panes. Keep the collection scannable and give the detail pane the surplus width.",
    document: "A document workspace: tabs or a DockArea for several long-lived objects.",
    utility: "A utility window: one focused task with a short, fixed action path.",
  },
  zh: {
    single: "单一工作区：标题栏或工具栏之下只有一个主视图。",
    sidebar: "侧栏工作区：左侧导航保持不变，右侧详情视图随之切换。内容变化时导航不要移动。",
    masterDetail: "列表与详情：可调整宽度的列表面板与详情面板。列表保持易于浏览的宽度，多余的宽度交给详情面板。",
    document: "文档工作区：用标签页或 DockArea 承载多个长期打开的对象。",
    utility: "工具窗口：聚焦单一任务，操作路径短而固定。",
  },
};

/* ---------- the components in use ---------- */

const API_HEAD: Record<Lang, string> = {
  ja: "使っている部品と、対応する gpui-kit のコンポーネントです。API は必ず現物のシグネチャを確認し、似た名前を推測で書かないでください。",
  en: "The parts in use and the gpui-kit component each one means. Check every signature against the real source; never guess a plausible-looking method.",
  zh: "所用组件及其对应的 gpui-kit 组件。所有 API 都必须核对真实签名，不要凭相似的名字猜写。",
};

/** semantics a kind carries that its type name alone does not say */
const KIND_NOTES: Record<Lang, Partial<Record<Kind, string>>> = {
  ja: {
    button: "アプリ内のコマンドはすべて Button です。Link は外部 URL とメールアドレスだけに使います。プライマリは決定領域の既定コミット（Enter で実行される操作）だけに与えます。",
    menu: "メニュー、ドロップダウン、ポップオーバー、セレクト、コマンドパレットは互換の箱ではありません。選択・フォーカス・キーボード・閉じ方の契約がそれぞれ違うので、役割に合う標準コンポーネントを使います。",
    dialog: "ダイアログは短く焦点の絞られた決定だけに使います。探索や多数のフィールドが必要ならページかシートにします。ボタンは対象と動詞を名指しします。",
    sheet: "シートは既定で主対象を覆いません。内容が増えるならリサイズか閉じられるようにします。",
    dataTable: "ヘッダー、行、集計、ローディング、インライン編集で同じ列の幾何を保ちます。比較できる数値は右寄せ、識別子と文章は左寄せです。",
    list: "行はアイコン、ラベル、値、バッジ、末尾の操作を安定した列に置きます。任意の要素が欠けても残りのラベルが動かないようにします。",
    tree: "階層・包含・展開が本当にある場合だけインデントします。",
    resizable: "各領域に最小幅・既定幅・余剰の配分を決め、ユーザーが動かした分割は保存して復元時に現在のウィンドウへクランプします。",
    badge: "バッジは素早く走査したい短い状態・件数・分類だけに使います。ほとんどはニュートラルにし、意味のある状態にだけセマンティックな variant を使います。",
    alert: "セマンティックな色は意味のためだけに使い、装飾には使いません。色だけで意味を伝えないでください。",
    input: "各フィールドには見えるラベルを付け、ヘルプと検証はそのフィールドの隣に置きます。",
    progress: "処理中は送信を無効にし、入力は保持し、結果は操作の近くに表示します。",
    statusBar: "ステータスバーは常時見える控えめな情報だけを持ちます。ここに操作の唯一の入口を置かないでください。",
    titleBar: "TITLE_BAR_HEIGHT と macOS の信号機ボタン位置はコンポーネントに任せ、自前で描き直さないでください。",
    sidebar: "サイドバーはラベルが安定して入る幅を持ちつつ、作業領域より明確に従属させます。最小幅・既定幅・最大幅を決めてください。",
  },
  en: {
    button: "Every in-app command is a Button; Link is only for external URLs and email addresses. Primary is reserved for the default commit in a decision area, normally the action invoked by Enter.",
    menu: "A menu, dropdown menu, popover, select and command palette are not interchangeable boxes: each owns different selection, focus, keyboard, dismissal and layout contracts. Use the one whose role matches.",
    dialog: "Reserve dialogs for short, focused decisions; use a page or a sheet for work that needs exploration or many fields. Name the object and the verb on the buttons.",
    sheet: "A sheet should not cover the primary object by default, and should be resizable or dismissible as its content grows.",
    dataTable: "Repeat the column geometry through headers, rows, summaries, loading states and inline editors. Right-align comparable numbers; left-align prose and identifiers.",
    list: "Keep icons, labels, values, badges and trailing actions on stable columns, and do not let a missing optional element move the remaining labels.",
    tree: "Indent only for real hierarchy, containment or disclosure.",
    resizable: "Define a minimum, a comfortable default and how each region consumes surplus. Persist user-moved splits and clamp restored values against the current window.",
    badge: "Use Badge for a short state, count or classification worth scanning. Keep most badges neutral and reserve semantic variants for states that carry that meaning.",
    alert: "Use a semantic colour only for its meaning, never as decoration, and never encode meaning by colour alone.",
    input: "Give every field a visible label and place help and validation next to the field they describe.",
    progress: "Disable submission while an operation is in flight, keep the user's input, and show the result near the action.",
    statusBar: "The status bar carries quiet, always-visible information. Never make it the only path to a command.",
    titleBar: "Let the component own TITLE_BAR_HEIGHT and the macOS traffic-light position instead of redrawing them.",
    sidebar: "Give the sidebar a width that holds its labels while staying visibly subordinate to the work area, with a minimum, preferred and maximum width.",
  },
  zh: {
    button: "应用内的所有命令都用 Button；Link 只用于外部 URL 和邮箱地址。primary 只留给决策区域的默认提交动作（通常是按 Enter 触发的那个）。",
    menu: "菜单、下拉菜单、浮层、下拉选择和命令面板不是可互换的容器，各自的选择、焦点、键盘和关闭契约都不同，请按角色选用对应组件。",
    dialog: "对话框只用于简短、聚焦的决策；需要探索或字段较多时改用页面或抽屉面板。按钮文字要点明对象和动作。",
    sheet: "抽屉面板默认不应遮住主对象，内容变多时应可调整宽度或可关闭。",
    dataTable: "表头、数据行、汇总行、加载态和行内编辑要保持同一套列几何。可比较的数值右对齐，文本和标识符左对齐。",
    list: "图标、标签、数值、徽标和尾部操作要落在稳定的列上；可选元素缺失时不能让其余标签发生位移。",
    tree: "只有真实存在层级、包含或展开关系时才使用缩进。",
    resizable: "为每个区域定义最小宽度、舒适默认值以及如何消化多余空间。用户拖动过的分栏要持久化，并在恢复时按当前窗口尺寸做钳制。",
    badge: "徽标只用于值得快速扫读的简短状态、计数或分类。多数徽标保持中性，语义色只用于真正带该含义的状态。",
    alert: "语义色只用于表达含义，不作装饰，也不能仅靠颜色传递信息。",
    input: "每个字段都要有可见标签，帮助文本和校验信息紧邻其所描述的字段。",
    progress: "操作进行中禁用提交、保留用户输入，并在操作附近显示结果。",
    statusBar: "状态栏承载安静且常驻的信息，不要让它成为某个命令的唯一入口。",
    titleBar: "TITLE_BAR_HEIGHT 与 macOS 红黄绿按钮的位置交给组件本身，不要自行重绘。",
    sidebar: "侧边栏的宽度要放得下标签，同时明显从属于工作区，并定义最小、默认与最大宽度。",
  },
};

const GENERAL: Record<Lang, string[]> = {
  ja: [
    "実装の前に gpui-kit のスキル（`gpui-kit` と `gpui-kit-design-guides`）を読んでください。入っていない場合は https://gpui-kit.com/llms-full.txt 、https://gpui-kit.com/docs/design-guides.md 、https://gpui-kit.com/docs/coding-guides.md を取得します。API は絶対に推測せず、現物のシグネチャを検索して確認します。React や CSS、古い GPUI の例からの類推で書かないでください。",
    "依存は `gpui-kit` クレート 1 つだけです。GPUI は `use gpui_kit::*;`、各レイヤーは `gpui_kit::component` / `gpui_kit::base` / `gpui_kit::assets` / `gpui_kit::platform` から辿ります。",
    "起動は `gpui_kit::application().with_assets(gpui_kit::assets::Assets).run(|cx| { gpui_kit::init(cx); ... })` の順で、最初に `gpui_kit::init(cx)` を呼び、ウィンドウのルートは `Root::new(view, window, cx)` にします。",
    "色・角丸・間隔はすべて `cx.theme()` のセマンティックトークンと rem ベースのヘルパーから取ります。アプリのコードに生の hex や rgb(...) を書かないでください。必要なロールが無ければテーマ／トークン層に定義します。",
    "状態を持たない部品は `RenderOnce`、状態を持つものは `Entity<T>` を view が保持して `render` では参照だけ渡します。`render` の中で状態を作らないこと。繰り返す要素の `ElementId` はドメインの値から作り、リストの添字は使いません。",
    "すべてのコマンドはキーボードから到達できるようにします。`actions!` で action を定義し `bind_keys` で割り当て、フォーカスは常に見えるようにし、Esc は最前面のオーバーレイを閉じてフォーカスを開いた要素に戻します。",
    "スクロールやペイン管理を div の入れ子で作り直さず、`Scrollable`、`VirtualList`、`DataTable`、`DockArea` を本来の用途で使います。主作業領域は `flex_1()` と、縮む必要のある子には `min_w_0()` / `min_h_0()` を付けます。",
    "データは本物として扱います。ユーザーが作ったものは永続化して再起動後も残し、ダミーやサンプルデータは入れず、何もない状態には空の案内を出します。入力は検証し、破壊的な操作は対象を名指しして確認します。",
    "ウィンドウが狭くなったときの振る舞いを決めます。主タスクを守り、リサイズできる領域は決めた最小値まで縮め、副次的なラベルやインスペクタを畳み、低頻度の操作はメニューへ移し、あふれた領域だけをスクロールさせます。操作を隠すときは必ず別の到達経路を残します。",
    "文言は対象と動詞を名指しします。`本当によろしいですか？` と `OK` ではなく、`「Roadmap」を削除しますか？` と `削除` です。",
    "テストは `#[gpui_kit::test]` と `TestAppContext` で書きます。仕上げに `cargo fmt`、`cargo clippy`、`cargo test` を通し、`cargo run --release` で起動できる状態にしてください。",
    "最後に Design Guides の Design review checklist と Coding Guides の Implementation checklist を成果物に対して 1 項目ずつ確認します。",
  ],
  en: [
    "Before writing code, read the gpui-kit skills (`gpui-kit` and `gpui-kit-design-guides`). If they are not installed, fetch https://gpui-kit.com/llms-full.txt, https://gpui-kit.com/docs/design-guides.md and https://gpui-kit.com/docs/coding-guides.md. Never invent an API: search the current source for the real signature, and do not translate a React, CSS or older-GPUI example by analogy.",
    "Depend on the `gpui-kit` crate alone. GPUI is `use gpui_kit::*;`, and the layers are `gpui_kit::component`, `gpui_kit::base`, `gpui_kit::assets` and `gpui_kit::platform`.",
    "Bootstrap with `gpui_kit::application().with_assets(gpui_kit::assets::Assets).run(|cx| { gpui_kit::init(cx); ... })`, calling `gpui_kit::init(cx)` first, and give the window a `Root::new(view, window, cx)`.",
    "Take every colour, radius and gap from `cx.theme()` semantic tokens and the rem-based helpers. No raw hex or rgb(...) in application code; if a role does not exist, define it in the theme/token layer.",
    "Use `RenderOnce` for stateless parts and an `Entity<T>` held by the view for stateful ones, passing a reference in `render`. Never build state inside `render`. Give repeated elements domain-derived `ElementId`s, never list indexes.",
    "Make every command reachable from the keyboard: declare actions with `actions!`, bind them with `bind_keys`, keep focus visible, and let Escape dismiss the topmost overlay and return focus to its trigger.",
    "Do not rebuild scrolling or pane management from nested `div`s: use `Scrollable`, `VirtualList`, `DataTable` and `DockArea` for their intended behaviour. Give the primary work area `flex_1()`, and `min_w_0()` / `min_h_0()` to children that must shrink.",
    "Treat the data as real. Persist what the user creates so it survives a restart, ship no dummy or sample data, and show an empty state when there is nothing yet. Validate input, and confirm destructive actions with the object named.",
    "Decide what happens as the window narrows: preserve the primary task, let resizable regions reach a documented minimum, collapse secondary labels or inspectors, move low-frequency actions into a menu, and scroll only the region that actually overflows. Never hide an action without another path to it.",
    "Name the object and the verb in interface copy: `Delete \"Roadmap\"?` with a `Delete` button, not `Are you sure?` with `OK`.",
    "Write tests with `#[gpui_kit::test]` and `TestAppContext`. Finish by getting `cargo fmt`, `cargo clippy` and `cargo test` clean, and leave the app runnable with `cargo run --release`.",
    "Finish by running the Design review checklist from the Design Guides and the Implementation checklist from the Coding Guides against the work, item by item.",
  ],
  zh: [
    "动手之前请先阅读 gpui-kit 的 skill（`gpui-kit` 与 `gpui-kit-design-guides`）。若未安装，则抓取 https://gpui-kit.com/llms-full.txt 、https://gpui-kit.com/docs/design-guides.md 和 https://gpui-kit.com/docs/coding-guides.md 。绝不要凭空编造 API：请在真实源码中搜索确切签名，也不要按 React、CSS 或旧版 GPUI 的例子类推。",
    "只依赖 `gpui-kit` 这一个 crate。GPUI 通过 `use gpui_kit::*;` 引入，各层分别是 `gpui_kit::component`、`gpui_kit::base`、`gpui_kit::assets` 和 `gpui_kit::platform`。",
    "启动流程为 `gpui_kit::application().with_assets(gpui_kit::assets::Assets).run(|cx| { gpui_kit::init(cx); ... })`，必须先调用 `gpui_kit::init(cx)`，窗口根节点使用 `Root::new(view, window, cx)`。",
    "所有颜色、圆角和间距都取自 `cx.theme()` 的语义 token 与基于 rem 的辅助函数。应用代码中不要出现原始 hex 或 rgb(...)；缺少所需角色时，请在主题／token 层中定义。",
    "无状态部件用 `RenderOnce`，有状态的用 view 持有的 `Entity<T>`，在 `render` 中只传引用。不要在 `render` 里创建状态。重复元素的 `ElementId` 必须由领域数据派生，不能用列表下标。",
    "所有命令都要能用键盘触达：用 `actions!` 定义 action、用 `bind_keys` 绑定，焦点始终可见，Esc 关闭最上层浮层并把焦点交还给触发它的元素。",
    "不要用嵌套 `div` 重新实现滚动或分栏管理，请按用途使用 `Scrollable`、`VirtualList`、`DataTable` 和 `DockArea`。主工作区使用 `flex_1()`，需要收缩的子元素加上 `min_w_0()` / `min_h_0()`。",
    "把数据当作真实数据：用户创建的内容要持久化并在重启后仍然存在，不要放入虚拟或示例数据，没有数据时显示空状态。校验输入，破坏性操作要点名对象后再确认。",
    "明确窗口变窄时的行为：保住主任务，可调区域收缩到有明确定义的最小值，折叠次要标签或检查器，低频操作移入菜单，只让真正溢出的区域滚动。隐藏某个操作时必须保留另一条到达路径。",
    "界面文案要点名对象和动作：用「删除「Roadmap」？」配「删除」按钮，而不是「确定要继续吗？」配「确定」。",
    "用 `#[gpui_kit::test]` 与 `TestAppContext` 编写测试。收尾时让 `cargo fmt`、`cargo clippy`、`cargo test` 全部通过，并保证 `cargo run --release` 能直接运行。",
    "最后逐项对照 Design Guides 的 Design review checklist 与 Coding Guides 的 Implementation checklist 检查成果。",
  ],
};

/* ---------- fixed phrases ---------- */

const PH = {
  ja: {
    window: "ウィンドウ",
    intro: (title: string, brief: string) => `${title}を gpui-kit（Rust のデスクトップ UI フレームワーク）で実装してください。${brief ? trimEnd(brief) + "。" : ""}`,
    titleOnly: (name: string) => `${name}ウィンドウ`,
    titleAll: (n: number) => (n > 1 ? "このデスクトップアプリ" : "このデスクトップアプリ"),
    target: (dark: boolean, both: boolean, w: number, h: number) =>
      `デスクトップアプリで、既定のウィンドウサイズは ${w}×${h} です。サイズは固定ではないので、狭くなったときの振る舞いも決めてください。${both ? "ライトとダークの両方に対応し、OS の設定に従って切り替えます。" : dark ? "ダークモード固定です。" : "ライトモード固定です。"}`,
    sketch:
      "下のウィンドウ構成は、意図を伝えるためのラフスケッチです。完成図の仕様ではないので、静止画のように再現するのではなく、この種のデスクトップアプリとして普通に期待される機能を一通り備えた、実際に使える完成品として仕上げてください。",
    hShell: "## ウィンドウの骨格",
    hColor: "## テーマ",
    colorIntro: (label: string, file: string | null) =>
      file
        ? `テーマは gpui-kit 同梱の ${label}（${file}）です。ThemeRegistry から読み込んで適用し、UI の色はすべて cx.theme() のロール経由で参照してください。参考として主要なトークンの値を挙げます。`
        : `テーマは ${label} です。次の ThemeConfig をテーマファイルとして追加し、UI の色はすべて cx.theme() のロール経由で参照してください。`,
    schemeHead: (dark: boolean) => (dark ? "ダークテーマ:" : "ライトテーマ:"),
    hTheme: "## 角丸・文字・密度・動き",
    hLayout: "## ウィンドウ構成",
    empty: "ウィンドウにはまだ部品が置かれていません。",
    windows: (names: string[]) => `ウィンドウ（ビュー）は ${names.length} つあり、${names.join("、")}です。`,
    windowHead: (name: string, size: string, bg: string | undefined, has: boolean) =>
      `${name}ウィンドウ（${size}${bg ? `、背景は ${bg}` : ""}）${has ? "の中身は次の通りです。重なっている部品はその旨を書いています。" : "はまだ空です。"}`,
    loose: "ウィンドウの外に置かれている部品（共通パーツや参考）:",
    freeform: "レイアウトを上から順に説明します。",
    hBehavior: "## 振る舞いとビューの切り替え",
    hParts: "## 使うコンポーネント",
    hGeneral: "## 全体の指針",
  },
  en: {
    window: "window",
    intro: (title: string, brief: string) => `Please implement ${title} with gpui-kit, the Rust desktop UI framework.${brief ? ` ${trimEnd(brief)}.` : ""}`,
    titleOnly: (name: string) => `the ${name} window`,
    titleAll: () => "this desktop app",
    target: (dark: boolean, both: boolean, w: number, h: number) =>
      `It is a desktop app whose default window is ${w}×${h}. Desktop does not mean fixed-size, so decide what happens as the window narrows. ${both ? "Support both light and dark themes and follow the system setting." : `${dark ? "Dark" : "Light"} theme only.`}`,
    sketch:
      "The layout below is a rough sketch that conveys intent, not a finished spec. Do not reproduce it as a static picture; build the complete, usable desktop app that this kind of product is normally expected to be.",
    hShell: "## Window shell",
    hColor: "## Theme",
    colorIntro: (label: string, file: string | null) =>
      file
        ? `The theme is ${label}, which gpui-kit ships as ${file}. Load it through the ThemeRegistry and read every UI colour through its role on cx.theme(). Its main tokens, for reference:`
        : `The theme is ${label}. Add the ThemeConfig below as a theme file and read every UI colour through its role on cx.theme().`,
    schemeHead: (dark: boolean) => (dark ? "Dark theme:" : "Light theme:"),
    hTheme: "## Radius, type, density and motion",
    hLayout: "## Layout",
    empty: "Nothing has been placed in the window yet.",
    windows: (names: string[]) => `There are ${names.length} windows (views): ${names.join(", ")}.`,
    windowHead: (name: string, size: string, bg: string | undefined, has: boolean) =>
      `The ${name} window, ${size}${bg ? ` on ${bg}` : ""}${has ? " — overlapping parts are called out as such:" : ", is still empty."}`,
    loose: "Parts placed outside the windows (shared parts or references):",
    freeform: "The layout, from top to bottom:",
    hBehavior: "## Behaviour and navigation",
    hParts: "## Components to use",
    hGeneral: "## General guidance",
  },
  zh: {
    window: "窗口",
    intro: (title: string, brief: string) => `请用 gpui-kit（Rust 桌面 UI 框架）实现${title}。${brief ? trimEnd(brief) + "。" : ""}`,
    titleOnly: (name: string) => `${name}窗口`,
    titleAll: () => "这个桌面应用",
    target: (dark: boolean, both: boolean, w: number, h: number) =>
      `这是一个桌面应用，默认窗口尺寸为 ${w}×${h}。桌面并不意味着固定尺寸，请同时确定窗口变窄时的行为。${both ? "同时支持浅色与深色主题，并跟随系统设置切换。" : `只做${dark ? "深色" : "浅色"}主题。`}`,
    sketch:
      "下面的窗口结构是传达意图的草图，不是最终规格。不要把它当静态图片照搬，而要做成这类桌面应用通常应具备的功能齐全、真正可用的成品。",
    hShell: "## 窗口骨架",
    hColor: "## 主题",
    colorIntro: (label: string, file: string | null) =>
      file
        ? `主题为 gpui-kit 自带的 ${label}（${file}）。请通过 ThemeRegistry 加载并应用，UI 的所有颜色都通过 cx.theme() 的语义角色引用。以下列出主要 token 供参考：`
        : `主题为 ${label}。请把下面的 ThemeConfig 添加为主题文件，UI 的所有颜色都通过 cx.theme() 的语义角色引用。`,
    schemeHead: (dark: boolean) => (dark ? "深色主题：" : "浅色主题："),
    hTheme: "## 圆角、字体、密度与动效",
    hLayout: "## 窗口结构",
    empty: "窗口中还没有放置任何组件。",
    windows: (names: string[]) => `共有 ${names.length} 个窗口（视图）：${names.join("、")}。`,
    windowHead: (name: string, size: string, bg: string | undefined, has: boolean) =>
      `${name}窗口（${size}${bg ? `，背景为 ${bg}` : ""}）的结构如下${has ? "（重叠的组件会特别说明）：" : "：目前为空。"}`,
    loose: "放在窗口之外的组件（公共部件或参考）：",
    freeform: "从上到下说明布局：",
    hBehavior: "## 行为与视图切换",
    hParts: "## 需要使用的组件",
    hGeneral: "## 整体原则",
  },
};

/** the theme file gpui-kit ships a palette in, when it ships one */
const themeFileOf = (p: Palette): string | null => {
  const [slug] = p.key.split(":");
  if (!slug || slug === "custom") return null;
  return slug === "default" ? "the built-in default theme" : `themes/${slug}.json`;
};

export function buildPrompt(doc: Doc, widths: Record<string, number>, onlyFrameId?: string, lang: Lang = getLang()): string {
  const th = normalizeTheme(doc.theme);
  const pal = paletteOf(doc.paletteKey, doc.customPalette, th);
  const windowed = doc.frame === "window";
  const allFrames = windowed ? doc.frames : [];
  const only = onlyFrameId ? allFrames.find((f) => f.id === onlyFrameId) : undefined;
  const frames = only ? [only] : allFrames;
  /* canvas order is the layer order; rows are worked out per window. A hand-made
   * group is written part by part, since it exists only to move things together. */
  const groups = doc.groups
    .filter((g) => !only || frameOfGroup(g, allFrames, widths)?.id === only.id)
    .flatMap((g) => explodeGroup(g, widths));
  const lines: string[] = [];
  const q = quote(lang);
  const ph = PH[lang];

  const byFrame = new Map<string, Group[]>();
  const loose: Group[] = [];
  for (const g of groups) {
    const f = frameOfGroup(g, allFrames, widths);
    if (f && frames.some((x) => x.id === f.id)) byFrame.set(f.id, [...(byFrame.get(f.id) ?? []), g]);
    else if (!f) loose.push(g);
  }

  const kindsUsed: Kind[] = [];
  for (const g of groups) for (const it of g.items) if (!kindsUsed.includes(it.kind)) kindsUsed.push(it.kind);

  const title = only ? ph.titleOnly(q(only.name || ph.window)) : doc.title.trim() || ph.titleAll(frames.length);
  const mainFrame = frames[0];
  const winW = mainFrame ? frameW(mainFrame) : WINDOW_W;
  const winH = mainFrame ? frameH(mainFrame) : WINDOW_H;
  lines.push(ph.intro(title, doc.brief.trim()));
  lines.push(ph.target(th.dark, th.bothModes, winW, winH));
  lines.push(ph.sketch);

  /* the shell comes before the parts: structure carries the product's intent */
  const shells = Array.from(new Set(frames.map((f) => f.shell ?? DEFAULT_SHELL)));
  if (shells.length) {
    lines.push("");
    lines.push(ph.hShell);
    for (const shell of shells) lines.push(`- ${SHELL_TEXT[lang][shell]}`);
  }

  lines.push("");
  lines.push(ph.hColor);
  const file = themeFileOf(pal);
  lines.push(ph.colorIntro(pal.label, file));
  if (th.bothModes) {
    const light = paletteOf(doc.paletteKey, doc.customPalette, { ...th, dark: false });
    const dark = paletteOf(doc.paletteKey, doc.customPalette, { ...th, dark: true });
    lines.push(ph.schemeHead(false));
    lines.push(...themeJson(light, { ...th, dark: false }));
    if (dark.key !== light.key) {
      lines.push(ph.schemeHead(true));
      lines.push(...themeJson(dark, { ...th, dark: true }));
    }
  } else {
    lines.push(...themeJson(pal, th));
  }

  lines.push("");
  lines.push(ph.hTheme);
  lines.push(...themeLines(th, lang));

  lines.push("");
  lines.push(ph.hLayout);
  if (groups.length === 0) {
    lines.push(ph.empty);
  } else if (frames.length > 0) {
    if (frames.length > 1) lines.push(ph.windows(frames.map((f) => q(f.name || ph.window))));
    frames.forEach((f, i) => {
      const gs = byFrame.get(f.id) ?? [];
      if (i > 0 || frames.length > 1) lines.push("");
      if (hasText(f.note)) lines.push(lang === "en" ? `${trimEnd(f.note!)}.` : `${trimEnd(f.note!)}。`);
      lines.push(
        ph.windowHead(
          q(f.name || ph.window),
          `${frameW(f)}×${frameH(f)}`,
          f.bg && f.bg !== "background" ? TOKEN_NAMES[f.bg] ?? f.bg : undefined,
          gs.length > 0,
        ),
      );
      describeWindow(lines, gs, { l: f.x, t: f.y, r: f.x + frameW(f), b: f.y + frameH(f) }, widths, lang);
    });
    if (loose.length && !only) {
      lines.push("");
      lines.push(ph.loose);
      describeWindow(lines, loose, null, widths, lang);
    }
  } else {
    lines.push(ph.freeform);
    describeWindow(lines, groups, null, widths, lang);
  }

  const behavior = groups.flatMap((g) => notes(g, allFrames, lang));
  if (behavior.length) {
    lines.push("");
    lines.push(ph.hBehavior);
    for (const n of behavior) lines.push(`- ${n}`);
  }

  if (kindsUsed.length) {
    lines.push("");
    lines.push(ph.hParts);
    lines.push(API_HEAD[lang]);
    for (const kind of kindsUsed) {
      const spec = KIND_SPEC[kind];
      const noun = KIND_TEXT[lang][kind]?.noun ?? kind;
      const note = KIND_NOTES[lang][kind];
      lines.push(`- ${noun}: \`${spec.api}\`${note ? ` — ${note}` : ""}`);
    }
  }

  lines.push("");
  lines.push(ph.hGeneral);
  for (const s of GENERAL[lang]) lines.push(`- ${s}`);
  return lines.join("\n");
}

/** the prompt to hand out: the author's edited text when there is one, otherwise the generated one */
export const effectivePrompt = (doc: Doc, widths: Record<string, number>, lang: Lang = getLang()): string =>
  doc.promptEdit !== undefined ? doc.promptEdit : buildPrompt(doc, widths, undefined, lang);
