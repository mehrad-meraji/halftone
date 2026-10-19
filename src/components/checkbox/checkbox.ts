import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Checkbox: a 24px box with a tick, a dash for the indeterminate state, and a label slot.
 * Form-associated: submits `value` when checked.
 *
 * @tag ht-checkbox
 * @summary Checkbox.
 *
 * @slot - Label text.
 *
 * @csspart box - The checkbox square.
 * @csspart label - The label text.
 *
 * @fires change - Toggled by the user. Re-dispatched from the host.
 */
export class HtCheckbox extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    checked: { type: Boolean, reflect: true },
    /** A partly-selected state, e.g. a "select all" over a mixed list. Cleared when the user toggles. */
    indeterminate: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    name: {},
    /** Value submitted with the form when checked. */
    value: {},
    /** Accessible name when there is no slotted text. `aria-label` on the element is forwarded here. */
    label: {},
    _groupDisabled: { state: true },
    _formDisabled: { state: true },
  };

  declare checked: boolean;
  declare indeterminate: boolean;
  declare disabled: boolean;
  declare required: boolean;
  declare name: string;
  declare value: string;
  declare label: string;
  declare _groupDisabled: boolean;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #defaultChecked = false;

  constructor() {
    super();
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.required = false;
    this.name = '';
    this.value = 'on';
    this.label = '';
    this._groupDisabled = false;
    this._formDisabled = false;
    // A `<label for>` (or a wrapping label) outside the shadow root clicks the host, not the native
    // input inside it. Pass that click on, so the control toggles like a native one. Clicks from
    // inside are ignored here: the inner label and input already handle them.
    this.addEventListener('click', (e) => {
      if (e.composedPath()[0] !== this) return;
      this.renderRoot.querySelector('input')?.click();
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultChecked = this.hasAttribute('checked');
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
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      font: 400 0.875rem/1.5rem var(--ht-font-ui);
      color: var(--ht-text);
    }
    :host([disabled]) label,
    :host([data-group-disabled]) label { cursor: not-allowed; opacity: 0.6; }
    /*
     * A recessed socket (the box) with a raised, glossy key (the ::after face) that appears when
     * checked. The socket keeps a 1px --ht-border-input outline so the control stays 3:1 against the page.
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
      width: 24px;
      height: 24px;
      color: white;
      background: linear-gradient(180deg, color-mix(in oklab, var(--ht-surface-sunken), black 3%), var(--ht-surface-sunken));
      border: 1px solid var(--ht-border-input);
      border-radius: 7px;
      box-shadow: var(--_well);
      transition: border-color 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    label:hover .box { border-color: var(--ht-text-muted); }
    /* Checked: the outline turns a faint accent instead of grey. */
    :host([checked]) .box,
    :host([indeterminate]) .box { border-color: color-mix(in oklab, var(--ht-accent) 38%, var(--ht-border-strong)); }
    :host([checked]) label:hover .box,
    :host([indeterminate]) label:hover .box { border-color: color-mix(in oklab, var(--ht-accent) 55%, var(--ht-border-strong)); }
    .box::after {
      content: '';
      position: absolute;
      inset: 1px;
      z-index: 0;
      pointer-events: none;
      /* Concentric with the socket: its 7px radius minus the 1px border and 1px gap. */
      border-radius: 5px;
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
    /* Squircle corners where supported; elsewhere the plain rounded corners above stay. */
    @supports (corner-shape: squircle) {
      /* A squircle corner reads tighter than a circular arc of the same radius, so the radii grow (still concentric: 10 minus 1px border minus 1px gap = 8). */
      .box { corner-shape: squircle; border-radius: 10px; }
      .box::after { corner-shape: squircle; border-radius: 8px; }
    }
    :host([checked]) .box::after,
    :host([indeterminate]) .box::after { opacity: 1; transform: none; }
    label:hover .box::after { filter: brightness(1.05); }
    .box:has(input:active)::after { transform: translateY(0.5px) scale(0.97); }
    input {
      position: absolute;
      inset: 0;
      z-index: 2;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }
    .box:has(input:focus-visible) {
      box-shadow: var(--_well), 0 0 0 2px var(--ht-surface), 0 0 0 4px var(--ht-focus);
    }
    svg {
      grid-area: 1 / 1;
      position: relative;
      z-index: 1;
      opacity: 0;
      transform: scale(0.8);
      transition: opacity 120ms, transform 160ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    /* A heavier stroke than the icon's own, so the mark reads as a bold key legend. */
    svg path { stroke: currentColor; stroke-width: 22; stroke-linejoin: round; stroke-linecap: round; }
    :host([checked]:not([indeterminate])) .tick,
    :host([indeterminate]) .dash { opacity: 1; transform: none; }
    .text { padding-block: 0; }
  `;

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
    this.checked = this.#defaultChecked;
    this.indeterminate = false;
  }
  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
  }
  formStateRestoreCallback(state: string | null) {
    this.checked = state !== null;
  }

  willUpdate() {
    this.toggleAttribute('data-group-disabled', this._groupDisabled);
  }

  updated() {
    const input = this.renderRoot.querySelector('input');
    if (!input) return;
    input.indeterminate = this.indeterminate;
    this.#internals.setFormValue(this.checked ? this.value : null);
    this.#internals.setValidity(input.validity, input.validationMessage, input);
  }

  #onChange = (e: Event) => {
    this.checked = (e.target as HTMLInputElement).checked;
    this.indeterminate = false;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  render() {
    return html`<label>
      <span part="box" class="box">
        <input
          type="checkbox"
          .checked=${this.checked}
          ?required=${this.required}
          ?disabled=${this.disabled || this._groupDisabled || this._formDisabled}
          name=${ifDefined(this.name || undefined)}
          aria-label=${ifDefined(this.label || undefined)}
          @change=${this.#onChange}
        />
        <svg class="tick" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/></svg>
        <svg class="dash" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128Z"/></svg>
      </span>
      <span part="label" class="text"><slot></slot></span>
    </label>`;
  }
}

/**
 * Labelled wrapper for related checkboxes: legend, helper text, error text, and a shared
 * disabled state. Each checkbox still submits on its own, so give them the same `name`.
 *
 * @tag ht-checkbox-group
 * @summary Checkbox group.
 *
 * @slot - `ht-checkbox` elements.
 *
 * @csspart legend - The legend text.
 * @csspart items - The row or column of checkboxes.
 *
 * @fires change - A checkbox inside changed (bubbles from the checkbox).
 */
export class HtCheckboxGroup extends LitElement {
  static properties = {
    /** Group label, announced with each checkbox. */
    label: {},
    helper: {},
    /** Error text. Announced as an alert. */
    error: {},
    disabled: { type: Boolean, reflect: true },
    /** Layout of the items. */
    orientation: { reflect: true },
  };

  declare label: string;
  declare helper: string;
  declare error: string;
  declare disabled: boolean;
  declare orientation: 'vertical' | 'horizontal';

  constructor() {
    super();
    this.label = '';
    this.helper = '';
    this.error = '';
    this.disabled = false;
    this.orientation = 'vertical';
  }

  static styles = css`
    :host { display: block; }
    .legend {
      margin-bottom: 8px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .items { display: flex; flex-direction: column; gap: 12px; }
    :host([orientation='horizontal']) .items { flex-direction: row; flex-wrap: wrap; gap: 8px 24px; }
    .message { margin-top: 8px; font: 400 0.75rem/1.3 var(--ht-font-ui); color: var(--ht-text-muted); }
    .message.error { color: var(--ht-danger-text); }
  `;

  /** The `value` of every checked checkbox. */
  get value(): string[] {
    return this.#boxes().filter((b) => b.checked).map((b) => b.value);
  }

  #boxes() {
    return [...this.children].filter((c): c is HtCheckbox => c.localName === 'ht-checkbox');
  }

  #sync = () => {
    for (const b of this.#boxes()) b._groupDisabled = this.disabled;
  };

  updated() {
    this.#sync();
  }

  render() {
    const message = this.error || this.helper;
    return html`
      <div role="group" aria-labelledby=${ifDefined(this.label ? 'legend' : undefined)} aria-describedby=${ifDefined(message ? 'msg' : undefined)}>
        ${this.label ? html`<div id="legend" part="legend" class="legend">${this.label}</div>` : nothing}
        <div part="items" class="items"><slot @slotchange=${this.#sync}></slot></div>
      </div>
      ${message
        ? html`<div id="msg" class="message ${this.error ? 'error' : ''}" role=${ifDefined(this.error ? 'alert' : undefined)}>${message}</div>`
        : nothing}
    `;
  }
}

for (const [tag, ctor] of [
  ['ht-checkbox', HtCheckbox],
  ['ht-checkbox-group', HtCheckboxGroup],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-checkbox': HtCheckbox;
    'ht-checkbox-group': HtCheckboxGroup;
  }
}
