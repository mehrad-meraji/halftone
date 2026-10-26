# Eight components for Taskscape (v0.3.0)

2026-10-26 · source: Taskscape's request "Halftone components Taskscape needs" (same date)

Taskscape wants to build its tray panel on Halftone. It asked for 8 missing components. Three looks
were drawn for each on a design canvas; the user picked one per component. This plan builds the 8.
The 6 small additions to existing components and the theme tokens from the same request are a
second PR (phase 2, at the end).

## Decisions taken

- **Halftone owns drag-and-drop.** This reverses the 2026-10-23 line "drag-and-drop stays out of the
  library". `ht-sortable-list` carries a small drag engine; `ht-day-schedule` and `ht-week-strip`
  take drops through a shared DOM-event protocol (below), so no file imports another.
- **The component never moves DOM on drop.** It fires one event and the app saves the order and
  re-renders. Same rule as `ht-table`, which fires `sort` and never sorts.
- **Picked looks** (A, B, C as drawn on the canvas):

| # | Component | Pick | The look in one line |
|---|---|---|---|
| 1 | `ht-sortable-list` | A | Grip handle starts the drag, 2px accent line with a ring dot marks the landing spot, the card lifts (shadow-md, -1.2deg tilt) and follows the pointer; the origin row stays at 35% opacity. |
| 2 | `ht-combobox` | C | Prefix and suffix are inset chips inside the field. The list groups options under mono eyebrows. "Nothing found" is a plain muted row. A create row offers to add the typed text. |
| 3 | `ht-day-schedule` | A | Hours in a left gutter (mono, 24h), hairlines per hour, overlaps split into equal columns, a 2px accent now line with a dot and its time in the gutter, the Anytime group folded under the axis. |
| 4 | `ht-week-strip` | B | Seven columns. The tab background rises with the day's load; the split sits in a bar at the foot. Today's date is underlined in accent; the selected tab is accent-soft. A drag over a tab draws a 2px accent inset ring. |
| 5 | `ht-meter` | C | Parts against an optional `max`: the room left is a hatched track; over the max a 2px mark shows where it ran over. An optional legend table lists each part with its count on the right. |
| 6 | `ht-elapsed` | B | An accent-soft chip with a ping dot while running. Paused: neutral chip, pause glyph, no dot. |
| 7 | `ht-lightbox` | C | Image over a dark scrim, close top right, file name under the image, a filmstrip of thumbnails at the foot; the current thumb has a 2px light ring. |
| 8 | `ht-link-preview` | A and C | Default (A): square service icon left, repo line, one-line title, meta row; children in a muted footer. `appearance="strip"` (C): repo in a dot-screen header strip, title in display type, meta as tags, children on a tree line. |

## Rules every component follows

From `AGENTS.md`, repeated because each component is built on its own:

- Lit, TypeScript, no decorators (static `properties` + `declare`). One folder, `<name>.ts` +
  `<name>.stories.ts`. The `.ts` imports only `lit` (and `lit/directives/*`). Elements that only work
  together share one file.
- JSDoc every public property, slot, part, CSS custom property and event. Internals `#private` or
  `@internal`; Lit state props start with `_`.
- Style only with `--ht-*` tokens. Radii 2/6/10. Chakra Petch for headings, IBM Plex Mono uppercase
  for eyebrows, Geist for UI. Tone fills lean toward `--ht-text` (`color-mix(in oklab, tone 70%,
  var(--ht-text))`), as `ht-progress` does, so they hold 3:1 in both themes. Scrim colour: reuse
  `ht-dialog`'s literal `oklch(0.12 0.02 295 / …)`.
- A control with no visible label forwards a host `aria-label` to its inner element.
- Motion uses `--ht-duration`, `--ht-ease`, `--ht-ease-spring`; everything that moves respects
  `prefers-reduced-motion`.
- Stories: one per variant and state, plus disabled where it applies. Sample content is fictional.
- Labels Title Case, sentences sentence case, dry tone.

## The drag protocol (shared by 1, 3 and 4)

No component imports another, so they talk through DOM events. The source is always an
`ht-sortable-item` inside an `ht-sortable-list`. Any element can be a target.

Events, all `CustomEvent`, `composed: true`:

| Event | Fired on | Bubbles | Cancelable | Meaning |
|---|---|---|---|---|
| `ht-drag-over` | the deepest element under the pointer (from `elementsFromPoint`, skipping the drag preview) | yes | yes | "Will you take this item here?" A target that takes it calls `preventDefault()` and fills `detail.target`, and may fill `detail.data` and `detail.label`. Fired on every pointer move while dragging, and on every keyboard step that leaves the source list. |
| `ht-drag-leave` | the previous target, directly | no | no | The pointer left; remove the highlight. |
| `ht-drag-drop` | the accepting target, directly | no | no | The item was dropped on you. Remove the highlight. Same `detail` as the last `ht-drag-over`. |

`detail` of all three:

```ts
interface HtDragDetail {
  itemId: string;          // ht-sortable-item `item-id`
  item: HTMLElement;       // the ht-sortable-item
  source: HTMLElement;     // its ht-sortable-list
  group: string;           // the source list's `group` ('' when unset)
  clientX: number;
  clientY: number;
  target: HTMLElement | null;   // set by the target that accepts
  data: unknown;                // set by the target: { time: '13:15' }, { date: '2026-10-28' }, …
  label: string;                // set by the target: text for the screen-reader announcement, "13:15 on Mon 26"
}
```

A target takes an item only when it opts in: `ht-day-schedule` and `ht-week-tab` take drops when
they have the `droppable` attribute, and only from lists whose `group` is in their `accept`
attribute (space-separated; empty `accept` takes any group). A plain element can take drops by
listening to `ht-drag-over` itself.

`ht-sortable-list` handles `ht-drag-over` for itself: a list takes an item when its `group` equals the
source list's `group` (or it is the source list). It sets `detail.data = { index }` and draws its
drop line.

When the item is dropped, the **source list** fires one public event:

| Event | On | Detail |
|---|---|---|
| `ht-reorder` | the source `ht-sortable-list`; bubbles, composed, cancelable | `{ itemId, from: HTMLElement, to: HTMLElement, index: number \| null, data: unknown }` |

`to` is the target list or element; `index` is the new index when `to` is a list (counted without
the moved item), `null` otherwise; `data` is the target's `detail.data`. Not fired for a drop that
lands where it started, or a cancel.

## Components

### 1 · `ht-sortable-list`, `ht-sortable-item` (one file)

- `ht-sortable-list` is `role="list"`, with `label` (accessible name), `group`, `disabled`.
  `ht-sortable-item` is `role="listitem"` with `item-id` (required), `disabled`.
- The item renders a grip button in its shadow root before its slot (part `handle`, 24px hit
  area, six-dot icon drawn inline, `aria-label` "Move {item text}" or the item's `handle-label`).
  `handle="none"` on the list drops the grip and lets the whole row drag (the canvas's version B).
  The item itself is never `role="button"`, so it can hold its own buttons.
- Pointer: drag starts after 5px of movement from `pointerdown` on the grip. Touch: press and hold
  250ms on the grip; movement over 5px before that cancels, so the page scrolls. The grip has
  `touch-action: none`; the row does not.
- Preview: a copy of the item in a `popover="manual"` element (top layer), fixed at the pointer,
  `--ht-shadow-md`, `rotate(-1.2deg)`, the item's width. The origin item stays in place at 35%
  opacity. Reduced motion: no tilt.
- Landing spot: a 2px `--ht-accent` line between items with an 8px ring dot at its start (canvas A).
- Edge scroll: when the pointer is within 40px of the top or bottom of the nearest scrolling
  ancestor (or the list), scroll it, faster closer to the edge.
- Keyboard on the grip: Space or Enter picks up; Up and Down move the landing line; Space or Enter
  drops; Esc cancels; Tab while carrying cancels. Every step is announced in a polite live region
  inside the list: "Picked up {name}. Item 2 of 5 in {label}.", "Position 3 of 5.", "Dropped. {name} is
  now 3 of 5.", "Cancelled. {name} is back at 2 of 5.". Keyboard moves stay inside the list
  (cross-list moves by keyboard are the app's Move To menu).
- Esc during a pointer drag cancels.
- Fires `ht-reorder` (above). Stories: Default, Two Lists (same `group`), With Drop Targets (a
  plain element listening to `ht-drag-over`), Whole Row (`handle="none"`), Items With Buttons,
  Long List In A Scroll Area (edge scroll), Disabled.

### 2 · `ht-combobox`, `ht-combobox-option`, `ht-combobox-group` (one file)

- ARIA 1.2 combobox: the native `input` has `role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-autocomplete="list"` and the active descendant (use `ariaActiveDescendantElement` with the
  attribute fallback, as `ht-command` does). The list is a `listbox` in a manual popover under the
  field, the field's width.
- Slots `prefix` and `suffix`; anything slotted there gets the inset chip look via `::slotted`
  (sunken fill, 1px border, 2px radius, inner shadow), as on the canvas.
- Options are light-DOM `ht-combobox-option` (`value`, `disabled`, slots `prefix` and `suffix` for an
  id or a tag). `ht-combobox-group` has `label`, rendered as the mono eyebrow.
- The app filters: on each keystroke the host fires `ht-input` with `detail.value` and the app
  replaces the options. `loading` shows a spinner row "Searching…" (`loading-text`). With no options
  and not loading, an empty row shows `empty-text` ("No matches.").
- `create-label` (e.g. `Add task “{value}”`) adds a create row at the end while the text is not
  empty; picking it fires `ht-submit`.
- Up and Down move through options (wrap), Enter picks the active option (`ht-select`,
  `detail: { value, option }`, cancelable) or, with none active, submits the text (`ht-submit`,
  `detail: { value }`). Esc closes the list and keeps the text; a second Esc clears it. Home and End
  stay in the input.
- Form-associated: `name`, `value` (the text), `placeholder`, `disabled`, `required`.
- Stories: Default (results), Loading, Empty With Create Row, Grouped, With Prefix And Suffix,
  Disabled.

### 3 · `ht-day-schedule`, `ht-schedule-item` (one file)

- `ht-day-schedule`: `date` (YYYY-MM-DD), `start` and `end` hours of the axis (default `08:00` and
  `18:00`), `hour-height` (px, default 56), `now` (HH:MM; when unset and `date` is today, the line
  follows the clock, updated each minute, paused while the page is hidden), `anytime-label`
  ("Anytime"), `droppable`, `accept`, `label`.
- `ht-schedule-item`: `start`, `end` (HH:MM), `color` (any CSS colour: it is data, the calendar's
  colour, so it is the one place a raw colour is allowed; default `--ht-accent`), `kind`
  (`event` | `task`; a task gets the bordered surface look). Items without `start` go to the Anytime
  group. Default slot is the title; slot `meta` for the time text or a checkbox.
- Layout: items absolutely placed in the axis by minutes; overlapping items share the width in equal
  columns (standard interval-graph column packing: sort by start, assign the first free column, a
  cluster's column count is its width).
- The Anytime group sits under the axis with a mono eyebrow and the count, in a native
  `<details>` so it folds.
- Drop target (protocol above): snap `clientY` to 15 minutes, draw a dashed accent box 30 minutes
  tall with the time range, `detail.data = { time, date }`, `detail.label = '{time}'`.
- Semantics: the axis is a list of items in time order (`role="list"`), each item names its time
  for screen readers ("10:00 to 11:00, Design sync"). The hour labels are `aria-hidden`.
- Stories: Default, Overlaps, Now Line (fixed `now`), Anytime, Drop Target (with an
  `ht-sortable-list`), Dense (`hour-height="40"`), Long Day In A Scroll Area.

### 4 · `ht-week-strip`, `ht-week-tab` (one file)

- `ht-week-strip`: `value` (selected date), `label`. It is the `tablist`; arrow keys, Home and End
  move and select (`activation` auto, like `ht-tabs`), roving tabindex, focus ring inside the tab.
  Fires `change`.
- `ht-week-tab`: `value` (date), `day` (Mon), `date-label` (26), `today`, `load` (0 to 1, the fill
  height), `droppable`, `accept`, `disabled`. Slot `meter` for an `ht-meter size="sm"` (or anything)
  at the foot. The accessible name is "Mon 26, today" plus the slotted meter's summary when the app
  sets `summary` on the tab.
- Look B from the canvas. A drag over a droppable tab: 2px accent inset ring;
  `detail.data = { date: value }`, `detail.label = '{day} {date-label}'`.
- Stories: Default, With Meters, Drop Targets (with an `ht-sortable-list`), Disabled Day.

### 5 · `ht-meter`, `ht-meter-part` (one file)

- `ht-meter`: `max` (optional), `size` (`sm` 4px, `md` 6px default, `lg` 8px), `legend`
  (shows the legend table), `label`, `summary` (overrides the generated text). The bar is
  `role="img"` named by the summary.
- `ht-meter-part`: `value`, `tone` (`neutral | accent | success | warning | danger | info`),
  `label` ("Meetings"). Summary is generated: "3 meetings, 2 done, 4 open, 1 late" (count + label
  in lower case), with "of 12" when `max` is set and "over by 2" when the sum passes it.
- Without `max` the parts fill the width by share. With `max`, parts take `value / max` and the
  rest is a hatched track; over the max, the bar scales to the sum and a 2px `--ht-text` mark sits at
  `max`.
- Stories: Default, Sizes, With Max, Over Max, Legend, Tones, In A Week Strip.

### 6 · `ht-elapsed`

- `start` (ISO date-time or epoch ms), `paused`, `compact` (`mm:ss` under an hour, `h:mm` above),
  `bare` (plain tabular text, no chip: canvas version A for tight spots).
- Ticks once a second with one `setTimeout` aligned to the second; stops on `visibilitychange` to
  hidden and recomputes from `start` on show. Paused shows the time frozen at `paused-at` or now.
- `role="timer"`; the accessible name holds hours and minutes only ("1 hour 24 minutes elapsed")
  and changes once a minute, so nothing is announced every second.
- The ping is drawn inline (it cannot import `ht-ping`); none under reduced motion.
- Stories: Default, Compact, Paused, Bare, In A Task Row.

### 7 · `ht-lightbox`

- Light-DOM `img` children are the set (their `src`, `alt`, and `data-name` for the caption).
  `open`, `index`, `label`. Methods `show(index?)` and `close()`.
- Native `<dialog>` with `showModal()`: focus trap, Esc, top layer. Click on the scrim closes. Focus
  returns to the element that had it before opening (store it; do not rely on the browser).
- Left and Right move; Home and End jump. The filmstrip is a row of thumbnail buttons
  (`aria-current` on the current), hidden for a single image.
- The image is `object-fit: contain` within the viewport minus the controls. Motion: scrim fade and
  a small scale-in, as `ht-dialog`; none under reduced motion.
- Fires `ht-close` and `change` (`detail: { index }`).
- Stories: Default (4 images), Single Image, Opened From Thumbnails.

### 8 · `ht-link-preview`, `ht-link-preview-row` (one file)

- `ht-link-preview`: `href`, `host` ("atlas/web · #1284"), `heading` (the title), `status` (text),
  `status-tone`, `appearance` (`card` default, `strip`). Slots: `icon` (service icon; Halftone ships
  no brand marks), `meta` (checks, comments; anything), default slot for `ht-link-preview-row`
  children. Part names for each region.
- The title is a real link (`href`), one line with ellipsis, at least 56px wide.
- Open button: shown on `:hover` and `:focus-within`, opens `href` (`target` attribute passed on).
- Narrow: a container query on the host. Below 260px the status label hides and only its dot shows
  (the text stays for screen readers).
- `ht-link-preview-row`: `key` ("sc-482"), `href`, default slot for the title, slot `status`.
- Stories: Default, Strip, With Rows, Narrow, Statuses.

## Order and who builds what

Each component is built on its own, in its own folder, in parallel. The shared protocol above is the
contract between 1, 3 and 4. Then, in this order:

1. Add all 8 to `src/index.ts`.
2. `npm run typecheck && npm run build`.
3. Storybook: every story in light, dark and at 375px; drag between a list, a schedule and a week
   strip by pointer and by keyboard.
4. `scripts/a11y-runner.js` and `node scripts/contrast.mjs`.
5. Docs site: `STATUS` New badges in `site/scripts/gen-components.mjs`; Shipped rows in
   `getting-started/about.mdx`; `npm run build --prefix site`.
6. `docs/decisions.md`: one entry for the 8, including the drag reversal.

## Phase 2 (next PR)

The small additions from the same request: `ht-tag` interactive mode and dot-only shrink;
`ht-checkbox` 15px box and `label` property; `ht-toggle` icon-only check; `ht-accordion-item` `meta`
slot and drop target (it joins the drag protocol); `ht-tooltip` keeps `aria-description` in step
with `text`; `ht-toggle-group` wrap check. Then a documented theme recipe (accent, neutrals, radius
scale 3/6/8/10/12/round, focus ring) and a menu type-size token.
