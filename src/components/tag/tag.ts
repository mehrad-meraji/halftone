import { LitElement, css, html } from 'lit';

/**
 * Small outlined label for status, counts and metadata. 1px border and text share one
 * colour, with a transparent fill (after PostHog's `LemonTag`).
 *
 * @tag ht-tag
 * @summary Status or metadata tag.
 *
 * @slot - Tag text.
 * @slot prefix - Icon or dot before the text.
 *
 * @csspart base - The tag box.
 */
export class HtTag extends LitElement {
  static properties = {
    /** Colour. `neutral` is the default. */
    tone: { reflect: true },
    /** Height: sm 16px with 10px text, md 20px with 12px text. */
    size: { reflect: true },
  };

  declare tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  declare size: 'sm' | 'md';

  constructor() {
    super();
    this.tone = 'neutral';
    this.size = 'sm';
  }

  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      --_c: var(--ht-text-muted);
      --_h: 1rem;
      --_fs: 0.625rem;
      --_lh: 0.875rem;
      --_px: 3px;
    }
    :host([size='md']) { --_h: 1.25rem; --_fs: 0.75rem; --_lh: 1rem; --_px: 5px; }
    :host([tone='accent']) { --_c: var(--ht-accent-text); }
    :host([tone='success']) { --_c: color-mix(in oklch, var(--ht-success) 80%, black); }
    :host([tone='warning']) { --_c: color-mix(in oklch, var(--ht-warning) 55%, black); }
    :host([tone='danger']) { --_c: var(--ht-danger-text); }
    :host([tone='info']) { --_c: color-mix(in oklch, var(--ht-info) 85%, black); }
    .tag {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: var(--_h);
      padding-inline: var(--_px);
      font: 500 var(--_fs) / var(--_lh) var(--ht-font-ui);
      white-space: nowrap;
      color: var(--_c);
      border: 1px solid var(--_c);
      border-radius: var(--ht-radius-md);
    }
  `;

  render() {
    return html`<span part="base" class="tag"><slot name="prefix"></slot><slot></slot></span>`;
  }
}

if (!customElements.get('ht-tag')) customElements.define('ht-tag', HtTag);

declare global {
  interface HTMLElementTagNameMap {
    'ht-tag': HtTag;
  }
}
