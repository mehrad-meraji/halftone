import { LitElement, css, html } from 'lit';

/**
 * A stack of headers that each show or hide a panel: FAQs, settings groups, long forms. Follows
 * the WAI-ARIA accordion pattern. Each header is a button inside a heading; Up and Down move
 * between headers, Home and End jump to the first and last, and Enter or Space toggles.
 *
 * By default one item is open at a time. Set `multiple` to let any number stay open.
 *
 * @tag ht-accordion
 * @summary Stack of collapsible sections.
 *
 * @slot - `ht-accordion-item` elements.
 *
 * @fires change - An item was opened or closed by the user. The event target is the item; read its `open`.
 */
export class HtAccordion extends LitElement {
  static properties = {
    /** Lets any number of items stay open. Without it, opening one closes the others. */
    multiple: { type: Boolean, reflect: true },
  };

  declare multiple: boolean;

  constructor() {
    super();
    this.multiple = false;
    this.addEventListener('change', (e) => {
      const item = e.target;
      if (item instanceof HtAccordionItem && item.open) this.#closeOthers(item);
    });
  }

  static styles = css`
    :host {
      display: block;
      overflow: clip;
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-lg);
      background: var(--ht-surface);
    }
    :host([hidden]) { display: none; }
  `;

  #items() {
    return [...this.children].filter((c): c is HtAccordionItem => c.localName === 'ht-accordion-item');
  }

  #closeOthers(keep: HtAccordionItem) {
    if (this.multiple) return;
    for (const it of this.#items()) if (it !== keep) it.open = false;
  }

  /** One open item at most, unless `multiple`. The first one authored open wins. */
  #normalise = () => {
    if (this.multiple) return;
    const open = this.#items().filter((it) => it.open);
    if (open.length > 1) this.#closeOthers(open[0]);
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('multiple')) this.#normalise();
  }

  render() {
    return html`<slot @slotchange=${this.#normalise}></slot>`;
  }
}

const CHEVRON = 'M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z';

/**
 * One section of an `ht-accordion`: a header and the panel it controls. Put the header text in the
 * `header` slot and the panel content in the default slot. Closed content is hidden from the
 * accessibility tree and from the tab order.
 *
 * @tag ht-accordion-item
 * @summary Header and panel inside an accordion.
 *
 * @slot - Panel content.
 * @slot header - Header text.
 *
 * @csspart trigger - The header button.
 * @csspart panel - The panel wrapper.
 *
 * @fires change - The user opened or closed the item. Bubbles; read `open` from the target.
 */
export class HtAccordionItem extends LitElement {
  static properties = {
    /** Whether the panel is shown. */
    open: { type: Boolean, reflect: true },
    /** Disables the header. A disabled item is skipped by arrow keys. */
    disabled: { type: Boolean, reflect: true },
    /** Heading level (1 to 6) of the header, so the outline of the page stays correct. */
    level: { type: Number },
  };

  declare open: boolean;
  declare disabled: boolean;
  declare level: number;

  constructor() {
    super();
    this.open = false;
    this.disabled = false;
    this.level = 3;
  }

  static styles = css`
    :host {
      display: block;
      border-top: 1px solid var(--ht-border);
    }
    :host(:first-child) { border-top: 0; }
    :host([hidden]) { display: none; }
    .heading { margin: 0; }
    .trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-sizing: border-box;
      width: 100%;
      min-height: 2.75rem;
      margin: 0;
      padding: 10px 16px;
      border: 0;
      background: transparent;
      color: var(--ht-text);
      font: 500 0.875rem/1.25rem var(--ht-font-ui);
      text-align: start;
      cursor: pointer;
      transition: background var(--ht-duration) var(--ht-ease);
    }
    .trigger:hover:not(:disabled) { background: color-mix(in oklab, var(--ht-text) 4%, transparent); }
    .trigger:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    .trigger:disabled { color: var(--ht-text-subtle); cursor: not-allowed; }
    .chevron {
      flex: none;
      color: var(--ht-text-muted);
      transition: transform 200ms var(--ht-ease);
    }
    :host([open]) .chevron { transform: rotate(180deg); }
    /* Height animates through grid rows, so no height is measured. Hidden while closed: out of the tab order and the accessibility tree. */
    .panel {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      transition: grid-template-rows 200ms var(--ht-ease), visibility 0s linear 200ms;
    }
    :host([open]) .panel {
      grid-template-rows: 1fr;
      visibility: visible;
      transition: grid-template-rows 200ms var(--ht-ease), visibility 0s;
    }
    .inner { min-height: 0; overflow: hidden; }
    .body {
      padding: 0 16px 16px;
      color: var(--ht-text-muted);
      font: 400 0.875rem/1.5 var(--ht-font-ui);
    }
    @media (prefers-reduced-motion: reduce) {
      .panel, :host([open]) .panel, .chevron { transition: none; }
    }
  `;

  focus(options?: FocusOptions) {
    this.renderRoot.querySelector<HTMLElement>('.trigger')?.focus(options);
  }

  #toggle = () => {
    if (this.disabled) return;
    this.open = !this.open;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  #onKeydown = (e: KeyboardEvent) => {
    const parent = this.parentElement;
    if (!parent || parent.localName !== 'ht-accordion') return;
    const items = [...parent.children].filter(
      (c): c is HtAccordionItem => c.localName === 'ht-accordion-item' && !(c as HtAccordionItem).disabled,
    );
    const i = items.indexOf(this);
    let next = -1;
    if (e.key === 'ArrowDown') next = (i + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next < 0 || i < 0) return;
    e.preventDefault();
    items[next].focus();
  };

  render() {
    const level = Math.min(6, Math.max(1, Math.round(this.level) || 3));
    return html`
      <div class="heading" role="heading" aria-level=${level}>
        <button
          part="trigger"
          class="trigger"
          type="button"
          id="trigger"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="panel"
          ?disabled=${this.disabled}
          @click=${this.#toggle}
          @keydown=${this.#onKeydown}
        >
          <span><slot name="header"></slot></span>
          <svg class="chevron" width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d=${CHEVRON} /></svg>
        </button>
      </div>
      <div part="panel" class="panel" id="panel">
        <div class="inner"><div class="body"><slot></slot></div></div>
      </div>`;
  }
}

if (!customElements.get('ht-accordion')) customElements.define('ht-accordion', HtAccordion);
if (!customElements.get('ht-accordion-item')) customElements.define('ht-accordion-item', HtAccordionItem);

declare global {
  interface HTMLElementTagNameMap {
    'ht-accordion': HtAccordion;
    'ht-accordion-item': HtAccordionItem;
  }
}
