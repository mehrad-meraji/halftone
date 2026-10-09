# Halftone: rules for agents

- Components are Lit, TypeScript, **no decorators** (static `properties` + `declare` fields).
- One folder per component: `src/components/<name>/<name>.ts` and `<name>.stories.ts`. Tag is `ht-<name>`.
- A component file imports only `lit`. No cross-component imports, so the file stays copyable (copy mode).
- Document every public attribute, slot, part and CSS variable with JSDoc (`@slot`, `@csspart`, `@cssprop`, `@fires`). The manifest and Storybook docs are generated from it.
- Style only through `--ht-*` tokens (`src/tokens/tokens.css`) with fallbacks. No hard-coded colors.
- Form controls use `ElementInternals` (`static formAssociated = true`).
- Add every new component to `src/index.ts`, with a story covering each variant and the disabled state.
- Verify with `npm run typecheck && npm run build`, then check the story in Storybook.
