"use client";

import { createContext, useContext } from "react";

export type Lang = "ja" | "en" | "zh";
export const LANGS: { key: Lang; label: string }[] = [
  { key: "ja", label: "日本語" },
  { key: "en", label: "English" },
  { key: "zh", label: "中文" },
];
export const isLang = (v: unknown): v is Lang => v === "ja" || v === "en" || v === "zh";

/** The language the module starts in, which is what the server renders with. */
export const DEFAULT_LANG: Lang = "ja";

/* A module-level copy lets non-React helpers (item defaults, prompt text)
 * follow the language without threading it through every call. */
let current: Lang = DEFAULT_LANG;
export const getLang = () => current;
export const setGlobalLang = (l: Lang) => {
  current = l;
};

export const LangContext = createContext<Lang>("ja");
export const useLang = () => useContext(LangContext);

type Str = { ja: string; en: string; zh: string };

const UI = {
  // panels
  parts: { ja: "部品", en: "Parts", zh: "组件" },
  layers: { ja: "レイヤー", en: "Layers", zh: "图层" },
  edit: { ja: "編集", en: "Edit", zh: "编辑" },
  prompt: { ja: "プロンプト", en: "Prompt", zh: "提示词" },
  closePanel: { ja: "パネルを閉じる", en: "Close panel", zh: "关闭面板" },
  search: { ja: "検索", en: "Search", zh: "搜索" },
  favorites: { ja: "お気に入り", en: "Favorites", zh: "收藏" },
  addFavorite: { ja: "お気に入りに追加", en: "Add to favorites", zh: "添加到收藏" },
  removeFavorite: { ja: "お気に入りから外す", en: "Remove from favorites", zh: "取消收藏" },
  clear: { ja: "クリア", en: "Clear", zh: "清除" },
  language: { ja: "言語", en: "Language", zh: "语言" },
  // toolbar
  select: { ja: "選択 (V)", en: "Select (V)", zh: "选择 (V)" },
  hand: { ja: "手のひら (H / Space)", en: "Hand (H / Space)", zh: "抓手 (H / Space)" },
  blank: { ja: "白紙", en: "Blank canvas", zh: "空白画布" },
  window: { ja: "ウィンドウ", en: "App windows", zh: "应用窗口" },
  addFrame: { ja: "ウィンドウを追加", en: "Add window", zh: "添加窗口" },
  preview: { ja: "プレビュー (P)", en: "Preview (P)", zh: "预览 (P)" },
  zoomIn: { ja: "拡大 (+)", en: "Zoom in (+)", zh: "放大 (+)" },
  zoomOut: { ja: "縮小 (-)", en: "Zoom out (-)", zh: "缩小 (-)" },
  fit: { ja: "全体を表示 (0)", en: "Fit (0)", zh: "适应窗口 (0)" },
  undo: { ja: "元に戻す (Ctrl+Z)", en: "Undo (Ctrl+Z)", zh: "撤销 (Ctrl+Z)" },
  redo: { ja: "やり直す (Ctrl+Shift+Z)", en: "Redo (Ctrl+Shift+Z)", zh: "重做 (Ctrl+Shift+Z)" },
  clearAll: { ja: "すべて消す", en: "Clear canvas", zh: "全部清除" },
  clearAllTitle: { ja: "すべて消しますか？", en: "Clear the canvas?", zh: "要全部清除吗？" },
  clearAllBody: {
    ja: "すべてのウィンドウと部品を削除します。元に戻す (Ctrl+Z) で復元できます。",
    en: "Every window and part will be removed. Undo (Ctrl+Z) can bring them back.",
    zh: "将删除所有窗口和组件。可以用撤销 (Ctrl+Z) 恢复。",
  },
  // inspector
  screen: { ja: "ウィンドウ", en: "Window", zh: "窗口" },
  screenName: { ja: "ウィンドウの名前", en: "Window name", zh: "窗口名称" },
  name: { ja: "名前", en: "Name", zh: "名称" },
  background: { ja: "背景", en: "Background", zh: "背景" },
  export: { ja: "書き出し", en: "Export", zh: "导出" },
  project: { ja: "プロジェクト", en: "Project", zh: "项目" },
  saveProject: { ja: "プロジェクトを保存", en: "Save project", zh: "保存项目" },
  openProject: { ja: "プロジェクトを開く", en: "Open project", zh: "打开项目" },
  replaceProjectTitle: { ja: "プロジェクトを開きますか？", en: "Open this project?", zh: "要打开这个项目吗？" },
  replaceProject: {
    ja: "現在のキャンバスは置き換えられ、元に戻す (Ctrl+Z) では戻れません。先に保存しておくと安全です。",
    en: "The current canvas will be replaced, and undo (Ctrl+Z) cannot bring it back. Save it first to be safe.",
    zh: "当前画布将被替换，且无法用撤销 (Ctrl+Z) 恢复。建议先保存。",
  },
  invalidProject: {
    ja: "プロジェクトファイルを開けませんでした。",
    en: "Could not open the project file.",
    zh: "无法打开项目文件。",
  },
  copied: { ja: "コピーしました", en: "Copied", zh: "已复制" },
  saveImage: { ja: "画像で保存", en: "Save as image", zh: "保存为图片" },
  saving: { ja: "保存中…", en: "Saving…", zh: "保存中…" },
  previewFrom: { ja: "このウィンドウからプレビュー", en: "Preview from this window", zh: "从此窗口预览" },
  duplicate: { ja: "複製", en: "Duplicate", zh: "复制" },
  duplicateKey: { ja: "複製 (Ctrl+D)", en: "Duplicate (Ctrl+D)", zh: "复制 (Ctrl+D)" },
  delete: { ja: "削除 (Delete)", en: "Delete (Delete)", zh: "删除 (Delete)" },
  deleteSelection: { ja: "選択を削除", en: "Delete selection", zh: "删除所选" },
  text: { ja: "テキスト", en: "Text", zh: "文本" },
  label: { ja: "ラベル", en: "Label", zh: "标签" },
  bold: { ja: "太字", en: "Bold", zh: "粗体" },
  action: { ja: "アクション", en: "Action", zh: "操作" },
  supporting: { ja: "サブテキスト", en: "Supporting text", zh: "辅助文本" },
  tabs: { ja: "項目", en: "Items", zh: "项目" },
  changeIcon: { ja: "アイコンを変更", en: "Change icon", zh: "更改图标" },
  icon: { ja: "アイコン", en: "Icon", zh: "图标" },
  noIcon: { ja: "アイコンなし", en: "No icon", zh: "无图标" },
  searchIcons: { ja: "アイコンを検索", en: "Search icons", zh: "搜索图标" },
  noBackground: { ja: "背景なし", en: "No background", zh: "无背景" },
  image: { ja: "画像", en: "Image", zh: "图片" },
  pickImage: { ja: "画像を選ぶ", en: "Choose image", zh: "选择图片" },
  removeImage: { ja: "画像を外す", en: "Remove image", zh: "移除图片" },
  determinate: { ja: "確定", en: "Determinate", zh: "确定进度" },
  normalState: { ja: "通常", en: "Normal", zh: "常态" },
  onState: { ja: "オン", en: "On", zh: "开启" },
  onStateHint: { ja: "オンのときの文字・アイコン・スタイル", en: "Text, icon and style when on", zh: "开启时的文字、图标和样式" },
  iconSetHint: {
    ja: "gpui-kit が同梱する Lucide アイコンだけを選べます。プロンプトには IconName で書き出されます。",
    en: "Only the Lucide icons gpui-kit ships. The prompt quotes them as IconName variants.",
    zh: "仅包含 gpui-kit 自带的 Lucide 图标，提示词中会写成 IconName 变体。",
  },
  style: { ja: "スタイル", en: "Style", zh: "样式" },
  state: { ja: "状態", en: "State", zh: "状态" },
  selected: { ja: "選択", en: "Selected", zh: "已选中" },
  on: { ja: "オン", en: "On", zh: "开" },
  disabled: { ja: "無効", en: "Disabled", zh: "禁用" },
  size: { ja: "サイズ", en: "Size", zh: "尺寸" },
  width: { ja: "幅", en: "Width", zh: "宽度" },
  height: { ja: "高さ", en: "Height", zh: "高度" },
  fontSize: { ja: "文字サイズ", en: "Font size", zh: "字号" },
  cornerRadius: { ja: "角丸", en: "Corner radius", zh: "圆角" },
  cornerTop: { ja: "上の角丸", en: "Top corners", zh: "上方圆角" },
  cornerBottom: { ja: "下の角丸", en: "Bottom corners", zh: "下方圆角" },
  windowWidth: { ja: "ウィンドウいっぱい", en: "Full window", zh: "整个窗口" },
  contentWidth: { ja: "左右 16px の余白", en: "16px side padding", zh: "左右 16px 内边距" },
  halfWidth: { ja: "2 列に並べる幅", en: "Half a row (two columns)", zh: "两列宽" },
  sidebarWidth: { ja: "サイドバーの幅", en: "Sidebar width", zh: "侧栏宽度" },
  windowHeight: { ja: "ウィンドウの高さ", en: "Full height", zh: "整个高度" },
  halfHeight: { ja: "ウィンドウの半分", en: "Half the window", zh: "半个窗口" },
  windowSize: { ja: "ウィンドウのサイズ", en: "Window size", zh: "窗口尺寸" },
  clickTo: { ja: "クリックで移動", en: "Click to open", zh: "点击跳转" },
  none: { ja: "なし", en: "None", zh: "无" },
  goBack: { ja: "戻る", en: "Back", zh: "返回" },
  toggle: { ja: "切り替えボタン", en: "Toggle button", zh: "切换按钮" },
  toggleHint: { ja: "クリックでオン／オフ", en: "Click toggles on / off", zh: "点击切换开/关" },
  shortcut: { ja: "ショートカット", en: "Shortcut", zh: "快捷键" },
  shortcutHint: {
    ja: "この操作のキーバインド。プロンプトでは actions! と bind_keys として要求されます。",
    en: "The keybinding for this command. The prompt asks for it as an action and bind_keys entry.",
    zh: "该操作的快捷键。提示词会要求生成对应的 action 与 bind_keys。",
  },
  behavior: { ja: "振る舞い", en: "Behavior", zh: "行为" },
  whenPressed: { ja: "押したとき…", en: "When pressed…", zh: "按下时…" },
  whatItDoes: { ja: "この部品の動き…", en: "What this part does…", zh: "这个组件的作用…" },
  removeLink: { ja: "リンクを外す", en: "Remove link", zh: "移除链接" },
  group: { ja: "グループ", en: "Group", zh: "组" },
  makeGroup: { ja: "グループ化", en: "Group", zh: "编组" },
  ungroup: { ja: "グループ解除", en: "Ungroup", zh: "取消编组" },
  selectedParts: { ja: "個を選択中", en: "selected", zh: "个已选中" },
  groupHint: {
    ja: "重なりを保ったまま、ひとつのレイヤーとして一緒に動かせます",
    en: "Keeps the overlap and moves as one layer",
    zh: "保持叠放关系，作为一个图层一起移动",
  },
  groupEditNote: { ja: "中の部品を編集するにはグループを解除してください", en: "Ungroup to edit the parts inside", zh: "要编辑其中的组件，请先取消编组" },
  openPanel: { ja: "パネルを開く", en: "Open panel", zh: "打开面板" },
  colors: { ja: "カラー", en: "Colors", zh: "配色" },
  templates: { ja: "テーマ", en: "Themes", zh: "主题" },
  customColor: { ja: "カスタム", en: "Custom", zh: "自定义" },
  themeHint: {
    ja: "gpui-kit が同梱するテーマです。選ぶとそのテーマ名がプロンプトに入ります。",
    en: "The themes gpui-kit ships. The one you pick is named in the prompt.",
    zh: "这些是 gpui-kit 自带的主题，所选主题会写入提示词。",
  },
  useThis: { ja: "このテーマにする", en: "Use it", zh: "使用" },
  fineTune: { ja: "細かく調整", en: "Fine-tune", zh: "微调" },
  closeBtn: { ja: "閉じる", en: "Close", zh: "关闭" },
  screens: { ja: "ウィンドウを選ぶ", en: "Choose window", zh: "选择窗口" },
  // layers
  layerUp: { ja: "前面へ", en: "Bring forward", zh: "上移一层" },
  layerDown: { ja: "背面へ", en: "Send backward", zh: "下移一层" },
  noLayers: { ja: "このウィンドウには部品がありません", en: "Nothing in this window yet", zh: "此窗口还没有组件" },
  // prompt panel
  brief: { ja: "このアプリの説明…", en: "What this app is…", zh: "这个应用的说明…" },
  appName: { ja: "アプリの名前", en: "App name", zh: "应用名称" },
  copyPrompt: { ja: "プロンプトをコピー", en: "Copy prompt", zh: "复制提示词" },
  promptTargetHint: {
    ja: "実装先は gpui-kit（Rust のデスクトップアプリ）です。プロンプトは先に gpui-kit のスキルかドキュメントを読むよう指示します。",
    en: "The target is gpui-kit, a Rust desktop app. The prompt tells the tool to read the gpui-kit skills or docs first.",
    zh: "实现目标是 gpui-kit（Rust 桌面应用）。提示词会要求先阅读 gpui-kit 的 skill 或官方文档。",
  },
  // preview
  back: { ja: "戻る", en: "Back", zh: "返回" },
  close: { ja: "閉じる (Esc)", en: "Close (Esc)", zh: "关闭 (Esc)" },
  // parts content
  cancel: { ja: "キャンセル", en: "Cancel", zh: "取消" },
  ok: { ja: "OK", en: "OK", zh: "确定" },
  confirmVerb: { ja: "確定ボタンの文言", en: "Commit verb", zh: "确认按钮文字" },
  deleteVerb: { ja: "削除", en: "Delete", zh: "删除" },
  placeholderHint: {
    ja: "入力欄のラベルはプレースホルダーです。項目名は Label 部品として別に置きます。",
    en: "An input's label is its placeholder; the field's name is a separate Label part.",
    zh: "输入框的标签即占位文本；字段名称请单独使用 Label 组件。",
  },
  save: { ja: "保存", en: "Save", zh: "保存" },
  leading: { ja: "先頭", en: "Leading", zh: "前置" },
  trailing: { ja: "末尾", en: "Trailing", zh: "后置" },
  // frames
  home: { ja: "メイン", en: "Main", zh: "主窗口" },
  screenN: { ja: "ウィンドウ", en: "Window", zh: "窗口" },
  copySuffix: { ja: " コピー", en: " copy", zh: " 副本" },
  // mobile
  mobileNote: { ja: "フル機能は PC のブラウザで使えます", en: "Full features on a desktop browser", zh: "完整功能请在电脑浏览器中使用" },
  addButton: { ja: "ボタンを追加", en: "Add button", zh: "添加按钮" },
  done: { ja: "完了", en: "Done", zh: "完成" },
  theme: { ja: "テーマ", en: "Theme", zh: "主题" },
  settings: { ja: "テーマと設定", en: "Theme and settings", zh: "主题与设置" },
  // theme panel
  shape: { ja: "角丸", en: "Radius", zh: "圆角" },
  typography: { ja: "タイポグラフィ", en: "Type", zh: "字体" },
  motion: { ja: "モーション", en: "Motion", zh: "动效" },
  brightness: { ja: "明るさ", en: "Brightness", zh: "明暗" },
  light: { ja: "ライト", en: "Light", zh: "浅色" },
  dark: { ja: "ダーク", en: "Dark", zh: "深色" },
  bothModes: { ja: "両対応", en: "Both", zh: "两者" },
  bothModesHint: {
    ja: "OS の設定に合わせて切り替えます。キャンバスは選んだ側を表示します。",
    en: "Follows the system setting; the canvas shows the mode you picked.",
    zh: "跟随系统设置切换，画布显示所选的模式。",
  },
  radiusScale: { ja: "角丸の度合い", en: "Corner roundness", zh: "圆角程度" },
  radiusSquare: { ja: "スクエア (0px)", en: "Square (0px)", zh: "方形 (0px)" },
  radiusDefault: { ja: "標準 (6px)", en: "Default (6px)", zh: "标准 (6px)" },
  radiusRound: { ja: "丸め (10px)", en: "Round (10px)", zh: "圆润 (10px)" },
  radiusHint: {
    ja: "テーマの radius と radius.lg をまとめて変えます。部品ごとに入力した角丸はそのまま残ります。",
    en: "Sets the theme's radius and radius.lg together. A radius you typed on a part stays as it is.",
    zh: "同时设置主题的 radius 与 radius.lg。已为单个组件输入的圆角保持不变。",
  },
  fontFamily: { ja: "書体", en: "Typeface", zh: "字体" },
  density: { ja: "密度", en: "Density", zh: "密度" },
  densityCompact: { ja: "コンパクト (small)", en: "Compact (small)", zh: "紧凑 (small)" },
  densityDefault: { ja: "標準 (medium)", en: "Default (medium)", zh: "标准 (medium)" },
  densityComfortable: { ja: "ゆったり (large)", en: "Comfortable (large)", zh: "宽松 (large)" },
  densityHint: {
    ja: "部品の既定サイズです。ツールバーやデータ中心の画面はコンパクトが向いています。",
    en: "The default component size. Toolbars and data-dense screens suit compact.",
    zh: "组件的默认尺寸。工具栏和数据密集界面适合紧凑。",
  },
  shadow: { ja: "影", en: "Shadow", zh: "阴影" },
  shadowHint: {
    ja: "テーマの shadow です。ボタンやポップオーバーの影を切り替えます。",
    en: "The theme's shadow flag; toggles the shadow on buttons and popovers.",
    zh: "主题的 shadow 开关，控制按钮与浮层的阴影。",
  },
  focusRing: { ja: "フォーカスリング", en: "Focus ring", zh: "焦点环" },
  focusRingHint: {
    ja: "キーボード操作の可視化です。切るとアクセシビリティを損ないます。",
    en: "Makes keyboard focus visible. Turning it off costs accessibility.",
    zh: "让键盘焦点可见，关闭会损害可访问性。",
  },
  motionScheme: { ja: "動きの種類", en: "Motion", zh: "动效" },
  motionDefault: { ja: "標準", en: "Default", zh: "标准" },
  motionReduced: { ja: "控えめ", en: "Reduced", zh: "减弱" },
  motionHint: {
    ja: "控えめにすると遷移は即座に切り替わります。プレビューとプロンプトに反映されます。",
    en: "Reduced switches views instantly. It drives the preview and the prompt.",
    zh: "减弱后视图会立即切换，作用于预览和提示词。",
  },
  tryIt: { ja: "クリックして確認", en: "Click to try", zh: "点击试试" },
  // tidy
  tidy: { ja: "整える", en: "Tidy", zh: "整理" },
  tidyUndo: { ja: "整える前に戻す", en: "Undo tidy", zh: "撤销整理" },
  tidyDone: { ja: "すでに整っています", en: "Already tidy", zh: "已经整齐" },
  // window description
  description: { ja: "説明", en: "Description", zh: "说明" },
  screenDescription: { ja: "このウィンドウの目的", en: "What this window is for", zh: "这个窗口的用途" },
  // shell regions
  shell: { ja: "ウィンドウ構成", en: "Window shell", zh: "窗口结构" },
  shellSingle: { ja: "単一ワークスペース", en: "Single workspace", zh: "单一工作区" },
  shellSidebar: { ja: "サイドバー", en: "Sidebar workspace", zh: "侧栏工作区" },
  shellMasterDetail: { ja: "一覧と詳細", en: "Master–detail", zh: "列表与详情" },
  shellDocument: { ja: "タブ（ドキュメント）", en: "Document workspace", zh: "文档标签" },
  shellUtility: { ja: "ユーティリティ", en: "Utility window", zh: "工具窗口" },
  shellHint: {
    ja: "gpui-kit の Design Guides が挙げる 5 つの骨格です。プロンプトはこの骨格を最初に指示します。",
    en: "The five shells the gpui-kit Design Guides name. The prompt states the shell first.",
    zh: "gpui-kit 设计规范列出的五种骨架，提示词会首先说明所选骨架。",
  },
  columns: { ja: "列", en: "Columns", zh: "列" },
  rows: { ja: "行", en: "Rows", zh: "行" },
  addRow: { ja: "行を追加", en: "Add row", zh: "添加行" },
  addColumn: { ja: "列を追加", en: "Add column", zh: "添加列" },
  numeric: { ja: "数値（右寄せ）", en: "Numeric (right-aligned)", zh: "数值（右对齐）" },
  placeholder: { ja: "プレースホルダー", en: "Placeholder", zh: "占位文本" },
  side: { ja: "位置", en: "Side", zh: "位置" },
  sideLeft: { ja: "左", en: "Left", zh: "左" },
  sideRight: { ja: "右", en: "Right", zh: "右" },
  sideTop: { ja: "上", en: "Top", zh: "上" },
  sideBottom: { ja: "下", en: "Bottom", zh: "下" },
  collapsed: { ja: "折りたたむ", en: "Collapsed", zh: "折叠" },
  windowControls: { ja: "ウィンドウ操作ボタン", en: "Window controls", zh: "窗口控件" },
  controlsMac: { ja: "macOS（左）", en: "macOS (left)", zh: "macOS（左侧）" },
  controlsWin: { ja: "Windows（右）", en: "Windows (right)", zh: "Windows（右侧）" },
  controlsNone: { ja: "なし", en: "None", zh: "无" },
  value: { ja: "値", en: "Value", zh: "数值" },
  indeterminate: { ja: "不確定", en: "Indeterminate", zh: "不确定" },
  circle: { ja: "円形", en: "Circle", zh: "圆形" },
  // ai
  ai: { ja: "AI", en: "AI", zh: "AI" },
  promptReset: { ja: "生成されたプロンプトに戻す", en: "Back to the generated prompt", zh: "恢复为生成的提示词" },
  aiWriteShort: { ja: "AI で書く", en: "Write with AI", zh: "AI 撰写" },
  aiWrite: { ja: "AI に書いてもらう", en: "Let the AI write it", zh: "让 AI 来写" },
  aiSettings: { ja: "AI の設定", en: "AI settings", zh: "AI 设置" },
  aiProvider: { ja: "プロバイダ", en: "Provider", zh: "服务商" },
  aiBaseUrl: { ja: "ベース URL", en: "Base URL", zh: "基础 URL" },
  aiModel: { ja: "モデル ID", en: "Model ID", zh: "模型 ID" },
  aiKey: { ja: "API キー", en: "API key", zh: "API 密钥" },
  aiGetKey: { ja: "キーを取得", en: "Get a key", zh: "获取密钥" },
  aiKeyHint: {
    ja: "キーはこのブラウザにだけ保存され、プロバイダへ直接送られます。",
    en: "Stored only in this browser and sent straight to the provider.",
    zh: "密钥只保存在此浏览器中，并直接发送给服务商。",
  },
  aiRestore: { ja: "AI の前と切り替える", en: "Switch between the AI rewrite and the original", zh: "在 AI 改写与原文之间切换" },
  aiApplied: { ja: "適用しました", en: "Applied", zh: "已应用" },
  aiSelectScreen: { ja: "先にウィンドウを選んでください", en: "Select a window first", zh: "请先选择一个窗口" },
  aiNoKey: { ja: "AI タブでキーを入れると使えます", en: "Add a key in the AI tab to use this", zh: "在 AI 标签页中填写密钥后即可使用" },
  aiError: { ja: "AI の呼び出しに失敗しました", en: "The AI request failed", zh: "AI 请求失败" },
  aiErrorRefusal: { ja: "モデルが回答を拒否しました", en: "The model declined to answer", zh: "模型拒绝回答" },
  aiErrorJson: { ja: "モデルの返答を読み取れませんでした", en: "The model's reply could not be read", zh: "无法解析模型的回复" },
  aiErrorModel: { ja: "モデル ID を入力してください", en: "Enter a model ID", zh: "请输入模型 ID" },
  aiErrorInsecure: { ja: "ベース URL は https か localhost にしてください", en: "The base URL must use https or point at localhost", zh: "基础 URL 必须使用 https 或指向 localhost" },
  aiErrorNetwork: {
    ja: "接続できませんでした。URL、ネットワーク、CORS の設定を確認してください",
    en: "Could not connect. Check the URL, the network and the server's CORS settings",
    zh: "无法连接。请检查 URL、网络和服务器的 CORS 设置",
  },
} as const satisfies Record<string, Str>;

export type UIKey = keyof typeof UI;

export const t = (key: UIKey, lang: Lang = current): string => UI[key][lang];

/* ---- part defaults and nouns ---- */

export const KIND_TEXT: Record<
  Lang,
  Record<string, { noun: string; label?: string; supporting?: string }>
> = {
  ja: {
    titleBar: { noun: "タイトルバー", label: "アプリ" },
    sidebar: { noun: "サイドバー", label: "ナビゲーション" },
    toolbar: { noun: "ツールバー" },
    statusBar: { noun: "ステータスバー", label: "準備完了", supporting: "3 件" },
    breadcrumb: { noun: "パンくずリスト" },
    button: { noun: "ボタン", label: "ボタン" },
    iconButton: { noun: "アイコンボタン" },
    buttonGroup: { noun: "ボタングループ" },
    menu: { noun: "メニュー", label: "メニュー" },
    input: { noun: "入力欄", label: "検索…", supporting: "" },
    textarea: { noun: "複数行入力", label: "詳細を入力…", supporting: "" },
    select: { noun: "セレクト", label: "選択してください" },
    checkbox: { noun: "チェックボックス", label: "同意する" },
    radio: { noun: "ラジオグループ", label: "選択肢" },
    switch: { noun: "スイッチ", label: "通知" },
    slider: { noun: "スライダー", label: "音量" },
    label: { noun: "ラベル", label: "ラベル" },
    panel: { noun: "パネル" },
    groupBox: { noun: "グループボックス", label: "設定" },
    tabs: { noun: "タブ" },
    resizable: { noun: "リサイズ可能な分割" },
    dialog: { noun: "ダイアログ", label: "「Roadmap」を削除しますか？", supporting: "この操作は取り消せません。" },
    sheet: { noun: "シート", label: "詳細" },
    popover: { noun: "ポップオーバー", label: "ポップオーバー", supporting: "補足の説明がここに入ります。" },
    notification: { noun: "通知", label: "保存しました", supporting: "変更はすべて反映されています。" },
    list: { noun: "リスト" },
    dataTable: { noun: "データテーブル" },
    tree: { noun: "ツリー" },
    text: { noun: "テキスト", label: "見出し" },
    icon: { noun: "アイコン" },
    image: { noun: "画像" },
    separator: { noun: "セパレーター" },
    badge: { noun: "バッジ", label: "3" },
    tag: { noun: "タグ", label: "タグ" },
    alert: { noun: "アラート", label: "確認が必要です", supporting: "続ける前に入力を確認してください。" },
    progress: { noun: "プログレス" },
    spinner: { noun: "スピナー" },
    skeleton: { noun: "スケルトン" },
    combobox: { noun: "コンボボックス", label: "検索して選ぶ" },
    colorPicker: { noun: "カラーピッカー", label: "#3b82f6" },
    datePicker: { noun: "日付ピッカー", label: "2026-09-04" },
    calendar: { noun: "カレンダー", label: "2026年9月" },
    form: { noun: "フォーム" },
    rating: { noun: "レーティング" },
    settings: { noun: "設定ページ", label: "一般" },
    avatar: { noun: "アバター", label: "AB" },
    kbd: { noun: "キー表示", label: "cmd-s" },
    link: { noun: "リンク", label: "gpui-kit.com", supporting: "https://gpui-kit.com" },
    marker: { noun: "マーカー", label: "実行中" },
    clipboard: { noun: "コピーボタン", label: "npm run deploy" },
    shimmer: { noun: "シマーテキスト", label: "考えています…" },
    descriptionList: { noun: "定義リスト" },
    accordion: { noun: "アコーディオン" },
    collapsible: { noun: "折りたたみ", label: "詳細設定", supporting: "この中にあと 2 つの項目があります。" },
    pagination: { noun: "ページネーション" },
    stepper: { noun: "ステッパー" },
    dock: { noun: "ドックエリア" },
    scrollbar: { noun: "スクロールバー" },
    tooltip: { noun: "ツールチップ", label: "プロジェクトを保存" },
    hoverCard: { noun: "ホバーカード", label: "Ada Lovelace", supporting: "1843 年から · プロジェクト 12 件" },
    command: { noun: "コマンドパレット", label: "コマンドを入力…" },
    chart: { noun: "チャート", label: "日ごとのビルド数" },
    message: { noun: "メッセージ", label: "Ada", supporting: "ビルドは 42 秒で完了しました。" },
    bubble: { noun: "吹き出し", label: "main でもう一度実行してもらえますか？" },
    attachment: { noun: "添付ファイル", label: "build-log.txt", supporting: "18 KB" },
    messageScroller: { noun: "メッセージスクローラー" },
  },
  en: {
    titleBar: { noun: "title bar", label: "App" },
    sidebar: { noun: "sidebar", label: "Navigation" },
    toolbar: { noun: "toolbar" },
    statusBar: { noun: "status bar", label: "Ready", supporting: "3 items" },
    breadcrumb: { noun: "breadcrumb" },
    button: { noun: "button", label: "Button" },
    iconButton: { noun: "icon button" },
    buttonGroup: { noun: "button group" },
    menu: { noun: "menu", label: "Menu" },
    input: { noun: "input", label: "Search…", supporting: "" },
    textarea: { noun: "textarea", label: "Add the details…", supporting: "" },
    select: { noun: "select", label: "Choose one" },
    checkbox: { noun: "checkbox", label: "I agree" },
    radio: { noun: "radio group", label: "Option" },
    switch: { noun: "switch", label: "Notifications" },
    slider: { noun: "slider", label: "Volume" },
    label: { noun: "label", label: "Label" },
    panel: { noun: "panel" },
    groupBox: { noun: "group box", label: "Settings" },
    tabs: { noun: "tabs" },
    resizable: { noun: "resizable split" },
    dialog: { noun: "dialog", label: 'Delete "Roadmap"?', supporting: "This cannot be undone." },
    sheet: { noun: "sheet", label: "Details" },
    popover: { noun: "popover", label: "Popover", supporting: "Supporting copy goes here." },
    notification: { noun: "notification", label: "Saved", supporting: "Every change is in place." },
    list: { noun: "list" },
    dataTable: { noun: "data table" },
    tree: { noun: "tree" },
    text: { noun: "text", label: "Headline" },
    icon: { noun: "icon" },
    image: { noun: "image" },
    separator: { noun: "separator" },
    badge: { noun: "badge", label: "3" },
    tag: { noun: "tag", label: "Tag" },
    alert: { noun: "alert", label: "Check this first", supporting: "Review the input before continuing." },
    progress: { noun: "progress indicator" },
    spinner: { noun: "spinner" },
    skeleton: { noun: "skeleton" },
    combobox: { noun: "combobox", label: "Search or pick" },
    colorPicker: { noun: "color picker", label: "#3b82f6" },
    datePicker: { noun: "date picker", label: "2026-09-04" },
    calendar: { noun: "calendar", label: "September 2026" },
    form: { noun: "form" },
    rating: { noun: "rating" },
    settings: { noun: "settings page", label: "General" },
    avatar: { noun: "avatar", label: "AB" },
    kbd: { noun: "keyboard key", label: "cmd-s" },
    link: { noun: "link", label: "gpui-kit.com", supporting: "https://gpui-kit.com" },
    marker: { noun: "marker", label: "Running" },
    clipboard: { noun: "copy button", label: "npm run deploy" },
    shimmer: { noun: "shimmer text", label: "Thinking…" },
    descriptionList: { noun: "description list" },
    accordion: { noun: "accordion" },
    collapsible: { noun: "collapsible", label: "Advanced", supporting: "Two more options live in here." },
    pagination: { noun: "pagination" },
    stepper: { noun: "stepper" },
    dock: { noun: "dock area" },
    scrollbar: { noun: "scrollbar" },
    tooltip: { noun: "tooltip", label: "Save the project" },
    hoverCard: { noun: "hover card", label: "Ada Lovelace", supporting: "Joined in 1843 · 12 projects" },
    command: { noun: "command palette", label: "Type a command…" },
    chart: { noun: "chart", label: "Builds per day" },
    message: { noun: "message", label: "Ada", supporting: "The build finished in 42 seconds." },
    bubble: { noun: "bubble", label: "Can you rerun it on main?" },
    attachment: { noun: "attachment", label: "build-log.txt", supporting: "18 KB" },
    messageScroller: { noun: "message scroller" },
  },
  zh: {
    titleBar: { noun: "标题栏", label: "应用" },
    sidebar: { noun: "侧边栏", label: "导航" },
    toolbar: { noun: "工具栏" },
    statusBar: { noun: "状态栏", label: "就绪", supporting: "3 项" },
    breadcrumb: { noun: "面包屑" },
    button: { noun: "按钮", label: "按钮" },
    iconButton: { noun: "图标按钮" },
    buttonGroup: { noun: "按钮组" },
    menu: { noun: "菜单", label: "菜单" },
    input: { noun: "输入框", label: "搜索…", supporting: "" },
    textarea: { noun: "多行输入框", label: "请填写详细内容…", supporting: "" },
    select: { noun: "下拉选择", label: "请选择" },
    checkbox: { noun: "复选框", label: "我同意" },
    radio: { noun: "单选组", label: "选项" },
    switch: { noun: "开关", label: "通知" },
    slider: { noun: "滑块", label: "音量" },
    label: { noun: "标签", label: "标签" },
    panel: { noun: "面板" },
    groupBox: { noun: "分组框", label: "设置" },
    tabs: { noun: "标签页" },
    resizable: { noun: "可调分栏" },
    dialog: { noun: "对话框", label: "删除「Roadmap」？", supporting: "此操作无法撤销。" },
    sheet: { noun: "抽屉面板", label: "详情" },
    popover: { noun: "浮层", label: "浮层", supporting: "这里是补充说明。" },
    notification: { noun: "通知", label: "已保存", supporting: "所有更改都已生效。" },
    list: { noun: "列表" },
    dataTable: { noun: "数据表格" },
    tree: { noun: "树" },
    text: { noun: "文本", label: "标题" },
    icon: { noun: "图标" },
    image: { noun: "图片" },
    separator: { noun: "分隔线" },
    badge: { noun: "徽标", label: "3" },
    tag: { noun: "标签块", label: "标签" },
    alert: { noun: "提示条", label: "请先确认", supporting: "继续之前请检查输入内容。" },
    progress: { noun: "进度条" },
    spinner: { noun: "加载指示器" },
    skeleton: { noun: "骨架屏" },
    combobox: { noun: "可搜索下拉框", label: "搜索或选择" },
    colorPicker: { noun: "颜色选择器", label: "#3b82f6" },
    datePicker: { noun: "日期选择器", label: "2026-09-04" },
    calendar: { noun: "日历", label: "2026 年 9 月" },
    form: { noun: "表单" },
    rating: { noun: "评分" },
    settings: { noun: "设置页", label: "通用" },
    avatar: { noun: "头像", label: "AB" },
    kbd: { noun: "按键", label: "cmd-s" },
    link: { noun: "链接", label: "gpui-kit.com", supporting: "https://gpui-kit.com" },
    marker: { noun: "状态标记", label: "运行中" },
    clipboard: { noun: "复制按钮", label: "npm run deploy" },
    shimmer: { noun: "微光文本", label: "思考中…" },
    descriptionList: { noun: "描述列表" },
    accordion: { noun: "手风琴" },
    collapsible: { noun: "折叠区", label: "高级", supporting: "这里面还有两个选项。" },
    pagination: { noun: "分页" },
    stepper: { noun: "步骤条" },
    dock: { noun: "停靠区" },
    scrollbar: { noun: "滚动条" },
    tooltip: { noun: "工具提示", label: "保存项目" },
    hoverCard: { noun: "悬浮卡片", label: "Ada Lovelace", supporting: "1843 年加入 · 12 个项目" },
    command: { noun: "命令面板", label: "输入命令…" },
    chart: { noun: "图表", label: "每日构建数" },
    message: { noun: "消息", label: "Ada", supporting: "构建在 42 秒内完成。" },
    bubble: { noun: "气泡", label: "能在 main 上重跑一次吗？" },
    attachment: { noun: "附件", label: "build-log.txt", supporting: "18 KB" },
    messageScroller: { noun: "消息滚动区" },
  },
};

/* ---- the rows, columns and entries a freshly dropped part starts with ---- */

export const TAB_LABELS: Record<Lang, string[]> = {
  ja: ["概要", "アクティビティ", "設定"],
  en: ["Overview", "Activity", "Settings"],
  zh: ["概览", "动态", "设置"],
};

/** sidebar menu entries; icons are gpui-kit's own Lucide names */
export const SIDEBAR_ITEMS: Record<Lang, { icon: string; label: string }[]> = {
  ja: [
    { icon: "inbox", label: "受信箱" },
    { icon: "folder", label: "プロジェクト" },
    { icon: "chart-pie", label: "レポート" },
    { icon: "settings", label: "設定" },
  ],
  en: [
    { icon: "inbox", label: "Inbox" },
    { icon: "folder", label: "Projects" },
    { icon: "chart-pie", label: "Reports" },
    { icon: "settings", label: "Settings" },
  ],
  zh: [
    { icon: "inbox", label: "收件箱" },
    { icon: "folder", label: "项目" },
    { icon: "chart-pie", label: "报表" },
    { icon: "settings", label: "设置" },
  ],
};

export const MENU_ITEMS: Record<Lang, { icon: string; label: string }[]> = {
  ja: [
    { icon: "file-text", label: "名前を変更" },
    { icon: "copy", label: "複製" },
    { icon: "external-link", label: "新しいウィンドウで開く" },
    { icon: "delete", label: "削除" },
  ],
  en: [
    { icon: "file-text", label: "Rename" },
    { icon: "copy", label: "Duplicate" },
    { icon: "external-link", label: "Open in new window" },
    { icon: "delete", label: "Delete" },
  ],
  zh: [
    { icon: "file-text", label: "重命名" },
    { icon: "copy", label: "复制" },
    { icon: "external-link", label: "在新窗口中打开" },
    { icon: "delete", label: "删除" },
  ],
};

export const LIST_ROWS: Record<Lang, { icon: string; label: string }[]> = {
  ja: [
    { icon: "file-text", label: "設計メモ" },
    { icon: "file-text", label: "リリース計画" },
    { icon: "file-text", label: "議事録" },
    { icon: "file-text", label: "検証結果" },
  ],
  en: [
    { icon: "file-text", label: "Design notes" },
    { icon: "file-text", label: "Release plan" },
    { icon: "file-text", label: "Meeting notes" },
    { icon: "file-text", label: "Test results" },
  ],
  zh: [
    { icon: "file-text", label: "设计笔记" },
    { icon: "file-text", label: "发布计划" },
    { icon: "file-text", label: "会议记录" },
    { icon: "file-text", label: "测试结果" },
  ],
};

export const TREE_NODES: Record<Lang, { icon: string; label: string; depth: number }[]> = {
  ja: [
    { icon: "folder-open", label: "src", depth: 0 },
    { icon: "file", label: "main.rs", depth: 1 },
    { icon: "folder-closed", label: "ui", depth: 1 },
    { icon: "file", label: "Cargo.toml", depth: 0 },
  ],
  en: [
    { icon: "folder-open", label: "src", depth: 0 },
    { icon: "file", label: "main.rs", depth: 1 },
    { icon: "folder-closed", label: "ui", depth: 1 },
    { icon: "file", label: "Cargo.toml", depth: 0 },
  ],
  zh: [
    { icon: "folder-open", label: "src", depth: 0 },
    { icon: "file", label: "main.rs", depth: 1 },
    { icon: "folder-closed", label: "ui", depth: 1 },
    { icon: "file", label: "Cargo.toml", depth: 0 },
  ],
};

export const TABLE_COLUMNS: Record<Lang, { label: string; numeric?: boolean }[]> = {
  ja: [{ label: "名前" }, { label: "状態" }, { label: "更新日" }, { label: "件数", numeric: true }],
  en: [{ label: "Name" }, { label: "Status" }, { label: "Updated" }, { label: "Count", numeric: true }],
  zh: [{ label: "名称" }, { label: "状态" }, { label: "更新时间" }, { label: "数量", numeric: true }],
};

/** a data table's sample rows, one cell per column joined by `ROW_SEP` */
export const TABLE_ROWS: Record<Lang, string[]> = {
  ja: ["Roadmap\t進行中\t3 日前\t12", "Design\tレビュー\t昨日\t4", "Infra\t完了\t先週\t28"],
  en: ["Roadmap\tIn progress\t3 days ago\t12", "Design\tIn review\tYesterday\t4", "Infra\tDone\tLast week\t28"],
  zh: ["Roadmap\t进行中\t3 天前\t12", "Design\t评审中\t昨天\t4", "Infra\t已完成\t上周\t28"],
};

/** form field labels, for the Form part */
export const FORM_FIELDS: Record<Lang, string[]> = {
  ja: ["名前", "メール", "役割"],
  en: ["Name", "Email", "Role"],
  zh: ["名称", "邮箱", "角色"],
};

/** key / value pairs for a DescriptionList, joined by `ROW_SEP` */
export const DESCRIPTION_ITEMS: Record<Lang, string[]> = {
  ja: ["状態\t実行中", "所有者\tAda", "更新\t3 日前"],
  en: ["Status\tRunning", "Owner\tAda", "Updated\t3 days ago"],
  zh: ["状态\t运行中", "负责人\tAda", "更新\t3 天前"],
};

/** series labels for a Chart */
export const CHART_SERIES: Record<Lang, string[]> = {
  ja: ["月", "火", "水", "木", "金"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  zh: ["周一", "周二", "周三", "周四", "周五"],
};

export const BREADCRUMB_TRAIL: Record<Lang, string[]> = {
  ja: ["プロジェクト", "Roadmap", "Q3"],
  en: ["Projects", "Roadmap", "Q3"],
  zh: ["项目", "Roadmap", "Q3"],
};

export const TRANSITION_TEXT: Record<Lang, Record<string, string>> = {
  ja: {
    slide: "右からのスライド",
    slideLeft: "左からのスライド",
    slideUp: "下からのスライド",
    slideDown: "上からのスライド",
    fade: "フェード",
    expand: "拡大",
    none: "アニメーションなし",
  },
  en: {
    slide: "a slide in from the right",
    slideLeft: "a slide in from the left",
    slideUp: "a slide up from the bottom",
    slideDown: "a slide down from the top",
    fade: "a fade",
    expand: "an expand",
    none: "no animation",
  },
  zh: {
    slide: "从右侧滑入",
    slideLeft: "从左侧滑入",
    slideUp: "从底部滑入",
    slideDown: "从顶部滑入",
    fade: "淡入",
    expand: "放大",
    none: "无动画",
  },
};

/* ---- reading starter content back in another language ----
 *
 * A document stores the text a part was created with, so a canvas built before
 * the browser's language was known carries the defaults of whichever language
 * was current then. These tables let that content be re-read in another
 * language while anything the author typed is left exactly as it is. */

/** One built-in default, in every language. Only complete tuples are usable. */
type StringSet = Record<Lang, string>;

function defaultStringSets(): StringSet[] {
  const sets: StringSet[] = [];
  const push = (pick: (l: Lang) => string | undefined) => {
    const set = {} as StringSet;
    for (const { key } of LANGS) {
      const value = pick(key);
      if (!value) return;
      set[key] = value;
    }
    sets.push(set);
  };

  for (const kind of Object.keys(KIND_TEXT.ja)) {
    push((l) => KIND_TEXT[l][kind]?.label);
    push((l) => KIND_TEXT[l][kind]?.supporting);
  }
  for (const list of [SIDEBAR_ITEMS, MENU_ITEMS, LIST_ROWS] as Record<Lang, { label: string }[]>[])
    for (let i = 0; i < list.ja.length; i++) push((l) => list[l][i]?.label);
  for (let i = 0; i < TABLE_COLUMNS.ja.length; i++) push((l) => TABLE_COLUMNS[l][i]?.label);
  /* a tree row carries its depth as leading spaces, so both forms are indexed */
  for (let i = 0; i < TREE_NODES.ja.length; i++) {
    push((l) => TREE_NODES[l][i]?.label);
    push((l) => {
      const node = TREE_NODES[l][i];
      return node && `${"  ".repeat(node.depth)}${node.label}`;
    });
  }
  for (const rows of [TAB_LABELS, TABLE_ROWS, BREADCRUMB_TRAIL])
    for (let i = 0; i < rows.ja.length; i++) push((l) => rows[l][i]);
  /* interface strings that end up stored as document content */
  for (const key of ["home", "screenN", "deleteVerb", "label"] as UIKey[]) push((l) => t(key, l));
  return sets;
}

/** A default in any language mapped to its translations, or null where two
 *  different defaults share a spelling and picking one would be a guess. */
const TRANSLATIONS: Map<string, StringSet | null> = (() => {
  const map = new Map<string, StringSet | null>();
  for (const set of defaultStringSets())
    for (const { key } of LANGS) {
      const from = set[key];
      const seen = map.get(from);
      if (seen === undefined) map.set(from, set);
      else if (seen && LANGS.some(({ key: other }) => seen[other] !== set[other])) map.set(from, null);
    }
  return map;
})();

/** `text` in `to` when it is one of the built-in defaults, and `text` itself
 *  otherwise — because then the author wrote it. */
export function translateDefault(text: string, to: Lang): string {
  const hit = TRANSLATIONS.get(text);
  return hit ? hit[to] : text;
}

/** The same default read in `to`, when `text` is this kind's own label or
 *  supporting text. Asking the kind first resolves defaults that share a
 *  spelling across kinds — "标签" is both a Tag and a Label — which the flat
 *  table above has to refuse. */
export function translateKindText(kind: string, field: "label" | "supporting", text: string, to: Lang): string | null {
  for (const { key } of LANGS)
    if (KIND_TEXT[key][kind]?.[field] === text) return KIND_TEXT[to][kind]?.[field] ?? null;
  return null;
}

/** A window's name is either the starter name or "<Window> <n>", so the number
 *  is kept while the word around it moves. */
export function translateFrameName(name: string, to: Lang): string {
  const direct = TRANSLATIONS.get(name);
  if (direct) return direct[to];
  for (const { key } of LANGS) {
    const prefix = t("screenN", key);
    if (name.startsWith(`${prefix} `)) return `${t("screenN", to)} ${name.slice(prefix.length + 1)}`;
  }
  return name;
}
