import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
const TONES: readonly Tone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];

/**
 * One part of an `ht-meter`: a value, a tone and a label. It renders nothing itself; the parent
 * meter draws it. Changing any property redraws the meter.
 *
 * @tag ht-meter-part
 * @summary One part of a meter.
 */
export class HtMeterPart extends LitElement {
  static properties = {
    /** Count for this part. Negative and non-numeric values count as 0. A part at 0 is left out of the bar and the summary. */
    value: { type: Number, reflect: true },
    /** Fill colour. `neutral` is the default. */
    tone: { reflect: true },
    /** Name of the part, such as "Meetings". The summary uses it in lower case: "3 meetings". */
    label: { reflect: true },
  };

  declare value: number;
  declare tone: Tone;
  declare label: string;

  constructor() {
    super();
    this.value = 0;
    this.tone = 'neutral';
    this.label = '';
  }

  static styles = css`
    :host { display: none; }
  `;

  render() {
    return nothing;
  }

  updated() {
    // The meter reads its parts when it renders, so a change here asks it to render again.
    // This also covers parts upgraded after the meter's first render.
    const parent = this.parentElement;
    if (parent instanceof HtMeter) parent.requestUpdate();
  }
}

interface PartData {
  value: number;
  tone: Tone;
  label: string;
}

/**
 * A bar split into parts side by side, each with a value and a tone: "3 meetings, 2 done,
 * 4 open, 1 late". Parts are `ht-meter-part` children.
 *
 * Without `max`, the parts share the full width. With `max`, each part takes `value / max` and the
 * room left is a hatched track. When the parts add up to more than `max`, the bar scales to the
 * sum and a 2px mark shows where `max` falls.
 *
 * The bar is `role="img"`, named by a summary generated from the parts ("10 of 12: 3 meetings,
 * 2 done, 4 open, 1 late", "14 of 12, over by 2: 4 meetings, 10 open"), with `label` (or a host
 * `aria-label`, which is forwarded) in front. Labels are lower-cased as they are, with no
 * plurals worked out: set `summary` when the generated text does not read well.
 *
 * `legend` adds a table of parts with their counts. Parts at 0 keep their row there, so a set of
 * meters shows the same rows. While the summary is generated, the legend is hidden from screen
 * readers, because the bar already reads every part. When `summary` is set, the legend is exposed
 * as a list, since the custom text may leave the counts out.
 *
 * @tag ht-meter
 * @summary Bar of parts against an optional capacity.
 *
 * @slot - `ht-meter-part` elements, one per part, in bar order.
 *
 * @csspart header - The row above the bar holding the label and the count. Shown when `label` is set.
 * @csspart label - The visible label.
 * @csspart value - The count text in the header ("10 of 12", "Over by 2"). Shown when `max` is set.
 * @csspart track - The bar (`role="img"`).
 * @csspart fill - Each part's fill in the bar.
 * @csspart mark - The line at `max` when the parts run over it.
 * @csspart legend - The legend table.
 */
export class HtMeter extends LitElement {
  static properties = {
    /** Capacity. When set, the room left shows as a hatched track and an overrun is marked. Unset (or 0) means the parts fill the width by share. */
    max: { type: Number },
    /** Bar height: sm 4px, md 8px. */
    size: { reflect: true },
    /** Shows the legend table under the bar. */
    legend: { type: Boolean, reflect: true },
    /** Visible label above the bar. Also put in front of the bar's accessible name. */
    label: {},
    /** Accessible text for the bar, used instead of the generated summary. */
    summary: {},
  };

  declare max: number | undefined;
  declare size: 'sm' | 'md';
  declare legend: boolean;
  declare label: string;
  declare summary: string | undefined;

  #ariaLabel = '';

  constructor() {
    super();
    this.size = 'md';
    this.legend = false;
    this.label = '';
  }

  connectedCallback() {
    super.connectedCallback();
    // `aria-label` is not allowed on a generic host; move it to the bar.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
      this.requestUpdate();
    }
  }

  static styles = css`
    :host {
      display: block;
      --_h: 8px;
    }
    :host([size='sm']) { --_h: 4px; }
    [hidden] { display: none !important; }

    /* Fills lean 30% toward the text colour so they keep 3:1 against the track in both themes. */
    .neutral { --_c: var(--ht-text-muted); }
    .accent { --_c: color-mix(in oklab, var(--ht-accent) 70%, var(--ht-text)); }
    .success { --_c: color-mix(in oklab, var(--ht-success) 70%, var(--ht-text)); }
    .warning { --_c: color-mix(in oklab, var(--ht-warning) 70%, var(--ht-text)); }
    .danger { --_c: color-mix(in oklab, var(--ht-danger) 70%, var(--ht-text)); }
    .info { --_c: color-mix(in oklab, var(--ht-info) 70%, var(--ht-text)); }

    .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .value {
      margin-inline-start: auto;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-subtle);
    }
    .value.over { color: var(--ht-danger-text); }

    /* The mark sits outside the clipped track so it can stand 3px above and below it. */
    .bar { position: relative; }
    .track {
      display: flex;
      box-sizing: border-box;
      height: var(--_h);
      overflow: hidden;
      background: var(--ht-surface-sunken);
      border-radius: var(--ht-radius-sm);
    }
    .track.room {
      background:
        repeating-linear-gradient(135deg, var(--ht-border-strong) 0 1px, transparent 1px 4px),
        var(--ht-surface-sunken);
    }
    .fill {
      flex: none;
      height: 100%;
      background: var(--_c);
    }
    .mark {
      position: absolute;
      top: -3px;
      bottom: -3px;
      width: 2px;
      margin-inline-start: -1px;
      background: var(--ht-text);
      border-radius: var(--ht-radius-sm);
    }
    @media (prefers-reduced-motion: no-preference) {
      .fill { transition: width var(--ht-duration) var(--ht-ease); }
      .mark { transition: inset-inline-start var(--ht-duration) var(--ht-ease); }
    }

    .legend {
      list-style: none;
      margin: 16px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    .legend li {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 28px;
      border-bottom: 1px solid var(--ht-border);
      font: 400 0.75rem/1.2 var(--ht-font-ui);
      color: var(--ht-text-muted);
    }
    .legend li:last-child { border-bottom: 0; }
    .dot {
      flex: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--_c);
    }
    .count {
      margin-inline-start: auto;
      font: 400 0.75rem/1.2 var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text);
    }
  `;

  /** The `ht-meter-part` children, read fresh on each render. */
  #parts(): PartData[] {
    return Array.from(this.querySelectorAll(':scope > ht-meter-part'), (el) => {
      const raw = el instanceof HtMeterPart ? el.value : Number(el.getAttribute('value'));
      const tone = (el instanceof HtMeterPart ? el.tone : el.getAttribute('tone')) as Tone;
      const label = (el instanceof HtMeterPart ? el.label : el.getAttribute('label')) ?? '';
      return {
        value: Number.isFinite(raw) && raw > 0 ? raw : 0,
        tone: TONES.includes(tone) ? tone : 'neutral',
        label,
      };
    });
  }

  #onSlotChange = () => this.requestUpdate();

  render() {
    const parts = this.#parts();
    const shown = parts.filter((p) => p.value > 0);
    const sum = shown.reduce((n, p) => n + p.value, 0);
    const max = Number.isFinite(this.max) && (this.max as number) > 0 ? (this.max as number) : 0;
    const over = max > 0 && sum > max;
    const scale = max > 0 && !over ? max : sum;
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

    const list = shown.map((p) => `${fmt(p.value)} ${p.label.toLocaleLowerCase()}`.trim()).join(', ');
    let generated = list;
    if (max > 0) {
      const head = over ? `${fmt(sum)} of ${fmt(max)}, over by ${fmt(sum - max)}` : `${fmt(sum)} of ${fmt(max)}`;
      generated = list ? `${head}: ${list}` : head;
    }
    const custom = this.summary != null && this.summary !== '';
    const summary = custom ? (this.summary as string) : generated || 'Empty';
    const name = [this.label || this.#ariaLabel, summary].filter(Boolean).join(', ');

    return html`
      <div hidden><slot @slotchange=${this.#onSlotChange}></slot></div>
      ${this.label
        ? html`<div part="header" class="header" aria-hidden="true">
            <span part="label">${this.label}</span>
            ${max > 0
              ? html`<span part="value" class="value ${over ? 'over' : ''}"
                  >${over ? `Over by ${fmt(sum - max)}` : `${fmt(sum)} of ${fmt(max)}`}</span
                >`
              : nothing}
          </div>`
        : nothing}
      <div class="bar">
        <div part="track" class="track ${max > 0 && sum < max ? 'room' : ''}" role="img" aria-label=${name}>
          ${scale > 0
            ? shown.map(
                (p) => html`<span part="fill" class="fill ${p.tone}" style="width:${(p.value / scale) * 100}%"></span>`,
              )
            : nothing}
        </div>
        ${over
          ? html`<i part="mark" class="mark" aria-hidden="true" style="inset-inline-start:${(max / sum) * 100}%"></i>`
          : nothing}
      </div>
      ${this.legend && parts.length
        ? html`<ul part="legend" class="legend" aria-hidden=${ifDefined(custom ? undefined : 'true')}>
            ${parts.map(
              (p) => html`<li class=${p.tone}><i class="dot"></i><span>${p.label}</span><span class="count">${fmt(p.value)}</span></li>`,
            )}
          </ul>`
        : nothing}
    `;
  }
}

if (!customElements.get('ht-meter-part')) customElements.define('ht-meter-part', HtMeterPart);
if (!customElements.get('ht-meter')) customElements.define('ht-meter', HtMeter);

declare global {
  interface HTMLElementTagNameMap {
    'ht-meter': HtMeter;
    'ht-meter-part': HtMeterPart;
  }
}
