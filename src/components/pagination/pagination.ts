import { LitElement, css, html, nothing, svg } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/** Phosphor `caret-left`, bold. */
const CARET_LEFT = svg`<path d="M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z"/>`;
/** Phosphor `caret-right`, bold. */
const CARET_RIGHT = svg`<path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>`;

const icon = (path: unknown) =>
  html`<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${path}</svg>`;

type Item = number | 'gap';

/**
 * Page control for lists and tables: Previous, the page numbers, Next. Long ranges keep the first
 * and last page and fold the rest into ellipses, with a constant number of slots so the buttons do
 * not move under the pointer as the page changes.
 *
 * The page count is `total-pages` when set, else `total` divided by `page-size`, rounded up, else 1.
 * With `total` and `page-size` both set, a range summary ("21–40 of 312") sits before the controls.
 * A `page` outside the range is drawn as the nearest end but never rewritten, so it survives a
 * `total` that arrives later. The control stays visible with one page; hide it yourself if you
 * prefer.
 *
 * Without `href` the pages are buttons and the element keeps `page` itself. With `href` they are
 * links built from the template, for server-rendered lists. Either way a click fires
 * `ht-page-change` first; cancel it to keep the page (and, for links, to stop the navigation) and
 * route yourself. Modified clicks on links (Cmd, Ctrl, Shift, Alt, middle button) are left to the
 * browser.
 *
 * Renders a `<nav>` landmark. Name it with `label`, or `aria-label` on the element (forwarded to
 * the nav). Page changes are announced politely as "Page 3 of 16".
 *
 * @tag ht-pagination
 * @summary Page control with Previous, Next, page numbers and a range summary.
 *
 * @slot summary - Replaces the range summary text, for example "21–40 of 312 people".
 *
 * @csspart base - The `<nav>` landmark. A flex row: summary first, controls last.
 * @csspart summary - The range summary.
 * @csspart list - The `<ul>` of controls.
 * @csspart page - Each page button or link. The current one also has `current`.
 * @csspart current - The current page.
 * @csspart ellipsis - Each ellipsis standing in for hidden pages.
 * @csspart previous - The Previous button or link.
 * @csspart next - The Next button or link.
 * @csspart position - The "Page 3 of 16" text in `compact` mode.
 *
 * @fires ht-page-change - The person picked a page. `detail: { page }`. Cancelable: cancel it to keep the current page and, with `href`, to stop the navigation. Not fired when `page` is set from code.
 */
export class HtPagination extends LitElement {
  static properties = {
    /** Current page, 1-based. Updated after an uncancelled `ht-page-change`. */
    page: { type: Number, reflect: true },
    /** Number of pages. Takes precedence over `total` and `page-size`. 0 works it out from them. */
    totalPages: { type: Number, attribute: 'total-pages' },
    /** Number of items across all pages. With `page-size`, gives the page count and the range summary. */
    total: { type: Number },
    /** Items per page. With `total`, gives the page count and the range summary. */
    pageSize: { type: Number, attribute: 'page-size' },
    /** Pages shown on each side of the current one before an ellipsis. */
    siblings: { type: Number },
    /** Button height: sm 28px, md 32px. */
    size: { reflect: true },
    /** Only Previous, "Page 3 of 16" and Next, as icon buttons. For tight footers. */
    compact: { type: Boolean, reflect: true },
    /** Disables every control. Links lose their `href`. */
    disabled: { type: Boolean, reflect: true },
    /** Accessible name of the nav landmark. */
    label: {},
    /** URL template for page links. Every `{page}` is replaced with the page number, for example `?page={page}`. Without it the pages are buttons. */
    href: {},
    _status: { state: true },
  };

  declare page: number;
  declare totalPages: number;
  declare total: number | undefined;
  declare pageSize: number | undefined;
  declare siblings: number;
  declare size: 'sm' | 'md';
  declare compact: boolean;
  declare disabled: boolean;
  declare label: string;
  declare href: string;
  declare _status: string;

  #ariaLabel: string | undefined;
  #hasSummary = false;

  constructor() {
    super();
    this.page = 1;
    this.totalPages = 0;
    this.siblings = 1;
    this.size = 'md';
    this.compact = false;
    this.disabled = false;
    this.label = 'Pagination';
    this.href = '';
    this._status = '';
  }

  connectedCallback() {
    super.connectedCallback();
    // `aria-label` is not allowed on a generic host; move it to the nav.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
      this.requestUpdate();
    }
  }

  static styles = css`
    :host {
      display: block;
      --_h: 2rem;
      --_fs: 0.875rem;
      --_px: 0.5rem;
      --_icon: 14px;
    }
    :host([size='sm']) { --_h: 1.75rem; --_fs: 0.75rem; --_px: 0.375rem; --_icon: 12px; }
    nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 16px;
    }
    .summary {
      font: 400 0.75rem / 1rem var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-muted);
    }
    .summary[hidden] { display: none; }
    ul {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li { display: flex; }

    /* Quiet button mechanics from ht-button: flat, a tint on hover, a ring on focus. */
    .btn {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      height: var(--_h);
      min-width: var(--_h);
      padding-inline: var(--_px);
      font: 400 var(--_fs) / 1rem var(--ht-font-ui);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-md);
      cursor: pointer;
      user-select: none;
    }
    .btn:hover { background: color-mix(in oklch, var(--ht-text) 6%, transparent); color: var(--ht-text); }
    .btn:active { background: color-mix(in oklch, var(--ht-text) 10%, transparent); }
    .btn:focus-visible { box-shadow: 0 0 0 2px var(--ht-focus); }
    .btn[aria-current='page'] {
      background: var(--ht-accent-soft);
      color: var(--ht-accent-text);
      font-weight: 500;
    }
    .btn:disabled,
    .btn[aria-disabled='true'] {
      opacity: 0.55;
      cursor: not-allowed;
      background: none;
      color: var(--ht-text-muted);
    }
    .btn[aria-disabled='true'][aria-current='page'] { background: var(--ht-accent-soft); color: var(--ht-accent-text); }
    .arrow { padding-inline: calc(var(--_px) - 2px) var(--_px); }
    .arrow.next { padding-inline: var(--_px) calc(var(--_px) - 2px); }
    .arrow.icon-only { width: var(--_h); padding: 0; }
    svg { width: var(--_icon); height: var(--_icon); flex: none; }
    :host(:dir(rtl)) svg { transform: scaleX(-1); }

    .ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: var(--_h);
      height: var(--_h);
      font: 400 var(--_fs) / 1rem var(--ht-font-ui);
      color: var(--ht-text-subtle);
      user-select: none;
    }
    .position {
      display: inline-flex;
      align-items: center;
      height: var(--_h);
      padding-inline: 8px;
      font: 400 var(--_fs) / 1rem var(--ht-font-ui);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      color: var(--ht-text-muted);
    }
    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    @media (prefers-reduced-motion: no-preference) {
      .btn { transition: background-color var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease); }
    }
    @media (forced-colors: active) {
      .btn[aria-current='page'] { outline: 1px solid CanvasText; }
    }
  `;

  /** Page count after `total-pages`, then `total` / `page-size`. At least 1. */
  #pageCount() {
    const tp = Math.floor(Number(this.totalPages) || 0);
    if (tp > 0) return tp;
    if (this.#hasRange()) return Math.max(1, Math.ceil(this.total! / this.pageSize!));
    return 1;
  }

  #hasRange() {
    return Number.isFinite(this.total) && this.total! >= 0 && Number.isFinite(this.pageSize) && this.pageSize! > 0;
  }

  /** `page` clamped to the page count. The property itself is left alone. */
  #current(count = this.#pageCount()) {
    const p = Math.floor(Number(this.page) || 1);
    return Math.min(Math.max(p, 1), count);
  }

  /** Pages and gaps to draw. Always 2 × siblings + 5 slots once the count passes that. */
  #items(page: number, count: number): Item[] {
    const s = Math.max(0, Math.floor(Number(this.siblings) || 0));
    if (count <= 2 * s + 5) return Array.from({ length: count }, (_, i) => i + 1);
    const start = Math.max(Math.min(page - s, count - 2 * s - 2), 3);
    const end = Math.min(Math.max(page + s, 2 * s + 3), count - 2);
    const items: Item[] = [1, start > 3 ? 'gap' : 2];
    for (let n = start; n <= end; n++) items.push(n);
    items.push(end < count - 2 ? 'gap' : count - 1, count);
    return items;
  }

  #fmt(n: number) {
    return n.toLocaleString();
  }

  willUpdate(changed: Map<string, unknown>) {
    // Announce later page changes, whether from a click or from code. Not on first render.
    if (this.hasUpdated && changed.has('page')) {
      const count = this.#pageCount();
      this._status = `Page ${this.#fmt(this.#current(count))} of ${this.#fmt(count)}`;
    }
  }

  #url(page: number) {
    return this.href.replaceAll('{page}', String(page));
  }

  #onClick = async (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-page]');
    if (!el || this.disabled) return;
    const isLink = el.localName === 'a';
    if (isLink && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return;
    const target = Number(el.dataset.page);
    if (target === this.#current()) return;
    const ok = this.dispatchEvent(
      new CustomEvent('ht-page-change', { detail: { page: target }, bubbles: true, composed: true, cancelable: true }),
    );
    if (!ok) {
      if (isLink) e.preventDefault();
      return;
    }
    const root = this.shadowRoot!;
    const hadFocus = !!root.activeElement;
    this.page = target;
    await this.updateComplete;
    if (!hadFocus) return;
    // Page buttons are reused by position, so the focused one may now show another number, or an
    // arrow may have just become disabled. Move focus to the current page (or a live arrow).
    const active = root.activeElement as HTMLElement | null;
    if (active && !active.classList.contains('num') && !active.matches(':disabled, [aria-disabled="true"]')) return;
    const live = ':not(:disabled):not([aria-disabled="true"])';
    const next =
      root.querySelector<HTMLElement>(`[aria-current="page"]${live}`) ?? root.querySelector<HTMLElement>(`.arrow${live}`);
    next?.focus();
  };

  #control(opts: { page: number; content: unknown; part: string; cls: string; enabled: boolean; label?: string; current?: boolean; rel?: string }) {
    const { page, content, part, cls, enabled, label, current, rel } = opts;
    const on = enabled && !this.disabled;
    if (this.href) {
      // A link without `href` is not focusable; `role="link"` keeps its role for aria-disabled.
      return on
        ? html`<a
            part=${part}
            class="btn ${cls}"
            href=${this.#url(page)}
            data-page=${page}
            rel=${ifDefined(rel)}
            aria-label=${ifDefined(label)}
            aria-current=${ifDefined(current ? 'page' : undefined)}
            >${content}</a
          >`
        : html`<a
            part=${part}
            class="btn ${cls}"
            role="link"
            aria-disabled="true"
            aria-label=${ifDefined(label)}
            aria-current=${ifDefined(current ? 'page' : undefined)}
            >${content}</a
          >`;
    }
    return html`<button
      part=${part}
      class="btn ${cls}"
      type="button"
      data-page=${page}
      ?disabled=${!on}
      aria-label=${ifDefined(label)}
      aria-current=${ifDefined(current ? 'page' : undefined)}
    >${content}</button>`;
  }

  #onSummarySlot = (e: Event) => {
    const has = (e.target as HTMLSlotElement).assignedNodes().some((n) => n.nodeType === 1 || n.textContent?.trim());
    if (has !== this.#hasSummary) {
      this.#hasSummary = has;
      this.requestUpdate();
    }
  };

  render() {
    const count = this.#pageCount();
    const page = this.#current(count);
    const compact = this.compact;

    let summary = '';
    if (this.#hasRange()) {
      const total = this.total!;
      const size = this.pageSize!;
      summary =
        total === 0
          ? 'No results'
          : `${this.#fmt((page - 1) * size + 1)}–${this.#fmt(Math.min(page * size, total))} of ${this.#fmt(total)}`;
    }
    const showSummary = !!summary || this.#hasSummary;

    const prev = this.#control({
      page: page - 1,
      content: compact ? icon(CARET_LEFT) : html`${icon(CARET_LEFT)}<span>Previous</span>`,
      part: 'previous',
      cls: `arrow prev${compact ? ' icon-only' : ''}`,
      enabled: page > 1,
      label: compact ? 'Previous page' : undefined,
      rel: 'prev',
    });
    const next = this.#control({
      page: page + 1,
      content: compact ? icon(CARET_RIGHT) : html`<span>Next</span>${icon(CARET_RIGHT)}`,
      part: 'next',
      cls: `arrow next${compact ? ' icon-only' : ''}`,
      enabled: page < count,
      label: compact ? 'Next page' : undefined,
      rel: 'next',
    });

    const middle = compact
      ? html`<li><span part="position" class="position">Page ${this.#fmt(page)} of ${this.#fmt(count)}</span></li>`
      : this.#items(page, count).map((item) =>
          item === 'gap'
            ? html`<li aria-hidden="true"><span part="ellipsis" class="ellipsis">…</span></li>`
            : html`<li>
                ${this.#control({
                  page: item,
                  content: String(item),
                  part: item === page ? 'page current' : 'page',
                  cls: 'num',
                  // The current page stays a live control so it keeps its place in the tab order.
                  enabled: true,
                  label: `Page ${item}`,
                  current: item === page,
                })}
              </li>`,
        );

    return html`
      <nav part="base" aria-label=${this.#ariaLabel ?? this.label} @click=${this.#onClick}>
        <span part="summary" class="summary" ?hidden=${!showSummary}
          ><slot name="summary" @slotchange=${this.#onSummarySlot}>${summary}</slot></span
        >
        <ul part="list">
          <li>${prev}</li>
          ${middle}
          <li>${next}</li>
        </ul>
        <span class="sr" role="status">${this._status}</span>
      </nav>
    `;
  }
}

if (!customElements.get('ht-pagination')) customElements.define('ht-pagination', HtPagination);

declare global {
  interface HTMLElementTagNameMap {
    'ht-pagination': HtPagination;
  }
}
