@AGENTS.md

# What this project is

GPUI Kit Canvas: a browser tool for sketching [gpui-kit](https://github.com/longbridge/gpui-kit)
desktop windows and turning them into a prompt for an AI coding tool. It is a fork of
`lnkiai/m3e-canvas`, retargeted from Material 3 Expressive phone screens to gpui-kit
desktop windows. Nothing in it is Material any more.

## The one rule

Every fact about gpui-kit in this repo has to come from gpui-kit, not from memory.
A component that does not exist, a token spelled differently, an icon it does not
ship — each of those turns the generated prompt into a lie the AI tool will act on.

- Component names and import paths live in `KindSpec.api` (`lib/tokens.ts`) and go
  straight into the prompt. `npm run check:api` reads every one back out of the
  Rust source and fails on anything that is not there — run it, and do not trust
  the skill's component table alone (it lists types the source does not have).
- Sizes, paddings and radii come from `crates/component/src/sizing.rs`,
  `title_bar.rs` and `sidebar/mod.rs`. Cite the file when you change one.
- Colours and icons are **generated**, never hand-edited:
  `lib/kit-themes.gen.ts` and `lib/kit-icons.gen.ts`. Regenerate from a checkout
  (`npm run gen:themes -- ../gpui-kit`, `npm run gen:icons -- ../gpui-kit`).
- The gpui-kit repo also carries the normative guides as skills, under
  `skills/gpui-kit` and `skills/gpui-kit-design-guides`. Read them before changing
  what the prompt asks for.

## Conventions inherited from the fork

- Code comments in English. Every UI string and every line of prompt text exists in
  Japanese, English and Chinese (`lib/i18n.ts`, `lib/prompt.ts`); adding one language
  without the other two is incomplete.
- The editor's own chrome and the sketched parts are separate paths: parts draw from
  the palette tokens only, so they stay right in every theme.
- `npm run typecheck` and `npm run build` both have to pass.

`CONTRIBUTING.md` has the file map and the checklist for adding a part.
