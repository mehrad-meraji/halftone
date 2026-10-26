import { LitElement, css, html } from 'lit';

/**
 * The `detail` of `ht-drag-over`, `ht-drag-leave` and `ht-drag-drop`, the drag protocol that
 * `ht-sortable-list` speaks. A structural copy, so this file imports nothing but Lit.
 * @internal
 */
interface HtDragDetail {
  itemId: string;
  item: HTMLElement;
  source: HTMLElement;
  group: string;
  clientX: number;
  clientY: number;
  target: HTMLElement | null;
  data: unknown;
  label: string;
}

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
 * accessibility tree and from the tab order. The header button reports its state with
 * `aria-expanded`.
 *
 * The `meta` slot sits at the end of the header, before the chevron: a count, a summary, a
 * duration. It is inside the header button and part of its name ("Monday, 4 tasks"), so put text
 * there, never a control.
 *
 * With `droppable` the header is a drop target in the drag protocol (see `ht-sortable-list`): a
 * day heading that takes a task dragged onto it. It takes an item when the source list's `group`
 * is in `accept` (or `accept` is empty), and is not `disabled`. Only the header takes it, not the
 * open panel, so a list inside the panel still gets its own drops. It draws a 2px accent ring
 * while an item is over it, and fills `detail.data` with `{ value }` and `detail.label` with the
 * header text. The source list fires `ht-reorder` on drop; the item never moves anything itself.
 *
 * @tag ht-accordion-item
 * @summary Header and panel inside an accordion.
 *
 * @slot - Panel content.
 * @slot header - Header text.
 * @slot meta - Text at the end of the header, such as a count. No controls: it sits inside the header button.
 *
 * @csspart trigger - The header button.
 * @csspart meta - The wrapper of the `meta` slot.
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
    /** Identifier passed to the drag protocol as `data.value` when an item is dropped on the header, such as a date. */
    value: {},
    /** The header takes items dragged from an `ht-sortable-list`. */
    droppable: { type: Boolean, reflect: true },
    /** Space-separated `group` names of the lists it takes items from. Empty takes any group. */
    accept: {},
    _over: { state: true },
  };

  declare open: boolean;
  declare disabled: boolean;
  declare level: number;
  declare value: string;
  declare droppable: boolean;
  declare accept: string;
  declare _over: boolean;

  constructor() {
    super();
    this.open = false;
    this.disabled = false;
    this.level = 3;
    this.value = '';
    this.droppable = false;
    this.accept = '';
    this._over = false;
    this.addEventListener('ht-drag-over', this.#onDragOver);
    this.addEventListener('ht-drag-leave', this.#onDragEnd);
    this.addEventListener('ht-drag-drop', this.#onDragEnd);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._over = false;
  }

  #accepts(group: string) {
    const list = this.accept.trim();
    return !list || list.split(/\s+/).includes(group);
  }

  #onDragOver = (e: Event) => {
    // A nested target took it first: the deepest target wins.
    if (e.defaultPrevented) return;
    if (!this.droppable || this.disabled) return;
    // Only the header takes drops. The event also bubbles up from the panel.
    const trigger = this.renderRoot.querySelector('.trigger');
    if (!trigger || !e.composedPath().includes(trigger)) return;
    const d = (e as CustomEvent<HtDragDetail>).detail;
    if (!d || !this.#accepts(d.group ?? '')) return;
    e.preventDefault();
    d.target = this;
    d.data = { value: this.value };
    d.label = this.#headerText();
    this._over = true;
  };

  /** `ht-drag-leave` and `ht-drag-drop` both end the highlight. */
  #onDragEnd = () => {
    this._over = false;
  };

  #headerText() {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="header"]');
    const nodes = slot?.assignedNodes({ flatten: true }) ?? [];
    return nodes.map((n) => n.textContent ?? '').join(' ').replace(/\s+/g, ' ').trim();
  }

  willUpdate(changed: Map<string, unknown>) {
    // A disabled item cannot keep a drop highlight.
    if (changed.has('disabled') && this.disabled) this._over = false;
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
    .title { flex: 1; min-width: 0; }
    .meta {
      flex: none;
      color: var(--ht-text-muted);
      font: 400 0.75rem/1rem var(--ht-font-ui);
      font-variant-numeric: tabular-nums;
    }
    /* Drop target: an accent tint and a 2px inset ring while an item is over the header. The ring leans toward the text colour so it keeps 3:1 on the tint in dark mode. */
    .trigger.over,
    .trigger.over:hover:not(:disabled) {
      background: color-mix(in oklab, var(--ht-accent) 10%, var(--ht-surface));
      box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ht-accent) 80%, var(--ht-text));
    }
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
    @media (forced-colors: active) {
      .trigger.over { outline: 2px solid Highlight; outline-offset: -2px; }
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
          class="trigger ${this._over ? 'over' : ''}"
          type="button"
          id="trigger"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="panel"
          ?disabled=${this.disabled}
          @click=${this.#toggle}
          @keydown=${this.#onKeydown}
        >
          <span class="title"><slot name="header"></slot></span>
          <span part="meta" class="meta"><slot name="meta"></slot></span>
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
