# Changelog

All notable changes to `@_mehrad/halftone`. Versions follow semver; while the major is 0, minor bumps may break.

## Unreleased

## 0.3.0 (2026-10-28)

Eight new elements for Taskscape, field props from its gaps list, and a docs site built from Halftone. No breaking changes.

### New

- 8 new elements: sortable list, combobox, day schedule, week strip, meter, elapsed timer, lightbox, link preview. Drag and drop is now part of Halftone.
- `ht-input`: `min`, `max`, `step`, `minlength`, `maxlength`, `pattern`, `inputmode`, `enterkeyhint`, `multiple`; types `date`, `time`, `datetime-local`, `month`, `week`; `default-value`; size `xs` (28px); `bare` (no box); `--ht-input-height` and `--ht-input-padding-x`; `select()`, `setSelectionRange()` and `inputElement`.
- `ht-textarea`: `bare`, `fill` (takes the host's height), `resize="none"`, `mono`, `default-value`, `minlength`, `--ht-textarea-padding-x`; `select()`, `setSelectionRange()` and `textareaElement`.
- `ht-skeleton fill`, `ht-avatar initials`, `ht-tooltip arrow` and `offset`, `ht-popover offset`, `ht-menu offset`.
- A host `aria-describedby` on `ht-input` and `ht-textarea` now reaches the native field.

### Fixed

- Form controls no longer throw under jsdom: `setFormValue` and `setValidity` are skipped when missing.
- Week strip meters, and stories at phone width.

### Docs and tooling

- Blocks hub with a card grid and a grouped sidebar. The docs frame is built from Halftone components.
- Publishing uses npm trusted publishing. The CLI tests run on Node 22+, and CI checks Node 24.

## 0.2.0 (2026-10-26)

36 pull requests since 0.1.0. About 40 new elements, 20 blocks, a new palette and a docs site. While the major is 0, a minor bump may break: read Breaking changes first.

### Breaking changes

- **Toast** is rewritten in the style of Sonner. `toast('Saved')` now sets the **title**, not the description. `message`, `heading` and `no-close` are gone: use `description` (or the default slot) and `close-button`. The default duration is 4000ms (was 5000). New: a stack that fans out on hover, `toast.success`, `.error`, `.warning`, `.info`, `.loading`, `.message`, `.promise`, `.dismiss`, `action` and `cancel` buttons, and updating a toast by `id`.
- **Select** is a custom list like Radix Select, not a styled native `<select>`. Use the new `ht-option` and `ht-option-group` (any content, `label` for the trigger text). Plain `<option>` and `<optgroup>` still work as text. The list opens in the top layer, so it shows above an open dialog. The native mobile picker is gone. New `open` property, `open` and `close` events, and `glass`.
- **Checkbox** is `sm` (16px) by default (was 24px). Set `size="md"` to keep the old size. Checkbox and radio now take `sm`, `md` and `lg`, on the item or on the group.
- **Palette**: the accent moves from pink to deep violet, and text on the accent is now white. Neutrals are cooler. Products that map their own colours over `--ht-*` are not affected.
- **Dialog and alert dialog footers**: the keys sit flush on the bottom edge, 50px tall, and the footer border is gone. This also changes `ht-button flush`.
- **Toggle group** is a sunken track with a raised face for the pressed item. The group height stays 24/28/32px; items are 4px shorter.
- **Icons in buttons, inputs and tags** are 4px larger than the text beside them, and no longer follow the page's font size.

### New

- 20 new elements from the Taskscape gap audit: textarea, avatar (+ group), progress, skeleton, separator, breadcrumb (+ item), popover, menu (+ item, separator, label), alert dialog, sheet, command (+ item, group), table (+ head, body, row, header, cell), toggle, toggle group (+ item), scroll area, calendar, sidebar (+ group, header, footer), emoji picker.
- 3 new elements from the React Vibe audit: ping (status dot), marquee (endless scroller), accordion (+ item).
- 4 new elements from the Motion-Primitives audit: carousel (+ item), number, shimmer, spotlight.
- 6 new components for blocks: code (copy, secret), description list, dropzone (form-associated), pagination, steps, timeline. 10 new elements.
- `ht-alert`: a callout card (tones `neutral`, `info`, `success`, `warning`, `danger`) with an `action` slot. `ht-banner` stays as the one-line bar.
- `ht-empty-state`: a graphic on a fading dot screen, with a pointer spotlight (`no-spotlight` turns it off).
- Generated avatars: `ht-avatar` takes `art` (`pixel`, `dots`, `tiles`) and `seed` and draws an original picture from any string. New exports `generateAvatar`, `avatarDataUri` and `AVATAR_ARTS` make the same pictures outside the element. Opt-in; existing avatars do not change. In forced-colours mode every avatar now gets a `CanvasText` edge.
- `ht-code` colours code by `language` (JS/TS, JSON, bash, CSS, HTML, `.env`, logs, Python). `no-highlight` turns it off. Eight new `--ht-code-*` tokens.
- `ht-toggle-item count`: a mono number after the label.
- Liquid glass: an opt-in `glass` attribute on dialog, alert dialog, sheet, popover, menu, command and select. New `--ht-glass-*` tokens.
- Overlay motion: dialogs, menus, popovers and tooltips spring in and ease out, in CSS only. New tokens `--ht-ease-spring`, `--ht-duration-in` and `--ht-duration-out`.
- Tabs: `orientation="vertical"` and `activation="manual"`. Toast: swipe to dismiss, F8 to focus the stack, timers that hold on hover and focus. Popover: `arrow`.
- Alert dialog: `confirm` and `cancel` slots, and `confirm-disabled` and `cancel-disabled`.
- New tokens: `--ht-halftone-stage` (a calmer dot screen for large areas) and `--ht-surface-raised` (the face of default buttons and the pressed toggle item).
- Blocks: ready-made page sections in plain HTML, like shadcn/ui blocks. Four to start: `login-01`, `app-shell-01`, `settings-01`, `dashboard-01`. Each has a notes file for people and agents. `halftone add <block>` copies a block and its components, `halftone show <block>` prints it, and `llms.txt` lists every block with its notes.
- 16 more blocks, 20 in all: list, detail, activity feed, members, inbox, comments, board, notice card (interstitial), search home, search results, media grid, wizard, setup steps, status, log viewer and invoice. `scripts/check-blocks.mjs` checks blocks without building.
- 9 more built-in icons: `archive`, `image`, `paper-plane-tilt`, `paperclip`, `smiley`, `sparkle`, `squares-four`, `tag`, `upload-simple`.

### Changed

- Selected items get a pip, a short accent bar at the start of the row: command, menu, nav item and tree.
- Tag: a soft raised chip with a gradient and layered shadows; no border.
- Checkbox and radio: a recessed socket with a raised glossy key.
- Switch: an accent track when on, and a rail-style groove.
- Default buttons get a raised face in dark mode.
- The dot screen is quieter and finer, and header strips keep 4.5:1 text contrast.
- The pointer spotlight is stronger and larger.

### Fixed

- Fixes found while writing blocks: `ht-tabs fit` shrinks only the tab track; the selected tab shows in dark mode; `ht-tab-panel` is a tab stop only when it holds nothing focusable; `ht-checkbox` with no text drops the label gap; `ht-input`, `ht-textarea`, `ht-prompt` and `ht-command` ignore the page's `text-align`; `ht-toggle` sizes only icons in its prefix; `ht-banner` actions wrap under the message on narrow bars (new `actions` part); `ht-tag` takes a `font-family` from the host; `ht-select` no longer logs Lit's update-after-update warning; `llms.txt` and the manifest drop a nameless event on menu, popover and select. Blocks lose their workarounds.
- `ht-icon size` sized only the svg, so `size="32"` showed at 16px. It now sizes the icon.
- Switch and checkbox toggle when you click a `<label for>` outside the element.
- The deployed Storybook defined no elements (`sideEffects` now lists the source files).

### Docs and tooling

- A docs site at https://mehrad-meraji.github.io/halftone, with Storybook under `/storybook/`. Component and block pages are generated from the source.
- `scripts/contrast.mjs` checks every token pair that axe cannot see.
- Decisions and trade-offs: `docs/decisions.md`, entries 2026-10-19 to 2026-10-26.

## 0.1.0 (2026-10-12)

First public release. Contents:

- 22 elements: button, input, select, switch, checkbox (+ group), radio group (+ radio), tabs (+ tab, tab panel), card, dialog, banner, toast (+ toaster, `toast()`), tooltip, tag, kbd, nav item, prompt, speech bubble.
- Design tokens (`tokens.css`), light and dark, themed through `--ht-*` custom properties.
- `halftone` CLI: `add`, `list`, `init`, `diff` to copy components into a project (TypeScript or JavaScript).
- `custom-elements.json` and `llms.txt` for tools and agents.
- Zero axe-core violations across all stories in light and dark; see `docs/a11y.md` for what is and is not covered.
