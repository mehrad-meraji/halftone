import { LitElement, css, html } from 'lit';

/** The roles are set on the hosts (not inside shadow roots), so the table stays one real ARIA table. */
function setRole(el: HTMLElement, role: string) {
  if (!el.hasAttribute('role')) el.setAttribute('role', role);
}

/**
 * Data table made of custom elements. Layout uses `display: table*` on the hosts, and each
 * host carries its own ARIA role (`table`, `rowgroup`, `row`, `columnheader`, `cell`), so
 * assistive technology sees an ordinary table. Give it an accessible name with `aria-label`.
 *
 * ```html
 * <ht-table aria-label="Projects">
 *   <ht-table-head><ht-table-row>
 *     <ht-table-header sortable key="name">Name</ht-table-header>
 *     <ht-table-header align="end">Events</ht-table-header>
 *   </ht-table-row></ht-table-head>
 *   <ht-table-body>
 *     <ht-table-row><ht-table-cell>sentinel</ht-table-cell><ht-table-cell align="end">1,204</ht-table-cell></ht-table-row>
 *   </ht-table-body>
 * </ht-table>
 * ```
 *
 * The table does not sort or filter. A sortable header fires `sort`; reorder your rows in
 * response. Only one header shows a sort direction at a time.
 *
 * The table scrolls horizontally when it is wider than its container, and joins the
 * tab order while it does, so keyboard users can scroll it. For a sticky header, set
 * `sticky-header` and give the table a height with `--ht-table-max-height`.
 *
 * @tag ht-table
 * @summary Data table with density, row states and sortable headers.
 *
 * @slot - `ht-table-head` and `ht-table-body`.
 * @slot empty - Shown below the header while the body has no rows.
 *
 * @csspart empty - The empty-state row.
 *
 * @cssprop [--ht-table-max-height=none] - Maximum height of the table box. The body scrolls past it, which `sticky-header` needs.
 *
 * @fires sort - A sortable header was activated. Bubbles from the header: `detail` is `{ key, direction }`. The table resets the other headers' `sort` to `none`.
 */
export class HtTable extends LitElement {
  static properties = {
    /** `comfortable` (rows about 44px) or `dense` (about 32px). */
    density: { reflect: true },
    /** Tints every second body row. */
    zebra: { type: Boolean, reflect: true },
    /** Keeps the header row at the top of the wrapper while the body scrolls. Needs `--ht-table-max-height`. */
    stickyHeader: { type: Boolean, reflect: true, attribute: 'sticky-header' },
    _empty: { state: true },
    _hasEmpty: { state: true },
    _tabbable: { state: true },
  };

  declare density: 'comfortable' | 'dense';
  declare zebra: boolean;
  declare stickyHeader: boolean;
  declare _empty: boolean;
  declare _hasEmpty: boolean;
  declare _tabbable: boolean;

  #mo?: MutationObserver;
  #ro?: ResizeObserver;

  constructor() {
    super();
    this.density = 'comfortable';
    this.zebra = false;
    this.stickyHeader = false;
    this._empty = true;
    this._hasEmpty = false;
    this._tabbable = false;
    this.addEventListener('sort', (e) => {
      for (const h of this.querySelectorAll<HtTableHeader>('ht-table-header[sortable]')) {
        if (h !== e.target && h.sort !== 'none') h.sort = 'none';
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    setRole(this, 'table');
    this.#mo = new MutationObserver(() => this.#scan());
    this.#mo.observe(this, { childList: true, subtree: true });
    this.#scan();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#mo?.disconnect();
    this.#ro?.disconnect();
    this.#mo = this.#ro = undefined;
  }

  firstUpdated() {
    this.#ro = new ResizeObserver(() => this.#measure());
    const grid = this.renderRoot.querySelector('.grid');
    this.#ro.observe(this);
    if (grid) this.#ro.observe(grid);
    this.#measure();
  }

  static styles = css`
    :host {
      display: block;
      /* The host is the scroll box, so the table role, the scrolling and the tab stop all sit on one element. */
      box-sizing: border-box;
      max-height: var(--ht-table-max-height, none);
      overflow: auto;
      background: var(--ht-surface);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-lg);
      scrollbar-width: thin;
      scrollbar-color: var(--ht-border-input) transparent;
      --_tpy: 0.75rem;
      --_tpx: 1rem;
      --_zebra: transparent;
      --_hpos: static;
    }
    :host([density='dense']) { --_tpy: 0.375rem; --_tpx: 0.75rem; }
    :host([zebra]) { --_zebra: color-mix(in oklab, var(--ht-text) 3%, transparent); }
    :host([sticky-header]) { --_hpos: sticky; }
    :host(:focus-visible) { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    /* The slot is the table box: the head and body hosts become its row groups. */
    .grid { display: table; width: 100%; border-collapse: separate; border-spacing: 0; }
    .empty {
      padding: 2rem 1rem;
      text-align: center;
      font: 400 0.875rem/1.5 var(--ht-font-ui);
      color: var(--ht-text-muted);
    }
    .empty[hidden] { display: none; }
  `;

  /** Shows the empty slot while no body row exists. */
  #scan = () => {
    const empty = !this.querySelector(':scope > ht-table-body > ht-table-row');
    if (empty !== this._empty) this._empty = empty;
  };

  #measure = () => {
    this._tabbable = this.scrollWidth - this.clientWidth > 1 || this.scrollHeight - this.clientHeight > 1;
  };

  updated() {
    // Only manage tabindex when the author has not set one.
    if (this._tabbable) {
      if (!this.hasAttribute('tabindex')) { this.setAttribute('tabindex', '0'); this.#autoTab = true; }
    } else if (this.#autoTab) {
      this.removeAttribute('tabindex');
      this.#autoTab = false;
    }
  }

  #autoTab = false;

  render() {
    return html`
      <slot class="grid" @slotchange=${this.#scan}></slot>
      <div part="empty" class="empty" role="row" ?hidden=${!this._empty || !this._hasEmpty}>
        <div role="cell"><slot name="empty" @slotchange=${(e: Event) => (this._hasEmpty = (e.target as HTMLSlotElement).assignedNodes().length > 0)}></slot></div>
      </div>
    `;
  }
}

/**
 * Header row group. Put `ht-table-row` elements with `ht-table-header` cells in it.
 *
 * @tag ht-table-head
 * @summary Table header group.
 *
 * @slot - `ht-table-row` elements.
 */
export class HtTableHead extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    setRole(this, 'rowgroup');
  }
  static styles = css`:host { display: table-header-group; }`;
  render() {
    return html`<slot></slot>`;
  }
}

/**
 * Body row group. Put `ht-table-row` elements with `ht-table-cell` cells in it.
 *
 * @tag ht-table-body
 * @summary Table body group.
 *
 * @slot - `ht-table-row` elements.
 */
export class HtTableBody extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    setRole(this, 'rowgroup');
  }
  static styles = css`
    :host { display: table-row-group; }
    /* The table's zebra attribute sets --_zebra; rows read it through --_row-bg. */
    ::slotted(ht-table-row:nth-child(even)) { --_row-bg: var(--_zebra); }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

/**
 * One table row. Tints on hover. Mark the current one with `selected`: it gets an accent
 * tint, an accent bar on its first cell, and `aria-selected`.
 *
 * @tag ht-table-row
 * @summary Table row.
 *
 * @slot - `ht-table-header` or `ht-table-cell` elements.
 */
export class HtTableRow extends LitElement {
  static properties = {
    /** Marks the row as selected. */
    selected: { type: Boolean, reflect: true },
  };

  declare selected: boolean;

  constructor() {
    super();
    this.selected = false;
  }

  connectedCallback() {
    super.connectedCallback();
    setRole(this, 'row');
  }

  static styles = css`
    :host {
      display: table-row;
      background: var(--_row-bg, transparent);
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    /* No rule under the last body row; the wrapper's border closes the table. */
    :host(:last-child) { --_cell-bd: transparent; }
    :host(:hover) { background: color-mix(in oklab, var(--ht-text) 5%, transparent); }
    :host([selected]),
    :host([selected]:hover) { background: color-mix(in oklab, var(--ht-accent) 11%, transparent); }
    :host([selected]) ::slotted(:first-child) { box-shadow: inset 2px 0 0 var(--ht-accent); }
    @media (prefers-reduced-motion: reduce) {
      :host { transition: none; }
    }
  `;

  updated() {
    if (this.selected) this.setAttribute('aria-selected', 'true');
    else this.removeAttribute('aria-selected');
  }

  render() {
    return html`<slot></slot>`;
  }
}

/**
 * A column header. With `sortable` it holds a button, announces `aria-sort`, and fires
 * `sort` when activated. It cycles none, ascending, descending, ascending, and so on. The
 * header only reports intent: your code reorders the rows.
 *
 * @tag ht-table-header
 * @summary Table column header.
 *
 * @slot - Header text.
 *
 * @csspart button - The sort button (only when `sortable`).
 *
 * @fires sort - The sort button was activated. `detail` is `{ key, direction }`, where `key` is the header's `key` (or its text). Bubbles and is composed.
 */
export class HtTableHeader extends LitElement {
  static properties = {
    /** Makes the header a sort button. */
    sortable: { type: Boolean, reflect: true },
    /** Current direction. Set it from your code to show an initial or restored sort. */
    sort: { reflect: true },
    /** Identifier sent in the `sort` event. Defaults to the header text. */
    key: {},
    /** Text alignment. `end` also uses tabular numerals, for numbers. */
    align: { reflect: true },
  };

  declare sortable: boolean;
  declare sort: 'none' | 'ascending' | 'descending';
  declare key: string;
  declare align: 'start' | 'center' | 'end';

  constructor() {
    super();
    this.sortable = false;
    this.sort = 'none';
    this.key = '';
    this.align = 'start';
  }

  connectedCallback() {
    super.connectedCallback();
    setRole(this, 'columnheader');
  }

  static styles = css`
    :host {
      display: table-cell;
      box-sizing: border-box;
      position: var(--_hpos, static);
      top: 0;
      z-index: 1;
      padding: var(--_tpy, 0.75rem) var(--_tpx, 1rem);
      vertical-align: middle;
      text-align: start;
      white-space: nowrap;
      font: 500 0.6875rem/1rem var(--ht-font-mono);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ht-text-muted);
      background: var(--ht-surface-muted);
      border-bottom: 1px solid var(--ht-border-strong);
    }
    :host([sortable]) { padding: 0; }
    :host([align='center']) { text-align: center; }
    :host([align='end']) { text-align: end; font-variant-numeric: tabular-nums; }
    .btn {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      padding: var(--_tpy, 0.75rem) var(--_tpx, 1rem);
      cursor: pointer;
      user-select: none;
      color: inherit;
      text-transform: inherit;
      transition: color var(--ht-duration) var(--ht-ease), background-color var(--ht-duration) var(--ht-ease);
    }
    :host([align='center']) .btn { justify-content: center; }
    :host([align='end']) .btn { justify-content: flex-end; }
    .btn:hover { color: var(--ht-text); background: color-mix(in oklab, var(--ht-text) 5%, transparent); }
    .btn:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    :host([sort='ascending']) .btn,
    :host([sort='descending']) .btn { color: var(--ht-text); }
    svg { flex: none; width: 12px; height: 12px; }
    path { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; opacity: 0.4; }
    :host([sort='ascending']) .up,
    :host([sort='descending']) .down { opacity: 1; }
    @media (prefers-reduced-motion: reduce) {
      .btn { transition: none; }
    }
  `;

  updated() {
    if (this.sortable) this.setAttribute('aria-sort', this.sort);
    else this.removeAttribute('aria-sort');
  }

  #onClick = () => {
    const direction = this.sort === 'ascending' ? 'descending' : 'ascending';
    this.sort = direction;
    this.dispatchEvent(
      new CustomEvent('sort', {
        bubbles: true,
        composed: true,
        detail: { key: this.key || (this.textContent ?? '').trim(), direction },
      }),
    );
  };

  render() {
    if (!this.sortable) return html`<slot></slot>`;
    return html`
      <button part="button" class="btn" type="button" @click=${this.#onClick}>
        <slot></slot>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path class="up" d="M3.5 5 6 2.5 8.5 5" />
          <path class="down" d="M3.5 7 6 9.5 8.5 7" />
        </svg>
      </button>
    `;
  }
}

/**
 * A table cell. For a row header, set `role="rowheader"` on it.
 *
 * @tag ht-table-cell
 * @summary Table cell.
 *
 * @slot - Cell content.
 */
export class HtTableCell extends LitElement {
  static properties = {
    /** Text alignment. `end` also uses tabular numerals, for numbers. */
    align: { reflect: true },
  };

  declare align: 'start' | 'center' | 'end';

  constructor() {
    super();
    this.align = 'start';
  }

  connectedCallback() {
    super.connectedCallback();
    setRole(this, 'cell');
  }

  static styles = css`
    :host {
      display: table-cell;
      box-sizing: border-box;
      padding: var(--_tpy, 0.75rem) var(--_tpx, 1rem);
      vertical-align: middle;
      text-align: start;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      border-bottom: 1px solid var(--_cell-bd, var(--ht-border));
    }
    :host([align='center']) { text-align: center; }
    :host([align='end']) { text-align: end; font-variant-numeric: tabular-nums; }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

for (const [tag, ctor] of [
  ['ht-table', HtTable],
  ['ht-table-head', HtTableHead],
  ['ht-table-body', HtTableBody],
  ['ht-table-row', HtTableRow],
  ['ht-table-header', HtTableHeader],
  ['ht-table-cell', HtTableCell],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-table': HtTable;
    'ht-table-head': HtTableHead;
    'ht-table-body': HtTableBody;
    'ht-table-row': HtTableRow;
    'ht-table-header': HtTableHeader;
    'ht-table-cell': HtTableCell;
  }
}
