import { LitElement, css, html, nothing } from 'lit';

/**
 * Modal confirmation on the native `<dialog>`, with `role="alertdialog"`. It interrupts to ask
 * one question, so it has no close button and no light dismiss: only the two actions, or
 * Escape (which counts as cancel), close it. Initial focus lands on the cancel action, so a
 * reflexive Enter never confirms. Focus returns to the element that opened it.
 *
 * The footer repeats `ht-dialog`'s signature: two flat actions flush to the bottom edge, the
 * confirm action first with a mixed-radius corner. The buttons are drawn locally, so this file
 * does not depend on `ht-button`.
 *
 * `confirm` and `cancel` are cancelable. Call `preventDefault()` on `confirm` to keep the dialog
 * open while an async action runs, then set `open = false` yourself.
 *
 * @tag ht-alert-dialog
 * @summary Confirmation dialog.
 *
 * @slot - Extra body content, after `description`.
 * @slot title - Replaces the `heading` text.
 *
 * @csspart dialog - The native `<dialog>`.
 * @csspart header - The header row.
 * @csspart body - The body.
 * @csspart footer - The footer row.
 * @csspart confirm - The confirm button.
 * @csspart cancel - The cancel button.
 *
 * @cssprop [--ht-alert-dialog-width=28rem] - Maximum dialog width.
 *
 * @fires confirm - The confirm action was chosen. Cancelable; does not bubble.
 * @fires cancel - The cancel action or Escape was chosen. Cancelable when it comes from the button or a first Escape; does not bubble.
 */
export class HtAlertDialog extends LitElement {
  static properties = {
    /** Shows the dialog. Reflects: closing from inside updates it. */
    open: { type: Boolean, reflect: true },
    /** Title text. Use the `title` slot for anything richer. */
    heading: {},
    /** Small uppercase mono label above the title. */
    eyebrow: {},
    /** Body text under the title. Use the default slot for anything richer. */
    description: {},
    /** `danger` colours the header and the confirm action for destructive questions. */
    tone: { reflect: true },
    /** Text of the confirm action. */
    confirmLabel: { attribute: 'confirm-label' },
    /** Text of the cancel action. */
    cancelLabel: { attribute: 'cancel-label' },
  };

  declare open: boolean;
  declare heading: string;
  declare eyebrow: string;
  declare description: string;
  declare tone: 'default' | 'danger';
  declare confirmLabel: string;
  declare cancelLabel: string;

  #settled = false;

  constructor() {
    super();
    this.open = false;
    this.heading = '';
    this.eyebrow = '';
    this.description = '';
    this.tone = 'default';
    this.confirmLabel = 'Confirm';
    this.cancelLabel = 'Cancel';
  }

  static styles = css`
    :host { display: contents; }
    dialog {
      box-sizing: border-box;
      width: min(var(--ht-alert-dialog-width, 28rem), calc(100vw - 2rem));
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
    dialog[open] {
      display: flex;
      flex-direction: column;
      animation: pop var(--ht-duration) var(--ht-ease);
    }
    dialog[open]::backdrop { animation: fade var(--ht-duration) var(--ht-ease); }
    @keyframes pop { from { opacity: 0; transform: translateY(4px) scale(0.98); } }
    @keyframes fade { from { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) {
      dialog[open], dialog[open]::backdrop { animation: none; }
    }
    header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: var(--ht-halftone), var(--ht-surface-muted);
      border-bottom: 1px solid var(--ht-border);
    }
    :host([tone='danger']) header {
      background: var(--ht-danger-soft);
      border-bottom-color: color-mix(in oklab, var(--ht-danger) 35%, var(--ht-border));
    }
    .icon { flex: none; width: 20px; height: 20px; margin-top: 2px; color: var(--ht-danger-text); }
    .eyebrow {
      display: block;
      margin-bottom: 2px;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }
    :host([tone='danger']) .eyebrow { color: var(--ht-danger-text); }
    h2 { margin: 0; font: 600 1.125rem/1.25 var(--ht-font-display); letter-spacing: 0.01em; }
    .body { padding: 16px; overflow: auto; font: 400 0.875rem/1.5 var(--ht-font-ui); }
    .body p { margin: 0; }
    footer {
      display: flex;
      gap: 16px;
      align-items: stretch;
      border-top: 1px solid var(--ht-border);
    }
    /* The flush-button signature from ht-dialog: flat faces, 44px tall, mixed corner radii. */
    .act {
      all: unset;
      box-sizing: border-box;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding-inline: 1.5rem;
      font: 700 0.875rem/1rem var(--ht-font-ui);
      text-align: center;
      cursor: pointer;
      user-select: none;
      transition: filter var(--ht-duration);
    }
    .act:hover { filter: brightness(0.96); }
    .act:active { filter: brightness(0.92); }
    .confirm {
      color: var(--ht-accent-ink);
      background: var(--ht-accent);
      border-radius: 0 var(--ht-radius-md) 0 var(--ht-radius-lg);
    }
    :host([tone='danger']) .confirm { color: var(--ht-danger-ink); background: var(--ht-danger); }
    .cancel {
      color: var(--ht-text);
      background: var(--ht-surface-muted);
      border-radius: var(--ht-radius-md) var(--ht-radius-md) 0 0;
    }
    .confirm:focus-visible { outline: 2px dotted currentColor; outline-offset: -5px; }
    .cancel:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    @media (prefers-reduced-motion: reduce) {
      .act { transition: none; }
    }
  `;

  /** Opens the dialog. */
  show() {
    this.open = true;
  }
  /** Closes the dialog without firing `confirm` or `cancel`. */
  close() {
    this.#settled = true;
    this.open = false;
  }

  get #dialog() {
    return this.renderRoot.querySelector('dialog');
  }

  updated(changed: Map<string, unknown>) {
    if (!changed.has('open')) return;
    const dialog = this.#dialog;
    if (!dialog) return;
    if (this.open && !dialog.open) {
      this.#settled = false;
      dialog.showModal();
      this.renderRoot.querySelector<HTMLElement>('.cancel')?.focus();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#settled = true;
    this.#dialog?.close();
  }

  /** Fires the event; the dialog closes unless a listener cancelled it. */
  #choose(kind: 'confirm' | 'cancel') {
    const proceed = this.dispatchEvent(new Event(kind, { cancelable: true }));
    if (proceed) this.close();
  }

  // Escape is a cancel request, routed through the same cancelable event as the button.
  #onCancel = (e: Event) => {
    if (e.target !== e.currentTarget) return; // a bubbling `cancel` from slotted content is not ours
    e.preventDefault();
    this.#choose('cancel');
  };

  #onClose = () => {
    this.open = false;
    // The browser closed the dialog itself (a second Escape after a cancelled one): report it.
    if (!this.#settled) this.dispatchEvent(new Event('cancel'));
    this.#settled = true;
  };

  render() {
    const danger = this.tone === 'danger';
    return html`
      <dialog
        part="dialog"
        role="alertdialog"
        aria-labelledby="title"
        aria-describedby="desc"
        @cancel=${this.#onCancel}
        @close=${this.#onClose}
      >
        <header part="header">
          ${danger
            ? html`<svg class="icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M240.26,186.1,152.81,34.23h0a28.74,28.74,0,0,0-49.62,0L15.74,186.1a27.45,27.45,0,0,0,0,27.71A28.31,28.31,0,0,0,40.55,228h174.9a28.31,28.31,0,0,0,24.79-14.19A27.45,27.45,0,0,0,240.26,186.1Zm-20.8,15.7a4.46,4.46,0,0,1-4,2.2H40.55a4.46,4.46,0,0,1-4-2.2,3.56,3.56,0,0,1,0-3.73L124,46.2a4.77,4.77,0,0,1,8,0l87.44,151.87A3.56,3.56,0,0,1,219.46,201.8ZM116,136V104a12,12,0,0,1,24,0v32a12,12,0,0,1-24,0Zm28,40a16,16,0,1,1-16-16A16,16,0,0,1,144,176Z"/></svg>`
            : nothing}
          <div>
            ${this.eyebrow ? html`<span class="eyebrow">${this.eyebrow}</span>` : nothing}
            <h2 id="title"><slot name="title">${this.heading}</slot></h2>
          </div>
        </header>
        <div part="body" class="body" id="desc">
          ${this.description ? html`<p>${this.description}</p>` : nothing}
          <slot></slot>
        </div>
        <footer part="footer">
          <button part="confirm" class="act confirm" type="button" @click=${() => this.#choose('confirm')}>${this.confirmLabel}</button>
          <button part="cancel" class="act cancel" type="button" @click=${() => this.#choose('cancel')}>${this.cancelLabel}</button>
        </footer>
      </dialog>
    `;
  }
}

if (!customElements.get('ht-alert-dialog')) customElements.define('ht-alert-dialog', HtAlertDialog);

declare global {
  interface HTMLElementTagNameMap {
    'ht-alert-dialog': HtAlertDialog;
  }
}
