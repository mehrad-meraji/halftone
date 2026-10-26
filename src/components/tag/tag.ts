import { LitElement, css, html, nothing } from 'lit';

/**
 * Small raised chip for status, counts and metadata. A soft gradient fill, inner glow and a
 * two-layer shadow underneath; tones tint the fill and colour the text.
 *
 * `dot` adds a tone-coloured status dot before the text. `shrink` lets the tag get narrower than
 * its text when space runs out: the text is cut with an ellipsis until only the dot (or the prefix
 * icon) is left. The text stays in the accessible name.
 *
 * `interactive` makes the tag a button, so a status tag can open a menu: put it in the `trigger`
 * slot of an `ht-menu`, which sets `aria-haspopup` and `aria-expanded` on it. The host takes
 * `role="button"` and a tab stop, shows a hover tint and a focus ring, and Enter or Space clicks
 * it. Without `ht-menu`, set `aria-haspopup` yourself if it opens something.
 *
 * @tag ht-tag
 * @summary Status or metadata tag.
 *
 * @slot - Tag text.
 * @slot prefix - Icon or dot before the text.
 *
 * @csspart base - The tag box.
 * @csspart dot - The status dot. Only with `dot`.
 * @csspart label - The wrapper of the text, which carries the ellipsis.
 */
export class HtTag extends LitElement {
  static properties = {
    /** Colour. `neutral` is the default. */
    tone: { reflect: true },
    /** Height: sm 16px with 10px text, md 20px with 12px text. */
    size: { reflect: true },
    /** Shows a status dot in the tone colour before the text. */
    dot: { type: Boolean, reflect: true },
    /** Lets the tag shrink below its text: the text is cut with an ellipsis until only the dot or prefix is left. */
    shrink: { type: Boolean, reflect: true },
    /** Makes the tag a button (`role="button"`, a tab stop, hover and focus styles), such as the trigger of a status menu. */
    interactive: { type: Boolean, reflect: true },
  };

  declare tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  declare size: 'sm' | 'md';
  declare dot: boolean;
  declare shrink: boolean;
  declare interactive: boolean;

  /** The role and tab stop this element added, so they come off again when `interactive` does. */
  #ownRole = false;
  #ownTabindex = false;

  constructor() {
    super();
    this.tone = 'neutral';
    this.size = 'sm';
    this.dot = false;
    this.shrink = false;
    this.interactive = false;
    this.addEventListener('keydown', (e) => {
      if (!this.interactive || e.target !== this) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        this.click();
      } else if (e.key === ' ') {
        // Like a native button: Space clicks on release, and does not scroll the page.
        e.preventDefault();
      }
    });
    this.addEventListener('keyup', (e) => {
      if (this.interactive && e.target === this && e.key === ' ') this.click();
    });
  }

  willUpdate(changed: Map<string, unknown>) {
    if (!changed.has('interactive')) return;
    if (this.interactive) {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'button');
        this.#ownRole = true;
      }
      if (!this.hasAttribute('tabindex')) {
        this.tabIndex = 0;
        this.#ownTabindex = true;
      }
    } else {
      if (this.#ownRole) this.removeAttribute('role');
      if (this.#ownTabindex) this.removeAttribute('tabindex');
      this.#ownRole = this.#ownTabindex = false;
    }
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
      /* Width of what stays when the tag shrinks: the prefix icon, or the dot. */
      --_lead: var(--_icon);
    }
    :host([dot]) { --_lead: 6px; }
    :host([size='md']) { --_h: 1.25rem; --_fs: 0.75rem; --_lh: 1rem; --_px: 8px; --_icon: 14px; }
    ::slotted(ht-icon:not([size])), ::slotted(svg) { flex: none; width: var(--_icon); height: var(--_icon); }
    :host([tone='accent']) { --_c: var(--ht-accent-text); --_t: var(--ht-accent); --_mix: 12%; }
    :host([tone='success']) { --_c: color-mix(in oklab, var(--ht-success) 50%, var(--ht-text)); --_t: var(--ht-success); --_mix: 14%; }
    :host([tone='warning']) { --_c: color-mix(in oklab, var(--ht-warning) 55%, var(--ht-text)); --_t: var(--ht-warning); --_mix: 16%; }
    :host([tone='danger']) { --_c: var(--ht-danger-text); --_t: var(--ht-danger); --_mix: 12%; }
    :host([tone='info']) { --_c: color-mix(in oklab, var(--ht-info) 50%, var(--ht-text)); --_t: var(--ht-info); --_mix: 12%; }
    /* The dot leans 30% toward the text colour, like ht-meter's fills, so it keeps 3:1 on the fill. */
    .dot {
      flex: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: color-mix(in oklab, var(--_t, var(--ht-text-muted)) 70%, var(--ht-text));
    }
    :host(:not([tone])) .dot,
    :host([tone='neutral']) .dot { background: var(--ht-text-muted); }
    .label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    :host([shrink]) {
      max-width: 100%;
      min-width: calc(var(--_px) * 2 + var(--_lead));
    }
    :host([shrink]) .tag { display: flex; max-width: 100%; }
    /* Interactive: a hover tint over the fill, and the 2px focus ring. */
    :host([interactive]) { cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; }
    :host([interactive]:hover) .tag,
    :host([interactive][aria-expanded='true']) .tag {
      --_bg: color-mix(in oklab, var(--_t, var(--ht-text)) calc(var(--_mix) + 6%), var(--ht-surface));
    }
    :host([interactive]:focus-visible) .tag { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    @media (forced-colors: active) {
      :host([interactive]) .tag { border: 1px solid ButtonText; }
      .dot { background: CanvasText; }
    }
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
    return html`<span part="base" class="tag"
      >${this.dot ? html`<i part="dot" class="dot" aria-hidden="true"></i>` : nothing}<slot name="prefix"></slot
      ><span part="label" class="label"><slot></slot></span
    ></span>`;
  }
}

if (!customElements.get('ht-tag')) customElements.define('ht-tag', HtTag);

declare global {
  interface HTMLElementTagNameMap {
    'ht-tag': HtTag;
  }
}
