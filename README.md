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
  <a href="README.ja.md">日本語</a> · <a href="README.zh-CN.md">中文</a>
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
  Press it again to undo. Its trailing half chooses where the body goes — from the top, centred,
  against the status bar or spread out — which is saved on the window and written into the prompt.
- **Align** – the right panel lines the selection up: left, centre, right, top, middle, bottom, or
  spaced evenly. Several parts line up with each other; a lone part lines up with the body area Tidy
  fills, or with its container when it sits inside one.
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
| `Ctrl+C` / `Ctrl+V` | Copy and paste the selection, across windows too |
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
