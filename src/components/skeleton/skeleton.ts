import { LitElement, css, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

/** A bare number is pixels; anything else is passed through as a CSS length. */
const length = (v: string) => (/^\d+(\.\d+)?$/.test(v.trim()) ? `${v.trim()}px` : v.trim());

/**
 * Placeholder block for content that is still loading. It carries no meaning, so it is hidden from
 * assistive technology: mark the loading region with `aria-busy="true"` and announce the state in
 * text instead (see the Loading story).
 *
 * @tag ht-skeleton
 * @summary Loading placeholder.
 *
 * @csspart base - The placeholder shape. With `lines`, the wrapper around the lines.
 * @csspart line - One line of a multi-line text skeleton.
 *
 * @cssprop [--ht-skeleton-lines-gap=8px] - Space between lines of a multi-line text skeleton.
 */
export class HtSkeleton extends LitElement {
  static properties = {
    /** `text` is a single line of type, `rect` a block, `circle` a round avatar-sized dot. */
    variant: { reflect: true },
    /** CSS length. A bare number is pixels. Defaults: `100%` for text and rect, `40px` for circle. */
    width: {},
    /** CSS length. A bare number is pixels. Defaults: one text line for text, `4rem` for rect, the width for circle. */
    height: {},
    /** Number of text lines. The last of several lines is shorter. Only for `variant="text"`. */
    lines: { type: Number },
  };

  declare variant: 'text' | 'rect' | 'circle';
  declare width: string;
  declare height: string;
  declare lines: number;

  constructor() {
    super();
    this.variant = 'text';
    this.width = '';
    this.height = '';
    this.lines = 1;
  }

  static styles = css`
    :host {
      display: block;
      --_base: color-mix(in oklab, var(--ht-text) 8%, transparent);
      --_glow: color-mix(in oklab, var(--ht-text) 15%, transparent);
    }
    :host([variant='circle']) { display: inline-block; vertical-align: middle; }
    :host([hidden]) { display: none; }
    .shape {
      box-sizing: border-box;
      background: linear-gradient(90deg, var(--_base) 0%, var(--_glow) 50%, var(--_base) 100%) 0 0 / 200% 100%;
      border-radius: var(--ht-radius-md);
    }
    .text { height: 0.875rem; border-radius: var(--ht-radius-sm); }
    .circle { border-radius: 50%; }
    .stack { display: flex; flex-direction: column; gap: var(--ht-skeleton-lines-gap, 8px); }
    @media (prefers-reduced-motion: no-preference) {
      .shape { animation: shimmer 1.6s linear infinite; }
    }
    /* No motion: a flat tint, no moving highlight. */
    @media (prefers-reduced-motion: reduce) {
      .shape { background: var(--_base); }
    }
    @keyframes shimmer {
      from { background-position: 100% 0; }
      to { background-position: -100% 0; }
    }
  `;

  render() {
    const v = this.variant;
    const w = this.width ? length(this.width) : v === 'circle' ? '40px' : '100%';
    const h = this.height ? length(this.height) : v === 'circle' ? w : v === 'rect' ? '4rem' : '';
    if (v === 'text' && this.lines > 1) {
      const n = Math.floor(this.lines);
      return html`<div part="base" class="stack" aria-hidden="true" style=${styleMap({ width: w })}>
        ${Array.from({ length: n }, (_, i) => html`<div
          part="line"
          class="shape text"
          style=${styleMap({ width: i === n - 1 ? '60%' : '100%', height: h })}
        ></div>`)}
      </div>`;
    }
    return html`<div
      part="base"
      class="shape ${v}"
      aria-hidden="true"
      style=${styleMap({ width: w, height: h })}
    ></div>`;
  }
}

if (!customElements.get('ht-skeleton')) customElements.define('ht-skeleton', HtSkeleton);

declare global {
  interface HTMLElementTagNameMap {
    'ht-skeleton': HtSkeleton;
  }
}
