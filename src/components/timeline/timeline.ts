import { LitElement, css, html, nothing, type TemplateResult } from 'lit';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Events in time order on a vertical rail: an activity feed, a record's history, an incident log.
 * Put `ht-timeline-item` children in it, or `ht-timeline-group` children (one per day) that hold
 * the items. Do not mix the two at one level.
 *
 * It is an ordered list. With groups it is a list of days, each with a heading and its own list of
 * events. Order is yours: newest first or oldest first, the element does not sort.
 *
 * It only lays out what it is given. No fetching, no paging: put an `ht-pagination` or a Load More
 * button under it. It has no empty state either; when there is nothing to show, render an
 * `ht-empty-state` instead of the timeline.
 *
 * @tag ht-timeline
 * @summary Vertical list of events in time order.
 *
 * @slot - `ht-timeline-item` or `ht-timeline-group` elements.
 *
 * @csspart list - The list.
 *
 * @cssprop [--ht-timeline-gap=1.25rem] - Space between items. `density="dense"` sets 0.5rem.
 * @cssprop [--ht-timeline-marker-column=1.5rem] - Width of the marker column. Fits a 24px marker (`ht-avatar size="sm"`); use 2rem for `size="md"`.
 */
export class HtTimeline extends LitElement {
  static properties = {
    /** `dense` tightens the spacing and the text for long logs. */
    density: { reflect: true },
    /** Accessible name for the list, such as `Activity`. */
    label: {},
  };

  declare density: 'comfortable' | 'dense';
  declare label: string;

  constructor() {
    super();
    this.density = 'comfortable';
    this.label = '';
  }

  static styles = css`
    :host {
      display: block;
      --ht-timeline-gap: 1.25rem;
      --ht-timeline-marker-column: 1.5rem;
      /* Private, read by items and groups through inheritance. */
      --_tl-fs: 0.875rem;
      --_tl-lh: 1.25rem;
      --_tl-dot: 0.625rem;
      --_tl-col: 0.75rem;
      --_tl-body: 0.5rem;
      --_tl-group: 1.5rem;
      --_tl-head: 0.75rem;
    }
    :host([hidden]) { display: none; }
    :host([density='dense']) {
      --ht-timeline-gap: 0.5rem;
      --_tl-fs: 0.8125rem;
      --_tl-lh: 1.125rem;
      --_tl-dot: 0.5rem;
      --_tl-col: 0.625rem;
      --_tl-body: 0.25rem;
      --_tl-group: 1rem;
      --_tl-head: 0.5rem;
    }
    ol { display: block; margin: 0; padding: 0; list-style: none; }
  `;

  render() {
    // role="list" is explicit: Safari drops list semantics under list-style: none.
    return html`<ol part="list" role="list" aria-label=${this.label || nothing}><slot></slot></ol>`;
  }
}

/**
 * One day (or any other span) inside `ht-timeline`: a heading such as Today, Yesterday or a date,
 * and the items of that span. The rail restarts under each heading.
 *
 * @tag ht-timeline-group
 * @summary Headed group of timeline items.
 *
 * @slot - `ht-timeline-item` elements.
 * @slot heading - Replaces the `heading` text.
 *
 * @csspart heading - The heading.
 * @csspart list - The list of items.
 */
export class HtTimelineGroup extends LitElement {
  static properties = {
    /** Heading text, such as `Today` or `Tuesday 21 October`. */
    heading: {},
    /** Machine-readable date for the heading, such as `2026-10-21`. Renders the heading as a `<time>`. */
    datetime: {},
    /** Heading level announced to screen readers, 1 to 6. Default 3. */
    level: { type: Number },
  };

  declare heading: string;
  declare datetime: string;
  declare level: number;

  constructor() {
    super();
    this.heading = '';
    this.datetime = '';
    this.level = 3;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'listitem');
  }

  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }
    :host(:not(:first-of-type)) { margin-top: var(--_tl-group, 1.5rem); }
    h1, h2, h3, h4, h5, h6 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 var(--_tl-head, 0.75rem);
      font: 500 0.6875rem/1rem var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-muted);
    }
    /* A hairline from the label to the edge, as a divider between days. */
    h1::after, h2::after, h3::after, h4::after, h5::after, h6::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--ht-border);
    }
    ol { display: block; margin: 0; padding: 0; list-style: none; }
  `;

  #heading(): TemplateResult {
    const text = html`<slot name="heading">${this.datetime ? html`<time datetime=${this.datetime}>${this.heading}</time>` : this.heading}</slot>`;
    switch (Math.min(6, Math.max(1, Math.round(this.level) || 3))) {
      case 1: return html`<h1 part="heading">${text}</h1>`;
      case 2: return html`<h2 part="heading">${text}</h2>`;
      case 4: return html`<h4 part="heading">${text}</h4>`;
      case 5: return html`<h5 part="heading">${text}</h5>`;
      case 6: return html`<h6 part="heading">${text}</h6>`;
      default: return html`<h3 part="heading">${text}</h3>`;
    }
  }

  render() {
    return html`${this.#heading()}<ol part="list" role="list"><slot></slot></ol>`;
  }
}

/**
 * One event in `ht-timeline`: a marker on the rail, a title line, the time, and optional meta and
 * body. Only valid inside `ht-timeline` or `ht-timeline-group`, which provide the list it belongs to. The default slot is the title line, in the muted text colour; `<b>`, `<strong>` and `<a>`
 * placed directly in it are drawn in the full text colour, so "**Ada** moved **SNT-12** to Done"
 * reads actor, verb, target.
 *
 * The marker is a dot by default. Put an `ht-icon` in the `marker` slot to get it in a tinted
 * circle, or an `ht-avatar size="sm"` for a person. The marker is decoration and hidden from
 * assistive technology, and `tone` is only colour: the title must say who did what, and an outcome
 * such as Failed belongs in the text or in an `ht-tag` in `meta`.
 *
 * Give the time as `datetime` (machine-readable, such as `2026-10-23T14:02`) and `time` (what people
 * read, such as `14:02` or `2h ago`). With only `datetime`, it is shown as a short local date and time.
 *
 * @tag ht-timeline-item
 * @summary Timeline event.
 *
 * @slot - Title line: who did what to which thing.
 * @slot marker - Replaces the dot: an `ht-icon` (drawn in a 24px tinted circle) or an `ht-avatar size="sm"`.
 * @slot time - Replaces the `time` text. Still wrapped in `<time datetime>` when `datetime` is set.
 * @slot meta - Tags, an entity chip or links, under the title. Hidden when empty.
 * @slot body - Detail under the title: a quote, a diff, a comment excerpt or a card. Hidden when empty.
 *
 * @csspart base - The row: marker column and content column.
 * @csspart rail - The line between markers.
 * @csspart marker - The marker cell.
 * @csspart dot - The default dot.
 * @csspart content - The content column.
 * @csspart title - The title line.
 * @csspart time - The time.
 * @csspart meta - The meta row.
 * @csspart body - The body.
 */
export class HtTimelineItem extends LitElement {
  static properties = {
    /** Marker colour. `neutral` is the default. Colour only; say the outcome in text too. */
    tone: { reflect: true },
    /** Machine-readable time, such as `2026-10-23T14:02:00Z`. Renders the time as `<time datetime>`. */
    datetime: {},
    /** Visible time, such as `14:02`, `Yesterday` or `2h ago`. */
    time: {},
    _slots: { state: true },
  };

  declare tone: Tone;
  declare datetime: string;
  declare time: string;
  declare _slots: Set<string>;

  constructor() {
    super();
    this.tone = 'neutral';
    this.datetime = '';
    this.time = '';
    this._slots = new Set();
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'listitem');
  }

  static styles = css`
    :host {
      display: block;
      --_fs: var(--_tl-fs, 0.875rem);
      --_lh: var(--_tl-lh, 1.25rem);
      --_gap: var(--ht-timeline-gap, 1.25rem);
      --_col: var(--ht-timeline-marker-column, 1.5rem);
      /* --_c colours the dot. --_t is the raw tone colour, --_mix how much of it tints the icon circle, --_ink the icon colour. */
      --_c: var(--ht-text-subtle);
      --_mix: 0%;
      --_ink: var(--ht-text-muted);
      --_ring: var(--ht-border);
    }
    :host([hidden]) { display: none; }
    :host([tone='accent']) { --_c: var(--ht-accent); --_t: var(--ht-accent); --_mix: 12%; --_ink: var(--ht-accent-text); }
    :host([tone='success']) { --_c: var(--ht-success); --_t: var(--ht-success); --_mix: 14%; --_ink: color-mix(in oklab, var(--ht-success) 50%, var(--ht-text)); }
    /* Amber is the palest tone, so it is mixed toward the text colour (in oklab, so the hue holds in both themes). */
    :host([tone='warning']) { --_c: color-mix(in oklab, var(--ht-warning) 78%, var(--ht-text)); --_t: var(--ht-warning); --_mix: 16%; --_ink: color-mix(in oklab, var(--ht-warning) 55%, var(--ht-text)); }
    :host([tone='danger']) { --_c: var(--ht-danger); --_t: var(--ht-danger); --_mix: 12%; --_ink: var(--ht-danger-text); }
    :host([tone='info']) { --_c: var(--ht-info); --_t: var(--ht-info); --_mix: 12%; --_ink: color-mix(in oklab, var(--ht-info) 50%, var(--ht-text)); }
    :host(:not([tone='neutral'])) { --_ring: color-mix(in oklab, var(--_t, var(--ht-border)) 30%, var(--ht-border)); }

    .item {
      position: relative;
      display: grid;
      grid-template-columns: var(--_col) minmax(0, 1fr);
      column-gap: var(--_tl-col, 0.75rem);
      font: 400 var(--_fs) / var(--_lh) var(--ht-font-ui);
      color: var(--ht-text-muted);
    }

    /*
     * One line per item, from the top of the item to the bottom, centred in the marker column.
     * Items sit flush, so the lines join. The first item's line starts at its marker and the last
     * item's stops there. Markers are opaque and paint over it.
     */
    .rail {
      position: absolute;
      top: 0;
      bottom: 0;
      left: calc(var(--_col) / 2 - 1px);
      width: 2px;
      background: var(--ht-border);
    }
    :host(:first-of-type) .rail { top: calc(var(--_lh) / 2); }
    :host(:last-of-type) .rail { bottom: calc(100% - var(--_lh) / 2); }
    :host(:only-of-type) .rail { display: none; }

    /* The marker cell is one title line tall, so its centre is fixed whatever is in it. Bigger markers overflow evenly. */
    .marker {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: var(--_lh);
    }
    .dot {
      flex: none;
      width: var(--_tl-dot, 0.625rem);
      height: var(--_tl-dot, 0.625rem);
      border-radius: 50%;
      background: var(--_c);
    }
    .has-marker .dot { display: none; }
    ::slotted([slot='marker']) { flex: none; }
    ::slotted(ht-icon[slot='marker']) {
      box-sizing: content-box;
      padding: 0.3125rem;
      font-size: 0.875rem;
      border-radius: 50%;
      color: var(--_ink);
      background: color-mix(in oklab, var(--_t, transparent) var(--_mix), var(--ht-surface));
      box-shadow: inset 0 0 0 1px var(--_ring);
    }

    .content { min-width: 0; padding-bottom: var(--_gap); }
    :host(:last-of-type) .content { padding-bottom: 0; }

    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: 12px;
    }
    .title { flex: 1 1 14rem; min-width: 0; overflow-wrap: anywhere; }
    ::slotted(b), ::slotted(strong) { font-weight: 500; color: var(--ht-text); }
    ::slotted(a) { font-weight: 500; color: var(--ht-text); text-underline-offset: 2px; }
    .time {
      flex: none;
      font: 400 0.75rem / var(--_lh) var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      color: var(--ht-text-subtle);
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 6px;
      margin-top: 4px;
    }
    .body { margin-top: var(--_tl-body, 0.5rem); }
    [hidden] { display: none !important; }
  `;

  #track = (name: string) => (e: Event) => {
    const has = (e.target as HTMLSlotElement).assignedNodes().length > 0;
    if (has === this._slots.has(name)) return;
    const next = new Set(this._slots);
    has ? next.add(name) : next.delete(name);
    this._slots = next;
  };

  /** `time`, or `datetime` as a short local date and time when `time` is empty. */
  #timeText() {
    if (this.time || !this.datetime) return this.time;
    const d = new Date(this.datetime);
    if (Number.isNaN(d.getTime())) return this.datetime;
    // A bare date parses as UTC midnight; format it in UTC so it does not slip to the day before.
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(this.datetime.trim());
    return new Intl.DateTimeFormat(undefined, dateOnly ? { dateStyle: 'medium', timeZone: 'UTC' } : { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  }

  render() {
    const s = this._slots;
    const text = html`<slot name="time" @slotchange=${this.#track('time')}>${this.#timeText()}</slot>`;
    const showTime = !!(this.time || this.datetime) || s.has('time');
    return html`
      <div part="base" class="item ${s.has('marker') ? 'has-marker' : ''}">
        <span part="rail" class="rail" aria-hidden="true"></span>
        <div part="marker" class="marker" aria-hidden="true">
          <span part="dot" class="dot"></span>
          <slot name="marker" @slotchange=${this.#track('marker')}></slot>
        </div>
        <div part="content" class="content">
          <div class="head">
            <div part="title" class="title"><slot></slot></div>
            ${this.datetime
              ? html`<time part="time" class="time" datetime=${this.datetime} ?hidden=${!showTime}>${text}</time>`
              : html`<span part="time" class="time" ?hidden=${!showTime}>${text}</span>`}
          </div>
          <div part="meta" class="meta" ?hidden=${!s.has('meta')}><slot name="meta" @slotchange=${this.#track('meta')}></slot></div>
          <div part="body" class="body" ?hidden=${!s.has('body')}><slot name="body" @slotchange=${this.#track('body')}></slot></div>
        </div>
      </div>
    `;
  }
}

for (const [tag, ctor] of [
  ['ht-timeline', HtTimeline],
  ['ht-timeline-group', HtTimelineGroup],
  ['ht-timeline-item', HtTimelineItem],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-timeline': HtTimeline;
    'ht-timeline-group': HtTimelineGroup;
    'ht-timeline-item': HtTimelineItem;
  }
}
