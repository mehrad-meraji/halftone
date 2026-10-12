import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * On/off switch: a 40x24 track with a raised square knob that carries a cross or a tick,
 * styled after the settings toggles in Sentry's app. Form-associated.
 *
 * @tag ht-switch
 * @summary Boolean switch.
 *
 * @slot - Label text shown beside the switch.
 *
 * @csspart track - The track.
 * @csspart knob - The sliding knob.
 * @csspart label - The label text.
 *
 * @fires change - Toggled by the user. Re-dispatched from the host.
 */
export class HtSwitch extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** On or off. */
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** Accessible name when there is no slotted label text. `aria-label` on the element is forwarded here. */
    label: {},
    name: {},
    /** Value submitted with the form when on. */
    value: {},
    _formDisabled: { state: true },
  };

  declare checked: boolean;
  declare disabled: boolean;
  declare label: string;
  declare name: string;
  declare value: string;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #defaultChecked = false;

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.label = '';
    this.name = '';
    this.value = 'on';
    this._formDisabled = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultChecked = this.hasAttribute('checked');
    // `aria-label` is not allowed on a generic host; move it to the native input.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.label = al;
      this.removeAttribute('aria-label');
    }
  }

  static styles = css`
    :host { display: inline-block; }
    label {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
    }
    :host([disabled]) label { cursor: not-allowed; opacity: 0.6; }
    .track {
      position: relative;
      flex: none;
      width: 40px;
      height: 24px;
      border-radius: 5px;
      background: color-mix(in oklch, var(--ht-text) 3%, transparent);
      box-shadow: inset 0 1px 0 0 var(--ht-border);
      transition: background-color 120ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    :host([checked]) .track { background: var(--ht-accent-soft); }
    input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }
    .knob {
      position: absolute;
      top: 0;
      left: 0;
      width: 24px;
      height: 24px;
      box-sizing: border-box;
      display: grid;
      place-items: center;
      color: var(--ht-text-muted);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-radius: 5px;
      transform: translate(0, -1px);
      transition: transform 0.35s linear(0 0%, 0.2949 9.09%, 0.6842 18.18%, 0.911 27.27%, 0.9988 36.36%, 1.0172 45.45%, 1.0129 54.55%, 1.006 63.64%, 1.0018 72.73%, 1.0001 81.82%, 1 100%);
      pointer-events: none;
    }
    :host([checked]) .knob { transform: translate(16px, -1px); color: var(--ht-accent-text); }
    .track:has(input:hover):not(:has(input:disabled)) .knob { transform: translate(0, -2px); }
    :host([checked]) .track:has(input:hover):not(:has(input:disabled)) .knob { transform: translate(16px, -2px); }
    .track:has(input:focus-visible) { outline: 2px solid var(--ht-focus); outline-offset: 2px; border-radius: 5px; }
    svg { grid-area: 1 / 1; transition: opacity 120ms; }
    .off { opacity: 1; }
    .on { opacity: 0; }
    :host([checked]) .off { opacity: 0; }
    :host([checked]) .on { opacity: 1; }
  `;

  get form() {
    return this.#internals.form;
  }
  formResetCallback() {
    this.checked = this.#defaultChecked;
  }
  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
  }
  formStateRestoreCallback(state: string | null) {
    this.checked = state !== null;
  }

  updated() {
    this.#internals.setFormValue(this.checked ? this.value : null);
  }

  #onChange = (e: Event) => {
    this.checked = (e.target as HTMLInputElement).checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  render() {
    return html`<label>
      <span part="track" class="track">
        <input
          type="checkbox"
          role="switch"
          .checked=${this.checked}
          ?disabled=${this.disabled || this._formDisabled}
          name=${ifDefined(this.name || undefined)}
          aria-label=${ifDefined(this.label || undefined)}
          @change=${this.#onChange}
        />
        <span part="knob" class="knob" aria-hidden="true">
          <svg class="off" width="14" height="14" viewBox="0 0 16 16"><path d="M3.5 3.5l9 9m0-9l-9 9" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>
          <svg class="on" width="14" height="14" viewBox="0 0 16 16"><path d="M3 8.5l3.5 3.5L13 4.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </span>
      <span part="label"><slot></slot></span>
    </label>`;
  }
}

if (!customElements.get('ht-switch')) customElements.define('ht-switch', HtSwitch);

declare global {
  interface HTMLElementTagNameMap {
    'ht-switch': HtSwitch;
  }
}
