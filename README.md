# Halftone

Web components built with [Lit](https://lit.dev), styled between Sentinel and Taskscape: cool violet-tinted neutrals, a deep violet accent, sharp corners, display + mono type, one faint halftone dot screen on headers. Works in any framework or none. Human and agent friendly.

Package: `@_mehrad/halftone` · Tag prefix: `ht-` · Docs: [mehrad-meraji.github.io/halftone](https://mehrad-meraji.github.io/halftone/) (the docs site, in `site/`) and [Storybook](https://mehrad-meraji.github.io/halftone/storybook/) (`npm run dev` locally) · API for tools: `custom-elements.json`, `llms.txt` · Licence: MIT

## Use it (package mode)

```bash
npm i @_mehrad/halftone lit
```

```html
<link rel="stylesheet" href="node_modules/@_mehrad/halftone/dist/tokens.css" />
<script type="module">
  import '@_mehrad/halftone'; // everything, or one component:
  // import '@_mehrad/halftone/components/button/button';
</script>
<ht-button variant="primary">Deploy It</ht-button>
```

Components: 82 elements, from `ht-button` and `ht-input` to `ht-menu`, `ht-table`, `ht-timeline` and `ht-dropzone`. Run `npx @_mehrad/halftone list` for the full set. `tokens.css` is required.

Fonts are not bundled. Load Chakra Petch (display), Geist (UI) and IBM Plex Mono (mono) yourself, or system fallbacks are used. The Storybook docs load them from Google Fonts (`.storybook/preview-head.html`).

Theme by overriding `--ht-*` CSS variables (dark mode follows the OS, or set `data-theme`). Restyle internals through `::part()`. The full guide is in Storybook under Guide / Getting Started.

### Install from GitHub

Until (or instead of) the npm release, install straight from the repository. It builds itself on install, which takes about 20 seconds:

```bash
npm i github:mehrad-meraji/halftone lit
```

Pin a commit or tag for repeatable installs (`github:mehrad-meraji/halftone#<commit>`). The copy CLI works the same way: `npx github:mehrad-meraji/halftone add button`.

## Icons

Icons are [Phosphor](https://phosphoricons.com) (MIT). `ht-icon` ships 50 common ones in regular, bold and fill:

```html
<ht-icon name="arrow-right" weight="bold"></ht-icon>
<ht-button><ht-icon slot="prefix" name="plus" weight="bold"></ht-icon>New Issue</ht-button>
```

It sizes itself in `em`, so it follows the text around it (`size="24"` or any CSS length overrides). It is decorative unless you give it a `label`. For any of the other ~1,500 icons or the thin, light and duotone weights, register them from `@phosphor-icons/core`:

```ts
import { registerIcons } from '@_mehrad/halftone';
import fire from '@phosphor-icons/core/assets/regular/fire.svg?raw';
registerIcons({ fire: { regular: fire } });
```

## Own it (copy mode)

Every component is one file that imports only `lit`. Copy the ones you want into your project and edit them freely:

```bash
npx @_mehrad/halftone add button input tabs      # components + tokens.css
npx @_mehrad/halftone add --all                  # everything
npx @_mehrad/halftone list                       # what exists
npx @_mehrad/halftone diff                       # which of your copies drifted
```

Files land in `src/components/halftone/` (or `components/halftone/`) and a `halftone.json` records the choices. TypeScript is copied when a `tsconfig.json` exists, readable JavaScript with comments otherwise (`--ts` / `--js` to force). Existing files you edited are never overwritten without `--overwrite`; `--dry-run` shows the plan. Add `lit` yourself, or pass `--install`.

After copying you own the code: there is no runtime dependency on this package, and upgrades are a `halftone diff` plus your own merge.

## Blocks

Blocks are ready-made page sections, like [shadcn/ui blocks](https://ui.shadcn.com/blocks). There are 20: sign-in, app shell, settings, dashboard, record list and detail, activity feed, members, inbox, comments, board, notice card, search home and results, media grid, wizard, setup steps, status, log viewer and invoice. Each is plain HTML that composes `ht-*` elements, so it works in any framework or none.

```bash
npx @_mehrad/halftone list                 # blocks are listed after the components
npx @_mehrad/halftone show login-01        # print a block's notes and HTML
npx @_mehrad/halftone add login-01         # copy the block and every component it uses
```

A block lands in `<dir>/blocks/` as two files: `<name>.html` and `<name>.md`. The notes say when to use the block, how to adapt it and what not to do. They are written for agents as much as people, and `llms.txt` carries them too, so an agent starts from the closest block instead of composing from scratch.

To add or tune a block, edit `src/blocks/<name>/`. The rules are in `AGENTS.md`; `npm run registry` checks them.

## Develop

```bash
npm run dev        # Storybook on :6006
npm run build      # dist/, custom-elements.json and the copy registry
npm test           # CLI tests (rebuilds the registry first)
npm run typecheck
```

## For agents

`custom-elements.json` (Custom Elements Manifest) lists every tag, attribute, slot, part, CSS variable and event. Read it instead of guessing. See `AGENTS.md` for the component rules.
