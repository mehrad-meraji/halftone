# Changelog

All notable changes to `@_mehrad/halftone`. Versions follow semver; while the major is 0, minor bumps may break.

## Unreleased

- Fixes found while writing blocks: `ht-tabs fit` shrinks only the tab track; the selected tab shows in dark mode; `ht-tab-panel` is a tab stop only when it holds nothing focusable; `ht-checkbox` with no text drops the label gap; `ht-input`, `ht-textarea`, `ht-prompt` and `ht-command` ignore the page's `text-align`; `ht-toggle` sizes only icons in its prefix; `ht-banner` actions wrap under the message on narrow bars (new `actions` part); `ht-tag` takes a `font-family` from the host; `ht-select` no longer logs Lit's update-after-update warning; `llms.txt` and the manifest drop a nameless event on menu, popover and select. Blocks lose their workarounds.
- 9 more built-in icons: `archive`, `image`, `paper-plane-tilt`, `paperclip`, `smiley`, `sparkle`, `squares-four`, `tag`, `upload-simple`.
- 16 more blocks, 20 in all: list, detail, activity feed, members, inbox, comments, board, notice card (interstitial), search home, search results, media grid, wizard, setup steps, status, log viewer and invoice. `scripts/check-blocks.mjs` checks blocks without building.
- 6 new components for blocks: code (copy, secret), description list, dropzone (form-associated), pagination, steps, timeline. 10 new elements.
- 20 new elements from the Taskscape gap audit: textarea, avatar (+ group), progress, skeleton, separator, breadcrumb (+ item), popover, menu (+ item, separator, label), alert dialog, sheet, command (+ item, group), table (+ head, body, row, header, cell), toggle, toggle group (+ item), scroll area, calendar, sidebar (+ group, header, footer), emoji picker.
- 3 new elements from the React Vibe audit: ping (status dot), marquee (endless scroller), accordion (+ item).
- 4 new elements from the Motion-Primitives audit: carousel (+ item), number, shimmer, spotlight.
- Generated avatars: `ht-avatar` takes `art` (`pixel`, `dots`, `tiles`) and `seed` and draws an original picture from any string. New exports `generateAvatar`, `avatarDataUri` and `AVATAR_ARTS` make the same pictures outside the element. Opt-in; existing avatars do not change. In forced-colours mode every avatar now gets a `CanvasText` edge.
- Blocks: ready-made page sections in plain HTML, like shadcn/ui blocks. Four to start: `login-01`, `app-shell-01`, `settings-01`, `dashboard-01`. Each has a notes file for people and agents. `halftone add <block>` copies a block and its components, `halftone show <block>` prints it, and `llms.txt` lists every block with its notes.
- Decisions and trade-offs: `docs/decisions.md`, entries 2026-10-19, 2026-10-20 and 2026-10-23.

## 0.1.0 (2026-10-12)

First public release. Contents:

- 22 elements: button, input, select, switch, checkbox (+ group), radio group (+ radio), tabs (+ tab, tab panel), card, dialog, banner, toast (+ toaster, `toast()`), tooltip, tag, kbd, nav item, prompt, speech bubble.
- Design tokens (`tokens.css`), light and dark, themed through `--ht-*` custom properties.
- `halftone` CLI: `add`, `list`, `init`, `diff` to copy components into a project (TypeScript or JavaScript).
- `custom-elements.json` and `llms.txt` for tools and agents.
- Zero axe-core violations across all stories in light and dark; see `docs/a11y.md` for what is and is not covered.
