import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Side drawer on the native `<dialog>`: focus trap, Escape to close and top-layer stacking
 * come from the browser. It slides in from an edge with a fading scrim, and slides back out
 * on close. Under `prefers-reduced-motion` it appears and disappears at once.
 *
 * Same header strip as `ht-dialog` (eyebrow, title, close button). The footer is a plain
 * row of actions, right-aligned, because a drawer's actions sit in a column of content, not
 * on a card's bottom edge.
 *
 * @tag ht-sheet
 * @summary Side drawer.
 *
 * @slot - Sheet body.
 * @slot title - Replaces the `heading` text.
 * @slot footer - Action row. Hidden when empty.
 *
 * @csspart dialog - The native `<dialog>`.
 * @csspart header - The header row.
 * @csspart body - The scrolling body.
 * @csspart footer - The footer row.
 *
 * @cssprop [--ht-sheet-size] - Overrides `size`: width for left and right sheets, maximum height for top and bottom.
 *
 * @fires ht-close - The sheet closed, by any route (Escape, backdrop, close button, `open = false`).
 */
export class HtSheet extends LitElement {
  static properties = {
    /** Liquid glass look: a translucent panel that blurs what is behind it, with a bright rim and a sheen. */
    glass: { type: Boolean, reflect: true },
    /** Shows the sheet. Reflects: closing from inside updates it. */
    open: { type: Boolean, reflect: true },
    /** The edge the sheet slides in from. */
    side: { reflect: true },
    /** `sm` 20rem, `md` 24rem, `lg` 32rem, `xl` 40rem. Width for left and right, maximum height for top and bottom. */
    size: { reflect: true },
    /** Title text. Use the `title` slot for anything richer. */
    heading: {},
    /** Small uppercase mono label above the title. */
    eyebrow: {},
    /** Blocks Escape and backdrop-click dismissal and hides the close button. */
    persistent: { type: Boolean, reflect: true },
    _hasFooter: { state: true },
  };

  declare open: boolean;
  declare side: 'left' | 'right' | 'top' | 'bottom';
  declare size: 'sm' | 'md' | 'lg' | 'xl';
  declare heading: string;
  declare eyebrow: string;
  declare persistent: boolean;
  declare _hasFooter: boolean;

  #closing = false;
  #fallback = 0;

  declare glass: boolean;

  constructor() {
    super();
    this.glass = false;
    this.open = false;
    this.side = 'right';
    this.size = 'md';
    this.heading = '';
    this.eyebrow = '';
    this.persistent = false;
    this._hasFooter = false;
  }

  static styles = css`
    :host {
      display: contents;
      --_size: 24rem;
    }
    :host([size='sm']) { --_size: 20rem; }
    :host([size='lg']) { --_size: 32rem; }
    :host([size='xl']) { --_size: 40rem; }
    dialog {
      box-sizing: border-box;
      position: fixed;
      margin: 0;
      padding: 0;
      max-width: none;
      max-height: none;
      overflow: hidden;
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 0 solid var(--ht-border-strong);
      box-shadow: var(--ht-shadow-md);
      --_from: translateX(100%);
    }
    dialog[open] { display: flex; flex-direction: column; animation: slide var(--_dur) var(--ht-ease); }
    dialog[open]::backdrop { animation: fade var(--_dur) var(--ht-ease); }
    dialog.closing { animation: slide var(--_dur) var(--ht-ease) reverse forwards; }
    dialog.closing::backdrop { animation: fade var(--_dur) var(--ht-ease) reverse forwards; }
    dialog::backdrop { background: oklch(0.12 0.02 295 / 0.55); }
    @keyframes slide { from { transform: var(--_from); } }
    @keyframes fade { from { opacity: 0; } }

    /* Left and right: full height, fixed width. Top and bottom: full width, height follows content. */
    :host([side='right']) dialog,
    :host(:not([side])) dialog {
      inset: 0 0 0 auto;
      width: min(var(--ht-sheet-size, var(--_size)), calc(100vw - 2rem));
      height: 100vh;
      height: 100dvh;
      border-left-width: 1px;
    }
    :host([side='left']) dialog {
      inset: 0 auto 0 0;
      width: min(var(--ht-sheet-size, var(--_size)), calc(100vw - 2rem));
      height: 100vh;
      height: 100dvh;
      border-right-width: 1px;
      --_from: translateX(-100%);
    }
    :host([side='top']) dialog {
      inset: 0 0 auto 0;
      width: 100vw;
      height: auto;
      max-height: min(var(--ht-sheet-size, var(--_size)), calc(100vh - 2rem));
      border-bottom-width: 1px;
      --_from: translateY(-100%);
    }
    :host([side='bottom']) dialog {
      inset: auto 0 0 0;
      width: 100vw;
      height: auto;
      max-height: min(var(--ht-sheet-size, var(--_size)), calc(100vh - 2rem));
      border-top-width: 1px;
      --_from: translateY(100%);
    }
    :host { --_dur: calc(var(--ht-duration) * 2); }
    @media (prefers-reduced-motion: reduce) {
      :host { --_dur: 0s; }
      dialog[open], dialog[open]::backdrop, dialog.closing, dialog.closing::backdrop { animation: none; }
    }

    header {
      flex: none;
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
      flex: none;
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
    .body { flex: 1; min-height: 0; padding: 16px; overflow: auto; font: 400 0.875rem/1.5 var(--ht-font-ui); }
    footer {
      flex: none;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
      padding: 12px 16px;
      border-top: 1px solid var(--ht-border);
    }
    [hidden] { display: none !important; }
    :host([glass]) dialog {
      background: var(--ht-glass-panel-bg);
      border-color: transparent;
      box-shadow: var(--ht-glass-rim), var(--ht-glass-shadow);
      -webkit-backdrop-filter: var(--ht-glass-filter);
      backdrop-filter: var(--ht-glass-filter);
    }
    :host([glass]) header {
      background: var(--ht-halftone), color-mix(in oklab, var(--ht-surface) 28%, transparent);
      border-bottom-color: color-mix(in oklab, var(--ht-text) 10%, transparent);
    }
    :host([glass]) footer { border-top-color: color-mix(in oklab, var(--ht-text) 10%, transparent); }
    /* A lighter scrim, so the glass has colour to blur. */
    :host([glass]) dialog::backdrop { background: oklch(0.12 0.02 295 / 0.2); }
  `;

  /** Opens the sheet. */
  show() {
    this.open = true;
  }
  /** Closes the sheet, sliding it out first. */
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
    if (this.open) {
      this.#abortClosing(dialog);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open && !this.#closing) {
      this.#slideOut(dialog);
    }
  }

  #reduced() {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  #slideOut(dialog: HTMLDialogElement) {
    if (this.#reduced()) return dialog.close();
    this.#closing = true;
    dialog.classList.add('closing');
    const done = () => {
      clearTimeout(this.#fallback);
      dialog.removeEventListener('animationend', onEnd);
      if (!this.#closing) return;
      this.#closing = false;
      dialog.classList.remove('closing');
      dialog.close();
    };
    const onEnd = (e: AnimationEvent) => {
      if (e.target === dialog && e.animationName === 'slide') done();
    };
    dialog.addEventListener('animationend', onEnd);
    // Backstop in case the animation never runs (display none, tab in the background).
    this.#fallback = window.setTimeout(done, 500);
  }

  #abortClosing(dialog: HTMLDialogElement) {
    if (!this.#closing) return;
    this.#closing = false;
    clearTimeout(this.#fallback);
    dialog.classList.remove('closing');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#fallback);
    this.#closing = false;
    this.#dialog?.close();
  }

  // Escape: stop the instant close and run the slide-out instead (unless persistent).
  #onCancel = (e: Event) => {
    e.preventDefault();
    if (!this.persistent) this.close();
  };
  #onClose = () => {
    this.#closing = false;
    this.open = false;
    this.dispatchEvent(new Event('ht-close', { bubbles: true, composed: true }));
  };
  #onBackdropClick = (e: MouseEvent) => {
    if (!this.persistent && e.target === e.currentTarget) this.close();
  };
  #onFooterSlot = (e: Event) => {
    this._hasFooter = (e.target as HTMLSlotElement).assignedElements().length > 0;
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

if (!customElements.get('ht-sheet')) customElements.define('ht-sheet', HtSheet);

declare global {
  interface HTMLElementTagNameMap {
    'ht-sheet': HtSheet;
  }
}
