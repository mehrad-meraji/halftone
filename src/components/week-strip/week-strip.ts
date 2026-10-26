import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * The `detail` of `ht-drag-over`, `ht-drag-leave` and `ht-drag-drop`, the drag protocol that
 * `ht-sortable-list` speaks. A structural copy, so this file imports nothing but Lit.
 * @internal
 */
interface HtDragDetail {
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

/**
 * A week as a row of day tabs. Each tab is a column whose background rises with the day's load,
 * with a split bar at its foot (an `ht-meter size="sm"` in the tab's `meter` slot). Today's date is
 * underlined in accent; the selected day is accent-soft.
 *
 * It is a tab list. Arrow keys move and select (Home and End jump to the ends), with one tab stop
 * that follows the selection. Disabled days are skipped. When `value` matches no tab, nothing is
 * selected and the tab stop falls on today, else the first enabled day; `value` is left alone.
 *
 * Each `ht-week-tab` with `droppable` takes items dragged from an `ht-sortable-list` (see the
 * drag protocol): it draws a 2px accent inset ring while an item is over it, and the source list
 * fires `ht-reorder` with `data: { date }` on drop. The strip never moves anything itself.
 *
 * @tag ht-week-strip
 * @summary Week of day tabs that show load and take drops.
 *
 * @slot - `ht-week-tab` elements, one per day.
 *
 * @csspart list - The tab list row.
 *
 * @fires change - The selected day changed by user action. Read `value` from the host.
 */
export class HtWeekStrip extends LitElement {
  static properties = {
    /** `value` of the selected day, usually a date (`2026-10-28`). */
    value: { reflect: true },
    /** Accessible name for the tab list, such as "Week of 26 October". */
    label: {},
  };

  declare value: string;
  declare label: string;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.addEventListener('click', (e) => {
      const tab = (e.target as Element).closest('ht-week-tab') as HtWeekTab | null;
      if (tab && tab.parentElement === this && !tab.disabled) this.#choose(tab);
    });
  }

  static styles = css`
    :host { display: block; }
    .list {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(0, 1fr);
      border-bottom: 1px solid var(--ht-border);
    }
  `;

  #tabs() {
    return [...this.children].filter((c): c is HtWeekTab => c.localName === 'ht-week-tab');
  }

  /** Applies `value` to the tabs: selected state and the roving tab stop. */
  #sync = () => {
    const tabs = this.#tabs();
    const enabled = tabs.filter((t) => !t.disabled);
    const current = enabled.find((t) => t.value === this.value);
    const stop = current ?? enabled.find((t) => t.today) ?? enabled[0];
    for (const t of tabs) {
      t.selected = t === current;
      t.tabIndex = t === stop ? 0 : -1;
    }
  };

  /** @internal Called by a tab when its `value` or `disabled` changes. */
  _syncTabs() {
    this.#sync();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('value')) this.#sync();
  }

  #choose(tab: HtWeekTab) {
    if (tab.value === this.value) return;
    this.value = tab.value;
    this.#sync();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onKeydown = (e: KeyboardEvent) => {
    const tab = (e.target as Element).closest('ht-week-tab') as HtWeekTab | null;
    if (!tab || tab.parentElement !== this) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!tab.disabled) this.#choose(tab);
      return;
    }
    const tabs = this.#tabs().filter((t) => !t.disabled);
    const i = tabs.indexOf(tab);
    if (i < 0) return;
    const rtl = getComputedStyle(this).direction === 'rtl';
    let next = -1;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = (i + 1) % tabs.length;
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    this.#choose(tabs[next]);
  };

  render() {
    return html`
      <div
        part="list"
        class="list"
        role="tablist"
        aria-orientation="horizontal"
        aria-label=${ifDefined(this.label || undefined)}
        @keydown=${this.#onKeydown}
      >
        <slot @slotchange=${this.#sync}></slot>
      </div>
    `;
  }
}

/**
 * One day inside `ht-week-strip`. Shows the weekday and the date, a fill that rises with `load`,
 * and whatever sits in the `meter` slot at its foot.
 *
 * Its accessible name is built from its attributes: "Mon 26, today", plus `summary` when set
 * ("Mon 26, today, 2 meetings, 3 done"). Set `summary` to the same text as the slotted meter's
 * summary, since the tab's name replaces its content. An `aria-label` you set yourself wins.
 *
 * With `droppable` it is a drop target in the drag protocol. It takes an item when the source
 * list's `group` is in `accept` (or `accept` is empty), and is not `disabled`. It fills
 * `detail.data` with `{ date: value }` and `detail.label` with "Mon 26". A target nested inside
 * the tab that takes the item first wins.
 *
 * @tag ht-week-tab
 * @summary Day tab in a week strip.
 *
 * @slot meter - A small bar at the foot of the tab, usually `ht-meter size="sm"`.
 *
 * @csspart base - The tab column.
 * @csspart fill - The load fill.
 * @csspart day - The weekday name.
 * @csspart date - The date number.
 * @csspart meter - The wrapper of the `meter` slot.
 */
export class HtWeekTab extends LitElement {
  static properties = {
    /** Identifier matched by the strip's `value`, usually a date (`2026-10-28`). Passed to drop targets as `data.date`. */
    value: {},
    /** Weekday name shown on top, such as "Mon". */
    day: {},
    /** Date shown under the weekday, such as "26". */
    dateLabel: { attribute: 'date-label' },
    /** Marks today: the date is underlined in accent and the name says "today". */
    today: { type: Boolean, reflect: true },
    /** How full the day is, 0 to 1. The fill rises to this share of the tab's height. */
    load: { type: Number },
    /** Text added to the accessible name, usually the meter's summary ("2 meetings, 3 done"). */
    summary: {},
    /** Takes items dragged from an `ht-sortable-list`. */
    droppable: { type: Boolean, reflect: true },
    /** Space-separated `group` names of the lists it takes items from. Empty takes any group. */
    accept: {},
    /** Cannot be selected, focused by the arrow keys, or dropped on. */
    disabled: { type: Boolean, reflect: true },
    /** Set by the strip from its `value`. */
    selected: { type: Boolean, reflect: true },
    _over: { state: true },
  };

  declare value: string;
  declare day: string;
  declare dateLabel: string;
  declare today: boolean;
  declare load: number;
  declare summary: string;
  declare droppable: boolean;
  declare accept: string;
  declare disabled: boolean;
  declare selected: boolean;
  declare _over: boolean;

  #ownLabel: boolean | undefined;

  constructor() {
    super();
    this.value = '';
    this.day = '';
    this.dateLabel = '';
    this.today = false;
    this.load = 0;
    this.summary = '';
    this.droppable = false;
    this.accept = '';
    this.disabled = false;
    this.selected = false;
    this._over = false;
    this.addEventListener('ht-drag-over', this.#onDragOver);
    this.addEventListener('ht-drag-leave', this.#onDragEnd);
    this.addEventListener('ht-drag-drop', this.#onDragEnd);
  }

  connectedCallback() {
    super.connectedCallback();
    this.#ownLabel ??= this.hasAttribute('aria-label');
    this.setAttribute('role', 'tab');
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._over = false;
  }

  #accepts(group: string) {
    const list = this.accept.trim();
    return !list || list.split(/\s+/).includes(group);
  }

  #onDragOver = (e: Event) => {
    // A nested target took it first: the deepest target wins.
    if (e.defaultPrevented) return;
    if (!this.droppable || this.disabled) return;
    const d = (e as CustomEvent<HtDragDetail>).detail;
    if (!d || !this.#accepts(d.group ?? '')) return;
    e.preventDefault();
    d.target = this;
    d.data = { date: this.value };
    d.label = `${this.day} ${this.dateLabel}`.trim();
    this._over = true;
  };

  /** `ht-drag-leave` and `ht-drag-drop` both end the highlight. The source list fires `ht-reorder`. */
  #onDragEnd = () => {
    this._over = false;
  };

  static styles = css`
    :host { display: block; min-width: 0; outline: none; }
    .tab {
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      height: 66px;
      padding: 9px 7px;
      color: var(--ht-text-muted);
      background: var(--ht-surface);
      border-right: 1px solid var(--ht-border);
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition: background-color var(--ht-duration) var(--ht-ease), box-shadow var(--ht-duration) var(--ht-ease);
    }
    :host(:last-child) .tab { border-right: 0; }
    .tab > span { position: relative; }
    .day {
      font: 500 0.625rem/1 var(--ht-font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .date {
      font: 600 1.125rem/1 var(--ht-font-display);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text);
    }
    .fill {
      position: absolute;
      inset: auto 0 0 0;
      background: color-mix(in oklab, var(--ht-accent) 7%, transparent);
      border-top: 1px solid color-mix(in oklab, var(--ht-accent) 20%, transparent);
      transition: height var(--ht-duration) var(--ht-ease);
    }
    .tab > .meter { position: absolute; inset: auto 0 0 0; display: block; }
    ::slotted([slot='meter']) { display: block; width: 100%; }

    :host(:hover:not([disabled]):not([selected])) .tab {
      background: color-mix(in oklab, var(--ht-text) 4%, var(--ht-surface));
    }
    :host([today]) .date {
      text-decoration: underline 2px var(--ht-accent);
      text-underline-offset: 5px;
    }
    :host([selected]) .tab { background: var(--ht-accent-soft); color: var(--ht-accent-text); }
    :host([selected]) .date { color: var(--ht-accent-text); }
    /* After the selected rule: a drag over the selected day still shows the ring. */
    .tab.over {
      background: color-mix(in oklab, var(--ht-accent) 10%, var(--ht-surface));
      box-shadow: inset 0 0 0 2px var(--ht-accent);
    }
    :host(:focus-visible) .tab { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    :host([disabled]) .tab { opacity: 0.5; cursor: not-allowed; }

    @media (prefers-reduced-motion: reduce) {
      .tab, .fill { transition: none; }
    }
    @media (forced-colors: active) {
      :host([selected]) .tab { background: Highlight; color: HighlightText; }
      :host([selected]) .date { color: HighlightText; }
      .tab.over { outline: 2px solid Highlight; outline-offset: -2px; }
    }
  `;

  willUpdate(changed: Map<string, unknown>) {
    // A disabled tab cannot keep a drop highlight.
    if (changed.has('disabled') && this.disabled) this._over = false;
  }

  updated(changed: Map<string, unknown>) {
    this.setAttribute('aria-selected', String(this.selected));
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
    if (!this.#ownLabel) {
      const name = [`${this.day} ${this.dateLabel}`.trim(), this.today ? 'today' : '', this.summary]
        .filter(Boolean)
        .join(', ');
      if (name) this.setAttribute('aria-label', name);
      else this.removeAttribute('aria-label');
    }
    if (changed.has('value') || changed.has('disabled')) {
      const strip = this.parentElement;
      if (strip instanceof HtWeekStrip) strip._syncTabs();
    }
  }

  render() {
    const load = Math.min(1, Math.max(0, Number(this.load) || 0));
    return html`
      <span part="base" class="tab ${this._over ? 'over' : ''}">
        ${load > 0
          ? html`<i part="fill" class="fill" style="height:${load * 100}%"></i>`
          : nothing}
        <span part="day" class="day">${this.day}</span>
        <span part="date" class="date">${this.dateLabel}</span>
        <span part="meter" class="meter"><slot name="meter"></slot></span>
      </span>
    `;
  }
}

for (const [tag, ctor] of [
  ['ht-week-strip', HtWeekStrip],
  ['ht-week-tab', HtWeekTab],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-week-strip': HtWeekStrip;
    'ht-week-tab': HtWeekTab;
  }
}
