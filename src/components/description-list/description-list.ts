import { LitElement, css, html, nothing } from 'lit';

/**
 * Key and value pairs for metadata: the facts strip under a record's title, the properties
 * rail beside it, the info panel of a media viewer. Put `ht-description-item` children in it.
 *
 * The list renders a real `<dl>` in its own shadow root: a `<dt>` with each item's `label`
 * and a `<dd>` that the item itself is slotted into. So the term and its definition are in
 * one tree and screen readers get a true description list. The cost is that a label is
 * plain text: slots only reach the list's own children, so an item cannot project rich
 * content into the list's `<dt>`. Children other than `ht-description-item` are not shown.
 *
 * Three layouts: `stacked` (label above value, for side rails), `inline` (label left, value
 * right, for property panels) and `columns` (a strip of facts, label above value, that
 * wraps on narrow screens).
 *
 * @tag ht-description-list
 * @summary Key and value pairs for metadata.
 *
 * @slot - `ht-description-item` elements (each moved into its row automatically).
 *
 * @csspart base - Wrapper around the list. A labelled group when `label` is set.
 * @csspart list - The `<dl>`.
 * @csspart row - One term and its value (a `<div>` inside the `<dl>`).
 * @csspart label - The term (`<dt>`).
 * @csspart value - The definition (`<dd>`) that holds the item.
 *
 * @cssprop [--ht-description-list-label-width=7.5rem] - Width of the label column in the `inline` layout.
 * @cssprop [--ht-description-list-column-min=9rem] - Narrowest a fact gets in the `columns` layout before the strip wraps.
 */
export class HtDescriptionList extends LitElement {
  static properties = {
    /** `stacked` puts each label above its value, `inline` puts it to the left, `columns` lays the facts out side by side and wraps them. */
    layout: { reflect: true },
    /** Facts per row in the `columns` layout, at most. Fewer fit on narrow screens. `0`, the default, fits as many as `--ht-description-list-column-min` allows. */
    columns: { type: Number },
    /** `compact` tightens the space between rows. */
    density: { reflect: true },
    /** Lines between rows (and between facts in the `columns` layout). */
    dividers: { type: Boolean, reflect: true },
    /** Accessible name. Makes the list a labelled group; use it when a page has several lists and no heading tells them apart. */
    label: {},
  };

  declare layout: 'stacked' | 'inline' | 'columns';
  declare columns: number;
  declare density: 'default' | 'compact';
  declare dividers: boolean;
  declare label: string;

  #items: HtDescriptionItem[] = [];

  constructor() {
    super();
    this.layout = 'stacked';
    this.columns = 0;
    this.density = 'default';
    this.dividers = false;
    this.label = '';
  }

  static styles = css`
    :host {
      display: block;
      /* Space between rows, between a label and its value, and between facts side by side. */
      --_row-gap: 16px;
      --_pair-gap: 4px;
      --_col-gap: 24px;
      --_pad-y: 10px;
      --_pad-x: 16px;
    }
    :host([density='compact']) {
      --_row-gap: 10px;
      --_pair-gap: 2px;
      --_col-gap: 16px;
      --_pad-y: 6px;
      --_pad-x: 12px;
    }
    :host([layout='inline']) { --_row-gap: 10px; }
    :host([layout='inline'][density='compact']) { --_row-gap: 6px; }

    dl, dd { margin: 0; }
    .list {
      display: flex;
      flex-direction: column;
      gap: var(--_row-gap);
      color: var(--ht-text);
    }
    .row {
      display: flex;
      flex-direction: column;
      gap: var(--_pair-gap);
      min-width: 0;
    }
    dt {
      font: 400 0.6875rem/1rem var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-muted);
      overflow-wrap: anywhere;
    }
    dd { min-width: 0; }

    /* Stacked and inline: a line between rows. */
    :host([dividers]:not([layout='columns'])) .list { gap: 0; }
    :host([dividers]:not([layout='columns'])) .row { padding-block: var(--_pad-y); }
    :host([dividers]:not([layout='columns'])) .row + .row { border-top: 1px solid var(--ht-border); }
    :host([dividers]:not([layout='columns'])) .row:first-child { padding-top: 0; }
    :host([dividers]:not([layout='columns'])) .row:last-child { padding-bottom: 0; }

    /* Inline: a fixed label column, value beside it on the label's baseline. */
    :host([layout='inline']) .row {
      display: grid;
      grid-template-columns: var(--ht-description-list-label-width, 7.5rem) minmax(0, 1fr);
      align-items: baseline;
      column-gap: 16px;
    }

    /*
     * Columns: at most --_cols facts per row, none narrower than the column minimum, so the
     * strip wraps on its own. Without a count, as many as fit.
     */
    :host([layout='columns']) .list {
      display: grid;
      column-gap: var(--_col-gap);
      row-gap: var(--_row-gap);
      grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--ht-description-list-column-min, 9rem)), 1fr));
    }
    :host([layout='columns']) .list.counted {
      grid-template-columns: repeat(
        auto-fill,
        minmax(
          max(
            min(100%, var(--ht-description-list-column-min, 9rem)),
            calc((100% - (var(--_cols) - 1) * var(--_col-gap)) / var(--_cols))
          ),
          1fr
        )
      );
    }
    /*
     * Columns with dividers: every fact has a top and a left line, and the list is pulled up
     * and left by 1px under a clipping wrapper, so only the lines between facts show, however
     * the strip wraps.
     */
    :host([layout='columns'][dividers]) { --_col-gap: 0px; --_row-gap: 0px; }
    :host([layout='columns'][dividers]) .base { overflow: hidden; }
    :host([layout='columns'][dividers]) .list { margin: -1px 0 0 -1px; }
    :host([layout='columns'][dividers]) .row {
      padding: var(--_pad-y) var(--_pad-x);
      border-top: 1px solid var(--ht-border);
      border-left: 1px solid var(--ht-border);
    }
    :host([layout='columns'][dividers]:not([density='compact'])) { --_pad-y: 12px; }
  `;

  /** Reads the items from the light DOM and gives each one its own slot. */
  willUpdate() {
    this.#items = [...this.children].filter((c): c is HtDescriptionItem => c.localName === 'ht-description-item');
    this.#items.forEach((item, i) => {
      const name = `item-${i}`;
      if (item.getAttribute('slot') !== name) item.setAttribute('slot', name);
    });
  }

  #onSlotChange = () => this.requestUpdate();

  render() {
    const cols = this.layout === 'columns' && this.columns > 0 ? Math.floor(this.columns) : 0;
    return html`
      <div part="base" class="base" role=${this.label ? 'group' : nothing} aria-label=${this.label || nothing}>
        <dl part="list" class="list ${cols ? 'counted' : ''}" style=${cols ? `--_cols: ${cols}` : nothing}>
          ${this.#items.map(
            (item, i) => html`<div part="row" class="row">
              <dt part="label">${item.getAttribute('label') ?? ''}</dt>
              <dd part="value"><slot name="item-${i}" @slotchange=${this.#onSlotChange}></slot></dd>
            </div>`,
          )}
        </dl>
      </div>
      <slot hidden @slotchange=${this.#onSlotChange}></slot>
    `;
  }
}

const copyIcon = html`<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"></rect><path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5"></path></svg>`;
const checkIcon = html`<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5"></path></svg>`;

/**
 * One term and its value inside `ht-description-list`. The value goes in the default slot:
 * text, tags, avatars, links or `<code>`. With no value it shows a muted dash (read out as
 * "Not set").
 *
 * @tag ht-description-item
 * @summary Term and value in a description list.
 *
 * @slot - The value.
 * @slot hint - Secondary line under the value, e.g. a `<time>` with the exact timestamp. Replaces the `hint` attribute.
 *
 * @csspart base - Wrapper around the value line and the hint.
 * @csspart value - The value.
 * @csspart empty - The dash shown when there is no value.
 * @csspart copy - The copy button.
 * @csspart hint - The secondary line.
 *
 * @fires ht-copy - The value was copied to the clipboard. `detail.value` is the copied text.
 */
export class HtDescriptionItem extends LitElement {
  static properties = {
    /** The term, in Title Case. Plain text; the list draws it in the `<dt>`. */
    label: { reflect: true },
    /** Secondary line under the value, e.g. `Oct 23 14:02 UTC` under `3h ago`. */
    hint: {},
    /** Shows a small button that copies the value and announces "Copied". */
    copy: { type: Boolean, reflect: true },
    /** Text the copy button copies, when it differs from what is shown (the full hash behind a short one). Defaults to the value's text. */
    copyValue: { attribute: 'copy-value' },
    _empty: { state: true },
    _hasHint: { state: true },
    _copied: { state: true },
    _status: { state: true },
  };

  declare label: string;
  declare hint: string;
  declare copy: boolean;
  declare copyValue: string;
  declare _empty: boolean;
  declare _hasHint: boolean;
  declare _copied: boolean;
  declare _status: string;

  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.label = '';
    this.hint = '';
    this.copy = false;
    this.copyValue = '';
    this._empty = true;
    this._hasHint = false;
    this._copied = false;
    this._status = '';
  }

  static styles = css`
    :host { display: block; min-width: 0; }
    .base { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    /* The copy button lines up with the first line of a value that wraps. */
    .line { display: flex; align-items: flex-start; gap: 4px; min-width: 0; }
    .value {
      min-width: 0;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      overflow-wrap: anywhere;
    }
    .value[hidden], .hint[hidden] { display: none; }
    ::slotted(code) {
      font: 400 0.8125rem/1.25rem var(--ht-font-mono);
      color: var(--ht-text);
    }
    .empty { font: 400 0.875rem/1.25rem var(--ht-font-ui); color: var(--ht-text-muted); }
    .hint {
      font: 400 0.75rem/1rem var(--ht-font-mono);
      color: var(--ht-text-muted);
      overflow-wrap: anywhere;
    }
    button {
      flex: none;
      display: inline-grid;
      place-items: center;
      width: 24px;
      height: 24px;
      margin-block: -2px;
      padding: 0;
      color: var(--ht-text-muted);
      cursor: pointer;
      background: transparent;
      border: 0;
      border-radius: var(--ht-radius-sm);
      transition: background-color var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease);
    }
    button:hover { color: var(--ht-text); background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    button:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    button.copied { color: color-mix(in oklab, var(--ht-success) 50%, var(--ht-text)); }
    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;

  updated(changed: Map<string, unknown>) {
    // The list draws the label, so it re-renders when the label changes.
    if (changed.has('label') && this.parentElement instanceof HtDescriptionList) this.parentElement.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
  }

  #valueNodes() {
    return this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])')?.assignedNodes({ flatten: true }) ?? [];
  }

  #onValueSlot = () => {
    const nodes = this.#valueNodes();
    this._empty = !nodes.some((n) => n.nodeType === Node.ELEMENT_NODE || (n.textContent ?? '').trim() !== '');
  };

  #onHintSlot = (e: Event) => {
    // Not flattened: the fallback (the `hint` attribute) does not count as slotted content.
    this._hasHint = (e.target as HTMLSlotElement).assignedNodes().length > 0;
  };

  #onCopy = async () => {
    // Read at click time, so text a framework changed in place is copied as shown.
    const value =
      this.copyValue ||
      this.#valueNodes()
        .map((n) => n.textContent ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    clearTimeout(this.#timer);
    try {
      await navigator.clipboard.writeText(value);
      this._copied = true;
      this._status = 'Copied';
      this.dispatchEvent(new CustomEvent('ht-copy', { detail: { value }, bubbles: true, composed: true }));
    } catch {
      this._copied = false;
      this._status = 'Could not copy';
    }
    this.#timer = setTimeout(() => {
      this._copied = false;
      this._status = '';
    }, 1500);
  };

  render() {
    const showHint = !!this.hint || this._hasHint;
    return html`
      <div part="base" class="base">
        <div class="line">
          <span part="value" class="value" ?hidden=${this._empty}><slot @slotchange=${this.#onValueSlot}></slot></span>
          ${this._empty
            ? html`<span part="empty" class="empty"><span aria-hidden="true">—</span><span class="sr">Not set</span></span>`
            : nothing}
          ${this.copy && !this._empty
            ? html`<button
                part="copy"
                class=${this._copied ? 'copied' : ''}
                type="button"
                aria-label=${`Copy ${this.label}`.trim()}
                @click=${this.#onCopy}
              >
                ${this._copied ? checkIcon : copyIcon}
              </button>`
            : nothing}
        </div>
        <div part="hint" class="hint" ?hidden=${!showHint}><slot name="hint" @slotchange=${this.#onHintSlot}>${this.hint}</slot></div>
        <span class="sr" role="status">${this._status}</span>
      </div>
    `;
  }
}

for (const [tag, ctor] of [
  ['ht-description-list', HtDescriptionList],
  ['ht-description-item', HtDescriptionItem],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-description-list': HtDescriptionList;
    'ht-description-item': HtDescriptionItem;
  }
}
