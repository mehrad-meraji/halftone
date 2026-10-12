# Decisions

## 2026-10-09 — Hybrid distribution
npm package is the source of truth (versioned, themed with CSS variables). Each component is a single file importing only `lit`, so a copy CLI can be added later without restructuring. Rejected pure shadcn (drift, tooling assumptions) and pure package (no escape hatch).

## 2026-10-09 — Stack
Lit + TypeScript + Vite library mode; Storybook (web-components-vite) for docs; Custom Elements Manifest as the machine-readable API. Package name `@_mehrad/halftone` (unscoped `halftone` is taken on npm; matches `@_mehrad/cbox`). Tag prefix `ht-`.

## 2026-10-09 — Visual direction: between Sentinel and Taskscape
Replaced the first comic-yellow, thick-border look. Token vocabulary from Taskscape (bg/surface/border/text tiers, accent + soft/text/ink, `--ht-radius-*`, xs/sm/md shadows); mood from Sentinel (mauve-tinted neutrals, `#e838e8`-family pink accent, near-black violet dark page, Chakra Petch + IBM Plex Mono). Geist for UI (Taskscape's). Radii 2/6/10px: sharper than Taskscape's 4/8/12, but nonzero so the Taskscape dialog-footer signature (flush buttons, mixed radii) still reads. 1px borders everywhere; comic flavour is kept to one faint halftone dot screen on card and dialog headers (`--ht-halftone`, set `none` to remove) and the speech-bubble shape. Rejected: hard offset shadows, Sentinel scanlines, Taskscape's three colour directions.

## 2026-10-09 — tokens.css is required
Components use `var(--ht-*)` with no inline fallbacks. Copy mode therefore means "the component file plus tokens.css". Fonts are never bundled; the docs load them.

## 2026-10-09 — Button click handled on the host
`ht-button` listens for `click` on the host, not the inner `<button>`, so `el.click()` still submits or resets the form.

## 2026-10-12 — Component styles come from sentry.io, starting with buttons
Source is the app's sign-in page (sentry.io/auth/login), not the marketing site. I first read the marketing page's buttons by mistake (uppercase, gradient "glow" variants); those were removed.

Taken from the app's button: the keycap construction. A plate (`::before`, darker, with a 2px shadow) sits under a face (`::after`, 1px plate-coloured border) that is raised 2px (`--_lift`); hover raises it to 3px, active presses it to 0, disabled sits at 0. The label rides with the face. 120ms `cubic-bezier(0.8, -0.4, 0.5, 1)`. Focus is a 2px ring around face and plate; solid variants get a 2px dotted inner border instead. Sizes 24/28/32/36px, weight 500, sentence/Title Case, no uppercase. A `quiet` variant is flat with a 6%/10% hover/active tint and no plate.

Colours stay on Halftone tokens: plate = the face mixed 62% toward black for primary/danger, `--ht-border-strong` for default. Variants are `primary`, `default`, `danger`, `quiet`. Added `href` (renders `<a>`) and `block` (full width). Removed `secondary` and `glow*` and the `--ht-glow-*` tokens. Button `md` is 32px, so it lines up with `ht-input`.

## 2026-10-12 — Form controls from Sentry's app (settings pages)
Read from the signed-in app's account settings page (computed styles only).

Field (`ht-input`, `ht-select`): faint tint (`--ht-text` at 3%), 1px `--ht-border-strong` border, a 1px inset line along the top edge, radius `--ht-radius-md`, 16px side padding, 14/16px type. Focus adds a 2px `--ht-focus` ring and leaves the border alone. Transitions are 120ms `cubic-bezier(0.72, 0, 0.16, 1)` on border and box-shadow. Disabled is `not-allowed` with subtle text. Sizes sm 32, md 36 (Sentry's default), lg 40. Pair `ht-input` md with `ht-button` lg, or `ht-input` sm with `ht-button` md, to share a height.

Switch (`ht-switch`): 40x24 track, 24x24 square knob raised 1px, a cross when off and a tick when on, 0.35s spring `linear()` easing. The checked track colour and hover lift are inferred (I did not toggle the user's live settings).

Select: Sentry uses react-select; Halftone wraps the native `<select>` and mirrors light-DOM `<option>`s into it, which keeps keyboard, mobile pickers and a11y native. The dropdown menu is therefore the browser's.

Not done: radio (24px circle, checked fill + 12px dot, focus ring) needs a group element for arrow-key behaviour across shadow roots; error state colours are Halftone's, since no invalid field was on the page.

Note: two of the page's stylesheet rules came back blocked by the browser tool as "cookie/query string data"; the input and checkbox values above come from computed styles instead.

## 2026-10-12 — Tag, banner, kbd, nav-item from PostHog's app
Read from the signed-in PostHog home page (computed styles only, no project data). PostHog's own button is also a keycap with a lip (`0 3px 0 -1px` shadow, 1px border), close to what `ht-button` already does, so buttons were not changed.

- `ht-tag`: 1px border and text share one colour on a transparent fill, radius 6px, 16px tall with 10px/14px medium text (`sm`), padding 0 3px. `md` (20px, 12px text) is my extension. Warning and info text are darkened (mixed toward black) because PostHog's amber on white is under 3:1.
- `ht-banner`: 1px border, radius 6px, 8px padding and gap, min-height 48px, 14px/22px medium text. Info is the plain surface; success, warning and danger tint the fill and border. Tints mix in `oklab`, because `oklch` interpolation sends amber toward pink across the mauve surface hue.
- `ht-kbd`: one 20px keycap per key (12px text, 2px 4px padding, radius 4px, 2px gap). Added a 2px bottom edge for the keycap feel.
- `ht-nav-item`: 30px ghost row, 4px 6px padding, 6px gap, radius 6px. Hover is the text colour at 7.5%, pressed and current page 5% (PostHog's `highlight` ramp 2.5, 5, 7.5, 10, 15, 20%).

Palette is not borrowed: PostHog's light theme is warm grey-green (page `#f3f4f0`, sidebar `#e5e7df`, border `#dbded4`, text `#0d0d0d`), Halftone stays mauve-tinted.

Not done: the command/prompt box ("What can I help you with?" with a "Tab to search" hint), the promo card with mascot, and the segmented Apps/Files/Chat tabs. The prompt box would be an `ht-input` variant with a trailing hint slot.

## 2026-10-12 — Prompt box (`ht-prompt`) from PostHog's home page
Read from the signed-in app: a `<label>` container (min-height 40px, 1px border, radius 10px, white fill, 4px padding and gap, items aligned to the bottom) around an auto-growing borderless textarea (14px/20px, 4px padding, max 300px) and a trailing quiet xs button with a 10px "Tab to search" hint. The placeholder is an overlay with a muted second part ("/ for commands").

Focus is a soft neutral halo, not a coloured ring: border goes from `--border-primary` to `--border-secondary` and a `0 0 0 3px` shadow in the text colour at 7.5% appears (`.input-like:focus-within`). Hover only strengthens the border. Both use 0.1s ease-in-out. This is the `input-like` rule that PostHog applies to all fields, so Halftone's `ht-input`/`ht-select` still use Sentry's ring; the two systems are mixed on purpose, the prompt box being the one place that follows PostHog.

Behaviour added on top: Enter fires a cancelable `ht-submit` (`detail.value`) and then requests form submit unless cancelled; Shift+Enter and IME composition do not submit; empty values never submit. Form-associated (value, reset, required, disabled). Height auto-grows via `scrollHeight`, not `field-sizing`, for Safari. Trailing controls go in the `actions` slot rather than a built-in button, so "Tab to search", send arrows or model pickers are the consumer's.

## 2026-10-12 — Segmented tabs (`ht-tabs`, `ht-tab`, `ht-tab-panel`) from PostHog's sidebar
Read from the signed-in app's Apps / Files / Chat switcher (`role="tablist"`): a track with 4px padding and 4px gap, radius 10px, filled with the text colour at 5%; tabs are 30px tall (4px 6px padding, 4px gap, radius 6px, 14px/20px, equal width via `flex: 1 1 0`); the selected tab is a flat filled pill with no border. Unselected tabs tint on hover.

Choices:
- PostHog's selected pill reuses the sidebar's own colour (`surface-tertiary`), which only works against that sidebar. Halftone uses `--ht-surface` plus `--ht-shadow-xs` so it reads as raised on any background.
- One folder, three elements. `ht-tabs` moves its `ht-tab` children into the track by setting `slot="tabs"`, so authors write plain `<ht-tab>` children. Panels are optional `ht-tab-panel` siblings matched by `value`; `aria-controls` and `aria-labelledby` are wired automatically.
- Keyboard follows the WAI-ARIA tabs pattern with automatic activation: arrows wrap, Home and End jump, roving `tabindex`. `change` fires only on user action.
- `fit` shrinks the track to its content (PostHog always fills its container).
- Not included: an underline variant, vertical orientation, and closable tabs. None appeared in the source UI.
