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

## 2026-10-12 — Toast and tooltip (`ht-toast`, `ht-toaster`, `toast()`, `ht-tooltip`) from PostHog
Read from the signed-in PostHog app. Only the toast could be measured; PostHog's tooltip would not render under automated hover (three attempts), so the tooltip's measurements are limited to its colours and popover shape.

Measured (toast, react-toastify config): width 26rem, min-height 3.5rem, radius 6px, 8px padding, `0 4px 12px` at 10% black shadow, viewport offset 16px, solid tone fills (info `#3280ff`, success `#388600`, warning `#f7a501`, error `#db3707`, dark `#21242b`) with white text. Tooltip: surface `#232429`, popover radius 10px and a `0 3px 0` lip shadow on popovers, 50ms opacity transition.

Decisions:
- Tone fills use Halftone tokens, not PostHog's hexes. Success and info are darkened (mixed 82 to 88% toward black) so white text holds contrast. Warning keeps dark text, because white on amber fails. Neutral is the inverse surface, `--ht-inverse` (new token, flips in dark mode), shared with tooltips.
- `toast()` is an imperative helper that creates one `ht-toaster` on first use. The toaster is a manual popover (top layer), so toasts stay above an open modal `ht-dialog`. Default position is bottom-right (PostHog's position was not observed).
- Timer pauses on hover and focus. Danger toasts use `role="alert"`, others `role="status"`. Reduced-motion shortens the animation.
- Tooltip is a wrapper (`ht-tooltip` around the trigger), not a `title` replacement. The bubble is a manual popover positioned in JS (no anchor-positioning dependency); it flips on the main axis and clamps on the cross axis. It shows after 300ms on hover, immediately on keyboard focus, and hides on Escape, press and leave. The trigger gets `aria-description`, which is a supplement, not a replacement for a label.
- Inferred, not measured: tooltip padding (4px 8px), 12px/16px text, 20rem max width, 8px gap, and the toast close button size.

## 2026-10-12 — Accessibility pass and the field-border deviation
First full axe run over 85 stories in both themes found 10 distinct problems; all are fixed and the table is in `docs/a11y.md`. Result: 0 violations in light and dark.

Deliberate deviation from Sentry: fields use `--ht-border-input` (3.3:1 against the surface) instead of the paler `--ht-border-strong`, because Sentry's own field outline is about 1.3:1 and fails WCAG 1.4.11. The inset top line and the focus ring are kept.

Also: `--ht-text-subtle` was lowered in light and raised in dark so it clears 4.5:1 on tinted fills; tone colours in tags and banners now mix toward `--ht-text`; `--ht-danger-ink` is dark in the dark theme.

## 2026-10-12 — Radio group and checkbox
`ht-radio-group` + `ht-radio`, `ht-checkbox` + `ht-checkbox-group`. Style after Sentry's radio (read from the signed-in settings page): 24px, 1px border, circle, accent fill with an inner dot when checked, 2px focus ring, 120ms `cubic-bezier(0.72, 0, 0.16, 1)`. The checkbox is my extension of that (5px radius like the switch knob, tick and dash icons); Sentry's checked and disabled states were taken from its CSS, not observed.

Decisions:
- The group owns the value. Native radios in different shadow roots are not grouped by `name`, so the group sets `checked`, keeps one roving tab stop, and handles Arrow keys (move and select, wrap). Space selects through the native input. The group is the form-associated element (submits `value`, `required` gives `valueMissing`, reset restores the initial value).
- `ht-radio` is only meaningful inside a group, by design: one owner for selection, validity and keyboard.
- `ht-checkbox` is form-associated on its own (submits `value` when checked). `ht-checkbox-group` only adds legend, helper, error, shared disabled and layout; its `value` getter lists the checked values. Checkboxes sharing a `name` already submit independently, so the group does not own form state.
- The tick and dot use `--ht-accent-ink`, not white, because white on the pink fill fails contrast.
- Field borders use `--ht-border-input` (3:1), the same token as inputs.
- Sizes: one (24px). A denser size was not in the source UI.

## 2026-10-12 — `halftone add` (the copy half of the hybrid)
A zero-dependency Node CLI, `bin/halftone.mjs`, shipped in the package. Commands: `add`, `list`, `init`, `diff`.

How it works:
- `npm run registry` (part of `build` and `test`) writes `registry/registry.json`: each component's TypeScript source, a readable JavaScript build, the elements it defines, its dependencies, and `tokens.css`. The CLI reads that file from the installed package, so it works offline and has nothing to fetch. The build step fails if a component imports anything but `lit`, which turns the copy-mode rule from a convention into a check.
- JS output is the TypeScript compiler's own emit (ES2022, comments kept) so a copied file reads like source rather than a bundle. TS 7 has no `transpileModule`, so the registry shells out to `tsc` with `tsconfig.registry.json`.
- Files land flat as `<dir>/<name>.<ext>` with a two-line header recording the package and version. `halftone.json` stores the folder, language and installed versions. Language defaults to `ts` when `tsconfig.json` exists.
- Safety: an existing file is skipped if it differs, unless `--overwrite`; identical files report `unchanged`; `--dry-run` writes nothing, not even `halftone.json`.
- `diff` compares copies with the packaged source and exits 2 on drift. It cannot tell an upstream change from a local edit, so it reports and leaves merging to the owner. A real three-way merge would need the original stored; not worth it for v1.
- Not done: installing `lit` by default (it prints the command, `--install` runs it), per-component dependency graphs (there are none by design), a remote registry (everything ships in the package), and copying stories.

Verified: 10 CLI tests (`npm test`); the copied TypeScript for all 17 units type-checks under a standalone strict tsconfig; the copied JavaScript, served by Vite in a fresh project, defines all 22 elements and tabs and radio groups behave.

## 2026-10-12 — Packaging for publish
Checked from a packed tarball installed in a clean project: the root and per-component subpaths resolve (with and without `.js`), types resolve and reject a bad `variant`, `tokens.css`, `custom-elements.json` and `llms.txt` are importable, the `halftone` bin runs, and Vite serves a page that defines all 22 elements.

- `lit` moved from `dependencies` to `peerDependencies` (`^3`), with a dev copy. Two copies of lit in one page split shared state, so the consumer supplies it. The copy CLI already tells you to install it.
- `exports` has both `./components/*.js` and `./components/*`, because the first draft only resolved the extensionless form that the README did not use.
- `llms.txt` is generated from the manifest at build (`scripts/build-llms.mjs`) and shipped; `prepack` runs the full build so a publish can never carry a stale `dist`, registry or llms.txt.
- Package contents: `dist`, `bin`, `registry`, `custom-elements.json`, `llms.txt`, plus LICENSE and README. 61 files, 105 kB packed; source maps are included.
- `publishConfig` sets `access: public`. Provenance is requested by the publish workflow (`--provenance`), not by `publishConfig`, so a local `npm publish` works without flags.
- MIT licence, author from git config, repository URL `github.com/mehrad-meraji/halftone` (not yet created).

## 2026-10-12 — Storybook on GitHub Pages
`.github/workflows/docs.yml` builds Storybook on every push to `main` and deploys it with `actions/deploy-pages` to `https://mehrad-meraji.github.io/halftone/`. Pages uses the "GitHub Actions" source, so no `gh-pages` branch exists.

The site is served from a sub-path, so the manifest fetch in `.storybook/preview.ts` is relative (`custom-elements.json`, not `/custom-elements.json`); an absolute path worked in dev and would have silently dropped every props table in production. Checked by serving the static build under `/halftone/` and confirming the manifest request and the args table.

Docs rebuild on every push to `main`, independent of npm releases, so the site can run ahead of the published version. `package.json` `homepage` points at it.

## 2026-10-12 — Icons: Phosphor, through `ht-icon`
Phosphor (MIT) is the icon set. Verified in the installed `@phosphor-icons/core@2.1.1`: one SVG per icon per weight, `viewBox="0 0 256 256"`, `fill="currentColor"`.

Decisions:
- `ht-icon` is a normal single-file component. It embeds a curated 50 icons in regular, bold and fill (47 kB of source, 15 kB gzipped; the data sits at the end of the file and is generated by `npm run icons` from the list in `scripts/build-icons.mjs`). It does not depend on `@phosphor-icons/core` at runtime, which keeps copy mode honest.
- Everything else is `registerIcons()`: pass Phosphor SVG files (whole file or inner markup) at any weight; registered icons override built-ins and live icons re-render. Missing names render nothing and warn once, listing what is available.
- Components do not use `ht-icon` internally. They embed the one or two Phosphor paths they need, so each file still stands alone. Replaced: banner and toast tone icons (regular), close buttons (bold x), switch (bold x and check), checkbox (bold check and minus), select (bold caret-down). All were hand-drawn strokes before.
- Sizing is `1em` so an icon follows the type it sits in; `size` overrides. Icons are `aria-hidden` unless given a `label`.
- Licence: the MIT notice is a `/*!` comment in `icon.ts` (kept by minifiers and copied by the CLI) and in `NOTICE`, which ships in the package.
- Not done: duotone and thin built in (weight and size), a searchable gallery with all 1,500 names, an `ht-icon` slot-aware button (`<ht-button icon="plus">`).

Re-verified after the change: typecheck, build, 10 CLI tests, and axe over all 109 stories in light and dark with zero violations.

## 2026-10-12 — "Docs don't work in dev": stale dev server, then pre-bundle
Symptom: every docs page (Guide and each component's Docs tab) showed "Failed to fetch dynamically imported module .../docs/guide.mdx" on `localhost:6006`.

Cause: an 18-minute-old Storybook process still held port 6006 and had gone stale. Its Vite dependency cache no longer matched the files (console: `504 Outdated Optimize Dep`), and a newly started server quietly took 6007, so the browser kept talking to the stale one. The repo itself was fine: on a clean server all 19 docs pages rendered with their props tables.

What changed:
- `.storybook/main.ts` pre-bundles `lit` and the three `lit/directives` the components import (`if-defined`, `live`, `unsafe-svg`). Vite used to discover them one at a time, re-optimise mid-session and invalidate open tabs; `unsafe-svg` arrived with the icon component. A fresh start now logs no re-optimisation.
- `npm run dev:fresh` clears `node_modules/.cache/storybook` and `.vite`, then starts on 6006.

If docs fail again: check the port in the terminal output (it may not be 6006), stop every Storybook process, then `npm run dev:fresh`.

## 2026-10-12 — Tree view (`ht-tree`, `ht-tree-item`), file-tree style
Design: a file explorer's rows, not a disclosure menu. Row look reuses `ht-nav-item` (28px rows at 13px, 6px radius, hover at 7.5% of the text colour, selected at 5% and weight 500) so a tree beside a nav list matches. Indent is 16px per level (`--ht-tree-indent`), rows run full width so hover and selection reach the left edge, optional `guides` draw one hairline per ancestor level, and the caret is Phosphor's bold caret-right rotating 90 degrees. Folders get a folder or open-folder glyph, leaves a file glyph; the `icon` slot replaces them per file type and `suffix` takes counts or tags.

Authoring: nest `ht-tree-item` inside `ht-tree-item`, no data array. The tree moves nested items into the parent's `children` slot itself (same trick as tabs), computes level, set size and position, and marks folders by whether they have item children. `HtTree.items`, `expandAll()` and `collapseAll()` are the programmatic surface; `change` reports selection, `ht-toggle` reports expand and collapse.

Behaviour (WAI-ARIA tree pattern): one tab stop that follows the selected item; Up and Down walk the visible rows (collapsed children are skipped); Right expands, then enters the first child; Left collapses, then goes to the parent; Home and End; Enter or Space selects; `*` expands siblings; typing jumps to the next item starting with those letters (500ms buffer). Click selects, and toggles a folder; clicking the caret only toggles. A treeitem's accessible name is its own label, set explicitly, because name-from-content would read every descendant.

Navigation use: an item with `href` renders its row as a link; the selected one gets `aria-current="page"`. I chose `role=tree` for both, which is right for a file explorer and acceptable for a docs sidebar, but a plain nested list with disclosure buttons is simpler for assistive technology on content sites. Pick the tree when users expect arrow-key file-explorer behaviour.

Not built: multi-select, drag and drop, rename, context menus, lazy loading of children, virtualisation for very large trees. Checked in the browser: roles and levels, selection, caret versus row click, all the keys above, type-ahead, and axe on all six stories in both themes (0 violations). Not checked with a screen reader.

## 2026-10-13 — `prepare` builds on a git install
Why: npm was unavailable (account suspended for 72 hours), and a git install of this repo got source only, because `dist/`, `registry/` and `llms.txt` are build output and ignored by git.

`scripts/prepare.mjs` runs as the `prepare` hook and builds only when this package is being installed as a dependency of another project (`INIT_CWD` differs from the repo root) and is not built yet. Inside the repo it does nothing, so `npm install`, `npm ci` and CI stay fast, and `npm publish` still uses `prepack`. npm installs a git dependency's devDependencies when it has a `prepare` script, which is what makes the build possible; `files` then decides what the install keeps.

Verified from the committed state: `npm i git+file:///...#<sha> lit` into an empty project took 18 s, produced `dist`, `registry`, `llms.txt` and the manifest, ran the `halftone` bin, copied components, and resolved every export subpath.

Side fix: the CLI crashed with an unhandled `EPIPE` when its output was piped into `head`; it now exits quietly (test added).

Caveats: a git install needs the build toolchain, so it is slower and heavier than an npm install; it tracks whatever the ref points at. The local `v0.1.0` tag is stale, so pin a commit until the real release tag exists.

## 2026-10-19 — Twenty components from the Taskscape gap audit
Taskscape (React, Radix, shadcn) has primitives Halftone lacked. Twenty were added in four batches: display (textarea, avatar, progress, skeleton, separator, breadcrumb), overlays (popover, menu, alert dialog, sheet, command), data and toggles (table, toggle, toggle group, scroll area, calendar) and app shell (sidebar, emoji picker). Taskscape's `label` is already covered by the `label` attribute on `ht-input`. Mechanics (keys, roles, sizes) come from Taskscape's source and the WAI-ARIA patterns; looks come from existing Halftone parts and tokens. No Sentry or PostHog session was available, so sizes not taken from Taskscape or an existing part are inferred and marked in each file. Chosen look: Halftone's own rules, not a copy of Taskscape.

### Display: textarea, avatar, progress, skeleton, separator, breadcrumb
`ht-textarea` is `ht-input`'s field (same border, inset top line, 2px focus ring, form association, label forwarding) with `rows`, `autosize` plus `max-rows`, and an optional `maxlength` counter. It stays separate from `ht-prompt`, which is a rounded command box with trailing actions. `ht-avatar` is an `img`-role element named by `name`, with an initials fallback on a tint hashed from the name, so one person is always one colour. Tints reuse the soft/text token pairs, or mix the tone toward `--ht-text` in oklab (as `ht-tag` does), checked at 4.5:1 or better in both themes. A status dot is slot-only, and its meaning travels in `status-label`, because a dot is only colour. `ht-avatar-group` hides overflow avatars itself and shows a `+N` chip. `ht-progress` fills are the tone mixed 30% toward text so they keep 3:1 against the track (the raw accent gave 2.5:1). Indeterminate becomes static stripes under reduced motion so "unknown length" survives without movement. `ht-skeleton` is `aria-hidden` and carries no loading semantics: the consumer marks the region `aria-busy` and adds a status line, and the story shows the pattern. `ht-separator` defaults to a real separator (like `<hr>`) and `decorative` opts out; Taskscape's Radix default is decorative, so this differs. With a label, the role sits on the leading line and the label stays readable text. `ht-breadcrumb` is a `nav` + `ol` whose items set `role="listitem"` on their own hosts. Collapse works by assigning items to named slots. Expanding is one-way and moves focus to the first revealed item. Not built: breadcrumb re-collapse, avatar status presets, a thicker separator, a skeleton `loading` wrapper.

### Overlays: popover, menu, alert dialog, sheet, command
Popup panels (`ht-popover`, `ht-menu`) are manual popovers in the top layer, positioned in JS with the `ht-tooltip` flip-and-clamp (main axis flips, cross axis clamps), `placement` accepting `-start` or `-end`. Each file carries its own copy of the helper. Light-DOM content and shadow-DOM panels cannot share id references, so `ht-popover` points `aria-controls` at the slotted content element, `ht-menu` sets none, and `ht-command` drives `aria-activedescendant` through `ariaActiveDescendantElement` with an attribute and live-region fallback. Events that could be mistaken for native ones are non-bubbling (`open`, `close`, `confirm`, `cancel`): a bubbling `close` or `cancel` from a popover or alert dialog placed inside `ht-dialog` would hit its native handlers. `ht-select` (menu, command) bubbles and is cancelable, so `preventDefault()` keeps the surface open. `ht-menu` follows the APG menu button pattern: disabled items stay focusable (Radix skips them), a pointer-opened menu focuses the panel until the first arrow press, and `contextmenu` turns the trigger slot into a right-click target. `ht-alert-dialog` draws its flush footer locally so the file stays copyable, focuses Cancel first, ignores backdrop clicks, and treats Escape as a cancelable `cancel`. `ht-sheet` animates open and close with CSS keyframes and a class, not `@starting-style`, so Safari and Firefox get the same slide. `ht-command` takes the `ht-nav-item` row look, filters by substring with an in-order-letters fallback for words of 3+ letters, keeps authored order, and doubles as a palette through a `palette` attribute. Not built: submenus, nested or modal popovers, relevance sorting, async or custom filtering.

### Data and toggles: table, toggle, toggle group, scroll area, calendar
`ht-table` puts the ARIA role on each host (`table`, `rowgroup`, `row`, `columnheader`, `cell`) and lays out with `display: table*`, with the default slot as the table box inside a bordered scroll wrapper, so assistive technology sees one real table. Zebra striping and last-row rule removal pass through private custom properties, not `::slotted` overrides. The table never sorts: a sortable header fires `sort` with `{ key, direction }` and the consumer reorders rows. `ht-toggle` shows the pressed state as a fill plus a full-strength border, so it does not rely on colour. `ht-toggle-group` single mode is a radio group (arrows move and select, no way to clear, unlike Radix); multiple mode is a group of toggle buttons (arrows move focus, Space or Enter toggles); both use roving tabindex and a joined, bordered look, deliberately unlike the recessed track of `ht-tabs`. Multiple-mode `value` is comma-separated. `ht-scroll-area` keeps native scrolling and styles it (`scrollbar-width` and `scrollbar-color`, WebKit fallback), fades edges with a mask that works on any background, and is a tab stop only while content overflows. `ht-calendar` follows the WAI-ARIA date grid with plain y/m/d arithmetic in UTC and `Intl` for names and week start, so there is no date library and no time-zone drift. Not built: table footer, selection or pagination; toggle-group vertical orientation; calendar ranges, `required`, and deselect.

### App shell: sidebar, emoji picker
`ht-sidebar` is one file with its group, header and footer, and styles consumer rows generically instead of importing `ht-nav-item`. Rail mode is done by clipping slotted rows to a 2.25rem icon column, so it needs no hook in the row component; `data-expanded-only` marks things that should disappear. The sidebar owns no storage: `collapsed` is the consumer's to persist, and `ht-sidebar-toggle` fires only for user actions. Below `mobile-breakpoint` (768) the same content moves into a native `<dialog>` drawer, which gives the focus trap, Escape, scrim and focus return. The drawer scrim reuses `ht-dialog`'s literal colour. `ht-emoji-picker` ships about 330 emoji inline in its single file, because a component may import only `lit`. It is a panel, not a popup, so `ht-popover` can host it. Its grid follows the ARIA grid pattern with one tab stop, sticky `rowheader` category rows and a toolbar of plain buttons. Recents and skin tones are left to the consumer or out of scope. Rejected: a virtualised grid and per-category tabs.

Status: type-checked, built and tested (CLI tests pass). Axe results are in `docs/a11y.md`. Not tried with a screen reader, Safari or Firefox.

## 2026-10-19: Source files are side-effectful (deployed Storybook defined no elements)
`package.json` `sideEffects` listed only `dist` paths, so the production Storybook build treated `src/components/**` as having no side effects and dropped bare imports such as `import './alert-dialog.js'` from the stories. No `ht-*` element was defined on the deployed docs site, so `nextElementSibling.show()` in the dialog stories threw `show is not a function`. `npm run dev` does not tree-shake, so it hid the bug. `src/components/**` and `src/index.ts` are now listed. Check after any build change: open a built story and run `customElements.get('ht-button')`.

## 2026-10-19: Tag becomes a soft raised chip
`ht-tag` moves from a 1px outlined label to a raised chip, after a reference photo of a white chip: a fill that brightens a little toward the top, a faint inner glow and hairline rim, a short dark crescent under the bottom edge, and a wide soft shadow below. Neutral is plain surface with `--ht-text`. Tones tint the fill (12 to 16% of the raw tone colour over `--ht-surface`) and colour the text. The border is gone and padding grows (6px sm, 8px md). Shadow colours are black at low alpha, which reads on both themes. Axe skips text on gradients, so contrast was measured by hand against all three gradient stops, in both themes: worst case 5.31:1 (success text, dark). Success and info text are mixed 50% toward `--ht-text` because the tinted fill is lighter than the old transparent one. Not changed: the Taskscape `Badge`, which has its own look.

Follow-up the same day: the first pass was too strong, so every shadow alpha and both gradient stops were roughly halved (crescent 22% to 11%, soft shadow 10% to 5%, inner glows to 3 to 3.5%, top lift white 14% to 8%, bottom darkening 4% to 2%). A softer gradient only raises contrast, so the 5.31:1 worst case still holds as a floor.

## 2026-10-19: Checkbox becomes a recessed socket with a raised key
`ht-checkbox` follows a reference photo of a pink key set in a well. The box is a 24px socket: sunken gradient fill, inner shadow, a light lip under the bottom edge, and a 1px `--ht-border-input` outline so the control still meets 3:1 against the page. Checking raises a key (`::after`, 1px inside the outline) with a radial accent gradient, a top highlight and a drop shadow; the mark is a bold white stroke with no shadow. Checked and mixed turn the outline to a faint accent. Corners are concentric: 7px socket and 5px key, or 10px and 8px where `corner-shape: squircle` is supported (a squircle reads tighter than a circular arc of the same radius). Pressing nudges the key down half a pixel. The key gradient runs accent to 26% darker so the white mark holds 3.27:1 at the lightest stop (4.48:1 at the centre); the first version lifted the top with white and measured 2.63:1. Axe does not check graphics, so this was measured by hand. Not changed: the radio and switch, which keep their own looks.
