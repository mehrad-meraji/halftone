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

  constructor() {
    super();
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
      border: 1px solid var(--ht-border-strong);
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
    footer {
      display: flex;
      gap: 16px;
      align-items: stretch;
      border-top: 1px solid var(--ht-border);
    }
    footer ::slotted(ht-button) {
      --ht-flush-radius: var(--ht-radius-md) var(--ht-radius-md) 0 0;
    }
    footer ::slotted(ht-button:first-child) {
      --ht-flush-radius: 0 var(--ht-radius-md) 0 var(--ht-radius-lg);
    }
    [hidden] { display: none !important; }
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

  updated(changed: Map<string, unknown>) {
    if (!changed.has('open')) return;
    const dialog = this.#dialog;
    if (!dialog) return;
    if (this.open && !dialog.open) dialog.showModal();
    else if (!this.open && dialog.open) dialog.close();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
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
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
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
