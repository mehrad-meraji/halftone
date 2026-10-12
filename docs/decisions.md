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
