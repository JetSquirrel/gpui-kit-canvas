<p align="center">
  <img src="app/icon.svg" width="72" alt="" />
</p>

<h1 align="center">GPUI Kit Canvas</h1>

<p align="center">
  <strong>Sketch <a href="https://github.com/longbridge/gpui-kit">gpui-kit</a> desktop windows in the browser, link them, click through them, and copy a prompt for your AI coding tool.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61DAFB" />
  <img alt="gpui-kit" src="https://img.shields.io/badge/target-gpui--kit%20(Rust)-171717" />
  <img alt="No backend" src="https://img.shields.io/badge/backend-none%20(localStorage)-2E6A45" />
</p>

<p align="center">
  <a href="#日本語">日本語</a> · <a href="#中文">中文</a>
</p>

![The editor: a gpui-kit window with a title bar, sidebar, toolbar, breadcrumb, data table and status bar, beside the parts palette](docs/editor.png)

Works with any AI coding tool that takes a prompt, such as Claude Code, Codex, Gemini CLI or Cursor: copy the prompt, paste it into the tool, and ask for the app.

This is a fork of [lnkiai/m3e-canvas](https://github.com/lnkiai/m3e-canvas), retargeted from Material 3
Expressive phone screens to gpui-kit desktop windows.

## What it does

- **Drag-and-drop parts** – 66 of them, grouped the way you reach for them: the window shell (title
  bar, sidebar, toolbar, status bar, breadcrumb), actions (button, icon button, button group, menu),
  inputs (input, textarea, select, combobox, checkbox, radio group, switch, slider, label, form,
  rating, colour picker, date picker, calendar, settings page), containment (panel, group box, tabs,
  resizable split, accordion, collapsible, pagination, stepper, dock area, scrollbar), overlays
  (dialog, sheet, popover, notification, tooltip, hover card, command palette), data (list, data
  table, tree, chart), content (text, icon, image, separator, badge, tag, avatar, kbd, link, marker,
  clipboard, shimmer, description list), feedback (alert, progress, spinner, skeleton) and chat
  (message, bubble, attachment, message scroller).
- **Every part is a real component** – each one names an actual `gpui_kit::component` path, and
  `npm run check:api` reads all of them back out of a gpui-kit checkout and fails if one does not
  exist. The palette reaches 58 of gpui-kit's 63 component modules; the five it leaves out
  (`measure`, `native_menu`, `plot`, `searchable_list`, `window_border`) are infrastructure rather
  than parts you place.
- **Real gpui-kit geometry** – control heights, paddings, radii and row heights come from gpui-kit's
  own source (`sizing.rs`, `title_bar.rs`, `sidebar/mod.rs`), so a medium Button is 32px and a table
  row is 32px on the canvas too.
- **Real gpui-kit themes** – 33 palettes resolved from a gpui-kit checkout: the built-in Default
  Light and Dark plus the 21 theme sets it ships (Tokyo Night, Gruvbox, Catppuccin, Solarized,
  macOS Classic and the rest). Every colour on the canvas is one of gpui-kit's semantic tokens, and
  the prompt names them by their real keys (`primary.background`, `sidebar.accent.background`, …).
- **Real gpui-kit icons** – the icon picker offers exactly the 101 Lucide icons `gpui-kit-assets`
  ships, and the prompt quotes them as `IconName::` variants, so a sketch can never name an icon the
  generated app cannot draw.
- **Window shells** – each window declares one of the five shells the Design Guides name (single
  workspace, sidebar workspace, master–detail, document workspace, utility window), and the prompt
  states it before any part.
- **Magnetic connections** – bring two buttons close and they fuse into one `ButtonGroup`; the
  corners square off where they meet, the way gpui-kit draws a connected run.
- **Many windows** – add as many as you like, name them, give each its own size (1024×640 up to
  1680×1050) and background token, and drag a window to move everything in it.
- **Click to navigate** – give any clickable part, a title bar icon or a sidebar, tab, menu, list or
  breadcrumb entry a target window (or "back"). Arrows show the flow on the canvas; the preview lets
  you click through it.
- **Keyboard shortcuts** – give a part a keybinding and the prompt asks for the matching `actions!`
  declaration, `bind_keys` entry and `Kbd` in its tooltip.
- **Editable data** – a data table's columns carry their own labels and a numeric flag (which
  right-aligns them, the way comparable numbers want); its rows are edited cell by cell. A dialog
  names its own commit verb, so the prompt asks for `Delete` rather than `OK`.
- **Layers and groups** – a layers panel lists the z-order of each window. Select several parts and
  group them to keep their overlap and move them as one. The prompt describes overlaps and
  side-by-side rows explicitly so the generated layout keeps them.
- **Theme** – the axes a gpui-kit `ThemeConfig` actually has. Colour: 33 shipped palettes or a
  hand-tuned token set, light / dark, and a "follow the system" switch. Radius: square, default or
  round for `theme.radius` and `radius.lg` at once. Type: the system UI font or a named face.
  Density: compact / default / comfortable, which is the components' default `Size`. Plus
  `theme.shadow` and `theme.focus_ring`.
- **Prompt output** – the whole design (or a single window) becomes a concise brief in Japanese,
  English or Chinese: the shell, the theme as a drop-in `ThemeConfig` JSON block, the layout, the
  behaviour, the exact `gpui_kit::component` for every part in use, and closing guidance that starts
  by telling the tool to read the gpui-kit skills or docs and never to invent an API.
- **Tidy** – one button pins the title bar to the top, the sidebar to the leading edge and the status
  bar to the bottom, lays the toolbar and breadcrumb out as bands under the title bar, centres a
  dialog, drops a notification into the trailing corner, and flows the rest on 16px panel padding.
  Press it again to undo.
- **Optional AI helper** – bring your own key (OpenAI, Claude, Gemini or DeepSeek) and let the model
  write a part's behaviour note or a window's description, in your language. The key stays in your
  browser and the request goes straight to the provider; there is no server in between.
- **Export** – copy the prompt (edit it by hand first if you like) or save a window as a PNG.
- **Three languages** – the interface, the document's own starter content and the prompt are all
  available in Japanese, English and Chinese. A first visit picks the language from the browser, and
  changing it moves the starter content with it: every part remembers the text it was created with,
  so anything still at its built-in default is re-read in the new language while anything you typed
  yourself is left exactly as it is.
- **Alignment guides**, undo/redo, keyboard shortcuts, a favorites row in the parts panel, and
  everything is saved in your browser (localStorage).

## The prompt it writes

An excerpt for a two-window sketch on the Tokyo Night theme. The theme block is abridged;
everything else is verbatim:

```markdown
Please implement Fleet with gpui-kit, the Rust desktop UI framework. A tool for
watching a fleet of build machines.
It is a desktop app whose default window is 1280×800. Desktop does not mean
fixed-size, so decide what happens as the window narrows. Dark theme only.

## Window shell
- A sidebar workspace: persistent navigation beside a changing detail view. Keep
  the navigation stable while the content changes.
- A utility window: one focused task with a short, fixed action path.

## Theme
The theme is Tokyo Night, which gpui-kit ships as themes/tokyonight.json. Load it
through the ThemeRegistry and read every UI colour through its role on cx.theme().
Its main tokens, for reference:
{ "$schema": "…/.theme-schema.json", "name": "Tokyo Night", "mode": "dark",
  "radius": 6, "colors": { "background": "#1a1b26", "primary.background": "#7aa2f7",
  "sidebar.background": "#1c1e2a", "title_bar.background": "#161720", … } }

## Layout
There are 2 windows (views): "Main", "Settings".

The "Main" window, 1280×800 — overlapping parts are called out as such:
- Near the top: a title bar titled "App" with macOS traffic lights on the left,
  IconName::Ellipsis trailing.
- In the middle, on the leading edge: a sidebar headed "Navigation", 255px wide,
  with the entries "Inbox" (IconName::Inbox), "Projects" (IconName::Folder),
  "Reports" (IconName::ChartPie), "Settings" (IconName::Settings).
- Near the top, centred: a data table with the columns "Name", "Status",
  "Updated", "Count" (numeric, right-aligned) and 3 sample rows: Roadmap /
  In progress / 3 days ago / 12; Design / In review / Yesterday / 4; …
- Near the bottom: a status bar with IconName::CircleCheck and "Ready" leading
  and "3 items" trailing.

## Behaviour and navigation
- Clicking the "Settings" entry of the "Navigation" sidebar opens the "Settings"
  view immediately.
- The "Save" button opens the "Settings" view with a fade when clicked. It also
  is bound to cmd-s (declare the action with actions!, bind it with bind_keys,
  and show it with Kbd in the button's tooltip).

## Components to use
- data table: `table::{DataTable, TableState, TableDelegate}` — Repeat the column
  geometry through headers, rows, summaries, loading states and inline editors.
  Right-align comparable numbers; left-align prose and identifiers.
```

## Keeping up with gpui-kit

The palettes and icons are generated from a gpui-kit checkout, so they never drift into invention:

```bash
npm run gen:themes -- ../gpui-kit   # lib/kit-themes.gen.ts  (33 palettes)
npm run gen:icons  -- ../gpui-kit   # lib/kit-icons.gen.ts   (101 icons)
npm run check:api  -- ../gpui-kit   # verify every component path, list the gaps
```

All three default to `../gpui-kit`, and `GPUI_KIT` overrides the path. `check:api` is the one that
keeps the palette honest: it parses every component path out of `lib/tokens.ts` and looks each one
up in the Rust source, so a part can never quietly claim an API that is not there.
`script/gen-kit-themes.mjs` resolves a theme's missing tokens with the same fallback chain as
`ColorsConfig::apply_config` in `crates/component/src/theme/schema.rs`, so a theme that only sets
`background` still gets a coherent sidebar, list and table.

## Keyboard

| Key | Action |
| --- | --- |
| `V` / `H` | Select / hand tool (hold `Space` to pan) |
| Wheel, `Ctrl` + wheel | Pan, zoom |
| `+` `-` `0` | Zoom in, zoom out, fit |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo |
| `Ctrl+D` | Duplicate |
| `Ctrl+G` / `Ctrl+Shift+G` | Group / ungroup the selection |
| Arrows (`Shift` = 10) | Nudge |
| `Delete` | Delete the selected parts, or the selected window |
| `Esc` | Clear the selection |
| `P` | Preview |

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build      # static export to ./out
```

The app is a static Next.js export (`output: "export"`): there is no server, and `out/` is the whole
site. To host it under a sub-path (for example a GitHub Pages project site), set
`NEXT_PUBLIC_BASE_PATH=/your-repo` at build time.

## Deploy

### Cloudflare Workers

`wrangler.jsonc` deploys `out/` as a Workers static-assets site — no adapter, no Worker script:

```bash
npm run build
npm run preview    # wrangler dev, serves ./out locally
npm run deploy     # wrangler deploy
```

Leave `NEXT_PUBLIC_BASE_PATH` unset here: the site is served from the domain root. Keeping
`wrangler.jsonc` committed matters — without it `wrangler deploy` auto-detects "Next.js", installs
the OpenNext adapter and then fails looking for `.next/standalone`, which a static export never
produces.

### GitHub Pages

`.github/workflows/deploy.yml` builds with `NEXT_PUBLIC_BASE_PATH=/<repo>` and publishes `out/` on
every push to `main`.

## Credits

- Component set, geometry, themes and icons: [longbridge/gpui-kit](https://github.com/longbridge/gpui-kit) (Apache-2.0).
- Icons: [Lucide](https://lucide.dev) (ISC), as bundled by `gpui-kit-assets`.
- The editor itself: forked from [lnkiai/m3e-canvas](https://github.com/lnkiai/m3e-canvas) (MIT).

## License

MIT

---

## 日本語

**[gpui-kit](https://github.com/longbridge/gpui-kit) のデスクトップ画面をブラウザで組み立てて、画面同士をつなぎ、クリックして確かめ、そのまま AI コーディング用のプロンプトにするツールです。**

Claude Code、Codex、Gemini CLI、Cursor など、プロンプトを受け取れる AI コーディングツールならどれでも使えます。プロンプトをコピーしてツールに貼り、アプリを作ってと頼むだけです。

[lnkiai/m3e-canvas](https://github.com/lnkiai/m3e-canvas) の fork で、対象を Material 3 Expressive のスマホ画面から gpui-kit のデスクトップウィンドウへ移しています。

### できること

- **ドラッグ＆ドロップ** – 66 部品。ウィンドウの骨格、アクション、入力（フォーム、レーティング、カラー／日付ピッカー、カレンダー、設定ページを含む）、コンテナ（アコーディオン、折りたたみ、ページネーション、ステッパー、ドックエリア、スクロールバーを含む）、オーバーレイ（ツールチップ、ホバーカード、コマンドパレットを含む）、データ（チャートを含む）、コンテンツ（アバター、Kbd、リンク、マーカー、コピーボタン、シマー、定義リストを含む）、フィードバック、チャット（メッセージ、吹き出し、添付、メッセージスクローラー）。
- **すべて実在するコンポーネント** – 各部品が実際の `gpui_kit::component` のパスを名指しし、`npm run check:api` が gpui-kit のチェックアウトから全パスを読み直して、存在しないものがあれば失敗します。gpui-kit の 63 コンポーネントモジュールのうち 58 をカバーし、残る 5 つ（`measure`、`native_menu`、`plot`、`searchable_list`、`window_border`）は配置する部品ではなく基盤です。
- **本物の寸法** – 部品の高さ・余白・角丸・行の高さは gpui-kit のソース（`sizing.rs`、`title_bar.rs`、`sidebar/mod.rs`）から取っています。medium のボタンは 32px、テーブルの行も 32px です。
- **本物のテーマ** – gpui-kit のチェックアウトから解決した 33 パレット（組み込みの Default Light / Dark と同梱の 21 テーマ）。キャンバスの色はすべて gpui-kit のセマンティックトークンで、プロンプトには実際のキー（`primary.background` など）で書き出されます。
- **本物のアイコン** – `gpui-kit-assets` が同梱する Lucide アイコン 101 個だけを選べます。プロンプトには `IconName::` の形で書き出されるので、描けないアイコンを指定してしまうことがありません。
- **ウィンドウの骨格** – Design Guides が挙げる 5 つの骨格（単一ワークスペース、サイドバー、一覧と詳細、ドキュメント、ユーティリティ）から選び、プロンプトは部品より先に骨格を伝えます。
- **磁石のような連結** – ボタンを近づけると 1 つの `ButtonGroup` にくっつき、接する側の角が角ばります。
- **複数ウィンドウ** – 何枚でも追加でき、名前・サイズ（1024×640 〜 1680×1050）・背景トークンを個別に設定できます。
- **クリックで遷移** – 部品、タイトルバーのアイコン、サイドバー・タブ・メニュー・リスト・パンくずの項目に移動先を設定できます。キャンバスに矢印が出て、プレビューで実際にクリックして確かめられます。
- **ショートカット** – 部品にキーバインドを設定すると、プロンプトが `actions!` の定義、`bind_keys` の割り当て、tooltip の `Kbd` 表示まで要求します。
- **編集できるデータ** – データテーブルの列はラベルと「数値」フラグ（比較できる数値なので右寄せになります）を持ち、行はセル単位で編集できます。ダイアログは確定ボタンの文言を自分で持つので、プロンプトは `OK` ではなく `削除` を要求します。
- **3 言語** – UI・ドキュメントの初期内容・プロンプトのすべてが日本語・英語・中国語に対応します。初回はブラウザの言語で組み立て、言語を切り替えると初期内容もついてきます。部品は作られたときの文字を覚えているので、既定値のままのものだけが新しい言語で読み直され、自分で書いた文字はそのまま残ります。
- **レイヤーとグループ**、**テーマ**（カラー／角丸／書体／密度／影／フォーカスリング）、**整える**、**AI 補助（任意）**、**書き出し**、**補助線スナップ**、Undo/Redo。作業内容はブラウザ（localStorage）に自動保存されます。

### gpui-kit への追従

```bash
npm run gen:themes -- ../gpui-kit   # lib/kit-themes.gen.ts
npm run gen:icons  -- ../gpui-kit   # lib/kit-icons.gen.ts
```

### 開発

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # ./out に静的書き出し
```

### ライセンス

MIT

---

## 中文

**在浏览器中拼装 [gpui-kit](https://github.com/longbridge/gpui-kit) 的桌面窗口，把窗口连起来、点一点试试，然后直接变成给 AI 编程工具的提示词。**

可配合任何接受提示词的 AI 编程工具使用，例如 Claude Code、Codex、Gemini CLI 或 Cursor：复制提示词，粘贴到工具里，让它把应用做出来。

本项目 fork 自 [lnkiai/m3e-canvas](https://github.com/lnkiai/m3e-canvas)，把目标从 Material 3 Expressive 手机界面改为 gpui-kit 桌面窗口。

### 功能

- **拖放组件** – 共 66 个：窗口骨架、操作、输入（含表单、评分、颜色／日期选择器、日历、设置页）、容器（含手风琴、折叠区、分页、步骤条、停靠区、滚动条）、浮层（含工具提示、悬浮卡片、命令面板）、数据（含图表）、内容（含头像、Kbd、链接、状态标记、复制按钮、微光文本、描述列表）、反馈，以及聊天（消息、气泡、附件、消息滚动区）。
- **每个组件都真实存在** – 每个部件都点名一个真实的 `gpui_kit::component` 路径，`npm run check:api` 会从 gpui-kit 仓库把所有路径逐个读回核对，不存在就报错退出。调色板覆盖 gpui-kit 63 个组件模块中的 58 个，余下 5 个（`measure`、`native_menu`、`plot`、`searchable_list`、`window_border`）属于基础设施而非可放置的部件。
- **真实的尺寸** – 组件高度、内边距、圆角和行高均取自 gpui-kit 源码（`sizing.rs`、`title_bar.rs`、`sidebar/mod.rs`）：medium 按钮为 32px，表格行同样是 32px。
- **真实的主题** – 从 gpui-kit 仓库解析出的 33 套配色（内置 Default Light / Dark 加上自带的 21 套主题）。画布上的所有颜色都是 gpui-kit 的语义 token，提示词中会用真实的键名写出（如 `primary.background`）。
- **真实的图标** – 图标选择器只提供 `gpui-kit-assets` 自带的 101 个 Lucide 图标，提示词中写成 `IconName::` 变体，因此草图不会指定生成的应用画不出来的图标。
- **窗口骨架** – 每个窗口从设计规范列出的五种骨架（单一工作区、侧栏工作区、列表与详情、文档标签、工具窗口）中选择，提示词会在描述组件之前先说明骨架。
- **磁吸连接** – 把两个按钮靠近，它们会合并成一个 `ButtonGroup`，相接的一侧圆角变方。
- **多窗口** – 可添加任意多个窗口，并分别设置名称、尺寸（1024×640 至 1680×1050）与背景 token。
- **点击跳转** – 可为组件、标题栏图标，以及侧边栏、标签页、菜单、列表、面包屑的条目设置目标窗口。画布上会显示流程箭头，预览中可以真的点击跳转。
- **快捷键** – 为组件设置快捷键后，提示词会要求生成对应的 `actions!` 定义、`bind_keys` 绑定，并在 tooltip 中用 `Kbd` 展示。
- **可编辑的数据** – 数据表格的每一列都有自己的标签和「数值」标记（标记后右对齐，符合可比较数值的排版惯例），行则按单元格编辑。对话框自带确认按钮文案，因此提示词要求的是「删除」而不是「确定」。
- **三种语言** – 界面、文档的初始内容和提示词都提供日文、英文、中文。首次访问按浏览器语言生成，切换语言时初始内容也会跟着走：每个组件都记得自己被创建时的文案，因此仍是内置默认值的会用新语言重新读取，而你自己敲的字原样保留。
- **图层与编组**、**主题**（配色／圆角／字体／密度／阴影／焦点环）、**整理**、**AI 辅助（可选）**、**导出**、**对齐辅助线**、撤销／重做。所有内容自动保存在浏览器（localStorage）中。

### 跟随 gpui-kit 更新

```bash
npm run gen:themes -- ../gpui-kit   # lib/kit-themes.gen.ts
npm run gen:icons  -- ../gpui-kit   # lib/kit-icons.gen.ts
```

### 开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 静态导出到 ./out
```

### 许可证

MIT
