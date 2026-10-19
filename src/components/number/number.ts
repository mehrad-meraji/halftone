import { LitElement, css, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

type Cell = { key: string; digit: number } | { key: string; text: string };

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A formatted number that animates when its `value` changes: stats, totals, counters. Formatting
 * is `Intl.NumberFormat`, so grouping, decimals, currency and compact notation follow the locale.
 * Digits are always Latin (0 to 9), whatever the locale.
 *
 * Two effects. `slide` (default) rolls each digit up or down its own 0 to 9 reel, so only the
 * digits that change move. `count` counts from the old value to the new one. The first value is
 * shown as it is, with no animation.
 *
 * Assistive technology reads the final formatted value once. The moving digits are hidden from it,
 * so a screen reader never reads numbers in motion. With reduced motion the number just changes.
 *
 * @tag ht-number
 * @summary Formatted number that rolls or counts to a new value.
 *
 * @csspart visual - The visible, animated number.
 *
 * @cssprop [--ht-number-duration=600ms] - Time a change takes. Set with the `duration` attribute instead of this variable.
 */
export class HtNumber extends LitElement {
  static properties = {
    /** The number to show. */
    value: { type: Number },
    /** `slide` rolls each digit; `count` counts up or down. */
    effect: { reflect: true },
    /** BCP 47 language tag. Defaults to the nearest `lang` ancestor, then the browser language. */
    locale: {},
    /** ISO 4217 currency code, such as `USD`. Shows the value as money. */
    currency: {},
    /** Digits after the decimal point. Without it, whole numbers show no decimals and others up to 3. */
    decimals: { type: Number },
    /** Short form such as `1.2K`. */
    compact: { type: Boolean, reflect: true },
    /** Milliseconds a change takes. */
    duration: { type: Number },
    /** @internal The value being shown during a `count` animation. */
    _shown: { state: true },
  };

  declare value: number;
  declare effect: 'slide' | 'count';
  declare locale: string;
  declare currency: string;
  declare decimals: number | undefined;
  declare compact: boolean;
  declare duration: number;
  declare _shown: number;

  #seeded = false;
  #raf = 0;

  constructor() {
    super();
    this.value = 0;
    this.effect = 'slide';
    this.locale = '';
    this.currency = '';
    this.compact = false;
    this.duration = 600;
    this._shown = 0;
  }

  static styles = css`
    :host {
      display: inline-block;
      font-variant-numeric: tabular-nums;
    }
    :host([hidden]) { display: none; }
    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .visual { display: inline-flex; align-items: flex-start; white-space: pre; }
    .digit { display: inline-block; height: 1lh; overflow: hidden; }
    .strip {
      display: flex;
      flex-direction: column;
      transform: translateY(calc(var(--d) * -1lh));
      transition: transform var(--_dur) cubic-bezier(0.2, 0, 0, 1);
    }
    .strip > span { display: block; height: 1lh; }
    @media (prefers-reduced-motion: reduce) {
      .strip { transition: none; }
    }
  `;

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.#raf);
  }

  #formatter(v: number) {
    const lang = this.locale || this.closest('[lang]')?.getAttribute('lang') || navigator.language;
    const opts: Intl.NumberFormatOptions & { numberingSystem?: string } = {
      numberingSystem: 'latn',
      notation: this.compact ? 'compact' : 'standard',
    };
    if (this.currency) {
      opts.style = 'currency';
      opts.currency = this.currency;
    }
    // Whole targets show no decimals, so a count never flashes fractions on the way.
    const digits = this.decimals ?? (Number.isInteger(this.value) && !this.currency && !this.compact ? 0 : undefined);
    if (digits !== undefined) {
      opts.minimumFractionDigits = digits;
      opts.maximumFractionDigits = digits;
    }
    try {
      return new Intl.NumberFormat(lang, opts);
    } catch {
      return new Intl.NumberFormat(undefined, opts);
    }
  }

  /** Splits the formatted number into digit cells and static text cells. Keys are place values, so a digit keeps its reel when the length changes. */
  #cells(v: number): Cell[] {
    const parts = this.#formatter(v).formatToParts(v);
    let intLeft = parts.filter((p) => p.type === 'integer').reduce((n, p) => n + p.value.length, 0);
    let frac = 0;
    const cells: Cell[] = [];
    parts.forEach((p, i) => {
      if (p.type === 'integer') {
        for (const ch of p.value) cells.push({ key: `i${--intLeft}`, digit: Number(ch) });
      } else if (p.type === 'fraction') {
        for (const ch of p.value) cells.push({ key: `f${frac++}`, digit: Number(ch) });
      } else {
        cells.push({ key: p.type === 'group' ? `g${intLeft}` : `${p.type}${i}`, text: p.value });
      }
    });
    return cells;
  }

  willUpdate(changed: Map<string, unknown>) {
    if (!this.#seeded) {
      this.#seeded = true;
      this._shown = this.value;
      return;
    }
    if (changed.has('value')) this.#go();
  }

  #go() {
    cancelAnimationFrame(this.#raf);
    const from = this._shown;
    const to = this.value;
    if (this.effect !== 'count' || from === to || reducedMotion() || !(this.duration > 0)) {
      this._shown = to;
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / this.duration);
      this._shown = t >= 1 ? to : from + (to - from) * (1 - (1 - t) ** 3);
      if (t < 1) this.#raf = requestAnimationFrame(step);
    };
    this.#raf = requestAnimationFrame(step);
  }

  render() {
    if (!Number.isFinite(this.value)) return html``;
    const spoken = this.#formatter(this.value).format(this.value);
    const visual =
      this.effect === 'count'
        ? this.#formatter(this._shown).format(this._shown)
        : repeat(
            this.#cells(this.value),
            (c) => c.key,
            (c) =>
              'text' in c
                ? html`<span>${c.text}</span>`
                : html`<span class="digit"><span class="strip" style=${styleMap({ '--d': String(c.digit) })}>${DIGITS.map((d) => html`<span>${d}</span>`)}</span></span>`,
          );
    return html`<span class="sr">${spoken}</span><span part="visual" class="visual" aria-hidden="true" style=${styleMap({ '--_dur': `${this.duration}ms` })}>${visual}</span>`;
  }
}

if (!customElements.get('ht-number')) customElements.define('ht-number', HtNumber);

declare global {
  interface HTMLElementTagNameMap {
    'ht-number': HtNumber;
  }
}
