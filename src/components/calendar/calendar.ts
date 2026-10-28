import { LitElement, css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/** Calendar days are plain year/month/day triples (month 0 to 11), so time zones never shift a date. */
type Ymd = { y: number; m: number; d: number };

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const toIso = ({ y, m, d }: Ymd) => `${pad(y, 4)}-${pad(m + 1)}-${pad(d)}`;
const utc = ({ y, m, d }: Ymd) => new Date(Date.UTC(y, m, d));
const fromUtc = (t: Date): Ymd => ({ y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() });

function parseIso(s: string | undefined | null): Ymd | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!r) return null;
  const v = { y: +r[1], m: +r[2] - 1, d: +r[3] };
  const back = fromUtc(utc(v));
  return back.y === v.y && back.m === v.m && back.d === v.d ? v : null;
}
const addDays = (v: Ymd, n: number): Ymd => fromUtc(new Date(Date.UTC(v.y, v.m, v.d + n)));
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
/** Moves by whole months and keeps the day, clamped to the target month's length. */
const addMonths = (v: Ymd, n: number): Ymd => {
  const t = v.y * 12 + v.m + n;
  const y = Math.floor(t / 12);
  const m = t - y * 12;
  return { y, m, d: Math.min(v.d, daysInMonth(y, m)) };
};
const weekday = (v: Ymd) => utc(v).getUTCDay();

const chevron = html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg>`;
const chevrons = html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8.5 3.5 4 8l4.5 4.5M13 3.5 8.5 8l4.5 4.5" /></svg>`;

/**
 * Month grid for picking one date. Follows the WAI-ARIA date grid pattern: one tab stop in
 * the grid, arrows move by day and week, Home and End jump to the ends of the week, Page Up
 * and Page Down change month, Shift with them changes year, Enter or Space selects.
 *
 * Dates are ISO strings (`YYYY-MM-DD`). Month, weekday and day names come from `Intl` using
 * the element's `lang` (or the page's), and the week starts on that locale's first day unless
 * `week-start` is set. No date library. A single date only; ranges are not supported.
 *
 * Form-associated: the value is submitted under `name`, and form reset restores the initial value.
 *
 * Disable individual days with the `isDateDisabled` property:
 *
 * ```js
 * calendar.isDateDisabled = (date) => date.getDay() === 0 || date.getDay() === 6;
 * ```
 *
 * @tag ht-calendar
 * @summary Month calendar for choosing a date.
 *
 * @csspart base - The calendar box.
 * @csspart header - The row with the month label and navigation buttons.
 * @csspart nav - A navigation button.
 * @csspart title - The month and year label.
 * @csspart grid - The `role="grid"` table.
 * @csspart weekday - A weekday column header.
 * @csspart day - A day cell.
 *
 * @cssprop [--ht-calendar-cell-size=2.25rem] - Width and height of a day cell.
 *
 * @fires change - A date was picked by the user. Read `value` from the host.
 */
export class HtCalendar extends LitElement {
  /** @internal */
  static formAssociated = true;

  static properties = {
    /** Selected date, `YYYY-MM-DD`. Empty for none. Setting it also shows that month. */
    value: { reflect: true },
    /** Earliest selectable date, `YYYY-MM-DD`. */
    min: {},
    /** Latest selectable date, `YYYY-MM-DD`. */
    max: {},
    /** Form field name. */
    name: {},
    disabled: { type: Boolean, reflect: true },
    /** First day of the week: 0 is Sunday, 1 is Monday, and so on. Defaults to the locale's. */
    weekStart: { type: Number, attribute: 'week-start' },
    /** Returns `true` for dates that cannot be picked. Receives a `Date` at local midnight. Set it as a property. */
    isDateDisabled: { attribute: false },
    _view: { state: true },
    _focus: { state: true },
    _formDisabled: { state: true },
  };

  declare value: string;
  declare min: string;
  declare max: string;
  declare name: string;
  declare disabled: boolean;
  declare weekStart: number | null;
  declare isDateDisabled: ((date: Date) => boolean) | null;
  declare _view: { y: number; m: number };
  declare _focus: string;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #defaultValue = '';

  constructor() {
    super();
    this.value = '';
    this.min = '';
    this.max = '';
    this.name = '';
    this.disabled = false;
    this.weekStart = null;
    this.isDateDisabled = null;
    const t = this.#today();
    this._view = { y: t.y, m: t.m };
    this._focus = '';
    this._formDisabled = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? '';
  }

  static styles = css`
    :host {
      display: inline-block;
      --_cell: var(--ht-calendar-cell-size, 2.25rem);
    }
    .base {
      box-sizing: border-box;
      padding: 12px;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-bottom: 8px;
    }
    .title {
      flex: 1;
      min-width: 0;
      text-align: center;
      white-space: nowrap;
      font: 600 0.875rem/1.25rem var(--ht-font-display);
      color: var(--ht-text);
    }
    .nav {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      cursor: pointer;
      color: var(--ht-text);
      border-radius: var(--ht-radius-md);
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    .nav svg { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .nav:hover { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    .nav:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    .nav[aria-disabled='true'] { opacity: 0.4; cursor: not-allowed; background: transparent; }
    .flip { display: inline-flex; transform: scaleX(-1); }
    :host(:dir(rtl)) .nav svg { transform: scaleX(-1); }
    table { border-collapse: separate; border-spacing: 2px; margin: -2px; }
    th {
      width: var(--_cell);
      height: 1.5rem;
      padding: 0;
      font: 500 0.6875rem/1rem var(--ht-font-mono);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      text-align: center;
      color: var(--ht-text-subtle);
    }
    td {
      box-sizing: border-box;
      width: var(--_cell);
      height: var(--_cell);
      padding: 0;
      text-align: center;
      vertical-align: middle;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      user-select: none;
      outline: none;
      border-radius: var(--ht-radius-md);
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    td[data-outside] { color: var(--ht-text-subtle); }
    td:hover { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    td[aria-current='date'] { font-weight: 600; box-shadow: inset 0 0 0 1px var(--ht-border-input); }
    td:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    td[aria-selected='true'],
    td[aria-selected='true']:hover {
      font-weight: 600;
      color: var(--ht-accent-ink);
      background: var(--ht-accent);
    }
    td[aria-disabled='true'] { cursor: not-allowed; color: var(--ht-text-subtle); opacity: 0.5; background: transparent; }
    td[aria-disabled='true'][aria-selected='true'] { color: var(--ht-accent-ink); background: var(--ht-accent); }
    :host([disabled]) .nav { opacity: 0.4; cursor: not-allowed; }
    @media (prefers-reduced-motion: reduce) {
      .nav, td { transition: none; }
    }
  `;

  /** The owning form, if any. */
  get form() {
    return this.#internals.form;
  }

  /** Focuses the day that holds the grid's tab stop. */
  focus(options?: FocusOptions) {
    const cell = this.renderRoot.querySelector<HTMLElement>('td[tabindex="0"]');
    if (cell) cell.focus(options);
  }

  formResetCallback() {
    this.value = this.#defaultValue;
  }
  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
  }
  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('value')) {
      const v = parseIso(this.value);
      if (v) {
        this._view = { y: v.y, m: v.m };
        this._focus = this.value;
      }
    }
  }

  updated() {
    this.#internals.setFormValue?.(parseIso(this.value) ? this.value : null);
  }

  #today(): Ymd {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
  }

  get #locale() {
    return this.lang || document.documentElement.lang || navigator.language || 'en';
  }

  get #firstDay(): number {
    if (this.weekStart != null && !Number.isNaN(this.weekStart)) return ((Math.round(this.weekStart) % 7) + 7) % 7;
    try {
      const loc = new Intl.Locale(this.#locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
      const info = loc.getWeekInfo?.() ?? loc.weekInfo;
      if (info) return info.firstDay % 7; // 1 is Monday ... 7 is Sunday
    } catch {
      /* bad locale tag: fall through */
    }
    return 0;
  }

  #isOff(v: Ymd): boolean {
    if (this.disabled || this._formDisabled) return true;
    const iso = toIso(v);
    if (this.min && iso < this.min) return true;
    if (this.max && iso > this.max) return true;
    return !!this.isDateDisabled?.(new Date(v.y, v.m, v.d));
  }

  /** Whether any day of the month falls inside min and max. */
  #monthInRange(y: number, m: number) {
    if (this.min && toIso({ y, m, d: daysInMonth(y, m) }) < this.min) return false;
    if (this.max && toIso({ y, m, d: 1 }) > this.max) return false;
    return true;
  }

  /** The day that holds the roving tab stop: the focused one if visible, else selected, today, or the 1st. */
  #tabDate(): string {
    const { y, m } = this._view;
    const inView = (s: string) => {
      const v = parseIso(s);
      return !!v && v.y === y && v.m === m;
    };
    if (inView(this._focus)) return this._focus;
    if (inView(this.value)) return this.value;
    const t = this.#today();
    if (t.y === y && t.m === m) return toIso(t);
    return toIso({ y, m, d: 1 });
  }

  /** Moves the visible month and puts keyboard focus on a day. */
  async #focusDate(v: Ymd) {
    let iso = toIso(v);
    if (this.min && iso < this.min) iso = this.min;
    if (this.max && iso > this.max) iso = this.max;
    const c = parseIso(iso)!;
    this._focus = iso;
    this._view = { y: c.y, m: c.m };
    await this.updateComplete;
    this.renderRoot.querySelector<HTMLElement>(`td[data-date="${iso}"]`)?.focus();
  }

  #pick(v: Ymd) {
    if (this.#isOff(v)) return;
    const iso = toIso(v);
    const changed = iso !== this.value;
    this.value = iso;
    this.#focusDate(v);
    if (changed) this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #step(months: number) {
    const target = addMonths({ ...this._view, d: 1 }, months);
    if (!this.#monthInRange(target.y, target.m)) return;
    this._view = { y: target.y, m: target.m };
  }

  #onKeydown = (e: KeyboardEvent) => {
    const cell = (e.target as Element).closest<HTMLElement>('td[data-date]');
    const cur = parseIso(cell?.dataset.date);
    if (!cur) return;
    const rtl = getComputedStyle(this).direction === 'rtl';
    const offset = (weekday(cur) - this.#firstDay + 7) % 7;
    let next: Ymd | null = null;
    switch (e.key) {
      case 'ArrowLeft': next = addDays(cur, rtl ? 1 : -1); break;
      case 'ArrowRight': next = addDays(cur, rtl ? -1 : 1); break;
      case 'ArrowUp': next = addDays(cur, -7); break;
      case 'ArrowDown': next = addDays(cur, 7); break;
      case 'Home': next = addDays(cur, -offset); break;
      case 'End': next = addDays(cur, 6 - offset); break;
      case 'PageUp': next = addMonths(cur, e.shiftKey ? -12 : -1); break;
      case 'PageDown': next = addMonths(cur, e.shiftKey ? 12 : 1); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.#pick(cur);
        return;
      default:
        return;
    }
    e.preventDefault();
    this.#focusDate(next);
  };

  #onClick = (e: MouseEvent) => {
    const cell = (e.target as Element).closest<HTMLElement>('td[data-date]');
    const v = parseIso(cell?.dataset.date);
    if (v) this.#pick(v);
  };

  #navButton(label: string, months: number, icon: unknown) {
    const target = addMonths({ ...this._view, d: 1 }, months);
    const off = this.disabled || this._formDisabled || !this.#monthInRange(target.y, target.m);
    return html`
      <button
        part="nav"
        class="nav"
        type="button"
        aria-label=${label}
        aria-disabled=${ifDefined(off ? 'true' : undefined)}
        @click=${() => !off && this.#step(months)}
      >${icon}</button>`;
  }

  render() {
    const locale = this.#locale;
    const { y, m } = this._view;
    const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...o });
    const fTitle = fmt({ month: 'long', year: 'numeric' });
    const fDay = fmt({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const fShort = fmt({ weekday: 'short' });
    const fLong = fmt({ weekday: 'long' });

    const first = this.#firstDay;
    const monthStart: Ymd = { y, m, d: 1 };
    const gridStart = addDays(monthStart, -((weekday(monthStart) - first + 7) % 7));
    const todayIso = toIso(this.#today());
    const tab = this.#tabDate();
    const selected = parseIso(this.value) ? this.value : '';
    const titleText = fTitle.format(utc(monthStart));

    // Any week's days give the weekday names; start from the grid's first row.
    const heads = Array.from({ length: 7 }, (_, i) => utc(addDays(gridStart, i)));
    const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(gridStart, w * 7 + i)));

    return html`
      <div part="base" class="base">
        <div part="header" class="header">
          ${this.#navButton('Previous Year', -12, chevrons)}
          ${this.#navButton('Previous Month', -1, chevron)}
          <div part="title" class="title" id="title" aria-live="polite">${titleText}</div>
          ${this.#navButton('Next Month', 1, html`<span class="flip">${chevron}</span>`)}
          ${this.#navButton('Next Year', 12, html`<span class="flip">${chevrons}</span>`)}
        </div>
        <table part="grid" role="grid" aria-labelledby="title" @keydown=${this.#onKeydown} @click=${this.#onClick}>
          <thead>
            <tr>
              ${heads.map((d) => html`<th part="weekday" scope="col" abbr=${fLong.format(d)}>${fShort.format(d)}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${weeks.map(
              (week) => html`
                <tr>
                  ${week.map((v) => {
                    const iso = toIso(v);
                    const off = this.#isOff(v);
                    return html`
                      <td
                        part="day"
                        role="gridcell"
                        data-date=${iso}
                        data-outside=${ifDefined(v.m !== m ? '' : undefined)}
                        tabindex=${iso === tab && !this.disabled && !this._formDisabled ? '0' : '-1'}
                        aria-selected=${iso === selected ? 'true' : 'false'}
                        aria-disabled=${ifDefined(off ? 'true' : undefined)}
                        aria-current=${ifDefined(iso === todayIso ? 'date' : undefined)}
                        aria-label=${fDay.format(utc(v))}
                      >${v.d}</td>`;
                  })}
                </tr>`,
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}

if (!customElements.get('ht-calendar')) customElements.define('ht-calendar', HtCalendar);

declare global {
  interface HTMLElementTagNameMap {
    'ht-calendar': HtCalendar;
  }
}
