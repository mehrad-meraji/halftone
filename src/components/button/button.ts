import { LitElement, css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Keycap button, modelled on the buttons in Sentry's app (sentry.io/auth/login). The face
 * sits raised over a plate: it lifts 1px on hover and presses flush on click. Renders a
 * link when `href` is set.
 *
 * An icon-only button needs a name: set `label`, or `aria-label` on the element (it is moved to
 * the native button). Add `icon` to make it square. `ht-split-button` joins two of these into one key.
 *
 * @tag ht-button
 * @summary Action control. Submits or resets its form like a native button, or navigates when `href` is set.
 *
 * @slot - Button label.
 * @slot prefix - Icon or element before the label.
 * @slot suffix - Icon or element after the label.
 *
 * @csspart base - The inner native `<button>` or `<a>`.
 * @csspart label - The wrapper around the label and affixes. It rides with the face.
 *
 * @cssprop [--ht-flush-radius=0] - Border radius used when `flush` is set. `ht-dialog` sets this for its footer.
 */
export class HtButton extends LitElement {
  /** @internal */
  static formAssociated = true;

  static properties = {
    /** `primary` accent keycap, `default` neutral keycap, `danger` red keycap, `quiet` flat with a hover tint. */
    variant: { reflect: true },
    /** Height: xs 24px, sm 28px, md 32px, lg 36px. */
    size: { reflect: true },
    /** Disables interaction and form submission. */
    disabled: { type: Boolean, reflect: true },
    /** Native button behaviour inside a form. Ignored when `href` is set. */
    type: { reflect: true },
    /** Renders an `<a>` and navigates instead of acting as a button. */
    href: {},
    /** Link target. `_blank` also sets `rel="noopener noreferrer"`. */
    target: {},
    /** Fills the width of its container. */
    block: { type: Boolean, reflect: true },
    /** Fills its container's height with no lift. Set automatically by `ht-dialog` footers. */
    flush: { type: Boolean, reflect: true },
    /** Makes the button square, for an icon with no text. Give it a `label`. */
    icon: { type: Boolean, reflect: true },
    /** Accessible name, for an icon-only button. A host `aria-label` is moved here. */
    label: {},
  };

  declare variant: 'primary' | 'default' | 'danger' | 'quiet';
  declare size: 'xs' | 'sm' | 'md' | 'lg';
  declare disabled: boolean;
  declare type: 'button' | 'submit' | 'reset';
  declare href: string;
  declare target: string;
  declare block: boolean;
  declare flush: boolean;
  declare icon: boolean;
  declare label: string;

  #internals = this.attachInternals();

  // ARIA that other components write on the host, such as `ht-menu` (`aria-haspopup`, `aria-expanded`)
  // on its trigger. A generic host cannot carry them, so they are moved to the native button.
  static #moved = ['aria-label', 'aria-haspopup', 'aria-expanded'];
  #aria = new Map<string, string>();
  #observer = new MutationObserver(() => this.#takeAria());

  #takeAria() {
    let changed = false;
    for (const name of HtButton.#moved) {
      const v = this.getAttribute(name);
      if (v === null) continue;
      this.#aria.set(name, v);
      this.removeAttribute(name);
      changed = true;
    }
    if (changed) this.requestUpdate();
  }

  connectedCallback() {
    super.connectedCallback();
    this.#takeAria();
    this.#observer.observe(this, { attributes: true, attributeFilter: HtButton.#moved });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  constructor() {
    super();
    this.variant = 'primary';
    this.size = 'md';
    this.disabled = false;
    this.type = 'button';
    this.href = '';
    this.target = '';
    this.block = false;
    this.flush = false;
    this.icon = false;
    this.label = '';
    // On the host, so a programmatic `el.click()` also submits or resets the form.
    this.addEventListener('click', this.#onClick);
  }

  static styles = css`
    :host {
      display: inline-block;
      --_h: 2rem;
      --_px: 0.75rem;
      --_fs: 0.875rem;
      --_rest: 2px;
    }
    :host([size='xs']) { --_h: 1.5rem; --_px: 0.5rem; --_fs: 0.75rem; --_rest: 1px; }
    :host([size='sm']) { --_h: 1.75rem; --_px: 0.5rem; --_fs: 0.75rem; --_rest: 1px; }
    :host([size='lg']) { --_h: 2.25rem; --_px: 1rem; }
    :host([disabled]) { opacity: 0.55; }
    :host([block]) { display: block; }
    :host([block]) .btn { display: flex; width: 100%; }
    :host([icon]) { --_px: 0; }
    :host([icon]) .btn { width: var(--_h); }

    :host([variant='primary']) {
      --_fg: var(--ht-accent-ink);
      --_face: var(--ht-accent);
      --_plate: color-mix(in oklch, var(--ht-accent) 62%, black);
      --_dotted: var(--_fg);
    }
    :host([variant='danger']) {
      --_fg: var(--ht-danger-ink);
      --_face: var(--ht-danger);
      --_plate: color-mix(in oklch, var(--ht-danger) 62%, black);
      --_dotted: var(--_fg);
    }
    :host([variant='default']) {
      --_fg: var(--ht-text);
      --_face: var(--ht-surface);
      --_plate: var(--ht-border-strong);
    }

    .btn {
      all: unset;
      --_lift: var(--_rest);
      box-sizing: border-box;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--_h);
      min-height: var(--_h);
      padding-inline: var(--_px);
      font: 500 var(--_fs) / 1rem var(--ht-font-ui);
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      color: var(--_fg);
      border-radius: var(--ht-radius-md);
    }
    /* the plate */
    .btn::before {
      content: '';
      position: absolute;
      inset: 2px 0 0;
      height: calc(100% - 2px);
      transform: translateY(-2px);
      background: var(--_plate);
      box-shadow: 0 2px 0 0 var(--_plate);
      border-radius: inherit;
    }
    /* the face */
    .btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--_face);
      border: 1px solid var(--_plate);
      border-radius: inherit;
      transform: translateY(calc(-1 * var(--_lift)));
      transition: transform 120ms cubic-bezier(0.8, -0.4, 0.5, 1);
    }
    .label {
      position: relative;
      z-index: 1;
      display: inherit;
      align-items: inherit;
      justify-content: inherit;
      gap: 0.5rem;
      transform: translateY(calc(-1 * var(--_lift)));
      transition: transform 120ms cubic-bezier(0.8, -0.4, 0.5, 1);
    }
    .btn:hover { --_lift: calc(var(--_rest) + 1px); }
    .btn:active { --_lift: 0px; }
    .btn:disabled { --_lift: 0px; cursor: not-allowed; }
    .btn:focus-visible::after {
      box-shadow:
        0 var(--_lift) 0 0 var(--_plate),
        0 var(--_lift) 0 2px var(--ht-focus),
        0 0 0 2px var(--ht-focus);
    }
    :host([variant='primary']) .btn:focus-visible::after,
    :host([variant='danger']) .btn:focus-visible::after {
      box-shadow: none;
      border: 2px dotted var(--_dotted);
    }

    /* Joined to a neighbour (set by \`ht-split-button\`): the joined side is square. The start segment
       drops its left border, so the end segment's right border is the one line between them. A joined
       key rises above its neighbour while hovered or focused, so its focus ring is not cut off. */
    :host([data-join]) { position: relative; }
    :host([data-join]:hover), :host([data-join]:focus-within) { z-index: 1; }
    :host([data-join='end']) .btn { border-radius: var(--ht-radius-md) 0 0 var(--ht-radius-md); }
    :host([data-join='start']) .btn { border-radius: 0 var(--ht-radius-md) var(--ht-radius-md) 0; }
    :host([data-join='start']) .btn::after { border-left-width: 0; }

    /* quiet: flat, tint on hover, no plate */
    :host([variant='quiet']) .btn {
      --_fg: var(--ht-text-muted);
      --_lift: 0px;
      font-weight: 400;
    }
    :host([variant='quiet']) .btn::before,
    :host([variant='quiet']) .btn::after { display: none; }
    :host([variant='quiet']) .label { transform: none; }
    :host([variant='quiet']) .btn:hover { background: color-mix(in oklch, var(--ht-text) 6%, transparent); color: var(--ht-text); }
    :host([variant='quiet']) .btn:active { background: color-mix(in oklch, var(--ht-text) 10%, transparent); }
    :host([variant='quiet']) .btn:focus-visible { box-shadow: 0 0 0 2px var(--ht-focus); }

    /* flush: dialog footers. Flat fill, radius from the footer. */
    :host([flush]) { display: flex; min-width: 0; }
    :host([flush]) .btn {
      --_lift: 0px;
      flex: 1;
      min-width: 0;
      height: auto;
      min-height: 50px;
      padding: 0.5rem var(--ht-flush-padding, 3rem);
      /* Long labels wrap inside the key instead of pushing it past its container. */
      white-space: normal;
      text-align: center;
      overflow-wrap: break-word;
      font-weight: 700;
      border-radius: var(--ht-flush-radius, 0);
    }
    :host([flush]) .btn::before { display: none; }
    :host([flush]) .btn::after { border: 0; transition: filter 120ms; }
    :host([flush]) .btn:hover::after { filter: brightness(0.96); }
    :host([flush]) .btn:active::after { filter: brightness(0.92); }
    :host([flush]) .btn:focus-visible::after { box-shadow: inset 0 0 0 2px var(--ht-focus); border: 0; }
    /* Secondary footer keys: a plain face outlined on the top and sides, open at the bottom edge. */
    :host([flush][variant='quiet']) .btn::after,
    :host([flush][variant='default']) .btn::after {
      display: block;
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-bottom-width: 0;
    }
    :host([flush][variant='quiet']) { --_fg: var(--ht-text); }
    /* A key on the dialog's left or right edge drops the outline on that side. */
    :host([flush][data-edge-left]) .btn::after { border-left-width: 0; }
    :host([flush][data-edge-right]) .btn::after { border-right-width: 0; }
  `;

  #onClick = () => {
    if (this.disabled || this.href) return;
    const form = this.#internals.form;
    if (!form) return;
    if (this.type === 'submit') form.requestSubmit();
    else if (this.type === 'reset') form.reset();
  };

  render() {
    const label = this.label || this.#aria.get('aria-label') || undefined;
    const haspopup = this.#aria.get('aria-haspopup');
    const expanded = this.#aria.get('aria-expanded');
    const content = html`<span part="label" class="label"
      ><slot name="prefix"></slot><slot></slot><slot name="suffix"></slot
    ></span>`;
    if (this.href && !this.disabled) {
      const rel = this.target === '_blank' ? 'noopener noreferrer' : undefined;
      return html`<a
        part="base"
        class="btn"
        href=${this.href}
        target=${ifDefined(this.target || undefined)}
        rel=${ifDefined(rel)}
        aria-label=${ifDefined(label)}
        >${content}</a
      >`;
    }
    return html`<button
      part="base"
      class="btn"
      type="button"
      ?disabled=${this.disabled}
      aria-label=${ifDefined(label)}
      aria-haspopup=${ifDefined(haspopup)}
      aria-expanded=${ifDefined(expanded)}
    >
      ${content}
    </button>`;
  }
}

if (!customElements.get('ht-button')) customElements.define('ht-button', HtButton);

declare global {
  interface HTMLElementTagNameMap {
    'ht-button': HtButton;
  }
}
