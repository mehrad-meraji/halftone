import { LitElement, css, html, nothing } from 'lit';

/** Reads a time as epoch milliseconds: a number, a string of digits, an ISO date-time or a `Date`. `NaN` when unset or unreadable. */
const toMs = (v: string | number | Date | null | undefined): number => {
  if (v == null || v === '') return NaN;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  const s = v.trim();
  return /^-?\d+$/.test(s) ? Number(s) : Date.parse(s);
};

const pad = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * A live clock that counts up from `start`: time spent on a task, a call, a running job. It shows
 * `h:mm:ss`, or with `compact` `mm:ss` under an hour and `h:mm` from an hour on.
 *
 * Running, it is an accent chip with a pulsing dot. `paused` turns it into a neutral chip with a
 * pause glyph and freezes the time at `paused-at` (or at the moment `paused` was set). `bare` drops
 * the chip and leaves plain tabular digits in the mono face that take their size and colour from
 * the host, for tight spots.
 *
 * The clock always counts from `start`. Resuming does not subtract the paused span: when a paused
 * clock runs again, the app moves `start` forward by the time it spent paused.
 *
 * It ticks with one timer aligned to the next whole second of elapsed time (the next whole minute
 * for `compact` above an hour). While the page is hidden it stops; when the page shows it recomputes
 * from `start`, so it never drifts. A `start` in the future shows zero until it arrives. Without a
 * readable `start` it renders nothing and takes no space.
 *
 * It is a `timer` whose accessible name holds whole minutes only ("1 hour 24 minutes elapsed",
 * with ", paused" when paused), so it changes once a minute and nothing is read every second. The
 * visible digits sit in a `<time>` with a machine-readable duration (`datetime="PT1H24M7S"`).
 *
 * @tag ht-elapsed
 * @summary Live clock that counts up from a start time.
 *
 * @csspart base - The timer: the chip, or the plain text when `bare`.
 * @csspart dot - The pulsing dot shown while running. Not rendered when paused or bare.
 * @csspart glyph - The pause glyph shown while paused. Not rendered when bare.
 * @csspart time - The `<time>` that holds the digits.
 */
export class HtElapsed extends LitElement {
  static properties = {
    /** When the clock started: an ISO date-time (`2026-10-26T10:18:00Z`) or epoch milliseconds. Without it nothing renders. */
    start: {},
    /** Stops the clock. It shows the time at `paused-at`, or at the moment `paused` was set. */
    paused: { type: Boolean, reflect: true },
    /** Where a paused clock stops: an ISO date-time or epoch milliseconds. Unset, it stops at the moment `paused` was set. Ignored while running. */
    pausedAt: { attribute: 'paused-at' },
    /** Shorter time: `mm:ss` under an hour, `h:mm` from an hour on. */
    compact: { type: Boolean, reflect: true },
    /** Plain tabular digits with no chip, dot or glyph. Size and colour come from the host. */
    bare: { type: Boolean, reflect: true },
    /** Chip size: `md` 22px with 11px text (default), `lg` 28px with 13px text for a detail view. No effect when `bare`. */
    size: { reflect: true },
    /** @internal The clock reading the last render used, in epoch milliseconds. */
    _now: { state: true },
  };

  declare start: string | number | Date | undefined;
  declare paused: boolean;
  declare pausedAt: string | number | Date | undefined;
  declare compact: boolean;
  declare bare: boolean;
  declare size: 'md' | 'lg';
  declare _now: number;

  #timer: ReturnType<typeof setTimeout> | undefined;
  /** When `paused` last turned on, for a pause without `paused-at`. */
  #pausedSince: number | undefined;
  #internals: ElementInternals;

  constructor() {
    super();
    this.paused = false;
    this.compact = false;
    this.bare = false;
    this.size = 'md';
    this._now = Date.now();
    this.#internals = this.attachInternals();
  }

  static styles = css`
    :host {
      /* Flex, so the chip sits in no line box and adds no space under itself. */
      display: inline-flex;
      vertical-align: middle;
      flex: none;
    }
    :host([hidden]), :host(:state(empty)) { display: none; }

    .chip {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 1.375rem;
      padding: 0 8px;
      border: 1px solid transparent;
      border-radius: var(--ht-radius-md);
      background: var(--ht-accent-soft);
      color: var(--ht-accent-text);
      font-family: var(--ht-font-mono);
      font-size: 0.6875rem;
      font-weight: 500;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    :host([size='lg']) .chip {
      height: 1.75rem;
      padding: 0 10px;
      font-size: 0.8125rem;
    }
    :host([paused]) .chip {
      background: var(--ht-surface-muted);
      color: var(--ht-text-muted);
      border-color: var(--ht-border);
    }

    .bare {
      font-family: var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .dot {
      position: relative;
      flex: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ht-accent);
    }
    .dot::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--ht-accent);
      opacity: 0;
    }
    @media (prefers-reduced-motion: no-preference) {
      .dot::after { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
    }
    @keyframes ping {
      0% { transform: scale(1); opacity: 0.55; }
      75%, 100% { transform: scale(2.6); opacity: 0; }
    }

    .glyph {
      flex: none;
      width: 12px;
      height: 12px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this.#onVisibility);
    // Catch up after being moved or reattached; `updated` schedules the next tick.
    this._now = Date.now();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('visibilitychange', this.#onVisibility);
    this.#clear();
  }

  #onVisibility = () => {
    if (document.visibilityState === 'hidden') this.#clear();
    else this._now = Date.now();
  };

  #clear() {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  /** Elapsed milliseconds before clamping: negative while `start` is in the future. `NaN` without a start. */
  #raw(): number {
    const start = toMs(this.start);
    if (!this.paused) return this._now - start;
    const at = toMs(this.pausedAt);
    return (Number.isNaN(at) ? (this.#pausedSince ?? this._now) : at) - start;
  }

  /** One timer, set for the next moment the display changes. None while paused, hidden, disconnected or without a start. */
  #schedule() {
    this.#clear();
    if (this.paused || !this.isConnected || document.visibilityState === 'hidden') return;
    const raw = this.#raw();
    if (Number.isNaN(raw)) return;
    const step = this.compact && raw >= 3_600_000 ? 60_000 : 1000;
    // Normalised remainder, so a start in the future still lands on its whole seconds.
    const r = ((raw % step) + step) % step;
    // A future start waits for zero; cap the wait so a far-off start never overflows setTimeout.
    const wait = Math.min(raw < 0 ? -raw + step : step - r, 60_000);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      this._now = Date.now();
    }, Math.max(wait, 16));
  }

  willUpdate(changed: Map<PropertyKey, unknown>) {
    if (changed.has('paused')) this.#pausedSince = this.paused ? Date.now() : undefined;
    const empty = Number.isNaN(toMs(this.start));
    try {
      if (empty) this.#internals.states.add('empty');
      else this.#internals.states.delete('empty');
    } catch {
      /* Custom states unsupported: the empty host stays in the flow with no content. */
    }
  }

  updated() {
    this.#schedule();
  }

  render() {
    const raw = this.#raw();
    if (Number.isNaN(raw)) return nothing;
    const total = Math.max(0, Math.floor(raw / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    const text = this.compact ? (h ? `${h}:${pad(m)}` : `${pad(m)}:${pad(s)}`) : `${h}:${pad(m)}:${pad(s)}`;
    const parts = `${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}`;
    const datetime = `PT${parts || '0S'}`;
    const spoken = h || m ? [h ? plural(h, 'hour') : '', m ? plural(m, 'minute') : ''].filter(Boolean).join(' ') : 'Less than a minute';
    const label = `${spoken} elapsed${this.paused ? ', paused' : ''}`;

    const time = html`<time part="time" datetime=${datetime} aria-hidden="true">${text}</time>`;
    if (this.bare) return html`<span part="base" class="bare" role="timer" aria-label=${label}>${time}</span>`;

    const mark = this.paused
      ? html`<svg part="glyph" class="glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4v8M10 4v8"></path></svg>`
      : html`<span part="dot" class="dot" aria-hidden="true"></span>`;
    return html`<span part="base" class="chip" role="timer" aria-label=${label}>${mark}${time}</span>`;
  }
}

if (!customElements.get('ht-elapsed')) customElements.define('ht-elapsed', HtElapsed);

declare global {
  interface HTMLElementTagNameMap {
    'ht-elapsed': HtElapsed;
  }
}
