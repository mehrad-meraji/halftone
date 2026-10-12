# Halftone: rules for agents

- Components are Lit, TypeScript, **no decorators** (static `properties` + `declare` fields).
- One folder per component: `src/components/<name>/<name>.ts` and `<name>.stories.ts`. Tag is `ht-<name>`.
- A component file imports only `lit`. No cross-component imports, so the file stays copyable (copy mode). `npm run registry` fails the build if one does, and `halftone add` ships exactly these files.
- One folder is one `halftone add` unit. Elements that only make sense together (tabs, radio group, toast + toaster) live in one file. Never put runtime code in `*.stories.ts`: stories are not copied.
- Document every public attribute, slot, part and CSS variable with JSDoc (`@slot`, `@csspart`, `@cssprop`, `@fires`). The manifest and Storybook docs are generated from it.
- Style only through `--ht-*` tokens (`src/tokens/tokens.css`). It is a required stylesheet, so no per-use fallbacks. No hard-coded colors, radii or fonts.
- Visual language: radii 2/6/10px, Chakra Petch for headings, IBM Plex Mono uppercase for eyebrows, Geist for UI. Labels in Title Case, sentences in sentence case, dry tone.
- Component styles are being taken from sentry.io one component at a time (buttons done, see `docs/decisions.md`). Borrow the mechanics (sizes, borders, states, motion), not the colours; colours always come from `--ht-*` tokens.
- Mark internals `@internal` or `#private`; Lit `state: true` props start with `_`. The manifest strips these.
- Form controls use `ElementInternals` (`static formAssociated = true`).
- Add every new component to `src/index.ts`, with a story covering each variant and the disabled state.
- Verify with `npm run typecheck && npm run build`, then check the story in Storybook.
- Accessibility: a control without a visible label forwards a host `aria-label` to its native element (never leave `aria-label` on a generic host). Field outlines use `--ht-border-input` (3:1). Mix tone colours toward `--ht-text`, not `black`, so dark mode works, and mix in `oklab` when the other colour has a different hue. After token or style changes run `scripts/a11y-runner.js` and `node scripts/contrast.mjs`; see `docs/a11y.md`.
