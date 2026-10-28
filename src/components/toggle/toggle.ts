import { LitElement, css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * A button that stays pressed: bold, mute, pin. Reports its state with `aria-pressed`. The
 * pressed look is an accent-soft fill with an accent border, so it still reads without colour.
 * Pressed state is submitted with the form as `name=value`; unpressed submits nothing.
 *
 * A toggle with no text (icon only) needs a `label`, or an `aria-label` on the element,
 * which is forwarded to the native button.
 *
 * @tag ht-toggle
 * @summary Two-state toggle button.
 *
 * @slot - Toggle label.
 * @slot prefix - Icon or element before the label.
 *
 * @csspart base - The inner native `<button>`.
 *
 * @fires change - Pressed state changed by user action (or `el.click()`). Read `pressed` from the host.
 */
export class HtToggle extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** Whether the toggle is on. */
    pressed: { type: Boolean, reflect: true },
    /** `default` is flat with a hover tint, `outline` adds a field-style border. */
    variant: { reflect: true },
    /** Height: sm 24px, md 28px, lg 32px, so it lines up with `ht-button`. */
    size: { reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** Form field name. Without it nothing is submitted. */
    name: {},
    /** Value submitted while pressed. */
    value: {},
    /** Accessible name for an icon-only toggle. A host `aria-label` is moved here. */
    label: {},
    _formDisabled: { state: true },
  };

  declare pressed: boolean;
  declare variant: 'default' | 'outline';
  declare size: 'sm' | 'md' | 'lg';
  declare disabled: boolean;
  declare name: string;
  declare value: string;
  declare label: string;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #defaultPressed = false;

  constructor() {
    super();
    this.pressed = false;
    this.variant = 'default';
    this.size = 'md';
    this.disabled = false;
    this.name = '';
    this.value = 'on';
    this.label = '';
    this._formDisabled = false;
    // On the host, so a programmatic `el.click()` also toggles.
    this.addEventListener('click', this.#onClick);
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultPressed = this.hasAttribute('pressed');
    // `aria-label` is not allowed on a generic host; move it to the native button.
    const al = this.getAttribute('aria-label');
    if (al) {
      if (!this.label) this.label = al;
      this.removeAttribute('aria-label');
    }
  }

  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      --_h: 1.75rem;
      --_px: 0.5rem;
      --_fs: 0.875rem;
    }
    :host([size='sm']) { --_h: 1.5rem; --_px: 0.375rem; --_fs: 0.75rem; }
    :host([size='lg']) { --_h: 2rem; --_px: 0.625rem; }
    :host([disabled]) { opacity: 0.55; }
    .btn {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: var(--_h);
      min-width: var(--_h);
      padding-inline: var(--_px);
      font: 500 var(--_fs) / 1rem var(--ht-font-ui);
      white-space: nowrap;
      color: var(--ht-text);
      cursor: pointer;
      user-select: none;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--ht-radius-md);
      transition: background-color var(--ht-duration) var(--ht-ease), border-color var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease);
    }
    :host([variant='outline']) .btn { border-color: var(--ht-border-input); }
    .btn:hover { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    /* Pressed: fill plus a full-strength border, so the state does not rely on colour alone. */
    :host([pressed]) .btn,
    :host([pressed]) .btn:hover {
      color: var(--ht-accent-text);
      background: var(--ht-accent-soft);
      border-color: var(--ht-accent-text);
    }
    .btn:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    .btn:disabled { cursor: not-allowed; background: transparent; }
    ::slotted([slot='prefix']) { flex: none; }
    /* Icons get the 16px box. Anything else (a status dot, an avatar) keeps its own size. */
    ::slotted(ht-icon[slot='prefix']),
    ::slotted(svg[slot='prefix']) { width: 16px; height: 16px; }
    @media (prefers-reduced-motion: reduce) {
      .btn { transition: none; }
    }
  `;

  /** The owning form, if any. */
  get form() {
    return this.#internals.form;
  }

  #onClick = () => {
    if (this.disabled || this._formDisabled) return;
    this.pressed = !this.pressed;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  formResetCallback() {
    this.pressed = this.#defaultPressed;
  }
  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
  }
  formStateRestoreCallback(state: string) {
    this.pressed = state !== '';
  }

  updated() {
    this.#internals.setFormValue?.(this.pressed && this.name ? this.value : null, this.pressed ? 'on' : '');
  }

  render() {
    return html`
      <button
        part="base"
        class="btn"
        type="button"
        aria-pressed=${this.pressed ? 'true' : 'false'}
        aria-label=${ifDefined(this.label || undefined)}
        ?disabled=${this.disabled || this._formDisabled}
      >
        <slot name="prefix"></slot>
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('ht-toggle')) customElements.define('ht-toggle', HtToggle);

declare global {
  interface HTMLElementTagNameMap {
    'ht-toggle': HtToggle;
  }
}
