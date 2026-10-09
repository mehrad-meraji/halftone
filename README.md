# Halftone

Web components built with [Lit](https://lit.dev), styled between Sentinel and Taskscape: mauve-tinted neutrals, pink accent, sharp corners, display + mono type, one faint halftone dot screen on headers. Works in any framework or none. Human and agent friendly.

Package: `@_mehrad/halftone` · Tag prefix: `ht-` · Docs: Storybook

## Use it (package mode)

```html
<link rel="stylesheet" href="node_modules/@_mehrad/halftone/dist/tokens.css" />
<script type="module">
  import '@_mehrad/halftone/components/button/button.js';
</script>
<ht-button variant="primary">Deploy It</ht-button>
```

Components: `ht-button`, `ht-input`, `ht-card`, `ht-dialog`, `ht-speech-bubble`. `tokens.css` is required.

Fonts are not bundled. Load Chakra Petch (display), Geist (UI) and IBM Plex Mono (mono) yourself, or system fallbacks are used. The Storybook docs load them from Google Fonts (`.storybook/preview-head.html`).

Theme by overriding `--ht-*` CSS variables (dark mode follows the OS, or set `data-theme`). Restyle internals through `::part()`. The full guide is in Storybook under Guide / Getting Started.

## Own it (copy mode, planned)

Every component is one self-contained file under `src/components/<name>/<name>.ts` with no imports other than `lit`. A future `npx halftone add <name>` just copies that file. Until then, copy it by hand.

## Develop

```bash
npm run dev        # Storybook on :6006
npm run build      # dist/ + custom-elements.json
npm run typecheck
```

## For agents

`custom-elements.json` (Custom Elements Manifest) lists every tag, attribute, slot, part, CSS variable and event. Read it instead of guessing. See `AGENTS.md` for the component rules.
