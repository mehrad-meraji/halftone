import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Modal dialog on the native `<dialog>` element: focus trap, Escape to close and
 * top-layer stacking come from the browser.
 *
 * Footer buttons flush to the bottom edge with mixed corner radii (Taskscape's signature).
 * Put the primary action first; `ht-button`s in the footer get `flush` set automatically.
 *
 * @tag ht-dialog
 * @summary Modal dialog.
 *
 * @slot - Dialog body.
 * @slot title - Replaces the `heading` text.
 * @slot footer - Footer buttons. Hidden when empty.
 *
 * @csspart dialog - The native `<dialog>`.
 * @csspart header - The header row.
 * @csspart body - The scrolling body.
 * @csspart footer - The footer row.
 *
 * @cssprop [--ht-dialog-width=32rem] - Maximum dialog width.
 *
 * @fires ht-close - The dialog closed, by any route (Escape, backdrop, close button, `open = false`).
 */
export class HtDialog extends LitElement {
  static properties = {
    /** Liquid glass look: a translucent panel that blurs what is behind it, with a bright rim and a sheen. */
    glass: { type: Boolean, reflect: true },
    /** Shows the dialog. Reflects: closing from inside updates it. */
    open: { type: Boolean, reflect: true },
    /** Title text. Use the `title` slot for anything richer. */
    heading: {},
    /** Small uppercase mono label above the title. */
    eyebrow: {},
    /** Blocks Escape and backdrop-click dismissal and hides the close button. */
    persistent: { type: Boolean, reflect: true },
    _hasFooter: { state: true },
  };

  declare open: boolean;
  declare heading: string;
  declare eyebrow: string;
  declare persistent: boolean;
  declare _hasFooter: boolean;

  declare glass: boolean;

  constructor() {
    super();
    this.glass = false;
    this.open = false;
    this.heading = '';
    this.eyebrow = '';
    this.persistent = false;
    this._hasFooter = false;
  }

  static styles = css`
    :host { display: contents; }
    dialog {
      box-sizing: border-box;
      width: min(var(--ht-dialog-width, 32rem), calc(100vw - 2rem));
      max-height: calc(100vh - 4rem);
      margin: auto;
      padding: 0;
      overflow: hidden;
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 0;
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-md);
    }
    dialog::backdrop { background: oklch(0.12 0.02 295 / 0.55); }
    dialog[open] { display: flex; flex-direction: column; }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      background: var(--ht-halftone), var(--ht-surface-muted);
      border-bottom: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-lg) var(--ht-radius-lg) 0 0;
    }
    .eyebrow {
      display: block;
      margin-bottom: 2px;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }
    h2 { margin: 0; font: 600 1.125rem/1.25 var(--ht-font-display); letter-spacing: 0.01em; }
    .close {
      all: unset;
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      cursor: pointer;
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-sm);
    }
    .close:hover { color: var(--ht-text); background: var(--ht-surface-sunken); }
    .close:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    .body { padding: 16px; overflow: auto; font: 400 0.875rem/1.5 var(--ht-font-ui); }
    /*
     * Cassette keys: the footer buttons sit on the dialog's bottom-left, flush with the left and
     * bottom edges, side by side with a gap. The first (primary) key takes the dialog's corner
     * radius at the bottom left; the others are outlined with rounded tops. Nothing leaves the
     * dialog: keys shrink and wrap long labels before they would pass the right edge.
     */
    footer {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }
    /* Corners follow position, not role. A key on the left edge has no top-left radius and takes the
       dialog's radius at the bottom left; a key on the right edge has no top-right radius and takes it
       at the bottom right. The component sets data-edge-left / data-edge-right by measuring. */
    footer ::slotted(ht-button) {
      flex: 0 1 auto;
      min-width: 0;
      --ht-flush-radius: var(--ht-radius-md) var(--ht-radius-md) 0 0;
    }
    footer ::slotted(ht-button[data-edge-left]) { --ht-flush-radius: 0 var(--ht-radius-md) 0 var(--ht-radius-lg); }
    footer ::slotted(ht-button[data-edge-right]) { --ht-flush-radius: var(--ht-radius-md) 0 var(--ht-radius-lg) 0; }
    footer ::slotted(ht-button[data-edge-left][data-edge-right]) { --ht-flush-radius: 0 0 var(--ht-radius-lg) var(--ht-radius-lg); }
    [hidden] { display: none !important; }
    :host([glass]) dialog {
      background: var(--ht-glass-panel-bg);
      box-shadow: var(--ht-glass-rim), var(--ht-glass-shadow);
      -webkit-backdrop-filter: var(--ht-glass-filter);
      backdrop-filter: var(--ht-glass-filter);
    }
    :host([glass]) header {
      background: var(--ht-halftone), color-mix(in oklab, var(--ht-surface) 28%, transparent);
      border-bottom-color: color-mix(in oklab, var(--ht-text) 10%, transparent);
    }
    /* A lighter scrim, so the glass has colour to blur. */
    :host([glass]) dialog::backdrop { background: oklch(0.12 0.02 295 / 0.2); }
  `;

  /** Opens the dialog. */
  show() {
    this.open = true;
  }
  /** Closes the dialog. */
  close() {
    this.open = false;
  }

  get #dialog() {
    return this.renderRoot.querySelector('dialog');
  }

  #ro?: ResizeObserver;

  firstUpdated() {
    const footer = this.renderRoot.querySelector('footer');
    if (footer) {
      this.#ro = new ResizeObserver(() => this.#syncEdges());
      this.#ro.observe(footer);
    }
  }

  /** Marks the footer keys that touch the left or right edge, so their corners can follow position. */
  #syncEdges = () => {
    const footer = this.renderRoot.querySelector('footer');
    if (!footer || footer.hidden) return;
    const fr = footer.getBoundingClientRect();
    if (fr.width === 0) return;
    const keys = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="footer"]')?.assignedElements() ?? [];
    for (const el of keys) {
      const r = el.getBoundingClientRect();
      el.toggleAttribute('data-edge-left', Math.abs(r.left - fr.left) < 1.5);
      el.toggleAttribute('data-edge-right', Math.abs(fr.right - r.right) < 1.5);
    }
  };

  updated(changed: Map<string, unknown>) {
    if (!changed.has('open')) return;
    const dialog = this.#dialog;
    if (!dialog) return;
    if (this.open && !dialog.open) dialog.showModal();
    else if (!this.open && dialog.open) dialog.close();
    if (this.open) this.#syncEdges();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#ro?.disconnect();
    this.#dialog?.close();
  }

  #onCancel = (e: Event) => {
    if (this.persistent) e.preventDefault();
  };
  #onClose = () => {
    this.open = false;
    this.dispatchEvent(new Event('ht-close', { bubbles: true, composed: true }));
  };
  #onBackdropClick = (e: MouseEvent) => {
    if (!this.persistent && e.target === e.currentTarget) this.close();
  };
  #onFooterSlot = (e: Event) => {
    const nodes = (e.target as HTMLSlotElement).assignedElements();
    this._hasFooter = nodes.length > 0;
    for (const el of nodes) if (el.localName === 'ht-button') el.toggleAttribute('flush', true);
    requestAnimationFrame(() => this.#syncEdges());
  };

  render() {
    return html`
      <dialog
        part="dialog"
        aria-labelledby=${ifDefined(this.heading || this.querySelector('[slot="title"]') ? 'title' : undefined)}
        @cancel=${this.#onCancel}
        @close=${this.#onClose}
        @click=${this.#onBackdropClick}
      >
        <header part="header">
          <div>
            ${this.eyebrow ? html`<span class="eyebrow">${this.eyebrow}</span>` : nothing}
            <h2 id="title"><slot name="title">${this.heading}</slot></h2>
          </div>
          ${this.persistent
            ? nothing
            : html`<button class="close" aria-label="Close" @click=${() => this.close()}>
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"/></svg>
              </button>`}
        </header>
        <div part="body" class="body"><slot></slot></div>
        <footer part="footer" ?hidden=${!this._hasFooter}>
          <slot name="footer" @slotchange=${this.#onFooterSlot}></slot>
        </footer>
      </dialog>
    `;
  }
}

if (!customElements.get('ht-dialog')) customElements.define('ht-dialog', HtDialog);

declare global {
  interface HTMLElementTagNameMap {
    'ht-dialog': HtDialog;
  }
}
