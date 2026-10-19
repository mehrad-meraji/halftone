import { LitElement, css, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

/**
 * Text with a band of light that sweeps across it, for a line that says something is in progress,
 * such as "Thinking…". The text stays real, selectable text in the default slot. The effect is only
 * a gradient painted through the letters, so it adds nothing for assistive technology: announce the
 * state yourself, for example in a `role="status"` region.
 *
 * With reduced motion, or in forced-colors mode, the text is plain and still.
 *
 * @tag ht-shimmer
 * @summary Text with a sweeping highlight.
 *
 * @slot - The text.
 *
 * @csspart text - The element that carries the gradient.
 */
export class HtShimmer extends LitElement {
  static properties = {
    /** Seconds for one sweep. */
    duration: { type: Number },
  };

  declare duration: number;

  constructor() {
    super();
    this.duration = 2;
  }

  static styles = css`
    :host {
      display: inline;
      --_base: var(--ht-text-muted);
      --_light: var(--ht-text);
    }
    :host([hidden]) { display: none; }
    .text {
      color: transparent;
      background: linear-gradient(100deg, var(--_base) 40%, var(--_light) 50%, var(--_base) 60%) 100% 0 / 300% 100% no-repeat;
      -webkit-background-clip: text;
      background-clip: text;
    }
    @media (prefers-reduced-motion: no-preference) {
      .text { animation: sweep var(--_dur, 2s) linear infinite; }
    }
    /* No motion: plain text in the base colour. */
    @media (prefers-reduced-motion: reduce) {
      .text { background: none; color: var(--_base); }
    }
    /* Forced colours drop backgrounds, so transparent text would vanish. */
    @media (forced-colors: active) {
      .text { background: none; color: CanvasText; animation: none; }
    }
    @keyframes sweep {
      to { background-position: 0 0; }
    }
  `;

  render() {
    const dur = this.duration > 0 ? this.duration : 2;
    return html`<span part="text" class="text" style=${styleMap({ '--_dur': `${dur}s` })}><slot></slot></span>`;
  }
}

if (!customElements.get('ht-shimmer')) customElements.define('ht-shimmer', HtShimmer);

declare global {
  interface HTMLElementTagNameMap {
    'ht-shimmer': HtShimmer;
  }
}
