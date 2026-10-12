# Halftone

Web components built with [Lit](https://lit.dev), styled between Sentinel and Taskscape: mauve-tinted neutrals, pink accent, sharp corners, display + mono type, one faint halftone dot screen on headers. Works in any framework or none. Human and agent friendly.

Package: `@_mehrad/halftone` · Tag prefix: `ht-` · Docs: Storybook (`npm run dev`) · API for tools: `custom-elements.json`, `llms.txt` · Licence: MIT

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

Components: `ht-button`, `ht-input`, `ht-card`, `ht-dialog`, `ht-speech-bubble`. `tokens.css` is required.

Fonts are not bundled. Load Chakra Petch (display), Geist (UI) and IBM Plex Mono (mono) yourself, or system fallbacks are used. The Storybook docs load them from Google Fonts (`.storybook/preview-head.html`).

Theme by overriding `--ht-*` CSS variables (dark mode follows the OS, or set `data-theme`). Restyle internals through `::part()`. The full guide is in Storybook under Guide / Getting Started.

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

## Develop

```bash
npm run dev        # Storybook on :6006
npm run build      # dist/, custom-elements.json and the copy registry
npm test           # CLI tests (rebuilds the registry first)
npm run typecheck
```

## For agents

`custom-elements.json` (Custom Elements Manifest) lists every tag, attribute, slot, part, CSS variable and event. Read it instead of guessing. See `AGENTS.md` for the component rules.
