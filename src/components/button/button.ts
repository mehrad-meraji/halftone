import { LitElement, css, html } from 'lit';

/**
 * Action button. 1px border, sharp corners, accent fill for the primary action.
 *
 * @tag ht-button
 * @summary Primary action control. Submits or resets its form like a native button.
 *
 * @slot - Button label.
 * @slot prefix - Icon or element before the label.
 * @slot suffix - Icon or element after the label.
 *
 * @csspart base - The inner native `<button>`.
 *
 * @cssprop [--ht-flush-radius=0] - Border radius used when `flush` is set. `ht-dialog` sets this for its footer.
 */
export class HtButton extends LitElement {
  /** @internal */
  static formAssociated = true;

  static properties = {
    /** Visual style. */
    variant: { reflect: true },
    /** Height: xs 24px, sm 28px, md 32px, lg 40px. */
    size: { reflect: true },
    /** Disables interaction and form submission. */
    disabled: { type: Boolean, reflect: true },
    /** Native button behaviour inside a form. */
    type: { reflect: true },
    /** Fills its container's height with no border or shadow. Used in dialog footers. */
    flush: { type: Boolean, reflect: true },
  };

  declare variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  declare size: 'xs' | 'sm' | 'md' | 'lg';
  declare disabled: boolean;
  declare type: 'button' | 'submit' | 'reset';
  declare flush: boolean;

  #internals = this.attachInternals();

  constructor() {
    super();
    this.variant = 'primary';
    this.size = 'md';
    this.disabled = false;
    this.type = 'button';
    this.flush = false;
    // On the host, so a programmatic `el.click()` also submits or resets the form.
    this.addEventListener('click', this.#onClick);
  }

  static styles = css`
    :host {
      display: inline-block;
      --_h: 32px;
    }
    :host([size='xs']) { --_h: 24px; }
    :host([size='sm']) { --_h: 28px; }
    :host([size='lg']) { --_h: 40px; }
    :host([disabled]) {
      pointer-events: none;
      opacity: 0.5;
    }
    :host([variant='primary']) {
      --_bg: var(--ht-accent);
      --_bg-hover: var(--ht-accent-hover);
      --_fg: var(--ht-accent-ink);
      --_bd: var(--ht-accent-hover);
    }
    :host([variant='secondary']) {
      --_bg: var(--ht-surface);
      --_bg-hover: var(--ht-surface-muted);
      --_fg: var(--ht-text);
      --_bd: var(--ht-border-strong);
    }
    :host([variant='ghost']) {
      --_bg: transparent;
      --_bg-hover: var(--ht-surface-muted);
      --_fg: var(--ht-text-muted);
      --_bd: transparent;
    }
    :host([variant='danger']) {
      --_bg: var(--ht-danger);
      --_bg-hover: color-mix(in oklch, var(--ht-danger) 85%, black);
      --_fg: var(--ht-danger-ink);
      --_bd: var(--ht-danger);
    }
    button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5em;
      height: var(--_h);
      padding-inline: calc(var(--_h) * 0.4);
      font: 500 0.8125rem/1 var(--ht-font-ui);
      white-space: nowrap;
      cursor: pointer;
      color: var(--_fg);
      background: var(--_bg);
      border: 1px solid var(--_bd);
      border-radius: var(--ht-radius-sm);
      transition: background var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease);
    }
    button:hover { background: var(--_bg-hover); }
    button:active { transform: translateY(1px); }
    button:focus-visible {
      outline: 2px solid var(--ht-focus);
      outline-offset: 2px;
    }
    :host([variant='ghost']) button:hover { color: var(--ht-text); }

    :host([flush]) { display: flex; }
    :host([flush]) button {
      flex: 1;
      height: auto;
      min-height: 44px;
      padding-inline: 1.5rem;
      font-weight: 700;
      border: 0;
      border-radius: var(--ht-flush-radius, 0);
      position: relative;
      top: 1px;
    }
    :host([flush]) button:active { transform: none; top: 2px; }
  `;

  #onClick = () => {
    if (this.disabled) return;
    const form = this.#internals.form;
    if (!form) return;
    if (this.type === 'submit') form.requestSubmit();
    else if (this.type === 'reset') form.reset();
  };

  render() {
    return html`<button part="base" type="button" ?disabled=${this.disabled}>
      <slot name="prefix"></slot><slot></slot><slot name="suffix"></slot>
    </button>`;
  }
}

if (!customElements.get('ht-button')) customElements.define('ht-button', HtButton);

declare global {
  interface HTMLElementTagNameMap {
    'ht-button': HtButton;
  }
}
