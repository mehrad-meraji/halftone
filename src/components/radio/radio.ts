import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * One option in an `ht-radio-group`. Use it inside a group: selection, arrow-key
 * movement and form submission belong to the group. Three sizes: `sm` 16px, `md` 24px
 * (default), `lg` 32px; set `size` on the group to size every option.
 *
 * @tag ht-radio
 * @summary Radio option.
 *
 * @slot - Label text.
 *
 * @csspart box - The circle.
 * @csspart label - The label text.
 */
export class HtRadio extends LitElement {
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** The value the group takes when this option is chosen. Required. */
    value: {},
    /** Set by the group. */
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** Accessible name when there is no slotted text. `aria-label` on the element is forwarded here. */
    label: {},
    /** Circle and label size: `sm` 16px, `md` 24px, `lg` 32px. Unset takes the group's size, else `md`. */
    size: { reflect: true },
    /** @internal Set by the group. */
    _groupDisabled: { state: true },
    /** @internal Set by the group. */
    _groupSize: { state: true },
    /** @internal Set by the group: the roving tab stop. */
    _tabbable: { state: true },
  };

  declare value: string;
  declare checked: boolean;
  declare disabled: boolean;
  declare label: string;
  declare size: 'sm' | 'md' | 'lg' | undefined;
  declare _groupDisabled: boolean;
  declare _groupSize: 'sm' | 'md' | 'lg' | undefined;
  declare _tabbable: boolean;

  constructor() {
    super();
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.label = '';
    this._groupDisabled = false;
    this._groupSize = undefined;
    this._tabbable = false;
  }

  connectedCallback() {
    super.connectedCallback();
    const al = this.getAttribute('aria-label');
    if (al) {
      this.label = al;
      this.removeAttribute('aria-label');
    }
  }

  static styles = css`
    /*
     * Size. The label line height equals the circle, so a one-line label centres on it.
     * sm and lg are inferred, not taken from a source UI. Same steps as ht-checkbox.
     */
    :host {
      display: inline-block;
      --_box: 24px;
      --_gap: 12px;
      --_font: 400 0.875rem/1.5rem var(--ht-font-ui);
    }
    :host([data-size='sm']) { --_box: 16px; --_gap: 8px; --_font: 400 0.8125rem/1rem var(--ht-font-ui); }
    :host([data-size='lg']) { --_box: 32px; --_font: 400 1rem/2rem var(--ht-font-ui); }
    label {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--_gap);
      cursor: pointer;
      font: var(--_font);
      color: var(--ht-text);
    }
    :host([disabled]) label,
    :host([data-group-disabled]) label { cursor: not-allowed; opacity: 0.6; }
    /*
     * A recessed round socket (the box) with a raised, glossy key (the ::after face) when checked.
     * The socket keeps a 1px --ht-border-input outline so the control stays 3:1 against the page.
     */
    .box {
      --_well:
        inset 0 1.5px 2.5px color-mix(in oklab, black 14%, transparent),
        inset 0 0 0 1px color-mix(in oklab, black 4%, transparent),
        0 1px 0 color-mix(in oklab, var(--ht-surface), white 60%);
      position: relative;
      box-sizing: border-box;
      flex: none;
      display: grid;
      place-items: center;
      width: var(--_box);
      height: var(--_box);
      background: linear-gradient(180deg, color-mix(in oklab, var(--ht-surface-sunken), black 3%), var(--ht-surface-sunken));
      border: 1px solid var(--ht-border-input);
      border-radius: 999px;
      box-shadow: var(--_well);
      transition: border-color 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    label:hover .box { border-color: var(--ht-text-muted); }
    /* Checked: the outline turns a faint accent instead of grey. */
    :host([checked]) .box { border-color: color-mix(in oklab, var(--ht-accent) 38%, var(--ht-border-strong)); }
    :host([checked]) label:hover .box { border-color: color-mix(in oklab, var(--ht-accent) 55%, var(--ht-border-strong)); }
    .box::after {
      content: '';
      position: absolute;
      inset: 1px;
      z-index: 0;
      pointer-events: none;
      border-radius: 999px;
      /* Runs accent to 26% darker. */
      background: radial-gradient(
        120% 110% at 50% 0%,
        var(--ht-accent) 0%,
        color-mix(in oklab, var(--ht-accent), black 12%) 55%,
        color-mix(in oklab, var(--ht-accent), black 26%) 100%
      );
      box-shadow:
        inset 0 1px 0 color-mix(in oklab, var(--ht-accent), white 45%),
        inset 0 -1px 2px color-mix(in oklab, var(--ht-accent), black 35%),
        0 1px 2px color-mix(in oklab, black 28%, transparent);
      opacity: 0;
      transform: scale(0.85);
      transition: opacity 120ms cubic-bezier(0.72, 0, 0.16, 1), transform 160ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    :host([checked]) .box::after { opacity: 1; transform: none; }
    label:hover .box::after { filter: brightness(1.05); }
    .box:has(input:active)::after { transform: translateY(0.5px) scale(0.97); }
    /* Positioned inside the 1px border, so -1px covers the whole circle. At sm the hit area grows to 24px (WCAG 2.5.8). */
    input { position: absolute; inset: min(-1px, calc((var(--_box) - 26px) / 2)); z-index: 2; margin: 0; opacity: 0; cursor: inherit; }
    .box:has(input:focus-visible) { box-shadow: var(--_well), 0 0 0 2px var(--ht-surface), 0 0 0 4px var(--ht-focus); }
  `;

  willUpdate() {
    this.toggleAttribute('data-group-disabled', this._groupDisabled);
    this.setAttribute('data-size', this.size || this._groupSize || 'md');
  }

  render() {
    return html`<label>
      <span part="box" class="box">
        <input
          type="radio"
          .checked=${this.checked}
          tabindex=${this._tabbable ? '0' : '-1'}
          ?disabled=${this.disabled || this._groupDisabled}
          aria-label=${ifDefined(this.label || undefined)}
        />
      </span>
      <span part="label"><slot></slot></span>
    </label>`;
  }
}

/**
 * Single-choice group. Owns the value: one radio is checked at a time, arrow keys move
 * and select, and only the checked radio is a tab stop. Form-associated.
 *
 * @tag ht-radio-group
 * @summary Radio group.
 *
 * @slot - `ht-radio` elements.
 *
 * @csspart legend - The legend text.
 * @csspart items - The row or column of radios.
 *
 * @fires change - The selection changed by user action. Read `value` from the host.
 */
export class HtRadioGroup extends LitElement {
  /** @internal */
  static formAssociated = true;

  static properties = {
    /** Group label, announced with each radio. */
    label: {},
    helper: {},
    /** Error text. Announced as an alert. */
    error: {},
    /** Value of the chosen radio. */
    value: { reflect: true },
    name: {},
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** Layout of the items. */
    orientation: { reflect: true },
    /** Size for every radio inside. A radio's own `size` wins. */
    size: { reflect: true },
    _touched: { state: true },
    _formDisabled: { state: true },
  };

  declare label: string;
  declare helper: string;
  declare error: string;
  declare value: string;
  declare name: string;
  declare required: boolean;
  declare disabled: boolean;
  declare orientation: 'vertical' | 'horizontal';
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
    this.value = '';
    this.name = '';
    this.required = false;
    this.disabled = false;
    this.orientation = 'vertical';
    this.size = 'md';
    this._touched = false;
    this._formDisabled = false;
    this.addEventListener('click', (e) => {
      const r = (e.target as Element).closest('ht-radio') as HtRadio | null;
      if (r && r.parentElement === this && !r.disabled && !this.disabled) this.#choose(r);
    });
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusout', () => (this._touched = true));
    this.addEventListener('invalid', () => (this._touched = true));
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? '';
  }

  static styles = css`
    :host { display: block; }
    .legend {
      margin-bottom: 8px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .req { color: var(--ht-accent-text); margin-left: 2px; }
    .items { display: flex; flex-direction: column; gap: 12px; }
    :host([orientation='horizontal']) .items { flex-direction: row; flex-wrap: wrap; gap: 8px 24px; }
    :host([size='sm']) .items { gap: 8px; }
    :host([size='sm'][orientation='horizontal']) .items { gap: 8px 16px; }
    .message { margin-top: 8px; font: 400 0.75rem/1.3 var(--ht-font-ui); color: var(--ht-text-muted); }
    .message.error { color: var(--ht-danger-text); }
  `;

  #radios() {
    return [...this.children].filter((c): c is HtRadio => c.localName === 'ht-radio');
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

  #sync = () => {
    const radios = this.#radios();
    const off = this.disabled || this._formDisabled;
    const stop = radios.find((r) => r.value === this.value && !r.disabled) ?? radios.find((r) => !r.disabled);
    for (const r of radios) {
      r.checked = r.value === this.value;
      r._groupDisabled = off;
      r._groupSize = this.size;
      r._tabbable = !off && r === stop;
    }
  };

  updated() {
    this.#sync();
    this.#internals.setFormValue(this.value || null);
    const missing = this.required && !this.value;
    this.#internals.setValidity(
      missing ? { valueMissing: true } : {},
      missing ? 'Please select one of these options.' : '',
      this.#radios()[0],
    );
  }

  #choose(radio: HtRadio) {
    this._touched = true;
    if (radio.value === this.value) return;
    this.value = radio.value;
    this.#sync();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onKeydown = (e: KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(e.key) || this.disabled) return;
    const radios = this.#radios().filter((r) => !r.disabled);
    const i = radios.findIndex((r) => r === document.activeElement || r.matches(':focus-within'));
    if (i < 0) return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next = radios[(i + step + radios.length) % radios.length];
    next.focus();
    this.#choose(next);
  };

  render() {
    const native = this._touched && this.required && !this.value ? 'Please select one of these options.' : '';
    const message = this.error || native || this.helper;
    const invalid = !!this.error || !!native;
    return html`
      <div
        role="radiogroup"
        aria-labelledby=${ifDefined(this.label ? 'legend' : undefined)}
        aria-describedby=${ifDefined(message ? 'msg' : undefined)}
        aria-required=${this.required ? 'true' : 'false'}
        aria-invalid=${invalid ? 'true' : 'false'}
      >
        ${this.label
          ? html`<div id="legend" part="legend" class="legend">${this.label}${this.required
              ? html`<span class="req" aria-hidden="true">*</span>`
              : nothing}</div>`
          : nothing}
        <div part="items" class="items"><slot @slotchange=${this.#sync}></slot></div>
      </div>
      ${message
        ? html`<div id="msg" class="message ${invalid ? 'error' : ''}" role=${ifDefined(invalid ? 'alert' : undefined)}>${message}</div>`
        : nothing}
    `;
  }
}

for (const [tag, ctor] of [
  ['ht-radio', HtRadio],
  ['ht-radio-group', HtRadioGroup],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-radio': HtRadio;
    'ht-radio-group': HtRadioGroup;
  }
}
