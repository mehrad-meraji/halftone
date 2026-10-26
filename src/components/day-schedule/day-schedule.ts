import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

/**
 * The `detail` of `ht-drag-over`, `ht-drag-leave` and `ht-drag-drop`, the drag protocol shared with
 * `ht-sortable-list`. A structural copy, so this file imports nothing but `lit`.
 */
interface DragDetail {
  itemId: string;
  item: HTMLElement;
  source: HTMLElement;
  group: string;
  clientX: number;
  clientY: number;
  target: HTMLElement | null;
  data: unknown;
  label: string;
}

/** Space above the first hour line and below the last one, in px. The labels overhang the lines by 6px. */
const PAD_TOP = 8;
const PAD_BOTTOM = 12;
/** Snap step and size of the drop box, in minutes. */
const SNAP = 15;
const DROP_LENGTH = 30;
/** Blocks shorter than this (px) put the title and time on one line. */
const ONE_LINE_BELOW = 36;
/** Smallest block drawn (px), so a 15-minute item still shows its title. */
const MIN_BLOCK = 20;

/** `HH:MM` (or `H:MM`) to minutes after midnight; `NaN` when it is not a time. `24:00` is allowed as an end. */
function parseTime(value: string | null | undefined): number {
  const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(value ?? '');
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) return NaN;
  return h * 60 + min;
}

const pad = (n: number) => String(n).padStart(2, '0');
const formatTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Today as `YYYY-MM-DD` in local time (`toISOString` is UTC, and wrong for part of the day). */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Start and end of an item in minutes. No `end`, or an `end` not after `start`, means 30 minutes. */
function itemSpan(item: HtScheduleItem): { start: number; end: number; hasEnd: boolean } | null {
  const start = parseTime(item.start);
  if (Number.isNaN(start)) return null;
  const end = parseTime(item.end);
  const hasEnd = !Number.isNaN(end) && end > start;
  return { start, end: hasEnd ? end : Math.min(start + 30, 24 * 60), hasEnd };
}

interface Placed {
  el: HtScheduleItem;
  start: number;
  end: number;
  top: number;
  bottom: number;
  col: number;
  cols: number;
}

/**
 * One day on a vertical hour axis: meetings and planned tasks placed by start and end time, with the
 * hours in a left gutter. Items that overlap share the width in equal columns. A now line marks the
 * current time. Items with no `start` go to a folding Anytime group under the axis.
 *
 * Put `ht-schedule-item` children in it, in any order. It places them; it does not fetch, edit or
 * move them. Other children are not shown.
 *
 * For screen readers the axis is a list of the items in time order, whatever their order in the
 * DOM, and each item says its time first ("10:00 to 11:00, Design sync"). Name the list with `label`
 * or a host `aria-label`.
 *
 * **Now line.** Set `now` to fix it (`11:42`). Without `now`, when `date` is today, it follows the
 * clock: it moves once a minute and pauses while the page is hidden. Without either, there is no
 * line.
 *
 * **Drop target.** With `droppable`, the axis takes items dragged from an `ht-sortable-list` whose
 * `group` is in `accept` (any group when `accept` is empty). It answers the list's `ht-drag-over`,
 * snaps the pointer to 15 minutes and draws a dashed 30-minute box with the time range. On the drop
 * the source list fires `ht-reorder` with `to` set to this schedule and
 * `data: { time: '13:15', date: '2026-10-26' }`. Save the time and re-render; the schedule never moves
 * DOM itself. Only the axis takes drops, not the Anytime group.
 *
 * @tag ht-day-schedule
 * @summary One day on an hour axis, with a now line and a drop target.
 *
 * @slot - `ht-schedule-item` elements. Items with a `start` go on the axis, the rest in the Anytime group.
 *
 * @csspart axis - The hour axis: the list of timed items.
 * @csspart grid - The area with the hour lines. Its top edge is the `start` hour.
 * @csspart hour - Each hour label in the gutter.
 * @csspart now - The now line.
 * @csspart now-label - The time of the now line, in the gutter.
 * @csspart drop - The dashed box that shows where a dragged item would land.
 * @csspart drop-label - The drop time in the gutter, so it stays readable while the drag preview covers the box.
 * @csspart anytime - The Anytime group (a `<details>`).
 * @csspart anytime-summary - Its header, which folds and unfolds it.
 * @csspart anytime-list - The list of items with no time.
 */
export class HtDaySchedule extends LitElement {
  /** @internal */
  static shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, slotAssignment: 'manual' };

  static properties = {
    /** The day shown, as `YYYY-MM-DD`. Sent back in a drop's `data`, and turns on the live now line when it is today. */
    date: {},
    /** First hour of the axis, `HH:MM`. Rounded down to the whole hour. */
    start: {},
    /** Last hour of the axis, `HH:MM`. Rounded up to the whole hour; `24:00` is the end of the day. */
    end: {},
    /** Height of one hour in px. 40 suits a dense tray. */
    hourHeight: { type: Number, attribute: 'hour-height', reflect: true },
    /** Fixes the now line at this time, `HH:MM`. Unset: the line follows the clock when `date` is today. */
    now: {},
    /** Heading of the group for items with no `start`. */
    anytimeLabel: { attribute: 'anytime-label' },
    /** Takes items dragged from an `ht-sortable-list` (see the drag protocol). */
    droppable: { type: Boolean, reflect: true },
    /** Space-separated `group` names of the lists it takes items from. Empty takes any group. */
    accept: {},
    /** Accessible name of the axis list, such as `Monday 26 October`. A host `aria-label` is moved here. */
    label: {},
    _drop: { state: true },
  };

  declare date: string;
  declare start: string;
  declare end: string;
  declare hourHeight: number;
  declare now: string;
  declare anytimeLabel: string;
  declare droppable: boolean;
  declare accept: string;
  declare label: string;
  /** Start of the drop box in minutes, or `null` when nothing is being dragged over the axis. */
  declare _drop: number | null;

  #ariaLabel: string | undefined;
  #timed: Placed[] = [];
  #anytime: HtScheduleItem[] = [];
  #observer = new MutationObserver(() => this.requestUpdate());
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.date = '';
    this.start = '08:00';
    this.end = '18:00';
    this.hourHeight = 56;
    this.now = '';
    this.anytimeLabel = 'Anytime';
    this.droppable = false;
    this.accept = '';
    this.label = '';
    this._drop = null;
    this.addEventListener('ht-drag-over', this.#onDragOver);
    this.addEventListener('ht-drag-leave', this.#clearDrop);
    this.addEventListener('ht-drag-drop', this.#clearDrop);
  }

  connectedCallback() {
    super.connectedCallback();
    // `aria-label` is not allowed on a generic host; move it to the list.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
    }
    this.#observer.observe(this, { childList: true });
    document.addEventListener('visibilitychange', this.#onVisibility);
    this.requestUpdate();
    this.#arm();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
    document.removeEventListener('visibilitychange', this.#onVisibility);
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this._drop = null;
  }

  static styles = css`
    :host {
      display: block;
      background: var(--ht-surface);
      color: var(--ht-text);
      font: 400 0.8125rem/1.4 var(--ht-font-ui);
    }
    :host([hidden]) { display: none; }

    .axis { position: relative; }
    .grid {
      position: absolute;
      left: 48px;
      right: 8px;
      background: repeating-linear-gradient(to bottom, var(--ht-border) 0 1px, transparent 1px var(--_hh));
    }
    .hour, .now-label {
      position: absolute;
      left: 0;
      width: 40px;
      font: 400 0.625rem/12px var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      text-align: right;
      color: var(--ht-text-subtle);
      pointer-events: none;
    }

    /* The schedule does the geometry (set as private custom properties on each item); the item draws itself. */
    slot[name='timed']::slotted(*) {
      position: absolute;
      z-index: 1;
      box-sizing: border-box;
      top: var(--_ds-top);
      height: var(--_ds-h);
      --_ds-w: calc((100% - 62px - (var(--_ds-cols) - 1) * 4px) / var(--_ds-cols));
      width: var(--_ds-w);
      left: calc(52px + var(--_ds-col) * (var(--_ds-w) + 4px));
    }

    .now {
      position: absolute;
      z-index: 2;
      left: 48px;
      right: 8px;
      height: 2px;
      background: var(--ht-accent);
      pointer-events: none;
    }
    .now::before {
      content: '';
      position: absolute;
      left: -4px;
      top: -3px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ht-accent);
    }
    /* Right-aligned with the hour labels; its padding and surface fill cover the label it lands on. */
    .now-label {
      z-index: 2;
      left: auto;
      right: calc(100% - 42px);
      width: auto;
      padding: 0 2px;
      font-weight: 500;
      color: var(--ht-accent-text);
      background: var(--ht-surface);
    }
    @media (prefers-reduced-motion: no-preference) {
      .now, .now-label { transition: top var(--ht-duration) var(--ht-ease); }
    }

    /* The drop time again in the gutter: the drag preview follows the pointer and often covers the box. */
    .drop-label {
      position: absolute;
      z-index: 3;
      right: calc(100% - 44px);
      padding: 0 3px;
      border-radius: var(--ht-radius-sm);
      background: var(--ht-accent-soft);
      color: var(--ht-accent-text);
      font: 500 0.625rem/12px var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      pointer-events: none;
    }
    .drop {
      position: absolute;
      z-index: 3;
      left: 52px;
      right: 10px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 6px;
      overflow: hidden;
      white-space: nowrap;
      border: 1px dashed var(--ht-accent);
      border-radius: var(--ht-radius-sm);
      background: color-mix(in oklab, var(--ht-accent) 9%, transparent);
      color: var(--ht-accent-text);
      font: 400 0.625rem/12px var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      pointer-events: none;
    }

    details { display: block; }
    summary {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 32px;
      padding: 0 12px;
      border-top: 1px solid var(--ht-border);
      background: var(--ht-surface-muted);
      list-style: none;
      cursor: pointer;
      user-select: none;
    }
    summary::-webkit-details-marker { display: none; }
    summary:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    .eyebrow {
      flex: 1;
      font: 500 0.6875rem/1 var(--ht-font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }
    .count {
      font: 400 0.6875rem/1 var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-subtle);
    }
    .chevron {
      flex: none;
      color: var(--ht-text-muted);
      transform: rotate(-90deg);
    }
    details[open] .chevron { transform: none; }
    @media (prefers-reduced-motion: no-preference) {
      .chevron { transition: transform var(--ht-duration) var(--ht-ease); }
    }
    [hidden] { display: none !important; }
  `;

  /** The axis in whole hours, as minutes after midnight. */
  #range(): [number, number] {
    const s = parseTime(this.start);
    const e = parseTime(this.end);
    const a = Number.isNaN(s) ? 8 * 60 : Math.floor(s / 60) * 60;
    let b = Number.isNaN(e) ? 18 * 60 : Math.min(Math.ceil(e / 60) * 60, 24 * 60);
    if (b <= a) b = Math.min(a + 60, 24 * 60);
    return [a, b];
  }

  #hh(): number {
    const h = Number(this.hourHeight);
    return Number.isFinite(h) && h >= 24 ? h : 56;
  }

  /** Minutes to px from the top of the axis. */
  #y(minutes: number, a: number): number {
    return PAD_TOP + ((minutes - a) * this.#hh()) / 60;
  }

  /** The now line's time in minutes: `now` when set, the clock when `date` is today, else `NaN`. */
  #nowMinutes(): number {
    const fixed = parseTime(this.now);
    if (!Number.isNaN(fixed)) return fixed;
    if (!this.date || this.date !== today()) return NaN;
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  /** Runs the live clock: one timeout to the next minute, only while visible and following the clock. */
  #arm() {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    if (!this.isConnected || document.hidden) return;
    if (!Number.isNaN(parseTime(this.now)) || !this.date || this.date !== today()) return;
    const d = new Date();
    const wait = 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50;
    this.#timer = setTimeout(() => {
      this.requestUpdate();
      this.#arm();
    }, wait);
  }

  #onVisibility = () => {
    if (document.hidden) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    } else {
      this.requestUpdate();
      this.#arm();
    }
  };

  #clearDrop = () => {
    this._drop = null;
  };

  #onDragOver = (ev: Event) => {
    const e = ev as CustomEvent<DragDetail>;
    const d = e.detail;
    // A deeper target already took it: the deepest target wins.
    if (e.defaultPrevented || !d) return;
    if (!this.droppable) {
      this._drop = null;
      return;
    }
    const groups = (this.accept ?? '').trim().split(/\s+/).filter(Boolean);
    if (groups.length && !groups.includes(d.group ?? '')) {
      this._drop = null;
      return;
    }
    const axis = this.renderRoot.querySelector<HTMLElement>('.axis');
    const grid = this.renderRoot.querySelector<HTMLElement>('.grid');
    if (!axis || !grid) return;
    const box = axis.getBoundingClientRect();
    if (d.clientX < box.left || d.clientX > box.right || d.clientY < box.top || d.clientY > box.bottom) {
      this._drop = null;
      return;
    }
    const [a, b] = this.#range();
    const minutes = a + ((d.clientY - grid.getBoundingClientRect().top) / this.#hh()) * 60;
    const snapped = Math.round(minutes / SNAP) * SNAP;
    const start = Math.max(a, Math.min(snapped, b - DROP_LENGTH));
    const time = formatTime(start);
    e.preventDefault();
    d.target = this;
    d.data = { time, date: this.date };
    d.label = time;
    this._drop = start;
  };

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has('droppable') && !this.droppable) this._drop = null;

    const [a, b] = this.#range();
    const hh = this.#hh();
    const items = [...this.children].filter((c): c is HtScheduleItem => c.localName === 'ht-schedule-item');
    const timed: Placed[] = [];
    const anytime: HtScheduleItem[] = [];
    for (const el of items) {
      const span = itemSpan(el);
      if (!span) {
        anytime.push(el);
        continue;
      }
      // Clamp into the axis, so an item outside it still shows (at the edge) instead of vanishing.
      let s = Math.max(a, Math.min(span.start, b));
      let e = Math.max(a, Math.min(span.end, b));
      if (e - s < SNAP) {
        s = Math.min(s, b - SNAP);
        e = s + SNAP;
      }
      const top = ((s - a) * hh) / 60;
      const bottom = Math.max(((e - a) * hh) / 60, top + MIN_BLOCK);
      timed.push({ el, start: span.start, end: span.end, top, bottom, col: 0, cols: 1 });
    }
    // Time order is also the reading order: earlier first, the longer of two that start together first.
    timed.sort((x, y) => x.start - y.start || y.end - x.end || x.top - y.top);

    // Interval-graph column packing. A cluster is a run of items that overlap one another, directly or
    // through a chain; each takes the first free column, and all share the cluster's column count.
    let cluster: Placed[] = [];
    let columnEnds: number[] = [];
    let clusterEnd = -Infinity;
    const close = () => {
      for (const p of cluster) p.cols = columnEnds.length;
      cluster = [];
      columnEnds = [];
    };
    for (const p of timed) {
      if (p.top >= clusterEnd) {
        close();
        clusterEnd = -Infinity;
      }
      let col = columnEnds.findIndex((end) => end <= p.top);
      if (col < 0) {
        col = columnEnds.length;
        columnEnds.push(p.bottom);
      } else {
        columnEnds[col] = p.bottom;
      }
      p.col = col;
      cluster.push(p);
      clusterEnd = Math.max(clusterEnd, p.bottom);
    }
    close();

    this.#timed = timed;
    this.#anytime = anytime;
  }

  protected updated(changed: PropertyValues<this>) {
    const root = this.renderRoot;
    const timedSlot = root.querySelector<HTMLSlotElement>('slot[name="timed"]');
    const anytimeSlot = root.querySelector<HTMLSlotElement>('slot[name="anytime"]');
    for (const p of this.#timed) {
      const h = p.bottom - p.top - 2;
      p.el.style.setProperty('--_ds-top', `${PAD_TOP + p.top + 1}px`);
      p.el.style.setProperty('--_ds-h', `${h}px`);
      p.el.style.setProperty('--_ds-col', String(p.col));
      p.el.style.setProperty('--_ds-cols', String(p.cols));
      p.el._oneLine = h < ONE_LINE_BELOW;
    }
    for (const el of this.#anytime) {
      for (const prop of ['--_ds-top', '--_ds-h', '--_ds-col', '--_ds-cols']) el.style.removeProperty(prop);
      el._oneLine = undefined;
    }
    timedSlot?.assign(...this.#timed.map((p) => p.el));
    anytimeSlot?.assign(...this.#anytime);
    if (changed.has('date') || changed.has('now')) this.#arm();
  }

  render() {
    const [a, b] = this.#range();
    const hh = this.#hh();
    const hours = (b - a) / 60;
    const height = PAD_TOP + hours * hh + PAD_BOTTOM;
    const now = this.#nowMinutes();
    const showNow = !Number.isNaN(now) && now >= a && now <= b;
    const nowY = showNow ? this.#y(now, a) : 0;
    const drop = this._drop;
    const count = this.#anytime.length;
    const label = this.label || this.#ariaLabel;
    return html`
      <div part="axis" class="axis" role="list" aria-label=${label || nothing} style=${styleMap({ height: `${height}px`, '--_hh': `${hh}px` })}>
        <div part="grid" class="grid" aria-hidden="true" style=${styleMap({ top: `${PAD_TOP}px`, height: `${hours * hh + 1}px` })}></div>
        ${Array.from({ length: hours + 1 }, (_, i) => html`
          <span part="hour" class="hour" aria-hidden="true" style=${styleMap({ top: `${PAD_TOP + i * hh - 6}px` })}>${formatTime(a + i * 60)}</span>`)}
        <slot name="timed"></slot>
        ${showNow
          ? html`
            <span part="now-label" class="now-label" aria-hidden="true" style=${styleMap({ top: `${nowY - 6}px` })}>${formatTime(now)}</span>
            <div part="now" class="now" aria-hidden="true" style=${styleMap({ top: `${nowY - 1}px` })}></div>`
          : nothing}
        ${drop !== null
          ? html`<span part="drop-label" class="drop-label" aria-hidden="true" style=${styleMap({ top: `${this.#y(drop, a) - 6}px` })}>${formatTime(drop)}</span>
            <div part="drop" class="drop" aria-hidden="true" style=${styleMap({ top: `${this.#y(drop, a) + 1}px`, height: `${(DROP_LENGTH * hh) / 60 - 2}px` })}>
              Drop · ${formatTime(drop)} – ${formatTime(drop + DROP_LENGTH)}
            </div>`
          : nothing}
      </div>
      <details part="anytime" open ?hidden=${count === 0}>
        <summary part="anytime-summary">
          <svg class="chevron" width="10" height="10" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d=${CHEVRON} /></svg>
          <span class="eyebrow">${this.anytimeLabel}</span>
          <span class="count" aria-hidden="true">${count}</span>
        </summary>
        <div part="anytime-list" role="list" aria-label=${this.anytimeLabel || nothing}>
          <slot name="anytime"></slot>
        </div>
      </details>
    `;
  }
}

const CHEVRON = 'M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z';

/**
 * One meeting or task in `ht-day-schedule`. With a `start` it sits on the axis from `start` to
 * `end`; without one it is a row in the Anytime group. Only valid inside `ht-day-schedule`, which
 * places it and provides the list it belongs to.
 *
 * The item writes its own time: a mono line under the title (beside it when the block is short),
 * and, for screen readers, the time before the title ("10:00 to 11:00, Design sync"). So the
 * default slot holds the title only.
 *
 * `kind="event"` (the default) is a tinted block with a 3px side bar in `color`, the calendar's
 * colour. `kind="task"` is a bordered surface block, for work planned into the day; put its
 * checkbox in the `meta` slot.
 *
 * @tag ht-schedule-item
 * @summary Meeting or task in a day schedule.
 *
 * @slot - The title. One line, cut with an ellipsis.
 * @slot meta - Before the title: a checkbox for a task, or a small icon. Give a checkbox its own `aria-label`.
 *
 * @csspart base - The block or row.
 * @csspart title - The title.
 * @csspart time - The visible time text.
 */
export class HtScheduleItem extends LitElement {
  static properties = {
    /** Start time, `HH:MM`. Unset puts the item in the Anytime group. */
    start: {},
    /** End time, `HH:MM`. Unset, or not after `start`, draws 30 minutes and shows the start time only. */
    end: {},
    /**
     * Calendar colour of the side bar and tint, any CSS colour. It is data, so it is the one place a raw
     * colour is fine; tokens such as `var(--ht-info)` work too. Default `--ht-accent`.
     */
    color: {},
    /** `event` is a tinted block with a side bar; `task` is a bordered surface block. */
    kind: { reflect: true },
    _oneLine: { state: true },
  };

  declare start: string;
  declare end: string;
  declare color: string;
  declare kind: 'event' | 'task';
  /** Set by the schedule from the block's height; unset outside a schedule. @internal */
  declare _oneLine: boolean | undefined;

  constructor() {
    super();
    this.start = '';
    this.end = '';
    this.color = '';
    this.kind = 'event';
    this._oneLine = undefined;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'listitem');
  }

  static styles = css`
    :host {
      display: block;
      --_cal: var(--ht-accent);
    }
    :host([hidden]) { display: none; }

    .base {
      position: relative;
      box-sizing: border-box;
      display: flex;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      color: var(--ht-text);
    }
    .line {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .time {
      flex: none;
      font: 400 0.625rem/1.25 var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-subtle);
    }
    ::slotted([slot='meta']) { flex: none; }

    /* On the axis: a block that fills the box the schedule gives it. */
    .block {
      height: 100%;
      flex-direction: column;
      padding: 3px 6px 3px 9px;
      border-radius: var(--ht-radius-sm);
      background: color-mix(in oklab, var(--_cal) 13%, var(--ht-surface));
      box-shadow: inset 3px 0 0 var(--_cal);
      font: 500 0.75rem/1.25 var(--ht-font-ui);
    }
    .block.task {
      padding-left: 6px;
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      box-shadow: none;
    }
    .block.one {
      flex-direction: row;
      align-items: center;
      gap: 6px;
      padding-block: 0;
    }
    .block.one.task .line { flex: 1; }

    /* In the Anytime group: a row under a hairline. */
    .row {
      align-items: center;
      gap: 10px;
      min-height: 40px;
      padding: 0 12px;
      border-top: 1px solid var(--ht-border);
      background: var(--ht-surface);
    }
    .row .line { flex: 1; gap: 10px; }

    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    /* Forced colours drop the tint and the side bar; keep an outline so the block still reads as one. */
    @media (forced-colors: active) {
      .block { outline: 1px solid; outline-offset: -1px; }
    }
  `;

  protected updated(changed: PropertyValues<this>) {
    // The schedule lays items out from start and end; tell it when they change.
    if ((changed.has('start') || changed.has('end')) && this.parentElement?.localName === 'ht-day-schedule') {
      (this.parentElement as LitElement).requestUpdate();
    }
  }

  render() {
    const span = itemSpan(this);
    const task = this.kind === 'task';
    if (!span) {
      return html`<div part="base" class="base row">
        <span class="line"><slot name="meta"></slot><span part="title" class="title"><slot></slot></span></span>
      </div>`;
    }
    const s = formatTime(span.start);
    const e = formatTime(span.end);
    const oneLine = this._oneLine ?? span.end - span.start <= 30;
    const visible = oneLine || !span.hasEnd ? s : `${s} – ${e}`;
    const spoken = span.hasEnd ? `${s} to ${e}, ` : `${s}, `;
    return html`<div
      part="base"
      class="base block ${task ? 'task' : ''} ${oneLine ? 'one' : ''}"
      style=${styleMap({ '--_cal': this.color || null })}
    >
      <span class="line">
        <slot name="meta"></slot>
        <span part="title" class="title"><span class="sr">${spoken}</span><slot></slot></span>
      </span>
      <span part="time" class="time" aria-hidden="true">${visible}</span>
    </div>`;
  }
}

for (const [tag, ctor] of [
  ['ht-day-schedule', HtDaySchedule],
  ['ht-schedule-item', HtScheduleItem],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-day-schedule': HtDaySchedule;
    'ht-schedule-item': HtScheduleItem;
  }
}
