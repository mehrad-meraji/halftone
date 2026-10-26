import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

const relFor = (target: string) => (target === '_blank' ? 'noopener noreferrer' : undefined);

/**
 * A card for a link to a pull request, a ticket or a page: service icon, a host line
 * ("atlas/web · #1284"), a one-line title and a meta row with a status. Child rows
 * (`ht-link-preview-row`) sit under it.
 *
 * The title is the link. The card itself is not a link, so the rows and anything in the
 * meta row can hold their own links. An Open button shows on hover and while focus is
 * inside the card; it is always in the tab order and always shown on touch screens.
 *
 * Below 260px wide (a container query on the element) the status shows only its dot. Its
 * text stays for screen readers. The title keeps at least 56px.
 *
 * `appearance="strip"` moves the icon and host line into a dot-screen header strip, sets
 * the title in display type and hangs the rows off a tree line.
 *
 * Halftone ships no brand marks: put the service icon in the `icon` slot.
 *
 * @tag ht-link-preview
 * @summary Preview card for a pull request, ticket or page.
 *
 * @slot - `ht-link-preview-row` elements: tickets, sub-tasks, linked items.
 * @slot icon - Service icon, 16px. Hidden when empty.
 * @slot meta - Items after the status in the meta row: checks, comment count, `ht-tag`s.
 *
 * @csspart base - The card box.
 * @csspart strip - The dot-screen header strip. Only with `appearance="strip"`.
 * @csspart body - The region holding the host line, title and meta row.
 * @csspart icon - The square box around the `icon` slot. Only with `appearance="card"`; the strip shows the icon bare.
 * @csspart host - The host line.
 * @csspart title - The title link (a `<span>` when `href` is empty).
 * @csspart meta - The meta row.
 * @csspart status - The status tag.
 * @csspart open - The Open button.
 * @csspart rows - The wrapper around the child rows. Hidden when empty.
 */
export class HtLinkPreview extends LitElement {
  static properties = {
    /** Where the title and the Open button go. Without it the title is plain text and Open is not drawn. */
    href: {},
    /** Link target for the title and Open. `_blank` also sets `rel="noopener noreferrer"`. */
    target: {},
    /** Line above the title, e.g. `atlas/web · #1284`. */
    host: {},
    /** The title. One line, cut with an ellipsis. */
    heading: {},
    /** Status text, e.g. `Open`, `Merged`, `In Review`. No tag is drawn when empty. */
    status: {},
    /** Colour of the status tag. `neutral` is the default. */
    statusTone: { attribute: 'status-tone', reflect: true },
    /** `card`: icon left, three stacked lines, rows in a muted footer. `strip`: dot-screen header strip, display title, rows on a tree line. */
    appearance: { reflect: true },
    _slots: { state: true },
  };

  declare href: string;
  declare target: string;
  declare host: string;
  declare heading: string;
  declare status: string;
  declare statusTone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  declare appearance: 'card' | 'strip';
  declare _slots: Set<string>;

  constructor() {
    super();
    this.href = '';
    this.target = '';
    this.host = '';
    this.heading = '';
    this.status = '';
    this.statusTone = 'neutral';
    this.appearance = 'card';
    this._slots = new Set();
  }

  static styles = css`
    :host {
      display: block;
      /* The narrow layout follows the element's own width, not the viewport. */
      container-type: inline-size;
      color: var(--ht-text);
      font: 400 0.8125rem/1.4 var(--ht-font-ui);
    }
    *,
    *::before,
    *::after { box-sizing: border-box; }
    [hidden] { display: none !important; }

    .card {
      position: relative;
      overflow: hidden;
      background: var(--ht-surface);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-sm);
    }

    /* card: icon left, three stacked lines */
    .body { display: flex; gap: 10px; align-items: flex-start; padding: 12px; min-width: 0; }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .icon {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      flex: none;
      color: var(--ht-text-muted);
      background: var(--ht-surface-sunken);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-md);
    }
    ::slotted([slot='icon']) { display: block; flex: none; width: 16px; height: 16px; }
    .host {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font: 400 0.6875rem/1.4 var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-subtle);
    }
    .title {
      display: block;
      min-width: 56px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-weight: 500;
      color: var(--ht-text);
      text-decoration: none;
      border-radius: var(--ht-radius-sm);
    }
    a.title:hover { text-decoration: underline; text-underline-offset: 2px; }
    a.title:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    /* The title stands for the whole card, so its focus ring goes round the card. */
    @supports selector(:has(a)) {
      a.title:focus-visible { outline: none; text-decoration: underline; text-underline-offset: 2px; }
      .card:has(a.title:focus-visible) { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    }
    .meta {
      display: flex;
      gap: 10px;
      align-items: center;
      min-width: 0;
      margin-top: 3px;
      font: 400 0.6875rem/1 var(--ht-font-mono);
      color: var(--ht-text-muted);
    }
    ::slotted([slot='meta']) { display: inline-flex; align-items: center; gap: 4px; flex: none; white-space: nowrap; }

    /* status tag */
    .status {
      --_c: var(--ht-text-muted);
      --_bg: var(--ht-surface-muted);
      --_bd: var(--ht-border);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      flex: none;
      height: 18px;
      padding: 0 6px;
      font: 500 0.6875rem/1 var(--ht-font-ui);
      white-space: nowrap;
      color: var(--_c);
      background: var(--_bg);
      border: 1px solid var(--_bd);
      border-radius: var(--ht-radius-md);
    }
    :host([status-tone='accent']) .status {
      --_c: var(--ht-accent-text);
      --_bg: color-mix(in oklab, var(--ht-accent) 12%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-accent) 26%, var(--ht-surface));
    }
    :host([status-tone='success']) .status {
      --_c: color-mix(in oklab, var(--ht-success) 50%, var(--ht-text));
      --_bg: color-mix(in oklab, var(--ht-success) 14%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-success) 28%, var(--ht-surface));
    }
    :host([status-tone='warning']) .status {
      --_c: color-mix(in oklab, var(--ht-warning) 55%, var(--ht-text));
      --_bg: color-mix(in oklab, var(--ht-warning) 16%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-warning) 30%, var(--ht-surface));
    }
    :host([status-tone='danger']) .status {
      --_c: var(--ht-danger-text);
      --_bg: color-mix(in oklab, var(--ht-danger) 12%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-danger) 26%, var(--ht-surface));
    }
    :host([status-tone='info']) .status {
      --_c: color-mix(in oklab, var(--ht-info) 50%, var(--ht-text));
      --_bg: color-mix(in oklab, var(--ht-info) 12%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-info) 26%, var(--ht-surface));
    }
    .dot { width: 6px; height: 6px; flex: none; border-radius: 50%; background: currentColor; }

    /*
     * Open. Out of sight until the card is hovered or holds focus, but never out of the tab
     * order: a keyboard user tabs onto it, which counts as focus-within and shows it.
     */
    .open {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex: none;
      padding: 0 8px;
      font: 500 0.75rem/1 var(--ht-font-ui);
      color: var(--ht-text);
      text-decoration: none;
      background: var(--ht-surface-raised);
      border: 1px solid var(--ht-border-strong);
      border-radius: var(--ht-radius-md);
      /* The small default keycap: a 1px plate under the face. */
      box-shadow: 0 1px 0 var(--ht-border-strong), var(--ht-shadow-xs);
      transition: transform var(--ht-duration) var(--ht-ease), box-shadow var(--ht-duration) var(--ht-ease);
    }
    :host(:hover) .open,
    :host(:focus-within) .open {
      position: static;
      width: auto;
      height: 24px;
      overflow: visible;
      clip-path: none;
      animation: ht-link-preview-in var(--ht-duration) var(--ht-ease);
    }
    @media (hover: none) {
      .open { position: static; width: auto; height: 24px; overflow: visible; clip-path: none; }
    }
    .open:hover { transform: translateY(-1px); box-shadow: 0 2px 0 var(--ht-border-strong), var(--ht-shadow-xs); }
    .open:active { transform: translateY(1px); box-shadow: none; }
    .open:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    .open svg { width: 12px; height: 12px; flex: none; }
    @keyframes ht-link-preview-in {
      from { opacity: 0; }
    }

    /* rows: a muted footer, indented to the title */
    .rows {
      padding: 4px 0;
      background: var(--ht-surface-muted);
      border-top: 1px solid var(--ht-border);
    }
    .rows ::slotted(ht-link-preview-row) { padding: 0 12px 0 50px; min-height: 30px; }
    .rows.flush ::slotted(ht-link-preview-row) { padding-left: 12px; }

    /* strip: dot-screen header strip, display title, tree rows */
    .strip {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 34px;
      padding: 0 6px 0 10px;
      color: var(--ht-text-muted);
      background: var(--ht-halftone), var(--ht-surface-muted);
      border-bottom: 1px solid var(--ht-border);
    }
    .strip .host {
      flex: 1;
      min-width: 0;
      font-weight: 500;
      line-height: 1.2;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }
    :host([appearance='strip']) .body { flex-direction: column; align-items: stretch; gap: 8px; }
    :host([appearance='strip']) .title {
      font: 600 0.9375rem/1.3 var(--ht-font-display);
      letter-spacing: 0.01em;
    }
    :host([appearance='strip']) .meta { gap: 6px; margin-top: 0; }
    :host([appearance='strip']) .rows {
      margin: 0 12px 12px 22px;
      padding: 0;
      background: none;
      border: 0;
    }
    /* The tree line: a vertical rule down each row and a 9px tick into it; the last row stops at its middle. */
    :host([appearance='strip']) .rows ::slotted(ht-link-preview-row) {
      min-height: 28px;
      padding: 0 0 0 14px;
      background:
        linear-gradient(var(--ht-border-strong), var(--ht-border-strong)) 0 50% / 9px 1px no-repeat,
        linear-gradient(var(--ht-border-strong), var(--ht-border-strong)) 0 0 / 1px 100% no-repeat;
    }
    :host([appearance='strip']) .rows ::slotted(ht-link-preview-row:last-of-type) {
      background:
        linear-gradient(var(--ht-border-strong), var(--ht-border-strong)) 0 50% / 9px 1px no-repeat,
        linear-gradient(var(--ht-border-strong), var(--ht-border-strong)) 0 0 / 1px 50% no-repeat;
    }

    /* Narrow: the status gives way to its dot first, Open drops its word. */
    @container (max-width: 259.98px) {
      .status { width: 18px; padding: 0; justify-content: center; }
      .status-label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .open-word { display: none; }
      :host(:hover) .open,
      :host(:focus-within) .open { width: 24px; padding: 0; justify-content: center; }
    }
    @container (max-width: 259.98px) {
      @media (hover: none) {
        .open { width: 24px; padding: 0; justify-content: center; }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .open { transition: none; animation: none !important; }
      .open:hover,
      .open:active { transform: none; }
    }
  `;

  #track = (name: string) => (e: Event) => {
    const has = (e.target as HTMLSlotElement).assignedElements().length > 0;
    if (has === this._slots.has(name)) return;
    const next = new Set(this._slots);
    has ? next.add(name) : next.delete(name);
    this._slots = next;
  };

  #title() {
    if (!this.href) return html`<span part="title" class="title">${this.heading}</span>`;
    return html`<a
      part="title"
      class="title"
      href=${this.href}
      target=${ifDefined(this.target || undefined)}
      rel=${ifDefined(relFor(this.target))}
      >${this.heading}</a
    >`;
  }

  #open() {
    if (!this.href) return nothing;
    const name = this.heading || this.host;
    return html`<a
      part="open"
      class="open"
      href=${this.href}
      target=${ifDefined(this.target || undefined)}
      rel=${ifDefined(relFor(this.target))}
      aria-label=${name ? `Open ${name}` : 'Open'}
      ><span class="open-word">Open</span
      ><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 3.5H3.5v9h9V10M9 2.5h4.5V7M13.5 2.5L7.5 8.5"></path></svg
    ></a>`;
  }

  #meta() {
    const hasMeta = !!this.status || this._slots.has('meta');
    return html`<div part="meta" class="meta" ?hidden=${!hasMeta}>
      ${this.status
        ? html`<span part="status" class="status"
            ><i class="dot" aria-hidden="true"></i><span class="status-label">${this.status}</span></span
          >`
        : nothing}
      <slot name="meta" @slotchange=${this.#track('meta')}></slot>
    </div>`;
  }

  render() {
    const strip = this.appearance === 'strip';
    const hasIcon = this._slots.has('icon');
    const iconSlot = html`<slot name="icon" @slotchange=${this.#track('icon')}></slot>`;
    const host = this.host ? html`<span part="host" class="host">${this.host}</span>` : nothing;
    const rows = html`<div
      part="rows"
      class="rows ${strip || hasIcon ? '' : 'flush'}"
      role="list"
      ?hidden=${!this._slots.has('rows')}
    >
      <slot @slotchange=${this.#track('rows')}></slot>
    </div>`;

    if (strip) {
      return html`<div part="base" class="card">
        <div part="strip" class="strip">${iconSlot}<span part="host" class="host">${this.host}</span>${this.#open()}</div>
        <div part="body" class="body">${this.#title()}${this.#meta()}</div>
        ${rows}
      </div>`;
    }
    return html`<div part="base" class="card">
      <div part="body" class="body">
        <span part="icon" class="icon" ?hidden=${!hasIcon}>${iconSlot}</span>
        <div class="main">${host}${this.#title()}${this.#meta()}</div>
        ${this.#open()}
      </div>
      ${rows}
    </div>`;
  }
}

/**
 * One child row of `ht-link-preview`: a mono key, a one-line title and a status. Place it
 * in the default slot of `ht-link-preview`, which sets its indent and, with
 * `appearance="strip"`, draws its tree line.
 *
 * @tag ht-link-preview-row
 * @summary Child row of a link preview.
 *
 * @slot - The row title. One line, cut with an ellipsis.
 * @slot status - Status at the end of the row, e.g. an `ht-tag`.
 *
 * @csspart key - The key.
 * @csspart title - The title link (a `<span>` when `href` is empty).
 */
export class HtLinkPreviewRow extends LitElement {
  static properties = {
    /** Short ID before the title, e.g. `sc-482`. */
    key: {},
    /** Where the title goes. Without it the title is plain text. */
    href: {},
    /** Link target. `_blank` also sets `rel="noopener noreferrer"`. */
    target: {},
  };

  declare key: string;
  declare href: string;
  declare target: string;

  constructor() {
    super();
    this.key = '';
    this.href = '';
    this.target = '';
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'listitem');
  }

  static styles = css`
    :host {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 30px;
      padding: 0 12px;
      font: 400 0.75rem/1.3 var(--ht-font-ui);
      color: var(--ht-text-muted);
    }
    .key {
      flex: none;
      font: 400 0.6875rem/1 var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-subtle);
    }
    .title {
      flex: 1;
      min-width: 56px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: inherit;
      text-decoration: none;
      border-radius: var(--ht-radius-sm);
    }
    a.title:hover { color: var(--ht-text); text-decoration: underline; text-underline-offset: 2px; }
    a.title:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; color: var(--ht-text); }
    ::slotted([slot='status']) { flex: none; }
  `;

  render() {
    const title = this.href
      ? html`<a
          part="title"
          class="title"
          href=${this.href}
          target=${ifDefined(this.target || undefined)}
          rel=${ifDefined(relFor(this.target))}
          ><slot></slot
        ></a>`
      : html`<span part="title" class="title"><slot></slot></span>`;
    return html`${this.key ? html`<span part="key" class="key">${this.key}</span>` : nothing}${title}<slot
        name="status"
      ></slot>`;
  }
}

if (!customElements.get('ht-link-preview')) customElements.define('ht-link-preview', HtLinkPreview);
if (!customElements.get('ht-link-preview-row')) customElements.define('ht-link-preview-row', HtLinkPreviewRow);

declare global {
  interface HTMLElementTagNameMap {
    'ht-link-preview': HtLinkPreview;
    'ht-link-preview-row': HtLinkPreviewRow;
  }
}
