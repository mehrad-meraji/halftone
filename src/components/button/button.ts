import { LitElement, css, html } from 'lit';

/**
 * A comic-panel button: thick ink border, hard offset shadow, presses down on click.
 *
 * @tag ht-button
 * @summary Primary action control. Participates in forms like a native button.
 *
 * @slot - Button label.
 * @slot prefix - Icon or element before the label.
 * @slot suffix - Icon or element after the label.
 *
 * @csspart base - The inner native `<button>`.
 *
 * @cssprop [--ht-color-primary] - Background of the `primary` variant.
 * @cssprop [--ht-border-width] - Border thickness.
 * @cssprop [--ht-shadow-offset] - Hard shadow offset.
 */
export class HtButton extends LitElement {
  static formAssociated = true;

  static properties = {
    /** Visual style. */
    variant: { reflect: true },
    /** Disables interaction and form submission. */
    disabled: { type: Boolean, reflect: true },
    /** Native button type, used for form participation. */
    type: { reflect: true },
    /** Form field name when used as a submit button. */
    name: {},
    /** Form field value when used as a submit button. */
    value: {},
  };

  declare variant: 'primary' | 'secondary' | 'danger';
  declare disabled: boolean;
  declare type: 'button' | 'submit' | 'reset';
  declare name: string;
  declare value: string;

  #internals = this.attachInternals();

  constructor() {
    super();
    this.variant = 'primary';
    this.disabled = false;
    this.type = 'button';
    this.name = '';
    this.value = '';
  }

  static styles = css`
    :host {
      display: inline-block;
    }
    :host([disabled]) {
      pointer-events: none;
      opacity: 0.5;
    }
    button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.6em 1.2em;
      cursor: pointer;
      font-family: var(--ht-font-display, system-ui);
      font-size: 1.1rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--_ink);
      background: var(--_bg);
      border: var(--ht-border-width, 3px) solid var(--ht-color-ink, #14110f);
      border-radius: var(--ht-radius, 4px);
      box-shadow: var(--ht-shadow-offset, 4px) var(--ht-shadow-offset, 4px) 0 var(--ht-color-ink, #14110f);
      transition: transform 80ms, box-shadow 80ms;
    }
    button:hover {
      transform: translate(-1px, -1px);
    }
    button:active {
      transform: translate(var(--ht-shadow-offset, 4px), var(--ht-shadow-offset, 4px));
      box-shadow: 0 0 0 var(--ht-color-ink, #14110f);
    }
    button:focus-visible {
      outline: 3px solid var(--ht-color-focus, #1d4ed8);
      outline-offset: 3px;
    }
    :host([variant='primary']), :host(:not([variant])) {
      --_bg: var(--ht-color-primary, #ffd400);
      --_ink: var(--ht-color-primary-ink, #14110f);
    }
    :host([variant='secondary']) {
      --_bg: var(--ht-color-paper, #fffdf5);
      --_ink: var(--ht-color-ink, #14110f);
    }
    :host([variant='danger']) {
      --_bg: var(--ht-color-danger, #e63946);
      --_ink: var(--ht-color-danger-ink, #fff);
    }
  `;

  #onClick = () => {
    if (this.disabled) return;
    const form = this.#internals.form;
    if (!form) return;
    if (this.type === 'submit') form.requestSubmit();
    else if (this.type === 'reset') form.reset();
  };

  render() {
    return html`<button
      part="base"
      type="button"
      ?disabled=${this.disabled}
      @click=${this.#onClick}
    >
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
