import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

let uid = 0;

/**
 * Horizontal progress bar for work with a known length, or `indeterminate` for work without one.
 * A flat track with a tone-coloured fill that grows with the value.
 *
 * Give it a visible `label`, or set `aria-label` on the element (it is forwarded to the
 * progressbar). Without either, the bar has no name and a screen reader only says "progress bar".
 *
 * @tag ht-progress
 * @summary Progress bar.
 *
 * @csspart header - The row holding the label and value.
 * @csspart label - The visible label.
 * @csspart value - The value text shown by `show-value`.
 * @csspart track - The progressbar element.
 * @csspart fill - The filled part of the track.
 */
export class HtProgress extends LitElement {
  static properties = {
    /** Current amount, from 0 to `max`. Ignored when `indeterminate`. */
    value: { type: Number },
    /** Amount that counts as complete. */
    max: { type: Number },
    /** Work of unknown length. Draws a moving bar and omits `aria-valuenow`. Static stripes under reduced motion. */
    indeterminate: { type: Boolean, reflect: true },
    /** Visible label above the bar. Also names the progressbar. */
    label: {},
    /** Fill colour. `accent` is the default. */
    tone: { reflect: true },
    /** Track height: sm 4px, md 8px. */
    size: { reflect: true },
    /** Shows the percentage to the right of the label. Hidden while `indeterminate`. */
    showValue: { type: Boolean, attribute: 'show-value', reflect: true },
  };

  declare value: number;
  declare max: number;
  declare indeterminate: boolean;
  declare label: string;
  declare tone: 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  declare size: 'sm' | 'md';
  declare showValue: boolean;

  #id = `ht-progress-${++uid}`;
  #ariaLabel: string | undefined;

  constructor() {
    super();
    this.value = 0;
    this.max = 100;
    this.indeterminate = false;
    this.label = '';
    this.tone = 'accent';
    this.size = 'md';
    this.showValue = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // `aria-label` is not allowed on a generic host; move it to the progressbar.
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
      --_c: color-mix(in oklab, var(--ht-accent) 70%, var(--ht-text));
      --_h: 8px;
    }
    :host([size='sm']) { --_h: 4px; }
    /* Fills lean 30% toward the text colour so they keep 3:1 against the track in both themes. */
    :host([tone='neutral']) { --_c: var(--ht-text-muted); }
    :host([tone='success']) { --_c: color-mix(in oklab, var(--ht-success) 70%, var(--ht-text)); }
    :host([tone='warning']) { --_c: color-mix(in oklab, var(--ht-warning) 70%, var(--ht-text)); }
    :host([tone='danger']) { --_c: color-mix(in oklab, var(--ht-danger) 70%, var(--ht-text)); }
    :host([tone='info']) { --_c: color-mix(in oklab, var(--ht-info) 70%, var(--ht-text)); }
    .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .value {
      margin-inline-start: auto;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-muted);
    }
    .track {
      position: relative;
      box-sizing: border-box;
      height: var(--_h);
      overflow: hidden;
      background: color-mix(in oklab, var(--ht-text) 10%, transparent);
      border-radius: var(--ht-radius-sm);
    }
    .fill {
      height: 100%;
      background: var(--_c);
      border-radius: inherit;
    }
    .fill.indeterminate {
      width: 40%;
      animation: slide 1.4s var(--ht-ease) infinite;
    }
    @keyframes slide {
      from { transform: translateX(-100%); }
      to { transform: translateX(250%); }
    }
    :host(:dir(rtl)) .fill.indeterminate { animation-name: slide-rtl; }
    @keyframes slide-rtl {
      from { transform: translateX(100%); }
      to { transform: translateX(-250%); }
    }
    @media (prefers-reduced-motion: no-preference) {
      .fill:not(.indeterminate) { transition: width var(--ht-duration) var(--ht-ease); }
    }
    /* No motion: stripes across the whole track tell "unknown length" apart from a full bar. */
    @media (prefers-reduced-motion: reduce) {
      .fill.indeterminate {
        width: 100%;
        animation: none;
        background: repeating-linear-gradient(90deg, var(--_c) 0 6px, transparent 6px 12px);
      }
    }
  `;

  render() {
    const max = this.max > 0 ? this.max : 100;
    const value = Math.min(Math.max(Number.isFinite(this.value) ? this.value : 0, 0), max);
    const pct = (value / max) * 100;
    const indeterminate = this.indeterminate;
    const labelled = !!this.label;
    return html`
      ${labelled || (this.showValue && !indeterminate)
        ? html`<div part="header" class="header">
            ${labelled ? html`<span id=${this.#id} part="label">${this.label}</span>` : nothing}
            ${this.showValue && !indeterminate
              ? html`<span part="value" class="value" aria-hidden="true">${Math.round(pct)}%</span>`
              : nothing}
          </div>`
        : nothing}
      <div
        part="track"
        class="track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax=${max}
        aria-valuenow=${ifDefined(indeterminate ? undefined : value)}
        aria-valuetext=${ifDefined(indeterminate ? undefined : `${Math.round(pct)}%`)}
        aria-labelledby=${ifDefined(labelled ? this.#id : undefined)}
        aria-label=${ifDefined(labelled ? undefined : this.#ariaLabel)}
      >
        <div part="fill" class="fill ${indeterminate ? 'indeterminate' : ''}" style=${ifDefined(indeterminate ? undefined : `width:${pct}%`)}></div>
      </div>
    `;
  }
}

if (!customElements.get('ht-progress')) customElements.define('ht-progress', HtProgress);

declare global {
  interface HTMLElementTagNameMap {
    'ht-progress': HtProgress;
  }
}
