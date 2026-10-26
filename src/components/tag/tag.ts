import { LitElement, css, html } from 'lit';

/**
 * Small raised chip for status, counts and metadata. A soft gradient fill, inner glow and a
 * two-layer shadow underneath; tones tint the fill and colour the text.
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
      /* On the host, so a font-family set on the element (a mono ID, say) wins. */
      font-family: var(--ht-font-ui);
      /* --_c is the text colour. --_t is the raw tone colour and --_mix how much of it tints the fill (neutral stays plain surface). */
      --_c: var(--ht-text);
      --_mix: 0%;
      --_bg: color-mix(in oklab, var(--_t, transparent) var(--_mix), var(--ht-surface));
      --_h: 1rem;
      --_fs: 0.625rem;
      --_lh: 0.875rem;
      --_px: 6px;
      --_icon: 12px;
    }
    :host([size='md']) { --_h: 1.25rem; --_fs: 0.75rem; --_lh: 1rem; --_px: 8px; --_icon: 14px; }
    ::slotted(ht-icon:not([size])), ::slotted(svg) { flex: none; width: var(--_icon); height: var(--_icon); }
    :host([tone='accent']) { --_c: var(--ht-accent-text); --_t: var(--ht-accent); --_mix: 12%; }
    :host([tone='success']) { --_c: color-mix(in oklab, var(--ht-success) 50%, var(--ht-text)); --_t: var(--ht-success); --_mix: 14%; }
    :host([tone='warning']) { --_c: color-mix(in oklab, var(--ht-warning) 55%, var(--ht-text)); --_t: var(--ht-warning); --_mix: 16%; }
    :host([tone='danger']) { --_c: var(--ht-danger-text); --_t: var(--ht-danger); --_mix: 12%; }
    :host([tone='info']) { --_c: color-mix(in oklab, var(--ht-info) 50%, var(--ht-text)); --_t: var(--ht-info); --_mix: 12%; }
    /*
     * A soft, raised chip: a fill that brightens toward the top, a faint inner glow and rim,
     * a dark crescent just under the bottom edge, and a wide soft shadow below that.
     */
    .tag {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      height: var(--_h);
      padding-inline: var(--_px);
      font-family: inherit;
      font-weight: 500;
      font-size: var(--_fs);
      line-height: var(--_lh);
      white-space: nowrap;
      color: var(--_c);
      border-radius: var(--ht-radius-md);
      background: linear-gradient(
        180deg,
        color-mix(in oklab, var(--_bg), white 8%) 0%,
        var(--_bg) 55%,
        color-mix(in oklab, var(--_bg), var(--ht-text) 2%) 100%
      );
      box-shadow:
        inset 0 1px 0 color-mix(in oklab, var(--_bg), white 55%),
        inset 0 0 0 1px color-mix(in oklab, var(--ht-text) 4%, transparent),
        inset 0 0 4px color-mix(in oklab, black 3.5%, transparent),
        inset 0 -1px 2px color-mix(in oklab, black 3%, transparent),
        0 1px 1px color-mix(in oklab, black 11%, transparent),
        0 2px 4px color-mix(in oklab, black 5%, transparent);
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
