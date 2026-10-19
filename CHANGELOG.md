# Changelog

All notable changes to `@_mehrad/halftone`. Versions follow semver; while the major is 0, minor bumps may break.

## Unreleased

- 20 new elements from the Taskscape gap audit: textarea, avatar (+ group), progress, skeleton, separator, breadcrumb (+ item), popover, menu (+ item, separator, label), alert dialog, sheet, command (+ item, group), table (+ head, body, row, header, cell), toggle, toggle group (+ item), scroll area, calendar, sidebar (+ group, header, footer), emoji picker.
- 4 new elements from the Motion-Primitives audit: carousel (+ item), number, shimmer, spotlight.
- Decisions and trade-offs: `docs/decisions.md`, entry 2026-10-19.

## 0.1.0 (2026-10-12)

First public release. Contents:

- 22 elements: button, input, select, switch, checkbox (+ group), radio group (+ radio), tabs (+ tab, tab panel), card, dialog, banner, toast (+ toaster, `toast()`), tooltip, tag, kbd, nav item, prompt, speech bubble.
- Design tokens (`tokens.css`), light and dark, themed through `--ht-*` custom properties.
- `halftone` CLI: `add`, `list`, `init`, `diff` to copy components into a project (TypeScript or JavaScript).
- `custom-elements.json` and `llms.txt` for tools and agents.
- Zero axe-core violations across all stories in light and dark; see `docs/a11y.md` for what is and is not covered.
