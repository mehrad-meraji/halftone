import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Dropdown built on the native `<select>`: keyboard, mobile pickers and accessibility come
 * from the browser. Give it `<option>` / `<optgroup>` children. Participates in forms.
 *
 * @tag ht-select
 * @summary Select field.
 *
 * @slot - `<option>` and `<optgroup>` elements.
 *
 * @csspart label - The label element.
 * @csspart control - The bordered box.
 * @csspart select - The native `<select>`.
 * @csspart message - The helper or error text.
 *
 * @fires change - A new option was chosen. Re-dispatched from the host.
 */
export class HtSelect extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** Visible label. With no visible label, set `aria-label` on the element instead; it is forwarded to the native select. */
    label: {},
    /** Helper text under the field. */
    helper: {},
    /** Error text. Setting it marks the field invalid. */
    error: {},
    /** Disabled first option shown until the user chooses. */
    placeholder: {},
    /** Selected option value. */
    value: {},
    name: {},
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** Height: sm 32px, md 36px, lg 40px. */
    size: { reflect: true },
    _touched: { state: true },
    _formDisabled: { state: true },
  };

  declare label: string;
  declare helper: string;
  declare error: string;
  declare placeholder: string;
  declare value: string;
  declare name: string;
  declare required: boolean;
  declare disabled: boolean;
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
    this.placeholder = '';
    this.value = '';
    this.name = '';
    this.required = false;
    this.disabled = false;
    this.size = 'md';
    this._touched = false;
    this._formDisabled = false;
    this.addEventListener('invalid', () => (this._touched = true));
  }

  #ariaLabel: string | undefined;

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? '';
    // `aria-label` is not allowed on a generic host; move it to the native select.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
    }
  }

  static styles = css`
    :host { display: block; --_h: 2.25rem; }
    :host([size='sm']) { --_h: 2rem; }
    :host([size='lg']) { --_h: 2.5rem; }
    label {
      display: block;
      margin-bottom: 6px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .req { color: var(--ht-accent-text); margin-left: 2px; }
    .control {
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      height: var(--_h);
      color: var(--ht-text);
      background: color-mix(in oklch, var(--ht-text) 3%, transparent);
      border: 1px solid var(--ht-border-input);
      border-radius: var(--ht-radius-md);
      box-shadow: inset 0 1px 0 0 var(--ht-border-input);
      transition: border 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    .control:focus-within { box-shadow: inset 0 1px 0 0 var(--ht-border-input), 0 0 0 2px var(--ht-focus); }
    .control.invalid { border-color: var(--ht-danger); box-shadow: inset 0 1px 0 0 var(--ht-danger); }
    .control.invalid:focus-within { box-shadow: inset 0 1px 0 0 var(--ht-danger), 0 0 0 2px var(--ht-danger); }
    select {
      all: unset;
      box-sizing: border-box;
      flex: 1;
      min-width: 0;
      height: 100%;
      padding-inline: 1rem 2.25rem;
      font: 400 0.875rem/calc(var(--_h) - 2px) var(--ht-font-ui);
      color: inherit;
      cursor: pointer;
      text-overflow: ellipsis;
    }
    select:disabled { color: var(--ht-text-subtle); cursor: not-allowed; }
    .chevron {
      position: absolute;
      right: 0.75rem;
      pointer-events: none;
      color: var(--ht-text-muted);
    }
    .message { margin-top: 6px; font: 400 0.75rem/1.3 var(--ht-font-ui); color: var(--ht-text-muted); }
    .message.error { color: var(--ht-danger-text); }
  `;

  get #select() {
    return this.renderRoot.querySelector('select');
  }

  get form() {
    return this.#internals.form;
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

  /** Mirrors the light-DOM options into the native select. */
  #syncOptions = () => {
    const select = this.#select;
    if (!select) return;
    const slot = this.renderRoot.querySelector('slot');
    const nodes = (slot?.assignedElements() ?? []).filter((n) => n.localName === 'option' || n.localName === 'optgroup');
    select.replaceChildren();
    if (this.placeholder) {
      const ph = new Option(this.placeholder, '', true, false);
      ph.disabled = true;
      ph.hidden = true;
      select.append(ph);
    }
    for (const n of nodes) select.append(n.cloneNode(true));
    if (!this.value && !this.placeholder) this.value = select.value;
    select.value = this.value;
    this.#commit();
  };

  #commit() {
    const select = this.#select;
    if (!select) return;
    this.#internals.setFormValue(this.value);
    this.#internals.setValidity(select.validity, select.validationMessage, select);
  }

  updated(changed: Map<string, unknown>) {
    const select = this.#select;
    if (!select) return;
    if (changed.has('placeholder')) this.#syncOptions();
    else if (select.value !== this.value) select.value = this.value;
    this.#commit();
  }

  #onChange = (e: Event) => {
    this.value = (e.target as HTMLSelectElement).value;
    this._touched = true;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  render() {
    const native = this._touched ? this.#internals.validationMessage : '';
    const message = this.error || native || this.helper;
    const invalid = !!this.error || !!native;
    return html`
      ${this.label
        ? html`<label part="label" for="control">${this.label}${this.required
            ? html`<span class="req" aria-hidden="true">*</span>`
            : nothing}</label>`
        : nothing}
      <div part="control" class="control ${invalid ? 'invalid' : ''}">
        <select
          id="control"
          part="select"
          name=${ifDefined(this.name || undefined)}
          ?required=${this.required}
          ?disabled=${this.disabled || this._formDisabled}
          aria-label=${ifDefined(this.label ? undefined : this.#ariaLabel)}
          aria-invalid=${invalid ? 'true' : 'false'}
          aria-describedby=${ifDefined(message ? 'message' : undefined)}
          @change=${this.#onChange}
          @blur=${() => (this._touched = true)}
        ></select>
        <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <slot hidden @slotchange=${this.#syncOptions}></slot>
      ${message
        ? html`<div id="message" part="message" class="message ${invalid ? 'error' : ''}" role=${ifDefined(invalid ? 'alert' : undefined)}>${message}</div>`
        : nothing}
    `;
  }

  firstUpdated() {
    this.#syncOptions();
  }
}

if (!customElements.get('ht-select')) customElements.define('ht-select', HtSelect);

declare global {
  interface HTMLElementTagNameMap {
    'ht-select': HtSelect;
  }
}
