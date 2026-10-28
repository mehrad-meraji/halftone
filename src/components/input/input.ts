import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

/**
 * Single-line text field with label, helper and error text, styled like Sentry's app fields. Participates in forms,
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
 * @cssprop [--ht-input-height] - Height of the field. Overrides `size`.
 * @cssprop [--ht-input-padding-x] - Inline padding inside the box. Defaults to 1rem (0 with `bare`).
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
    /** Visible label. With no visible label, set `aria-label` on the element instead; it is forwarded to the native input. */
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
    /** Height: xs 28px, sm 32px, md 36px, lg 40px. */
    size: { reflect: true },
    /** Drops the box: no fill, border or padding. For a field that sits inside other content, such as a title that is edited in place. The focus ring stays. */
    bare: { type: Boolean, reflect: true },
    /** Value the field starts with, and returns to on form reset. `value` wins when both are set. */
    defaultValue: { attribute: 'default-value' },
    /** Lowest value, for `number` and the date and time types. */
    min: {},
    /** Highest value, for `number` and the date and time types. */
    max: {},
    /** Step between valid values, for `number` and the date and time types. `any` allows every value. */
    step: {},
    /** Fewest characters. */
    minLength: { type: Number, attribute: 'minlength' },
    /** Most characters. The browser stops typing at the limit. */
    maxLength: { type: Number, attribute: 'maxlength' },
    /** Regular expression the value has to match. Written without slashes. */
    pattern: {},
    /** Which on-screen keyboard to show: `numeric`, `decimal`, `tel`, `email`, `url`, `search` or `none`. */
    inputMode: { attribute: 'inputmode' },
    /** Label of the Enter key on a touch keyboard: `enter`, `done`, `go`, `next`, `previous`, `search` or `send`. */
    enterKeyHint: { attribute: 'enterkeyhint' },
    /** With `type="email"`, allows several addresses separated by commas. */
    multiple: { type: Boolean, reflect: true },
    _touched: { state: true },
    _formDisabled: { state: true },
  };

  declare label: string;
  declare helper: string;
  declare error: string;
  declare invalid: boolean;
  declare placeholder: string;
  declare value: string;
  declare type:
    | 'text'
    | 'email'
    | 'password'
    | 'search'
    | 'tel'
    | 'url'
    | 'number'
    | 'date'
    | 'time'
    | 'datetime-local'
    | 'month'
    | 'week';
  declare name: string;
  declare autocomplete: string;
  declare required: boolean;
  declare disabled: boolean;
  declare readonly: boolean;
  declare size: 'xs' | 'sm' | 'md' | 'lg';
  declare bare: boolean;
  declare defaultValue: string;
  declare min: string;
  declare max: string;
  declare step: string;
  declare minLength: number | undefined;
  declare maxLength: number | undefined;
  declare pattern: string;
  declare inputMode: string;
  declare enterKeyHint: string;
  declare multiple: boolean;
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
    this.bare = false;
    this.defaultValue = '';
    this.min = '';
    this.max = '';
    this.step = '';
    this.minLength = undefined;
    this.maxLength = undefined;
    this.pattern = '';
    this.inputMode = '';
    this.enterKeyHint = '';
    this.multiple = false;
    this._touched = false;
    this._formDisabled = false;
    this.addEventListener('invalid', () => (this._touched = true));
  }

  #ariaLabel: string | undefined;

  #describedBy = '';

  /** Text of the elements named by a host `aria-describedby`. Ids do not resolve across the shadow boundary, so the text is copied inside. */
  #externalDescription() {
    if (!this.#describedBy) return '';
    const root = this.getRootNode() as Document | ShadowRoot;
    return this.#describedBy
      .split(/\s+/)
      .map((id) => root.getElementById?.(id)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? this.defaultValue;
    // `aria-label` is not allowed on a generic host; move it to the native input.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
    }
    const db = this.getAttribute('aria-describedby');
    if (db) {
      this.#describedBy = db;
      this.removeAttribute('aria-describedby');
    }
  }

  static styles = css`
    :host {
      display: block;
      --_h: 2.25rem;
    }
    :host([size='xs']) { --_h: 1.75rem; }
    :host([size='sm']) { --_h: 2rem; }
    :host([size='lg']) { --_h: 2.5rem; }
    label {
      display: block;
      margin-bottom: 6px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .req { color: var(--ht-accent-text); margin-left: 2px; }
    /* Sentry's field: faint tint, 1px border, a 1px inset line along the top edge. */
    .control {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      height: var(--ht-input-height, var(--_h));
      min-height: var(--ht-input-height, var(--_h));
      padding-inline: var(--ht-input-padding-x, 1rem);
      color: var(--ht-text-subtle);
      background: color-mix(in oklch, var(--ht-text) 3%, transparent);
      border: 1px solid var(--ht-border-input);
      border-radius: var(--ht-radius-md);
      box-shadow: inset 0 1px 0 0 var(--ht-border-input);
      transition: border 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    /* A fixed size, so the icon does not follow the page's font size. An icon with a size attribute keeps it. */
    ::slotted(ht-icon:not([size])), ::slotted(svg) { flex: none; width: 16px; height: 16px; }
    .control:focus-within {
      box-shadow: inset 0 1px 0 0 var(--ht-border-input), 0 0 0 2px var(--ht-focus);
    }
    :host([bare]) .control {
      padding-inline: var(--ht-input-padding-x, 0);
      background: none;
      border-color: transparent;
      box-shadow: none;
    }
    :host([bare]) .control:focus-within { box-shadow: 0 0 0 2px var(--ht-focus); }
    :host([bare]) .control.invalid { box-shadow: none; }
    .control.invalid { border-color: var(--ht-danger); box-shadow: inset 0 1px 0 0 var(--ht-danger); }
    .control.invalid:focus-within { box-shadow: inset 0 1px 0 0 var(--ht-danger), 0 0 0 2px var(--ht-danger); }
    :host([disabled]) .control { cursor: not-allowed; }
    input {
      all: unset;
      /* After all: unset the field would inherit the page's alignment (a centred hero centred the text). */
      text-align: start;
      flex: 1;
      min-width: 0;
      height: 100%;
      font: 400 0.875rem/1rem var(--ht-font-ui);
      color: var(--ht-text);
    }
    input:disabled { color: var(--ht-text-subtle); cursor: not-allowed; }
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

  /** The native `<input>` inside, for a caller that needs the caret or the selection. */
  get inputElement() {
    return this.#input;
  }
  /** Selects all the text in the field. */
  select() {
    this.#input?.select();
  }
  /** Sets the selection range in the field. */
  setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none') {
    this.#input?.setSelectionRange(start, end, direction);
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

  #started = false;
  willUpdate() {
    // The start value applies once. After that `value` is the only source.
    if (!this.#started) {
      this.#started = true;
      if (!this.value && this.defaultValue) this.value = this.defaultValue;
    }
  }

  updated() {
    const input = this.#input;
    if (!input) return;
    // Some DOM shims (jsdom) have no form internals. Skip them so the element still loads.
    this.#internals.setFormValue?.(this.value);
    this.#internals.setValidity?.(input.validity, input.validationMessage, input);
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
    const external = this.#externalDescription();
    const describedBy = [message ? 'message' : '', external ? 'external' : ''].filter(Boolean).join(' ');
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
          min=${ifDefined(this.min || undefined)}
          max=${ifDefined(this.max || undefined)}
          step=${ifDefined(this.step || undefined)}
          minlength=${ifDefined(this.minLength ?? undefined)}
          maxlength=${ifDefined(this.maxLength ?? undefined)}
          pattern=${ifDefined(this.pattern || undefined)}
          inputmode=${ifDefined(this.inputMode || undefined)}
          enterkeyhint=${ifDefined((this.enterKeyHint || undefined) as any)}
          ?multiple=${this.multiple}
          ?required=${this.required}
          ?disabled=${this.disabled || this._formDisabled}
          ?readonly=${this.readonly}
          aria-label=${ifDefined(this.label ? undefined : this.#ariaLabel)}
          aria-invalid=${isInvalid ? 'true' : 'false'}
          aria-describedby=${ifDefined(describedBy || undefined)}
          @input=${this.#onInput}
          @change=${this.#onChange}
          @blur=${() => (this._touched = true)}
        />
        <slot name="suffix"></slot>
      </div>
      ${external ? html`<span id="external" hidden>${external}</span>` : nothing}
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
