import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

/**
 * Multi-line text field with label, helper and error text. Same look and API as `ht-input`:
 * participates in forms, constraint validation and form reset like a native `<textarea>`.
 * For a chat-style command box with trailing actions use `ht-prompt` instead.
 *
 * @tag ht-textarea
 * @summary Multi-line text field.
 *
 * @csspart label - The label element.
 * @csspart control - The bordered box around the native textarea.
 * @csspart textarea - The native `<textarea>`.
 * @csspart message - The helper or error text.
 * @csspart counter - The character counter.
 *
 * @cssprop [--ht-textarea-padding-x] - Inline padding inside the box. Defaults to 1rem (0 with `bare`).
 *
 * @fires input - Value changed by typing. Native event, crosses the shadow boundary.
 * @fires change - Value committed (blur). Re-dispatched from the host.
 */
export class HtTextarea extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** Visible label. With no visible label, set `aria-label` on the element instead; it is forwarded to the native textarea. */
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
    name: {},
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    /** Visible lines. With `autosize` this is the minimum. */
    rows: { type: Number },
    /** Grows with its content instead of showing a scrollbar. The manual resize handle is removed. */
    autosize: { type: Boolean, reflect: true },
    /** With `autosize`, the line count at which growth stops and the field scrolls. 0 means no limit. */
    maxRows: { type: Number, attribute: 'max-rows' },
    /** Maximum number of characters. The browser stops typing at the limit. */
    maxLength: { type: Number, attribute: 'maxlength' },
    /** Shows `length / maxlength` under the field. Needs `maxlength`. */
    counter: { type: Boolean, reflect: true },
    /** Drops the box: no fill, border or padding. For text that sits inside other content, such as a document description. The focus ring stays. */
    bare: { type: Boolean, reflect: true },
    /** Fills the height of the host instead of using `rows`. Give the host a height, or put it in a flex or grid cell that has one. */
    fill: { type: Boolean, reflect: true },
    /** Manual resize handle: `vertical` (default) or `none`. `autosize` and `fill` always turn it off. */
    resize: { reflect: true },
    /** Uses the mono font, for code and Markdown. */
    mono: { type: Boolean, reflect: true },
    /** Value the field starts with, and returns to on form reset. `value` wins when both are set. */
    defaultValue: { attribute: 'default-value' },
    /** Fewest characters. */
    minLength: { type: Number, attribute: 'minlength' },
    _touched: { state: true },
    _formDisabled: { state: true },
  };

  declare label: string;
  declare helper: string;
  declare error: string;
  declare invalid: boolean;
  declare placeholder: string;
  declare value: string;
  declare name: string;
  declare required: boolean;
  declare disabled: boolean;
  declare readonly: boolean;
  declare rows: number;
  declare autosize: boolean;
  declare maxRows: number;
  declare maxLength: number | undefined;
  declare counter: boolean;
  declare bare: boolean;
  declare fill: boolean;
  declare resize: 'vertical' | 'none';
  declare mono: boolean;
  declare defaultValue: string;
  declare minLength: number | undefined;
  declare _touched: boolean;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #defaultValue = '';
  #ariaLabel: string | undefined;
  #width = 0;

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
  #observer: ResizeObserver | undefined;

  constructor() {
    super();
    this.label = '';
    this.helper = '';
    this.error = '';
    this.invalid = false;
    this.placeholder = '';
    this.value = '';
    this.name = '';
    this.required = false;
    this.disabled = false;
    this.readonly = false;
    this.rows = 3;
    this.autosize = false;
    this.maxRows = 0;
    this.maxLength = undefined;
    this.counter = false;
    this.bare = false;
    this.fill = false;
    this.resize = 'vertical';
    this.mono = false;
    this.defaultValue = '';
    this.minLength = undefined;
    this._touched = false;
    this._formDisabled = false;
    this.addEventListener('invalid', () => (this._touched = true));
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? this.defaultValue;
    // `aria-label` is not allowed on a generic host; move it to the native textarea.
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
    // Wrapping changes with the width, so an autosizing field has to measure again.
    this.#observer = new ResizeObserver(() => {
      const w = this.clientWidth;
      if (w === this.#width) return;
      this.#width = w;
      if (this.autosize) this.#grow();
    });
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
  }

  static styles = css`
    :host { display: block; }
    :host([fill]) { display: flex; flex-direction: column; height: 100%; min-height: 0; }
    :host([fill]) .control { flex: 1; min-height: 0; }
    :host([fill]) textarea { height: 100%; }
    label {
      display: block;
      margin-bottom: 6px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .req { color: var(--ht-accent-text); margin-left: 2px; }
    /* Same field as ht-input: faint tint, 1px border, a 1px inset line along the top edge. */
    .control {
      box-sizing: border-box;
      display: flex;
      padding: 8px var(--ht-textarea-padding-x, 1rem);
      color: var(--ht-text-subtle);
      background: color-mix(in oklch, var(--ht-text) 3%, transparent);
      border: 1px solid var(--ht-border-input);
      border-radius: var(--ht-radius-md);
      box-shadow: inset 0 1px 0 0 var(--ht-border-input);
      transition: border var(--ht-duration) var(--ht-ease), box-shadow var(--ht-duration) var(--ht-ease);
    }
    .control:focus-within {
      box-shadow: inset 0 1px 0 0 var(--ht-border-input), 0 0 0 2px var(--ht-focus);
    }
    :host([bare]) .control {
      padding-inline: var(--ht-textarea-padding-x, 0);
      background: none;
      border-color: transparent;
      box-shadow: none;
    }
    :host([bare]) .control:focus-within { box-shadow: 0 0 0 2px var(--ht-focus); }
    :host([bare]) .control.invalid { box-shadow: none; }
    .control.invalid { border-color: var(--ht-danger); box-shadow: inset 0 1px 0 0 var(--ht-danger); }
    .control.invalid:focus-within { box-shadow: inset 0 1px 0 0 var(--ht-danger), 0 0 0 2px var(--ht-danger); }
    :host([disabled]) .control { cursor: not-allowed; }
    textarea {
      all: unset;
      /* After all: unset the field would inherit the page's alignment (a centred hero centred the text). */
      text-align: start;
      box-sizing: border-box;
      display: block;
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font: 400 0.875rem/1.5 var(--ht-font-ui);
      color: var(--ht-text);
      resize: vertical;
    }
    :host([resize='none']) textarea, :host([autosize]) textarea, :host([fill]) textarea { resize: none; }
    :host([mono]) textarea { font-family: var(--ht-font-mono); }
    textarea:disabled { color: var(--ht-text-subtle); cursor: not-allowed; }
    textarea::placeholder { color: var(--ht-text-subtle); }
    .foot { display: flex; align-items: flex-start; gap: 12px; margin-top: 6px; }
    .message {
      flex: 1;
      min-width: 0;
      font: 400 0.75rem/1.3 var(--ht-font-ui);
      color: var(--ht-text-muted);
    }
    .message.error { color: var(--ht-danger-text); }
    .counter {
      flex: none;
      margin-inline-start: auto;
      font: 400 0.75rem/1.3 var(--ht-font-ui);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-muted);
    }
    .counter.full { color: var(--ht-danger-text); }
  `;

  get #ta() {
    return this.renderRoot.querySelector('textarea');
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

  /** The native `<textarea>` inside, for a caller that needs the caret or the selection. */
  get textareaElement() {
    return this.#ta;
  }
  /** Selects all the text in the field. */
  select() {
    this.#ta?.select();
  }
  /** Sets the selection range in the field. */
  setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none') {
    this.#ta?.setSelectionRange(start, end, direction);
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

  #grow() {
    const ta = this.#ta;
    if (!ta) return;
    if (!this.autosize || this.fill) {
      ta.style.height = '';
      ta.style.maxHeight = '';
      return;
    }
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 21;
    ta.style.maxHeight = this.maxRows > 0 ? `${this.maxRows * lh}px` : '';
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
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
    const ta = this.#ta;
    if (!ta) return;
    this.#grow();
    this.#internals.setFormValue?.(this.value);
    this.#internals.setValidity?.(ta.validity, ta.validationMessage, ta);
  }

  #onInput = (e: Event) => {
    this.value = (e.target as HTMLTextAreaElement).value;
  };
  #onChange = () => {
    this._touched = true;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  render() {
    const native = this._touched ? this.#internals.validationMessage : '';
    const message = this.error || native || this.helper;
    const isInvalid = this.invalid || !!this.error || !!native;
    const showCounter = this.counter && !!this.maxLength;
    const length = this.value.length;
    const external = this.#externalDescription();
    const describedBy = [message ? 'message' : '', showCounter ? 'counter' : '', external ? 'external' : ''].filter(Boolean).join(' ');
    return html`
      ${this.label
        ? html`<label part="label" for="control">${this.label}${this.required
            ? html`<span class="req" aria-hidden="true">*</span>`
            : nothing}</label>`
        : nothing}
      <div part="control" class="control ${isInvalid ? 'invalid' : ''}">
        <textarea
          id="control"
          part="textarea"
          rows=${this.rows}
          .value=${live(this.value)}
          name=${ifDefined(this.name || undefined)}
          placeholder=${ifDefined(this.placeholder || undefined)}
          minlength=${ifDefined(this.minLength || undefined)}
          maxlength=${ifDefined(this.maxLength || undefined)}
          ?required=${this.required}
          ?disabled=${this.disabled || this._formDisabled}
          ?readonly=${this.readonly}
          aria-label=${ifDefined(this.label ? undefined : this.#ariaLabel)}
          aria-invalid=${isInvalid ? 'true' : 'false'}
          aria-describedby=${ifDefined(describedBy || undefined)}
          @input=${this.#onInput}
          @change=${this.#onChange}
          @blur=${() => (this._touched = true)}
        ></textarea>
      </div>
      ${external ? html`<span id="external" hidden>${external}</span>` : nothing}
      ${message || showCounter
        ? html`<div class="foot">
            ${message
              ? html`<div id="message" part="message" class="message ${this.error || native ? 'error' : ''}" role=${ifDefined(this.error || native ? 'alert' : undefined)}>${message}</div>`
              : nothing}
            ${showCounter
              ? html`<div id="counter" part="counter" class="counter ${length >= this.maxLength! ? 'full' : ''}">${length} / ${this.maxLength}</div>`
              : nothing}
          </div>`
        : nothing}
    `;
  }
}

if (!customElements.get('ht-textarea')) customElements.define('ht-textarea', HtTextarea);

declare global {
  interface HTMLElementTagNameMap {
    'ht-textarea': HtTextarea;
  }
}
