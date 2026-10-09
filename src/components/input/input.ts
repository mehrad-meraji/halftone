import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

/**
 * Single-line text field with label, helper and error text. Participates in forms,
 * constraint validation and form reset like a native input.
 *
 * @tag ht-input
 * @summary Text input.
 *
 * @slot prefix - Icon or text before the value.
 * @slot suffix - Icon or text after the value.
 *
 * @csspart label - The label element.
 * @csspart control - The bordered box around the native input.
 * @csspart input - The native `<input>`.
 * @csspart message - The helper or error text.
 *
 * @fires input - Value changed by typing. Native event, crosses the shadow boundary.
 * @fires change - Value committed (blur or Enter). Re-dispatched from the host.
 */
export class HtInput extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** Visible label. Always set one, or give the element an `aria-label`. */
    label: {},
    /** Helper text shown under the field. Replaced by `error` or a validation message. */
    helper: {},
    /** Error text. Setting it marks the field invalid. */
    error: {},
    /** Marks the field invalid without a message. */
    invalid: { type: Boolean, reflect: true },
    placeholder: {},
    /** Current value. */
    value: {},
    type: { reflect: true },
    name: {},
    autocomplete: {},
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    /** Height: sm 28px, md 32px, lg 40px. */
    size: { reflect: true },
    _touched: { state: true },
    _formDisabled: { state: true },
  };

  declare label: string;
  declare helper: string;
  declare error: string;
  declare invalid: boolean;
  declare placeholder: string;
  declare value: string;
  declare type: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
  declare name: string;
  declare autocomplete: string;
  declare required: boolean;
  declare disabled: boolean;
  declare readonly: boolean;
  declare size: 'sm' | 'md' | 'lg';
  declare _touched: boolean;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #defaultValue = '';

  constructor() {
    super();
    this.label = '';
    this.helper = '';
    this.error = '';
    this.invalid = false;
    this.placeholder = '';
    this.value = '';
    this.type = 'text';
    this.name = '';
    this.autocomplete = '';
    this.required = false;
    this.disabled = false;
    this.readonly = false;
    this.size = 'md';
    this._touched = false;
    this._formDisabled = false;
    this.addEventListener('invalid', () => (this._touched = true));
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? '';
  }

  static styles = css`
    :host {
      display: block;
      --_h: 32px;
    }
    :host([size='sm']) { --_h: 28px; }
    :host([size='lg']) { --_h: 40px; }
    label {
      display: block;
      margin-bottom: 6px;
      font: 500 0.8125rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .req { color: var(--ht-accent-text); margin-left: 2px; }
    .control {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      height: var(--_h);
      padding-inline: 10px;
      color: var(--ht-text-subtle);
      background: var(--ht-surface-sunken);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-sm);
      transition: border-color var(--ht-duration) var(--ht-ease), box-shadow var(--ht-duration) var(--ht-ease);
    }
    .control:hover { border-color: var(--ht-border-strong); }
    .control:focus-within {
      border-color: var(--ht-focus);
      box-shadow: 0 0 0 3px var(--ht-accent-soft);
      background: var(--ht-surface);
    }
    .control.invalid { border-color: var(--ht-danger); }
    .control.invalid:focus-within { box-shadow: 0 0 0 3px var(--ht-danger-soft); }
    :host([disabled]) .control { opacity: 0.5; }
    input {
      all: unset;
      flex: 1;
      min-width: 0;
      height: 100%;
      font: 400 0.8125rem/1 var(--ht-font-ui);
      color: var(--ht-text);
    }
    input::placeholder { color: var(--ht-text-subtle); }
    .message {
      margin-top: 6px;
      font: 400 0.75rem/1.3 var(--ht-font-ui);
      color: var(--ht-text-muted);
    }
    .message.error { color: var(--ht-danger-text); }
  `;

  get #input() {
    return this.renderRoot.querySelector('input');
  }

  /** The owning form, if any. */
  get form() {
    return this.#internals.form;
  }
  get validity() {
    return this.#internals.validity;
  }
  get validationMessage() {
    return this.#internals.validationMessage;
  }
  checkValidity() {
    return this.#internals.checkValidity();
  }
  reportValidity() {
    return this.#internals.reportValidity();
  }

  formResetCallback() {
    this.value = this.#defaultValue;
    this._touched = false;
  }
  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
  }
  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  updated() {
    const input = this.#input;
    if (!input) return;
    this.#internals.setFormValue(this.value);
    this.#internals.setValidity(input.validity, input.validationMessage, input);
  }

  #onInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
  };
  #onChange = () => {
    this._touched = true;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  render() {
    const native = this._touched ? this.#internals.validationMessage : '';
    const message = this.error || native || this.helper;
    const isInvalid = this.invalid || !!this.error || !!native;
    return html`
      ${this.label
        ? html`<label part="label" for="control">${this.label}${this.required
            ? html`<span class="req" aria-hidden="true">*</span>`
            : nothing}</label>`
        : nothing}
      <div part="control" class="control ${isInvalid ? 'invalid' : ''}">
        <slot name="prefix"></slot>
        <input
          id="control"
          part="input"
          .value=${live(this.value)}
          type=${this.type}
          name=${ifDefined(this.name || undefined)}
          placeholder=${ifDefined(this.placeholder || undefined)}
          autocomplete=${ifDefined((this.autocomplete || undefined) as any)}
          ?required=${this.required}
          ?disabled=${this.disabled || this._formDisabled}
          ?readonly=${this.readonly}
          aria-invalid=${isInvalid ? 'true' : 'false'}
          aria-describedby=${ifDefined(message ? 'message' : undefined)}
          @input=${this.#onInput}
          @change=${this.#onChange}
          @blur=${() => (this._touched = true)}
        />
        <slot name="suffix"></slot>
      </div>
      ${message
        ? html`<div id="message" part="message" class="message ${this.error || native ? 'error' : ''}" role=${ifDefined(this.error || native ? 'alert' : undefined)}>${message}</div>`
        : nothing}
    `;
  }
}

if (!customElements.get('ht-input')) customElements.define('ht-input', HtInput);

declare global {
  interface HTMLElementTagNameMap {
    'ht-input': HtInput;
  }
}
