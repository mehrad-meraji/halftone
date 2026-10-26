import { LitElement, css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Sidebar row: a 30px ghost button with an icon, label and optional trailing content.
 * The current page gets a faint fill (after PostHog's sidebar items). Renders a link
 * when `href` is set.
 *
 * @tag ht-nav-item
 * @summary Navigation row.
 *
 * @slot - Label.
 * @slot prefix - Icon before the label.
 * @slot suffix - Trailing content such as a count or `ht-tag`.
 *
 * @csspart base - The inner `<a>` or `<button>`.
 */
export class HtNavItem extends LitElement {
  static properties = {
    /** Makes the row a link. */
    href: {},
    /** Marks the current page. Sets `aria-current="page"`. */
    active: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare href: string;
  declare active: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.href = '';
    this.active = false;
    this.disabled = false;
  }

  static styles = css`
    :host { display: block; }
    :host([disabled]) { opacity: 0.5; }
    .item {
      all: unset;
      box-sizing: border-box;
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      height: 30px;
      padding-block: 4px;
      padding-inline: 10px 6px;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: var(--ht-radius-md);
      transition: background-color 120ms;
    }
    .item:hover { background: color-mix(in oklch, var(--ht-text) 7.5%, transparent); }
    .item:active { background: color-mix(in oklch, var(--ht-text) 5%, transparent); }
    :host([active]) .item { background: color-mix(in oklch, var(--ht-text) 5%, transparent); font-weight: 500; }
    /* The selected-item pip: a short accent bar at the start of the row. Mixed toward the text so it keeps 3:1 in dark mode. */
    .item::before {
      content: '';
      position: absolute;
      inset-inline-start: 2px;
      top: 50%;
      width: 3px;
      height: 14px;
      margin-top: -7px;
      border-radius: var(--ht-radius-sm);
      background: color-mix(in oklab, var(--ht-accent) 80%, var(--ht-text));
      opacity: 0;
      transition: opacity var(--ht-duration) var(--ht-ease);
    }
    :host([active]) .item::before { opacity: 1; }
    @media (forced-colors: active) {
      .item::before { background: Highlight; forced-color-adjust: none; }
    }
    .item:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -1px; }
    .label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    ::slotted([slot='prefix']) { flex: none; width: 16px; height: 16px; }
  `;

  render() {
    const body = html`<slot name="prefix"></slot><span class="label"><slot></slot></span><slot name="suffix"></slot>`;
    const current = this.active ? 'page' : undefined;
    if (this.href && !this.disabled) {
      return html`<a part="base" class="item" href=${this.href} aria-current=${ifDefined(current)}>${body}</a>`;
    }
    return html`<button part="base" class="item" type="button" ?disabled=${this.disabled} aria-current=${ifDefined(current)}>${body}</button>`;
  }
}

if (!customElements.get('ht-nav-item')) customElements.define('ht-nav-item', HtNavItem);

declare global {
  interface HTMLElementTagNameMap {
    'ht-nav-item': HtNavItem;
  }
}
