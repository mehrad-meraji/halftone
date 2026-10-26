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

## 2026-10-19: Radio matches the checkbox: round socket, raised key
`ht-radio` takes the checkbox's construction in a circle: a 24px recessed socket (sunken gradient, inner shadow, light lip, 1px `--ht-border-input` outline) with a raised glossy key (`::after`, 1px inside the outline) when checked, and a faint accent outline. There is no centre dot: the raised key against the empty socket is the checked cue, and it keeps 3.79:1 (light) and 4.54:1 (dark) against the socket fill, measured by hand since axe skips graphics. The key gradient is the same accent-to-26%-darker run as the checkbox. Pressing nudges the key down half a pixel. A circle needs no squircle or concentric-radius rule. Not changed: switch.

## 2026-10-19: Checkbox becomes a recessed socket with a raised key
`ht-checkbox` follows a reference photo of a pink key set in a well. The box is a 24px socket: sunken gradient fill, inner shadow, a light lip under the bottom edge, and a 1px `--ht-border-input` outline so the control still meets 3:1 against the page. Checking raises a key (`::after`, 1px inside the outline) with a radial accent gradient, a top highlight and a drop shadow; the mark is a bold white stroke with no shadow. Checked and mixed turn the outline to a faint accent. Corners are concentric: 7px socket and 5px key, or 10px and 8px where `corner-shape: squircle` is supported (a squircle reads tighter than a circular arc of the same radius). Pressing nudges the key down half a pixel. The key gradient runs accent to 26% darker so the white mark holds 3.27:1 at the lightest stop (4.48:1 at the centre); the first version lifted the top with white and measured 2.63:1. Axe does not check graphics, so this was measured by hand. Not changed: the radio and switch, which keep their own looks.

## 2026-10-19: Liquid glass for overlays, and the dialog footer keys
**Glass.** An opt-in `glass` attribute on the components that overlay the page: `ht-dialog`, `ht-alert-dialog`, `ht-sheet`, `ht-popover`, `ht-menu`, `ht-command`. A glass panel is translucent (`--ht-surface` at 62% light, 76% dark), blurs and saturates what is behind it (`backdrop-filter`), and has a bright rim and a diagonal sheen. In `ht-menu` and `ht-command` every row is a faint glass pill, with a brighter one on hover, focus or the active item. Rows do not blur on their own: a backdrop filter inside a backdrop-filtered parent sees nothing, so rows are tints and rims only, and share the panel's look through private custom properties (`--_row-bg` and friends) that the panel sets and the rows inherit. The recipe lives in `--ht-glass-*` tokens, set for light and both dark blocks, so a theme can retune it. Glass dialogs use a lighter scrim (20%) so there is colour to blur. It is opt-in so nothing existing changes; making it the default is one attribute flip per component. Not glass: nav item, tabs, tree (these sit in the layout, not over it), tooltip and toast. Contrast: axe cannot judge text over a blur, so main, muted and subtle text were measured by hand against the panel fill over the most saturated backdrops in the demo (red, blue, green, magenta, plus white in light and black in dark). Worst cases: text 12.7:1 light and 10.1:1 dark, muted text 5.2:1 in both, subtle text 4.2:1 in both. Subtle text (hints, eyebrows) is under 4.5:1 only over a saturated backdrop, so keep it off glass where it carries meaning.

**Dialog footer.** `ht-dialog` and `ht-alert-dialog` lose the outer border and the footer's top border. The footer keys follow the Taskscape dialog: flush with the bottom-left edge, 16px apart, 50px tall, labels 48px from the sides, primary key first. Corners follow position, not role: a key touching the left edge has no top-left radius and takes the dialog radius at the bottom left; a key touching the right edge has no top-right radius and takes it at the bottom right; other keys have rounded tops. The component measures the footer and sets `data-edge-left` and `data-edge-right`. Keys never leave the dialog: they shrink, wrap long labels at word breaks, and sit exactly on the bottom edge (overflow stays hidden). Secondary keys are plain surface faces outlined on the top and sides, open at the bottom. `ht-button` `flush` carries the same look, so slotted buttons need no extra styling. `--ht-flush-padding` (default 3rem) sets the key's side padding. A first attempt let the keys hang below the bottom edge; that was wrong and was removed. `ht-sheet` keeps its side border and plain footer.

## 2026-10-19: Palette becomes B. Violet
The palette moves from mauve neutrals and a bright pink accent to cool violet-tinted neutrals and a deep violet accent, so Halftone sits closer to Taskscape Cobalt. Chosen from three options compared side by side (today, a softer rose, and this one). Changes in `src/tokens/tokens.css`, light and dark: the accent goes from `oklch(0.68 0.25 328)` to `oklch(0.54 0.212 300)` and its ink (text on the accent) from dark to white, because the deeper accent holds white at 5.46:1 where dark ink on it was 4.33:1; neutrals shift from hue 295 to 305 down to about 273 to 283 with chroma at 90%; success, warning, danger and info move a few degrees in hue and lose 15% chroma; dark surfaces are a touch lighter (+0.02). The accent-soft, accent-text, hover and focus tokens follow the accent. The glass tokens derive from `--ht-surface` and needed no change. The checkbox mark and radio key use the accent as before. `scripts/contrast.mjs` has the new values and every pair passes in both themes. The white mark on a checked box is now 5.62:1 (it was 3.27:1). The tuner and compare pages were throwaway tools and are not in the repo. Not changed: the scrim colour (already violet, hue 295), the halftone dot screen (follows the accent), and radii or fonts.

## 2026-10-19: React Vibe audit, three new elements
Audited reactvibe.com/docs (74 React + Tailwind + Framer Motion items, about 10 read in full, the rest judged by name). Most of it is marketing sections (hero, pricing, footer, testimonials) and animated SVG backgrounds, which are not primitives. Separator, switch, dropdown and shadow button are already covered. Nothing could be copied (React, Tailwind, Framer Motion), so only ideas were taken, and the look is Halftone's own.

- `ht-ping` (from Pulse Ping): a status dot with a ring that pulses outward. A dot is only colour, so it is `aria-hidden` unless it has a `label`, which makes it a `role="img"`. `still` turns the pulse off; reduced motion also turns it off. Warning is mixed toward `--ht-text` because amber is the palest tone.
- `ht-marquee` (from Brand Loop): slotted content scrolls without end. The loop is seamless because the content is cloned once into an `aria-hidden`, `inert` copy and the track moves exactly one group width. Speed is pixels per second, and the duration is measured from the content width. It stops on hover and focus-within, and `paused` stops it from outside (WCAG 2.2.2). Reduced motion removes the copy and lets the row scroll by hand. The copy is a snapshot taken on `slotchange`. Not built: vertical mode, right-to-left layout.
- `ht-accordion` + `ht-accordion-item` (the gap behind React Vibe's FAQ block, built from the WAI-ARIA accordion pattern, not from React Vibe): header button inside a heading (`level`, default 3), `aria-expanded` and `aria-controls`, Up, Down, Home, End with wrap, disabled items skipped. One item open at a time unless `multiple`; the first one authored open wins. Height animates with grid rows (`0fr` to `1fr`), and a closed panel is `visibility: hidden` so it leaves the tab order and the accessibility tree. No landmark role on panels (the pattern warns against it with many items). Not built: an icon-left variant, a "collapsible=false" mode.
- Skipped on purpose: Orbit Border and the gradient badge (rotating gradient border, off-tone for Halftone), Flowlist (a stagger helper, not a component), and the Glow cursor spotlight (a possible later `ht-spotlight` with the halftone dot screen).

Checked: typecheck and build pass; axe 4.10 shows 0 violations on 15 stories in light and dark; accordion click, single-open and arrow keys exercised in the browser; marquee loop end position equals one group width. The preview pane froze animation time, so marquee and ping motion were checked by seeking, not by watching.

## 2026-10-20: Alert dialog actions take slots and can be disabled
Taskscape's confirm dialogs put a spinner and a "Deleting…" label inside the confirm action, disable both actions while a request runs, and disable confirm until a choice is made. `ht-alert-dialog` could only set a label string. It now has `confirm` and `cancel` slots, which replace the `confirm-label` and `cancel-label` text inside the key, and `confirm-disabled` and `cancel-disabled` booleans that disable the native buttons. The `description` attribute stays a string. Richer description content goes in the default slot, which is already inside the `aria-describedby` body, so no new slot was needed. A disabled cancel still lets Escape cancel (as Radix does), and the consumer decides what Escape does through the cancelable `cancel` event. Disabled keys keep the layout, drop to 50% opacity, and lose the hover and press filters.

## 2026-10-20: Motion-Primitives audit, four new elements
Audited motion-primitives.com/docs (33 items per a third-party catalogue; the official pages for all 16 text, number and surface effects plus Accordion, Dock and In View were read, props and examples only, not source). It is React, Tailwind and Motion, so nothing is copied; only ideas were taken, and none needs a runtime dependency.

- `ht-carousel` + `ht-carousel-item` (from Carousel; the one real gap): native scroll-snap, previous and next buttons, optional dots. WAI-ARIA carousel pattern: the host is a named `region` with `aria-roledescription="carousel"`, each item is a `group` named "N of M". No autoplay, on purpose: it would need a pause control and WCAG 2.2.2 handling that nothing asked for. The current slide comes from an `IntersectionObserver` at 50% (with the end of the scroll forcing the last slide, so dots still reach it when several slides are visible at once). Navigation scrolls the slide area with `scrollTo` from measured rects, not `scrollIntoView`, so the page never jumps. The slide area is a tab stop with Arrow, Home and End keys. Not built: autoplay, looping, vertical, drag, RTL.
- `ht-number` (from Sliding Number and Animated Number, as two effects of one element): `slide` gives each digit its own 0 to 9 reel moved by a CSS transition, keyed by place value so a digit keeps its reel when the length changes (999 to 1,000); `count` tweens the value with a short rAF ease-out. Formatting is `Intl.NumberFormat` with Latin digits. Screen readers get the final value in a visually hidden span and the moving digits are `aria-hidden`. The first value is shown without animation. Named `ht-number`, not `ht-counter`, though it can be mistaken for a number field next to `ht-input`; revisit if it confuses.
- `ht-shimmer` (from Text Shimmer): a gradient swept through slotted text with `background-clip: text`. Static, in the base colour, under reduced motion; plain `CanvasText` in forced-colors mode, where transparent text would vanish. The text stays slotted so it can be selected and found. It announces nothing; the story shows a `role="status"` pairing. The design hook flagged gradient text; ignored for this file only, because the sweep is the function.
- `ht-spotlight` (from Spotlight): the halftone dot screen and a faint accent glow revealed under the mouse by a radial mask, position in CSS variables set on `pointermove`. Decoration only: `aria-hidden`, no pointer events, ignores touch, and not shown with reduced motion.
- Skipped on purpose: Text Shimmer Wave, Text Roll, Text Morph and Spinning Text (per-letter or heavy motion with little value), Glow Effect (colours outside the tokens), Tilt and Magnetic (moving targets and motion discomfort), Progressive Blur (eight stacked backdrop blurs; `ht-scroll-area` already fades edges). Left as maybes: Text Effect, Text Loop, Text Scramble, Border Trail, In View and Animated Group (scroll reveal).

Checked: typecheck and build pass; axe 4.10 shows 0 violations on 17 stories in light and dark. In the browser: carousel buttons, dots, End and Home, labels and `change` events; number digits, growth from 999 to 1,000, USD, German, compact and the count end value (rAF shimmed to timers, because the preview pane freezes animation time); shimmer paints slotted text through the gradient; spotlight follows the pointer, ignores touch, fades on leave.

## 2026-10-20: Switch and checkbox respond to outside label clicks
A `<label for="id">` next to an `ht-switch` or `ht-checkbox` clicks the host element, not the native input inside its shadow root, so the control did nothing. Taskscape pairs most of its switches with such labels. Each control now listens for a click on its own host and forwards it to the inner input, which toggles and fires `change` as before. Only clicks whose first target is the host itself are forwarded (`composedPath()[0] === this`); clicks from inside the shadow tree are already handled by the inner label and input, so there is no double toggle. A disabled control ignores it, because a disabled input does not click. `ht-radio` needed no change: `ht-radio-group` already selects on any click that reaches a radio. Measured in Storybook: one `change` per click, from the label and from the control, for both parts.

## 2026-10-19 — Overlay motion is CSS only
Dialog, alert dialog, command, popover, menu and tooltip now animate in and out with `@starting-style` plus `transition: overlay, display allow-discrete`, so the exit plays before the element leaves the top layer. No JS timers, no animation library. This replaces the `.on` class that popover, menu and tooltip toggled from `requestAnimationFrame` (it could only animate in).
- Tokens: `--ht-ease-spring` (small overshoot), `--ht-duration-in` 240ms, `--ht-duration-out` 140ms. Out is faster than in.
- Panels scale from 0.96 and grow out of the side that faces the trigger. Scrims fade while they blur the page by 3px.
- Micro touches: footer keys rise from the bottom edge one after another (cassette keys), the dialog body fades up, the close icon turns on hover, menu items stagger in (`sibling-index()`, ignored where unsupported), toast springs in.
- Browsers without `overlay` transitions close at once. `prefers-reduced-motion` removes all of it, as before.
- Sheet keeps its JS close (it slides, so the spring overshoot would show a gap at the edge). It only gains the scrim blur.

## 2026-10-20 — The dot screen is a stage texture, not a surface
Compared how Radix, Fluent, Carbon, Polaris, Primer and pattern guides use backgrounds and images (notes in the vault, `Projects/halftone/ideas/background-patterns-research.md`). Product chrome stays flat; texture and imagery are placed by role, at chosen moments, in one or two quiet motifs. Halftone keeps one motif, the dot screen, and gives it rules.

**Where it goes**
- Header strips of containers (card, dialog, alert dialog, sheet). Already so.
- Stages: a surface that exists to show or frame something. The docs example stage, hero figures, empty states, a sign-in side panel, spotlight and onboarding.
- Fading out toward the content (a mask), so the dots read as tone and not as a tile. This is what "halftone" means, and it is the signature move for stages.

**Where it never goes**
- Behind body copy, inputs, tables, lists or code.
- On menus, select lists, popovers, tooltips and toasts. Those are glass or solid, one material per role (as Fluent does).
- On error states. An error uses the alert icon, not decoration (Primer).

**Tokens**
- `--ht-halftone` stays: 6px tile, 0.8px dots, accent at 26%, for strips only.
- Add `--ht-halftone-stage` for large areas: an 8px tile, 1px dots, accent at 18%. Large areas need a calmer screen.
- Both are `none` when a product opts out (Taskscape sets `--ht-halftone: none`), and both are `none` under `forced-colors: active` and `prefers-contrast: more`.
- Text on a patterned area keeps 4.5 to 1 against the dots' brightest point.

**Images**
- Halftone ships no raster images. Illustrations are inline SVG that use `currentColor` and tokens, so they follow the theme. Quiet line style by default, expressive (gradient, layered) rarely (Carbon).

**Done.** `--ht-halftone-stage` and the `forced-colors` and `prefers-contrast: more` opt-outs are in `tokens.css`. New `ht-empty-state`: a graphic on a dot disc that fades out (a mask), text and actions on the plain surface, `tone="error"` for no stage and an alert icon, `level` for the heading. Its graphic is decorative and hidden from screen readers. Still open: a glass look and an illustration set.

## 2026-10-20 — Radix review: three updates to existing components
Reviewed Radix Primitives against Halftone. Halftone covers 18 of the 30 Radix components (Menu covers Dropdown Menu and Context Menu). This change takes three features Halftone lacked, without adding any component:
- **Tabs**: `orientation="vertical"` (tabs stack on the left, Up and Down move, `aria-orientation` set) and `activation="manual"` (arrows move focus only, Enter or Space selects, the tab stop follows focus).
- **Toast**: swipe to dismiss. Drag toward the edge the toaster sits on (or set `swipe` to `left`, `right`, `up`, `down`, `none`); 50px or more dismisses, less snaps back, and the timer waits while it is held. Buttons and links inside the toast do not start a drag.
- **Popover**: `arrow` draws a pointer to the trigger that follows its centre and swaps sides when the panel flips. The panel then stops clipping and an inner `.scroll` box scrolls instead.
Not taken: Aspect Ratio, Label, Form and Visually Hidden (HTML or CSS already does them), and the React-only helpers (Portal, Slot, Presence, Direction). Still open: Slider, Collapsible, Hover Card, OTP Field, Toolbar, Menubar, Navigation Menu.

## 2026-10-20 — Toast follows Radix Toast
Compared `ht-toast` and `ht-toaster` with the Radix Toast docs and took the behaviors that fit an imperative toaster:
- The timer now holds for hover, focus, a swipe and the window being in the background (blur), and releases only when nothing holds it. `ht-pause` and `ht-resume` fire. The toaster holds every toast while the pointer or focus is anywhere in the stack.
- `F8` (`hotkey`, any `KeyboardEvent.code` or `altKey+KeyT` style combo) moves focus into the stack. The region is named "Notifications (F8)" (`label`, with `{hotkey}`).
- Escape on a focused toast closes it.
- `type` (`foreground` assertive, `background` polite) sets the live region. Unset keeps the old rule: danger is assertive.
- `heading` or a `title` slot gives the bold first line, and the default slot is the description. `toast({ title })` sets it.
- `swipe-threshold` (50px) and `data-swipe` (`start`, `move`, `cancel`, `end`) on the toast.
- `toast({ action: { altText } })` becomes the action button's accessible name.
Not taken: controlled `open` and `onOpenChange` (the toaster is imperative and `toast()` returns the element, so call `dismiss()` and listen for `ht-dismiss`), `forceMount`, `announcerContainer` (each toast is its own live region), and the `--radix-toast-swipe-*` variables (internal here).

## 2026-10-20 — Select is a custom list, like Radix Select
`ht-select` no longer wraps a native `<select>`. The trigger is a button (`role=combobox`) and the list is a `popover="manual"` panel in the top layer, so it stays above an open `ht-dialog` (the reason Taskscape's `statuses.tsx` stayed on Radix) and is never clipped.
- **Items.** New `ht-option` (any content, `label` for the short text, `prefix` slot) and `ht-option-group`. Chosen because Taskscape's member and role selects need two-line items. Plain `<option>`, `<optgroup>` and `<hr>` still work as text, drawn from a parsed copy. Do not mix the two kinds.
- **Behavior from Radix.** Press opens on mouse down and a drag onto an option picks it on release. Trigger: Enter, Space, ArrowDown and ArrowUp open; typing picks a match without opening. List: arrows, Home, End, PageUp and PageDown (10), Enter or Space picks, Escape closes, typeahead (a prefix within 1s, a repeated letter cycles), Tab is held inside. Focus moves onto the chosen option and returns to the trigger. Scroll arrows appear when the list is taller than the room, and it flips above the trigger when there is no room below.
- **Form.** Still form-associated: `name`, `required` (message "Please select an item in the list."), reset, restore. `change` fires only for a user choice. New `open` property and `open` and `close` events.
- **Focus.** Real focus moves onto the options (not `aria-activedescendant`), because an id reference cannot cross from the list's shadow root to options in the host's light DOM.
- **Gives up.** The native mobile picker. Radix does too.
- **Not taken.** Radix's item-aligned position (the chosen option sits over the trigger). Only the popper position, which is what shadcn and Taskscape use.

## 2026-10-20 — A docs site in Astro Starlight, with Storybook under it
The public docs were only Storybook. They now have a real site in `site/`, built with Astro Starlight (chosen over VitePress: its sidebar badges, on-this-page rail, edit link, search and per-component overrides match the docs design, and it works with custom elements). It follows the "Halftone docs system" design: getting started, foundations (color, type, spacing, motion, glass, dot screen), and one page per component.
- **Generated, not copied.** `site/scripts/gen-components.mjs` writes a page per component folder from `custom-elements.json` (the JSDoc) and the stories files (the live examples), so the API cannot drift. A hand-written page goes in `site/overrides/<folder>.mdx` (Select is the first).
- **Live.** The site imports Halftone from `../src`, so examples on the hand-written pages are the real elements. Generated pages embed the deployed Storybook stories.
- **Themed by tokens.** Starlight's variables point at `--ht-*`, so light and dark follow `tokens.css`.
- **Pages layout.** The site is at the Pages root and Storybook moved to `/storybook/`. The Docs workflow builds both with Node 22 (Astro 7 needs 22.12 or newer; the root package still builds on 20). CI also builds the site on every pull request.
- **Cost.** Old links to `…/halftone/?path=…` Storybook pages now land on the site, not Storybook.
- **Not built.** The top navigation bar from the design (the sidebar groups do its job), breadcrumbs, a page-helpful vote, and the Patterns and Resources sections.

## 2026-10-21 — Docs site brought closer to the design
The first deploy of the Starlight site looked like stock Starlight with Halftone colors. This pass overrides the Starlight parts to match the "Halftone docs system" design:
- **Header** (`Header.astro`): logo, top navigation (Getting started, Foundations, Components), search, GitHub and an icon light/dark toggle in place of the Auto dropdown.
- **Title block** (`PageTitle.astro`): breadcrumb, large title, a lede from the page description, and chips from a new `chips` frontmatter key (the generator fills it with the element names and the New or Updated badge).
- **Right rail** (`PageSidebar.astro` and CSS): a mono label, a rule and an accent marker on the current heading, plus Report an issue and GitHub links. Headings inside a tab that is not showing open that tab when clicked.
- **Footer** (`Footer.astro`): a "Was this page helpful?" box, the edit link, next and previous as cards, and a site footer line.
- **Sidebar**: group labels are small mono caps and not collapsible, and the current page is a soft accent row.
- **Pages**: the first screen is the About page (the root redirects to it, respecting the Pages base path). About has numbered columns and start cards. Select follows the design: Usage, Style, Code and Accessibility tabs, a variant switcher over a stage, do and don't cards, and an "HTML" code frame.
- **Still not built**: Patterns and Resources in the top navigation (no pages yet), a full-width site footer (Starlight's footer lives in the content column), and the right rail changing per tab (it lists every heading).

## 2026-10-21 — The switch's on track is the accent color
The on state used `--ht-accent-soft` for the track, which was inferred from Sentry and never checked. With the white knob at the right it read as a checkbox with a pale smudge beside it, not as a switch. The on track is now `--ht-accent` (and loses its inset hairline). Measured with `scripts/contrast.mjs` (new rows): track against the page 4.93 to 1 in light and 3.45 in dark, knob against the track 5.54 and 3.22, tick on the knob 10.59 and 12.32; all pass the 3 to 1 non-text rule. Axe is clean on the 6 switch stories in light and dark. The off state, the knob, the hover lift and the spring are unchanged.

Follow-up, same day: the off track stands out too, as a rail. There is no border on either state: a 2px inner shadow along the top (24% of the text color when off, 32% black when on) and a light lip under the bottom edge, so the track reads as a groove the knob slides in. Two earlier tries with a 1px outline were dropped: one stood out too much, and the softer one measured about 2 to 1 against the page. **Trade-off:** with no outline the track edge is carried by shadow only and has no 3 to 1 contrast measure. The state is still carried by the cross or tick in the knob (7.35 to 1 or better), the knob's own border and its position, and the accent fill when on. Axe was clean on the 6 switch stories in light and dark for the first outline version; it was not re-run after the rail, and axe does not check non-text contrast anyway.

## 2026-10-21 — Patterns and Resources sections, and a full-width footer
The docs design had Patterns and Resources in its top navigation, so they now exist, with content taken from the repo:
- **Patterns**: Forms (a live form: required blocks submit, `FormData`, reset; which element submits what), Overlays (one live demo of each overlay, a dialog with a select inside to show the top layer, and a table for choosing), and Empty states (the writing rules, and `tone="error"`).
- **Resources**: Links, Accessibility checks (from `docs/a11y.md`), and a Decisions log page that the generator builds from `docs/decisions.md`, so it cannot drift.
- **Footer**: Starlight's `PageFrame` is copied into `site/src/components/PageFrame.astro` with the site footer added at the bottom of the main column, so it spans the full width beside the sidebar. When Starlight is upgraded, compare the copy with the new default.
- `docs/a11y.md` said `ht-select` uses the browser's own menu. That stopped being true with the custom list; the line is corrected.

## 2026-10-21 — Docs site alignment sweep
More misaligned rows turned up: the radius and shadow boxes on Spacing and radius, and the color swatches (every item but the first sat 16px low). Same cause as before, Starlight's `margin-top: 1rem` on every following sibling. The fix is now global in `theme.css`: any container with an inline `display:flex`, `display:grid` or `display:inline-flex`, and the swatch and example grids, resets it. Verified by crawling all 61 pages: no flex or grid child has the leaked margin, and no flex row has children with different tops. Markdown tables also now fill the column (they had shrunk to their content inside a full-width frame); below 60rem a wide table scrolls inside its frame, because at tablet widths the sidebar leaves a content column narrower than the widest API tables.

## 2026-10-21 — Spotlight on stages
The stages (docs example areas, and now `ht-empty-state`) get a pointer-following glow like `ht-spotlight`: a faint accent glow (10 to 12%) and the dot screen at stage strength under the pointer, fading on leave. `ht-empty-state` builds it in (it cannot import `ht-spotlight` and stay a copyable single file) behind its content, with a `no-spotlight` attribute; it is off for the `error` tone, touch and reduced motion. The docs `Stage` wraps its content in the real `ht-spotlight`, except around an empty state, which has its own. Decoration only, `pointer-events: none`, never required to understand anything. Text keeps its 4.5 to 1 contrast against the brightest dot.


## 2026-10-21 — Stronger spotlight glow
The glow was too faint to see, most of all in dark mode. It is now about double: accent at 20% (was 12% on `ht-spotlight`, 10% on `ht-empty-state`), and bigger: 280px (was 200px) on `ht-spotlight`, 300px (was 220px) on `ht-empty-state`. The dot screen under the glow is softer so text keeps its contrast: opacity 0.6 on `ht-spotlight`, 0.75 on `ht-empty-state`. Measured contrast (accent over the page and surface colors, at the glow's center): the glow alone leaves `--ht-text-muted` at 4.99 to 1 or better in both themes and `--ht-text` at 12 to 1 or better. With a dot at the same point, `--ht-text` stays above 9.5 to 1. Muted text on a dot at the center of the glow, on the page background in light, is about 4.2 to 1, under 4.5. That case is one 1px dot under part of a letter, so it is a small area, but it is not a pass. If it matters, lower the glow to 16% or put muted text on a surface.

## 2026-10-21 — Generated avatars: `art` and `seed` on `ht-avatar`
**Ask.** A seeded avatar generator in the style of DiceBear or Avatars in Pixels, for people with no photo. Same seed, same picture, with nothing to store.

**API: two attributes on `ht-avatar`, not a new element.** `art` (`pixel`, `dots` or `tiles`; empty is off) and `seed`. `seed` defaults to `name`, so `<ht-avatar name="Ada Lovelace" art="pixel">` works. I chose this over an `ht-avatar-art` element because it is smaller and it keeps everything that already works: `ht-avatar-group` only counts children named `ht-avatar` (a new element would silently fall out of groups), and size, shape, ring, status slot, image loading and the accessible name are all reused. It is opt-in, so the initials fallback is unchanged for anyone who does not set `art`. The attribute is not called `style` (a global HTML attribute) or `style-name`.
- Order: a loaded `src` wins, then generated art, then initials, then the person glyph. The art sits under the image, so it shows while a photo loads and when it fails.
- Pure functions, exported from the same file: `generateAvatar(seed, { art, size, label })` returns SVG markup and `avatarDataUri(seed, options)` returns a `data:` URI. Both are also exported from `src/index.ts`, with `AVATAR_ARTS`. The element and the functions share one drawing path, so they never disagree. `halftone add avatar` copies them with the element, and the file still imports only `lit`.
- Not built: a `shape` option on the function (round it with CSS), more styles, user-supplied palettes or part lists, face-from-photo, animation.

**Original art.** The parts are drawn in code and nothing is copied or traced. DiceBear styles have mixed licences (some CC BY or non-commercial), and Avatars in Pixels art is proprietary, so neither was opened for reference. `pixel` is a creature on a 12 by 12 grid, drawn as half a picture and mirrored (4 heads, 3 bodies, 6 tops, 5 eyes, 5 mouths). `dots` is a halftone screen: a 5 to 7 cell grid whose dot sizes follow a glow, a gradient or a ripple, sometimes inverted. `tiles` is a 3 by 3 grid of 7 shapes turned in quarters, in two colours. This fits the dot-screen motif of the library.

**Determinism.** FNV-1a over the seed, a murmur3 finish so near seeds (`user1`, `user2`) split apart, then mulberry32. Every choice is read from the one stream in a fixed order. Adding, removing or reordering a part (or any grid size) changes the pictures that seeds draw, so treat the part lists as frozen once avatars are stored or shared; a new look should be a new `art` name. The seed is trimmed; case counts, because `Ada@x.com` and `ada@x.com` can be two ids. Checked in the browser: the same seed gives byte-identical markup, and 300 seeds gave 300 different pictures in each style.

**Colour.** The art uses a fixed palette of eight hues in three tiers (hex in the file), not theme tokens. A picture from `generateAvatar` has to look the same inside an `<img>`, a data URI, a file or an email, where `var(--ht-*)` does not resolve. It also keeps a user's avatar from changing when the theme does, like a photo. This is the one place the "tokens only" rule bends. The tiers are measured by new rows in `scripts/contrast.mjs` (WCAG relative luminance, keep them in step with the file): the figure's dark tier on the light background 8.3:1 or more, the mid tier on the background 3.3:1 or more (the 3:1 rule for graphics), and the near-black ink for eyes and mouth on the mid tier 5.0:1 or more, for every hue against every hue. Not held: the mid tier against the dark tier inside one figure (2.5:1 at worst, e.g. a face against clothes); those parts are told apart by hue, and the figure itself and its features hold the ratios above.

**Accessibility.** The picture is decoration until the avatar has a `name`; the name is the only source of the accessible label, and the `<svg>` is always `aria-hidden`. This is the existing `ht-avatar` rule, so it needed no new code. The function's SVG has `aria-hidden="true"` unless `label` is passed, and the label is escaped. In forced-colours mode the picture keeps its colours (like a photo) and a `CanvasText` outline draws the edge, because forced colours remove the shadow hairline that normally does it. That outline applies to initials avatars too. The hairline over the picture stays, so a pale picture still has an edge.

## 2026-10-23 — Blocks: page sections in plain HTML, with notes for agents
Like shadcn/ui blocks: ready-made sections (sign-in, app shell, settings, dashboard) that you copy and adapt. Four to start: `login-01`, `app-shell-01`, `settings-01`, `dashboard-01`.

Decisions:
- A block is plain HTML, not a Lit component. A component may import only `lit` and no other component (the copy-mode rule), and a block is by nature a composition of components. HTML also works in any framework, and an agent can read it and change it directly.
- Two files per block in `src/blocks/<name>/`: `<name>.html` and `<name>.md`. The notes (front matter plus `When to use`, `How to adapt`, `Do not`) are the part to tune for AI: when an agent misuses a block, fix the notes first. Prose, not JSON, because agents follow written rules better than fields.
- Names end in `-NN` (shadcn's convention), so variants can exist later and a block name never collides with a component name.
- The component list is derived from the tags in the HTML, never written by hand. `scripts/blocks.mjs` maps tags to component folders from the component source.
- `npm run registry` checks every block: names, required notes, a scoped root (`data-block`), every selector scoped to it, no `<script>`, no hard-coded colours, radii or fonts, every tag a real element, and a story. This turns the rules into a build failure, like the `lit`-only import check.
- Blocks ship inside `registry/registry.json` (`blocks` key), so the CLI still reads one file and works offline. `halftone add <block>` writes `<dir>/blocks/<name>.html` (with a copy header) and `<name>.md`, and adds the components it uses through the normal skip/overwrite path. `halftone.json` records blocks under `blocks`, apart from `installed`. `halftone show <block>` prints notes and HTML for agents. `diff` covers blocks. `add --all` stays components only.
- `llms.txt` gets a `Blocks` section with each block's summary, components and full notes, and tells agents to start from the closest block.
- Storybook: one file, `src/blocks/blocks.stories.ts`, renders each HTML file as is (`?raw` plus `unsafeHTML`), so the story is exactly what gets copied. `lit/directives/unsafe-html.js` is pre-bundled for the same reason as the other directives (2026-10-12).
- Accessibility: axe over the four block stories, light and dark, zero violations. It first found that `ht-card` always renders an `h3` and a `<header>`. Four cards at page level read as four banner landmarks and the heading order jumped from `h1` to `h3`. Fixed in the block, not the card: the dashboard root is a `<section>`, and two visually hidden `h2` headings fill the gap. A `level` attribute on `ht-card` would be the better fix later.

Not done: a Blocks gallery on the docs site, more blocks (sign-up, pricing, data table page, command palette), and wiring the app-shell menu button (blocks have no script; the notes say how).

## 2026-10-23 — Toast becomes Sonner; new `ht-alert` from shadcn
**Ask.** A Sonner-style toast (the one shadcn/ui uses) in place of the PostHog-style toast, and a separate Alert in the style of shadcn's. The shadcn "toast" page linked in the ask is built on Base UI's toast, not Sonner; the stack mechanics below are Sonner's, which Base UI's toast also copies.

**Toast, taken from Sonner** (`styles.css` and `index.tsx`, MIT):
- Look: a surface card, 1px border, 16px padding, 13px text, 6px gap, `--ht-shadow-sm`, 356px wide. Title 500 weight; description on a second line in `--ht-text-muted`. Radius is `--ht-radius-md` (6px): Sonner's 8px is not one of the house radii.
- Stack: the newest toast is in front; older ones sit 14px behind, each 5% smaller and cut to the front toast's height, with their content hidden. Three show; the rest wait at 0 opacity. Hovering the stack, or focus inside it, fans it out with a 14px gap; a hover bridge covers the gaps. The toaster measures each toast's natural height and sets `--_index`, `--_offset` and `--_height` on it. Sonner's collapsed transform reads `scale(calc(-1 * var(--scale)))`, which only works because custom properties substitute as tokens (it becomes `1 - 0.05 × index`); written out plainly here.
- Motion: enter slides in from the edge (400ms transition, not a keyframe), exit 200ms. A swipe of 45px or a flick faster than 0.11 px/ms dismisses.
- Tones colour the icon only (as in shadcn's wrapper). `neutral` has no icon. `rich` (`richColors`) tints the card like `ht-banner`, mixed in `oklab` toward `--ht-text`.
- `action` and `cancel` are properties drawn inside the shadow root (solid inverse and quiet sunken, 24px tall), with `action` and `cancel` slots to replace them. Both close the toast unless `onClick` calls `preventDefault()`. `close-button` adds Sonner's small round close button at the top corner; off by default, as in Sonner.
- API: `toast(title, options)`, `toast.success`, `.error`, `.warning`, `.info`, `.loading`, `.message`, `.promise` and `.dismiss`. An `id` that is already showing updates that toast. Default duration 4000ms (was 5000). Loading toasts have a spinner, no timer, and cannot be swiped, closed or escaped.

**Kept from the old toast** (the Radix behaviours from 2026-10-20): per-toast live regions and `type`, F8 hotkey and the labelled region, timer holds (hover, focus, window blur, the whole stack held while expanded), Escape on a focused toast, `swipe` and `swipe-threshold` (now 45), `data-swipe`, `altText`, the `ht-dismiss`, `ht-pause` and `ht-resume` events, and the manual popover in the top layer.

**Changed.** A bare string is now the title, not the description: `toast('Saved')` draws the 500-weight line, as in Sonner. `message` is gone; use `title` and `description`. `heading` and the `title` slot on `ht-toast` are gone; the default slot is the title and the `description` attribute or slot is the second line. `no-close` is gone; the close button is opt-in with `close-button`. Not taken from Sonner: `invert`, `unstyled`, per-toast `position`, several toasters, `offset` as a prop (use `--ht-toaster-offset`), and `onDismiss` and `onAutoClose` (listen for `ht-dismiss`).

**Alert, from shadcn's `alert.tsx`.** A bordered card on `--ht-surface`, `--ht-radius-lg`, 12px 16px padding, 14px text. A grid: a 16px icon column (nudged down 2px), 12px column gap and 2px row gap; title and description in column 2. With `no-icon` the icon column is 0. shadcn's `AlertAction` is absolutely placed at the top right; here the `action` slot is a third grid column, so long text never runs under it. `tone` (house term) replaces `variant`: `danger` is shadcn's `destructive` (title and description in `--ht-danger-text`, the description at 90%); `info`, `success` and `warning` colour the icon only. The title uses the display face (Chakra Petch 600), per the house rule for headings. shadcn puts `role="alert"` on every alert; here only `danger` is `alert` and the rest are `status`, as in `ht-banner`.

**Alert and banner.** Both stay. `ht-banner` is a one-line bar with a dismiss button (PostHog); `ht-alert` is a callout card with a title and a description (shadcn). Neither is dismissed by a timer.

## 2026-10-23 — Blocks on the docs site
One page per block under `/blocks/`, generated by `site/scripts/gen-blocks.mjs` from `src/blocks/<name>/` with the same reader as the registry (`scripts/blocks.mjs`), so a broken block fails the docs build too. Each page has a live frame, `npx @_mehrad/halftone add <name>`, the notes, and the HTML with a copy button.

Decisions:
- The frame shows a bare site page (`/block-preview/<name>/`) that renders the HTML with `tokens.css` and the elements, not the Storybook story. Blocks use `100vh`, so they need a page of their own. The deployed Storybook only has blocks after a deploy, and its theme does not follow the docs. The bare page copies the docs theme (`data-theme` on the parent) and follows it live.
- Block pages drop the right-hand contents column and widen the content to 64rem, only on pages with a frame. At 46rem the dashboard showed its tablet layout. A Phone button narrows the frame to 375px; it is hidden on small screens, where the frame is already phone width.
- Blocks is also a header link. Six links did not fit next to search at 1024px, so the header nav now shows from 64rem (the left sidebar is the navigation below that), links never wrap, and link padding is 0.5rem below 72rem.

## 2026-10-23 — Keeping the docs site current
The docs site is the reference people use most, so it must not drift from the source.

- More of it is generated. The Contributing page now copies the rules from `AGENTS.md` at build (`site/scripts/gen-rules.mjs`) instead of keeping its own copy. The About page counts blocks from the build, like components and elements.
- `AGENTS.md` has a "Docs site" section: a change is done when the site shows it. It lists the pages that are still written by hand (About with its Roadmap, Install, foundations, patterns, the `STATUS` badges), so a reviewer knows what to check.
- `npm run build --prefix site` now ends with a link check (`site/scripts/check-links.mjs`): every internal link in `dist/` must reach a page or file. Renaming or removing a component or block without fixing its links fails CI. Storybook links are skipped, because Storybook is copied in only by the deploy job. The first run found four broken "Start here" cards on the live About page (relative links one level short); fixed.
- Install has a "Copy a block" tab, About a "Building a page" card and a Blocks row in the Roadmap. Four start cards sit 2 by 2, not 3 and 1.

## 2026-10-23 — Six components that blocks were missing: code, description list, dropzone, pagination, steps, timeline
A survey of seven of my apps for new blocks (Taskscape, Command Centre, Sentinel, Magpie, Glean, People Project, Forage; plan in `docs/plans/2026-10-23-blocks-round-2.md`) found the same missing pieces again and again. I chose to build them as components before the blocks, so blocks stay markup only. Each borrows mechanics from the apps, never their colours.

**`ht-code`, from Sentinel's setup views.** A header strip with a mono label over a `<pre>`, a small flat Copy button, "Copied" for 1.5s, and the token-shown-once card, which becomes `secret` (masked, Reveal, copy still copies the real value). Sentinel's `aria-label="Copy: {title}"` becomes a hidden suffix, so the visible text still starts the accessible name. The body is `--ht-surface-sunken` under a `--ht-halftone` header like `ht-card`. The label keeps its own case (file names are case-sensitive); the language is the uppercase eyebrow. Slot text is tidied (one blank line dropped at each end, shared indent removed); `code` is shown exactly as given. Line numbers are CSS counters, so they are never copied or read out. A failed copy announces itself and selects the text. Left out: syntax highlighting, an inline variant (use `<code>`) and per-line highlights.

**`ht-description-list`.** The list renders a real `<dl>` in its own shadow root: each item's `label` becomes a `<dt>`, and the item is slotted into the matching `<dd>`. Term and definition then sit in one tree, so axe and screen readers see one true description list; a `<dl>` split across shadow roots is not one list to anything, and `role="term"`/`definition` are announced unevenly. The cost: labels are plain text. From Sentinel's issue header: mono uppercase labels, the exact time under the relative one, a short hash shown with the full one copied, a strip of 2 to 4 columns with dividers. From People Project: the dash for empty values. From Taskscape: the fixed label column in `inline`. Left out: a `label` slot, truncation, inline editing.

**`ht-dropzone`.** From People Project's import upload step: the dashed zone, the accent border on drag-over and the error under the zone. From Magpie: the full-window overlay (`page`) and ignoring drags that carry no files. From Taskscape's comment composer: the compact row and file rows with a "Remove report.csv" button. Focus lands on a real, visually hidden `<input type="file">`, and the zone is its `<label>`; `input.files` is kept equal to `files`. Form-associated: one FormData entry per file. A file's extension is checked before its MIME type, because Windows reports CSVs oddly. Drag enter and leave are counted, not trusted one at a time. Rejections are read out politely; only the consumer's `error` is an alert. Left out: thumbnails, dropped links, naming the accepted types in the rejection sentence.

**`ht-pagination`.** From People Project: the mono, muted count and icon-only arrows (`compact`). From Taskscape: "Page x of y" between Previous and Next, disabled at the ends. From Sentinel: the position text in mono and a tinted current page. The page count is `total-pages`, else `total` ÷ `page-size`; the "21–40 of 312" summary needs both. The window always has the same number of slots, so buttons do not shift under the pointer. Pages are links with an `href` template, buttons without. `ht-page-change` is cancelable and does not fire for changes from code. Left out: First and Last buttons, a rows-per-page select, i18n of "Previous" and "Next".

**`ht-steps`, `ht-step`.** From Command Centre's provision wizard: a filled marker with a tick once done, a ring on the current step, the connector after a done step taking the accent. From Sentinel: two-digit mono numbering in a square marker, `aria-current="step"` on an `<ol>`, and the setup guides' marker-beside-content layout for `orientation="vertical"`. From People Project's import rail: `hidden` steps take no number. Steps are inert by default; `clickable` turns done steps into buttons in plain tab order, and focus stays on a step after it is chosen. Narrow rows are measured, not cut at a breakpoint: only the current label stays visible. Left out: sizes and heading levels.

**`ht-timeline`, `ht-timeline-group`, `ht-timeline-item`.** From Command Centre: day groups headed Today, Yesterday or a date. From People Project: the day heading as a mono eyebrow with a hairline. From Taskscape: an icon in a circle as the marker and actor / verb / target weighting. From Sentinel: mono time and a dense setting for incident logs. Nested lists: a list of days, each with a real heading (`level`, default 3) and its own list. The marker is decoration and `tone` is colour only; the outcome goes in the text or an `ht-tag`. Left out: filters, relative-time maths, paging and an empty state (the consumer's `ht-empty-state`).

## 2026-10-23 — Blocks, round 2: sixteen more from seven of my apps
Seven research agents read Taskscape, Command Centre, Sentinel, Magpie, Glean, People Project and Forage and listed page sections that recur. I kept the ones at least two apps share, plus a few the user wanted anyway; the table with sources is in `docs/plans/2026-10-23-blocks-round-2.md`. Built: `list-01`, `detail-01`, `activity-feed-01`, `members-01`, `inbox-01`, `comments-01`, `board-01`, `interstitial-01`, `search-home-01`, `search-results-01`, `media-grid-01`, `wizard-01`, `setup-steps-01`, `status-01`, `log-viewer-01`, `invoice-01`.

Decisions:
- The missing pieces became components first (entry above), so blocks stay markup only. What is still drawn with scoped CSS inside a block: bulk-action bars, the 90-day uptime strip, the log volume histogram, media thumbnails (token gradients, no images), kanban columns. Charts and drag-and-drop stay out of the library for now; the board moves cards with a "Move To" menu, which is also the keyboard path.
- Block notes and markup never name the source apps (they ship in the package and in `llms.txt`). Sample content is fictional.
- Four agents wrote four blocks each against one shared brief, each in its own folders; `scripts/check-blocks.mjs` gave them the build rules without writing the registry. I kept the stories file, ran axe over all 20 blocks in light and dark (zero violations after turning three nested `<aside>`s into sections) and checked phone width.
- Two ways to title page-level cards are now in use: a hidden or visible `h2` above `h3` card titles (`dashboard-01`), and `<h2 slot="header">` inside the card (`wizard-01`, `setup-steps-01`, `status-01`). Both pass. A `level` attribute on `ht-card` (separate branch) will replace both.
- Fixed in the block checker: a multi-value `border-radius` made of tokens and `0` is allowed.

Component issues the block authors worked around, left for a follow-up (fixed in the next entry): `ht-tabs fit` shrinks its panels too (blocks set `display: block`); an `ht-checkbox` with no text still reserves label space; `ht-input` inherits `text-align`; `ht-toggle` forces prefix content to 16px; `ht-banner`'s action slot does not wrap on phones; `ht-tab-panel` stays tabbable when it holds a control; the selected `ht-tab` is faint in dark mode; `ht-select` logs Lit's update-after-update warning; `llms.txt` lists an `undefined` event on menu, popover and select; the built-in icons lack upload, paperclip, archive, send, image and grid.

## 2026-10-23 — Component fixes from the blocks
The blocks round above left eleven component issues worked around inside blocks. All are fixed in the components and the workarounds are gone from the blocks.

- `ht-tabs fit`: the host stays block; only the track gets `width: fit-content`. `members-01` and `setup-steps-01` drop their `display: block` rule and the note that told agents to keep it.
- Selected `ht-tab` in dark mode: the pill was `--ht-surface`, darker than the track (text at 5% over the surface). It is now the surface mixed 12% toward white with a hairline edge (`--ht-text` at 14%), lighter than the track in both themes, on the page and inside a card. No new token.
- `ht-tab-panel` is a tab stop only when it holds nothing focusable (ARIA tabs pattern). The check runs on connect and on slotchange, against native controls, `[tabindex]` and a list of interactive `ht-*` tags (hosts that delegate focus report `tabIndex -1`, so they are matched by tag). A `tabindex` set by the author wins. Content added deeper inside later is not re-checked; set `tabindex` by hand for that case.
- `ht-checkbox` with no slotted text hides the label span, so the 12px gap goes too (same check as `ht-description-item`). `list-01`, `search-results-01` and `media-grid-01` drop `::part(label) { display: none }`.
- `ht-input` set `all: unset` on the native field, which made `text-align` inherit. It now sets `text-align: start`. The same fix went into `ht-textarea`, `ht-prompt` and `ht-command`. `search-home-01` drops its reset.
- `ht-toggle` gives the 16px box only to `ht-icon` and `svg` in its prefix; anything else keeps its size. `log-viewer-01` puts `ht-ping` straight in the prefix. The same rule in `ht-tab`, `ht-toggle-item`, `ht-nav-item`, `ht-menu-item`, `ht-option` and `ht-command-item` is left alone: there an avatar or image in the prefix relies on being shrunk to 16px.
- `ht-banner`: the message and the actions share a wrapping row inside the bar. The message wants 14rem before the actions drop under it, so two buttons wrap on a phone instead of crushing the text. The dismiss button stays top right. New `actions` part. `status-01` puts its buttons back in the `action` slot.
- `ht-tag` set `font-family` in a `font` shorthand inside its shadow root, so a font on the host was ignored. The family now sits on the host. `board-01` styles `ht-tag.board-id` instead of `::part(base)`.
- `ht-select` set state in `firstUpdated` and `updated` (the parsed native options, the trigger text), so Lit warned and rendered twice. The options are parsed in `willUpdate` on the first update and the trigger text follows `value` there too.
- The `undefined` event: `new Event(isOpen ? 'open' : 'close')` gave the manifest analyzer no literal name. Menu, popover and select now pick between two literal events, and the manifest plugin drops any nameless event as a guard.
- Icons: `archive`, `image`, `paper-plane-tilt`, `paperclip`, `smiley`, `sparkle`, `squares-four`, `tag` and `upload-simple` join the built-in set (59). Used in `media-grid-01` (upload, grid, tag), `detail-01` (archive in place of a lock, attach), `inbox-01` (archive, send) and `wizard-01` (AI suggestion). `image` and `smiley` ship unused by blocks for now.

Checked: axe over all 20 blocks and the stories of every touched component (137 stories) in light and dark, zero violations; no block scrolls sideways at 375px.

## 2026-10-25 — Checkbox and radio sizes
`ht-checkbox`, `ht-radio` and both groups take `size`: `sm` 16px, `md` 24px (default, unchanged), `lg` 32px. This replaces "Sizes: one (24px)" from the radio and checkbox entry.

- The steps are inferred. The source UI had one size. `sm` is for dense lists and table rows; `lg` is for touch-heavy or sparse forms.
- The label line height equals the box (1rem, 1.5rem, 2rem), so a one-line label stays centred on the box. Label type is 13px, 14px and 16px. The gap is 8px at `sm`, 12px otherwise.
- Checkbox radii scale with the box and stay concentric (inner = outer − 2px), in the squircle pair too. The tick and dash scale to 12, 16 and 20px. The radio stays a circle.
- `size` on a group sizes every item in it. An item's own `size` wins. An item without `size` and outside a group is `md`. The resolved size is a `data-size` attribute on the host, the same pattern as `data-group-disabled`.
- The hidden native input stays at least 24px square, so `sm` still meets WCAG 2.5.8 target size when it has no visible label.
- A `sm` group tightens its item gap to 8px (16px between columns when horizontal).

## 2026-10-26 — A quieter dot screen
- The dot screen was too loud. Three softer versions were compared on a card header and a stage, in light and dark: A (same grid, half the accent), B (smaller dots, wider tile) and C (dots mixed toward `--ht-text`, so grey grain).
- B shipped. Header strip: 0.6px dot, 8px tile, accent at 20%. Stage: 0.7px dot, 10px tile, accent at 13%. Smaller, sparser dots read as texture, not a grid, and stay purple.
- Dark mode takes more accent (28% and 20%). At the light-mode values the purple dots almost vanish on the dark ground. A had the same problem. C stayed even in both themes but lost the purple.
- The `forced-colors` / `prefers-contrast: more` opt-out now repeats the dark-mode selectors, so the dark values cannot bring the dots back.
- The hover dots got too faint, so their opacity went up: `ht-spotlight` 0.6 → 0.8, and the `ht-empty-state` spotlight 0.75 → full. Both end close to their old strength. No status badge: the components look the same as before, only the base token moved.
- Then the dots got a soft blur. Each dot is now a gradient from its centre to nothing: gone by 2.3px on the header strip, 2.8px on a stage. A light blur (a 1px fade at the edge) was too subtle, so the blur went past a full centre-to-edge fade at 1.7px. At 3px the dots grew big and loud again.

## 2026-10-26 — A raised surface for default buttons in dark mode
- In dark mode a default button's face was `--ht-surface`, the same colour as the card under it. The button read as an empty outline.
- New token `--ht-surface-raised`: the same as `--ht-surface` in light mode, `oklch(0.26 0.018 273)` in dark (a step above `--ht-surface-muted`). Light-mode buttons do not change.
- Only the default `ht-button` uses it. Flush dialog-footer keys keep `--ht-surface`, so they stay flat with the dialog.

## 2026-10-26 — Checkbox: `sm` by default, input fill
- The default checkbox size is now `sm` (16px), for a single checkbox and for `ht-checkbox-group`. `md` and `lg` stay. The 24px hit area at `sm` is unchanged.
- The socket fill is now the text input's fill (`--ht-text` at 3%), not the darker sunken gradient, so a checkbox next to a field looks like the same family. The inset well shadow and the 3:1 outline stay.

## 2026-10-26 — Header strip dots at 12% in light mode
- The card eyebrow (`--ht-text-subtle`) got 4.1:1 on the centre of a header-strip dot at 20% accent. Text needs 4.5:1.
- More blur would not help: the dot keeps the same centre and spreads its colour wider.
- `--ht-halftone` light goes to 12% (4.6:1). Dark stays at 28% (4.55:1). Fading the dots out behind the text was the other option; it was not picked because it touches five components.
- `scripts/contrast.mjs` now checks the eyebrow and heading against a dot centre, so a later change to the strip cannot drop below 4.5:1 unseen.

## 2026-10-26 — Syntax colours in ht-code
- `ht-code` colours its text by `language`: JS/TS, JSON, bash, CSS, HTML, `.env`, logs and Python, plus common aliases. Any other language stays plain. `no-highlight` turns it off.
- The highlighter is built into `code.ts`, about 170 lines, so the file still imports only `lit` and stays copyable. It is a scanner, not a parser: per language, a list of sticky regexes tried in order. Rejected: Shiki and Prism (a dependency, and far larger than the component).
- The rules use no regex lookbehind. A `when` regex checks the text before the match instead, because a lookbehind is a parse error in older Safari and would break the whole module.
- Eight new tokens, `--ht-code-keyword` to `--ht-code-variable`, light and dark. Each keeps 4.5:1 on `--ht-surface-sunken` (lowest: number at 4.84 in light); `scripts/contrast.mjs` checks them. Comments are italic too, so they do not depend on colour alone. Forced-colours mode drops the colours.
- Masked `secret` text is never coloured. Copy still copies the plain text.

## 2026-10-26 — Selected items get a pip
- Three treatments were compared on a command row and the docs "On this page" list, light and dark: a keycap row, a pip, and an accent tint. The pip was picked.
- The pip is a 3 × 14px bar, 2px radius, at the start of the row. Its colour is `--ht-accent` mixed 80% toward `--ht-text` in oklab. Plain accent got only 2.8:1 on the dark row fill; the mix gets 3.7:1 or more in dark and 5.6:1 or more in light (non-text, 3:1). `scripts/contrast.mjs` checks it.
- Where it is used: the active `ht-command-item`, the focused `ht-menu-item` (danger items use a danger pip), the active `ht-nav-item`, the selected `ht-tree-item`, and the docs sidebar and "On this page" list.
- The pip replaces the 2px `--ht-focus` edge bar (command) and the focus ring on keyboard focus (menu). The grey row fill stays. Command and menu rows do not go bold, so text does not move while arrowing. Nav, tree and the docs lists keep their weight.
- Rows got a little more start padding (12px command and menu, 10px nav item) so the pip does not touch the text. The tree keeps its indent and puts the pip at 1px.
- Under `forced-colors` the pip uses `Highlight`, so it does not vanish.
- The docs sidebar dropped its accent-soft row, and "On this page" dropped its rail line, so both match `ht-nav-item`.
- `ht-table`'s selected row keeps its 2px accent edge for now: a row in a grid is a different pattern.

## 2026-10-26 — Toggle group on a track, with counts
- Three looks were compared on the search results filter bar, light and dark: a sunken track, joined buttons with an accent underline, and separate chips. The track was picked. It is Sentry's segmented control.
- Before, the pressed item had an accent outline that overlapped the next item, and the counts were `ht-tag` chips, which were heavy next to the labels.
- The group is now the track: `--ht-surface-sunken`, 2px padding and gap, a 1px `--ht-border` rim. The pressed item is a `--ht-surface-raised` face with a small shadow. Unpressed labels are `--ht-text-muted`. The group's height stays 24/28/32px, so it still lines up with buttons; items are 4px shorter.
- The pressed face is soft on purpose: a 1px `--ht-border` rim and `--ht-shadow-sm`, like a native segmented control. A 3:1 outline (`--ht-border-input` mixed toward text) was tried first and read as too heavy. The face is only 1.2:1 against the track, so the state is also carried by the label (`--ht-text-muted` 6.3:1 to `--ht-text` 17.9:1) and the count (subtle to accent). This is a known trade-off against WCAG 1.4.11 for the face alone. Screen readers get `aria-checked` or `aria-pressed`.
- New `count` attribute on `ht-toggle-item`: a number after the label in mono, tabular, `--ht-text-subtle`; accent on the pressed item. It is a string, so `1.2k` works. The search results, list and inbox blocks use it.
- Under `forced-colors` the pressed item uses `Highlight`, because the outline is a box-shadow and would vanish.
- This makes it look closer to `ht-tabs`. They stay separate components: tabs switch panels, a toggle group does not, and it can be multiple choice.

## 2026-10-26 — Icons are 4px larger than the text beside them
- Icons in buttons and inputs were `1em`, so they took the text size or the page's font size: 12px in a small button, 14px in an input inside a block that sets 14px text. Next to the letters they read as too small.
- The rule now: an icon is 4px larger than the text beside it. Buttons: 16px (md, lg), 14px (sm, xs). Inputs: 16px at every size. Tags: 12px (sm), 14px (md). The prompt's prefix: 16px. Menus, selects, tabs, toggles and nav items were already 16px.
- The size is set on the slotted icon by the parent component, so it no longer depends on the page's font size.
- `ht-icon size` was broken: it sized the svg, but the host stayed `1em` and squeezed it back. It now sizes the host, and the attribute is reflected, so a parent's icon size does not override an icon with its own `size`.

## 2026-10-26 — Publish with npm trusted publishing
- npm no longer takes a stored token for this package; it asks for trusted publishing. The publish workflow now authenticates with GitHub's OIDC token (`id-token: write`). No `NPM_TOKEN` secret exists or is needed.
- npm trusts `.github/workflows/publish.yml` by file name, set once in the package's Trusted Publisher settings on npmjs.com. Renaming the file breaks publishing until that setting is changed too.
- Trusted publishing needs Node 22.14+ and npm 11.5.1+, so the job runs on Node 24 and installs npm 11. The root package still builds on Node 20 in CI.
- The workflow also runs by hand for an existing tag (`gh workflow run publish.yml -f tag=v0.3.0`). A re-run of a failed tag run uses the workflow file stored at the tag; the manual trigger uses the current file and checks out the tag, so a fix to the workflow never means moving a pushed tag. The 0.2.0 tag run failed for lack of a token, and 0.2.0 was published by hand.
- `--provenance` stays on the publish command: some maintainers found the first trusted publish failed without it.
- The first trusted-publishing run failed at `npm test`: `node --test scripts/` runs a folder on Node 20, but on Node 22+ the arguments are patterns, and a bare folder matches nothing. The script now passes `scripts/*.test.mjs`, which the shell expands, so it works on every version. CI's check job now runs on Node 20 and 24, so a Node 24-only break shows on the pull request, not at release.
