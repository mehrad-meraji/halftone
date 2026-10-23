import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

/**
 * Prompt box: an auto-growing text area in a rounded container with room for trailing
 * actions, after the command box on PostHog's home page. Enter submits, Shift+Enter adds a
 * line. Participates in forms.
 *
 * @tag ht-prompt
 * @summary Multi-line prompt / command input.
 *
 * @slot prefix - Content before the text, e.g. an icon.
 * @slot actions - Trailing controls, aligned to the bottom edge. Put an `ht-button` or `ht-kbd` here.
 *
 * @csspart base - The rounded container.
 * @csspart textarea - The native `<textarea>`.
 *
 * @cssprop [--ht-prompt-max-height=300px] - Height at which the text area stops growing and scrolls.
 *
 * @fires ht-submit - Enter was pressed with a non-empty value. `detail.value` holds the text. Cancel it to stop form submission.
 * @fires input - Value changed. Native event, crosses the shadow boundary.
 * @fires change - Value committed on blur. Re-dispatched from the host.
 */
export class HtPrompt extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** Current text. */
    value: {},
    /** Main placeholder text. Also the accessible name unless `label` is set. */
    placeholder: {},
    /** Muted text that follows the placeholder, e.g. `/ for commands`. */
    hint: {},
    /** Accessible name. Falls back to `placeholder`. */
    label: {},
    name: {},
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    _empty: { state: true },
    _formDisabled: { state: true },
  };

  declare value: string;
  declare placeholder: string;
  declare hint: string;
  declare label: string;
  declare name: string;
  declare required: boolean;
  declare disabled: boolean;
  declare _empty: boolean;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #defaultValue = '';

  constructor() {
    super();
    this.value = '';
    this.placeholder = '';
    this.hint = '';
    this.label = '';
    this.name = '';
    this.required = false;
    this.disabled = false;
    this._empty = true;
    this._formDisabled = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? '';
  }

  static styles = css`
    :host { display: block; }
    :host([disabled]) { opacity: 0.55; }
    .box {
      box-sizing: border-box;
      display: flex;
      align-items: flex-end;
      gap: 4px;
      width: 100%;
      min-height: 40px;
      padding: 4px;
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-input);
      border-radius: var(--ht-radius-lg);
      box-shadow: 0 0 0 0 transparent;
      cursor: text;
      transition: box-shadow 0.1s ease-in-out, border-color 0.1s ease-in-out;
    }
    .box:hover { border-color: var(--ht-text-muted); }
    .box:focus-within {
      border-color: var(--ht-text-muted);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--ht-text) 7.5%, transparent);
    }
    :host([disabled]) .box { cursor: not-allowed; }
    .field { position: relative; flex: 1; min-width: 0; display: flex; }
    textarea {
      all: unset;
      /* After all: unset the field would inherit the page's alignment (a centred hero centred the text). */
      text-align: start;
      box-sizing: border-box;
      flex: 1;
      min-width: 0;
      min-height: 30px;
      max-height: var(--ht-prompt-max-height, 300px);
      padding: 4px;
      overflow-y: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      resize: none;
    }
    textarea:disabled { cursor: not-allowed; }
    .ph {
      position: absolute;
      inset: 0;
      padding: 4px;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text-muted);
      pointer-events: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ph .hint { color: var(--ht-text-subtle); }
    .actions { display: flex; align-items: center; gap: 4px; flex: none; }
    ::slotted([slot='prefix']) { align-self: center; flex: none; margin-inline: 4px 0; }
  `;

  get #ta() {
    return this.renderRoot.querySelector('textarea');
  }

  /** The owning form, if any. */
  get form() {
    return this.#internals.form;
  }
  checkValidity() {
    return this.#internals.checkValidity();
  }
  reportValidity() {
    return this.#internals.reportValidity();
  }
  /** Empties the field and refocuses it. */
  clear() {
    this.value = '';
    this.#ta?.focus();
  }

  formResetCallback() {
    this.value = this.#defaultValue;
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
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }

  updated() {
    const ta = this.#ta;
    if (!ta) return;
    this._empty = this.value === '';
    this.#grow();
    this.#internals.setFormValue(this.value);
    this.#internals.setValidity(ta.validity, ta.validationMessage, ta);
  }

  #onInput = (e: Event) => {
    this.value = (e.target as HTMLTextAreaElement).value;
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    const value = this.value.trim();
    if (!value) return;
    const ok = this.dispatchEvent(
      new CustomEvent('ht-submit', { detail: { value }, bubbles: true, composed: true, cancelable: true }),
    );
    if (ok) this.form?.requestSubmit();
  };

  render() {
    const name = this.label || this.placeholder || undefined;
    return html`
      <div part="base" class="box" @click=${() => this.#ta?.focus()}>
        <slot name="prefix"></slot>
        <div class="field">
          ${this._empty && (this.placeholder || this.hint)
            ? html`<span class="ph" aria-hidden="true" aria-disabled=${this.disabled || this._formDisabled ? 'true' : 'false'}>${this.placeholder}${this.hint
                ? html` <span class="hint">${this.hint}</span>`
                : nothing}</span>`
            : nothing}
          <textarea
            part="textarea"
            rows="1"
            .value=${live(this.value)}
            name=${ifDefined(this.name || undefined)}
            aria-label=${ifDefined(name)}
            ?required=${this.required}
            ?disabled=${this.disabled || this._formDisabled}
            @input=${this.#onInput}
            @keydown=${this.#onKeydown}
            @change=${() => this.dispatchEvent(new Event('change', { bubbles: true }))}
          ></textarea>
        </div>
        <div class="actions"><slot name="actions"></slot></div>
      </div>
    `;
  }
}

if (!customElements.get('ht-prompt')) customElements.define('ht-prompt', HtPrompt);

declare global {
  interface HTMLElementTagNameMap {
    'ht-prompt': HtPrompt;
  }
}
