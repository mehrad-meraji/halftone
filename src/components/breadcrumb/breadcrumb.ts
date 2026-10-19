import { LitElement, css, html, nothing, svg } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/** Phosphor `caret-right`, bold. */
const CARET = svg`<path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>`;
/** Phosphor `dots-three`, bold. */
const DOTS = svg`<path d="M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z"/>`;

const sep = (kind: string) =>
  kind === 'caret'
    ? html`<span class="sep" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">${CARET}</svg></span>`
    : html`<span class="sep" aria-hidden="true">/</span>`;

/**
 * Trail of links showing where the current page sits. Put `ht-breadcrumb-item` children in it, in
 * order. The last item is the current page and gets `aria-current="page"`. Set `max-items` to
 * collapse the middle of a long trail into an ellipsis button that reveals it.
 *
 * Renders a `<nav>` landmark containing an ordered list.
 *
 * @tag ht-breadcrumb
 * @summary Breadcrumb trail.
 *
 * @slot - `ht-breadcrumb-item` elements. They are placed into the list automatically.
 *
 * @csspart nav - The `<nav>` landmark.
 * @csspart list - The `<ol>`.
 * @csspart ellipsis - The button that expands a collapsed trail.
 *
 * @fires ht-expand - The ellipsis button was used to reveal the collapsed items.
 */
export class HtBreadcrumb extends LitElement {
  static properties = {
    /** Accessible name of the nav landmark. */
    label: {},
    /** Glyph between items: `slash` or `caret`. */
    separator: { reflect: true },
    /**
     * Most items to show at once, not counting the ellipsis. The first item and the last `max-items - 1`
     * stay; the middle collapses. 0 shows everything. Values under 2 count as 2.
     */
    maxItems: { type: Number, attribute: 'max-items' },
    _expanded: { state: true },
    _hidden: { state: true },
  };

  declare label: string;
  declare separator: 'slash' | 'caret';
  declare maxItems: number;
  declare _expanded: boolean;
  declare _hidden: number;

  constructor() {
    super();
    this.label = 'Breadcrumb';
    this.separator = 'slash';
    this.maxItems = 0;
    this._expanded = false;
    this._hidden = 0;
  }

  static styles = css`
    :host { display: block; }
    ol {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li.ellipsis { display: inline-flex; align-items: center; gap: 4px; }
    button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-sm);
      cursor: pointer;
      transition: background var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease);
    }
    button:hover { color: var(--ht-text); background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    button:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    .sep {
      display: inline-flex;
      align-items: center;
      font: 400 0.8125rem/1.5 var(--ht-font-ui);
      color: var(--ht-text-subtle);
    }
    @media (prefers-reduced-motion: reduce) {
      button { transition: none; }
    }
  `;

  #items() {
    return [...this.children].filter((c): c is HtBreadcrumbItem => c.localName === 'ht-breadcrumb-item');
  }

  #sync = () => {
    const items = this.#items();
    const max = this.maxItems > 0 ? Math.max(2, this.maxItems) : 0;
    const collapse = !this._expanded && max > 0 && items.length > max;
    // Items in the named slots sit around the ellipsis; the unnamed slot holds a trail that shows in full.
    // A middle item in `hidden` has no matching slot, so it is simply not rendered.
    const tail = max - 1;
    items.forEach((item, i) => {
      const slot = !collapse ? '' : i === 0 ? 'start' : i >= items.length - tail ? 'end' : 'hidden';
      if ((item.getAttribute('slot') ?? '') !== slot) {
        if (slot) item.setAttribute('slot', slot);
        else item.removeAttribute('slot');
      }
      item._separator = this.separator;
      item._last = i === items.length - 1;
    });
    this._hidden = collapse ? items.length - 1 - tail : 0;
  };

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('maxItems') || changed.has('separator') || changed.has('_expanded')) this.#sync();
  }

  #expand = () => {
    const revealed = this.#items().filter((i) => i.getAttribute('slot') === 'hidden');
    this._expanded = true;
    this.#sync();
    this.dispatchEvent(new CustomEvent('ht-expand', { bubbles: true, composed: true }));
    // The button is about to disappear; put focus on the first revealed item.
    this.updateComplete.then(() => revealed[0]?.focus());
  };

  render() {
    return html`
      <nav part="nav" aria-label=${ifDefined(this.label || undefined)}>
        <ol part="list">
          <slot name="start"></slot>
          ${this._hidden > 0
            ? html`<li class="ellipsis">
                <button
                  part="ellipsis"
                  type="button"
                  aria-label="Show ${this._hidden} Hidden ${this._hidden === 1 ? 'Level' : 'Levels'}"
                  @click=${this.#expand}
                >
                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${DOTS}</svg>
                </button>
                ${sep(this.separator)}
              </li>`
            : nothing}
          <slot name="end"></slot>
          <slot @slotchange=${this.#sync}></slot>
        </ol>
      </nav>
    `;
  }
}

/**
 * One step in an `ht-breadcrumb`. With `href` it is a link; without, plain text. The last item in
 * the trail is the current page, and gets `aria-current="page"` whether or not it has an `href`.
 *
 * @tag ht-breadcrumb-item
 * @summary Breadcrumb step.
 *
 * @slot - Item text.
 *
 * @csspart link - The `<a>` (or `<span>` without `href`).
 */
export class HtBreadcrumbItem extends LitElement {
  static properties = {
    /** Link target. Leave empty for a step that is not a link. */
    href: {},
    /** @internal Set by the parent. */
    _separator: { state: true },
    /** @internal Set by the parent. */
    _last: { state: true },
  };

  declare href: string;
  /** @internal */
  declare _separator: 'slash' | 'caret';
  /** @internal */
  declare _last: boolean;

  constructor() {
    super();
    this.href = '';
    this._separator = 'slash';
    this._last = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // The parent's list is slotted, so the item itself is the list item.
    this.setAttribute('role', 'listitem');
  }

  static styles = css`
    :host { display: inline-flex; align-items: center; gap: 4px; }
    :host([hidden]) { display: none; }
    :host(:focus-visible) { outline: 2px solid var(--ht-focus); outline-offset: 1px; border-radius: var(--ht-radius-sm); }
    .link {
      display: inline-flex;
      align-items: center;
      height: 1.5rem;
      padding-inline: 4px;
      font: 400 0.8125rem/1.5 var(--ht-font-ui);
      color: var(--ht-text-muted);
      text-decoration: none;
      border-radius: var(--ht-radius-sm);
      transition: color var(--ht-duration) var(--ht-ease);
    }
    a.link:hover { color: var(--ht-text); text-decoration: underline; text-underline-offset: 3px; }
    a.link:focus-visible, .link:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    .link[aria-current='page'] { color: var(--ht-text); font-weight: 500; }
    .sep {
      display: inline-flex;
      align-items: center;
      font: 400 0.8125rem/1.5 var(--ht-font-ui);
      color: var(--ht-text-subtle);
    }
    @media (prefers-reduced-motion: reduce) {
      .link { transition: none; }
    }
  `;

  /** Moves focus to the link, or to the item itself when it is not a link. */
  focus(options?: FocusOptions) {
    const a = this.renderRoot?.querySelector<HTMLElement>('a');
    if (a) a.focus(options);
    else {
      this.tabIndex = -1;
      super.focus(options);
    }
  }

  render() {
    const current = this._last ? 'page' : undefined;
    return html`${this.href
        ? html`<a part="link" class="link" href=${this.href} aria-current=${ifDefined(current)}><slot></slot></a>`
        : html`<span part="link" class="link" aria-current=${ifDefined(current)}><slot></slot></span>`}${this._last
        ? nothing
        : sep(this._separator)}`;
  }
}

if (!customElements.get('ht-breadcrumb-item')) customElements.define('ht-breadcrumb-item', HtBreadcrumbItem);
if (!customElements.get('ht-breadcrumb')) customElements.define('ht-breadcrumb', HtBreadcrumb);

declare global {
  interface HTMLElementTagNameMap {
    'ht-breadcrumb': HtBreadcrumb;
    'ht-breadcrumb-item': HtBreadcrumbItem;
  }
}
