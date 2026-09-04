# Contributing to GPUI Kit Canvas

Thanks for your interest. This page explains how to report problems, propose
changes and send code. Japanese and Chinese summaries are at the end.

## Before you start

- **Bugs and small fixes**: open an issue or a pull request directly.
- **New parts, new panels, prompt wording, anything larger**: please open an
  issue first so we can agree on the shape of the change before you spend
  time on it. Every part has to map onto a real `gpui_kit::component`, and the
  prompt is tuned carefully; a short discussion up front saves rework.
- **Questions and ideas**: use [Discussions](https://github.com/JetSquirrel/gpui-kit-canvas/discussions).

## Setting up

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build      # static export into out/
```

Node 22 is what CI uses. The app is a single Next.js page with no server; everything
is stored in the browser.

## Where things live

| Area | Files |
|---|---|
| Part definitions, sizes, corners, theme axes | `lib/tokens.ts` |
| UI strings and part defaults (ja / en / zh) | `lib/i18n.ts` |
| Drawing a part | `components/KitNode.tsx` |
| Editing a part (desktop / phone) | `components/Inspector.tsx`, `components/Mobile.tsx` |
| Click-through preview | `components/Preview.tsx` |
| Prompt text (ja / en / zh) | `lib/prompt.ts` |
| Themes and the token editor | `components/ColorPanel.tsx`, `lib/color.ts` |
| Radius / type / density / motion panels | `components/ThemePanel.tsx` |
| The editor itself | `app/page.tsx` |
| Generated from gpui-kit — do not edit by hand | `lib/kit-themes.gen.ts`, `lib/kit-icons.gen.ts` |
| The generators | `script/gen-kit-themes.mjs`, `script/gen-kit-icons.mjs` |

The two generated files are the project's only source of gpui-kit facts. Regenerate
them from a checkout rather than editing them:

```bash
npm run gen:themes -- ../gpui-kit
npm run gen:icons  -- ../gpui-kit
```

### Adding a part

A new kind touches all of these; the existing kinds are the reference:

1. `Kind`, `KIND_SPEC`, `KIND_ORDER` and, if needed, `sizeOf` / `baseRadii` / `iconSlotsOf` in `lib/tokens.ts`
2. `KIND_TEXT` for all three languages in `lib/i18n.ts`
3. Rendering in `components/KitNode.tsx` (and `MEASURED` / `NO_BOX` when it applies)
4. The item sentence in `itemJa`, `itemEn`, `itemZh` and, where the type name alone
   does not carry the semantics, a `KIND_NOTES` entry per language in `lib/prompt.ts`
5. Any special editor in `components/Inspector.tsx`; click targets in `components/Preview.tsx` if it is clickable

A part must name a component that actually exists. Put its import path in
`KindSpec.api` (that string goes straight into the prompt), and check the
signature against the gpui-kit source or `https://gpui-kit.com/docs/components/{name}.md`
before you write it down.

## Conventions

- Code comments are in English. UI strings and prompt text exist in Japanese,
  English and Chinese; a string added in one language must be added in all three.
- Take sizes, corners and colours from gpui-kit itself and name them the way it
  does. Cite the file and line in your PR (for example `crates/component/src/sizing.rs`)
  rather than eyeballing a value.
- Keep the editor chrome and the parts on separate paths: parts are drawn from the
  palette tokens only, so they stay correct in dark mode and under every theme.
- Small, focused pull requests are easier to review than one large one.
- Commit messages are in English and describe the change, not the file.

## Pull requests

- Branch from `main` in your fork.
- Run `npm run typecheck` and `npm run build`; CI runs the same two on every PR.
- Fill in the PR template: what changed, why, and how you checked it. Screenshots
  help for anything visual.
- By contributing you agree that your changes are licensed under the project's
  [MIT license](LICENSE).

## 日本語

- バグ報告や小さな修正は Issue または PR を直接どうぞ。
- 新しい部品やパネル、プロンプトの文言など大きめの変更は、先に Issue で相談してください。部品は必ず実在する `gpui_kit::component` に対応させ、API は現物のシグネチャを確認してください。
- 質問やアイデアは Discussions へ。
- コードのコメントは英語で書きます。UI の文言とプロンプト文は日本語・英語・中国語の 3 言語すべてに追加してください。
- PR の前に `npm run typecheck` と `npm run build` を通してください。CI でも同じものが走ります。
- 貢献したコードは MIT ライセンスで公開されます。

## 中文

- Bug 报告和小修改可以直接提 Issue 或 PR。
- 新组件、新面板、提示词措辞等较大的改动，请先开 Issue 讨论。每个组件都必须对应真实存在的 `gpui_kit::component`，API 请核对真实签名。
- 提问和想法请到 Discussions。
- 代码注释用英文。UI 文字和提示词需同时提供日文、英文、中文三种语言。
- 提交 PR 前请运行 `npm run typecheck` 和 `npm run build`，CI 会执行同样的检查。
- 贡献的代码以 MIT 许可证发布。
