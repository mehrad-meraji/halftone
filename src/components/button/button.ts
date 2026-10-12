import { LitElement, css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Action button, modelled on Sentry's button system: uppercase bold label, 2px border,
 * a 2px underline shadow on the solid variant, and gradient "glow" variants that sweep
 * in on hover. Renders a link when `href` is set.
 *
 * @tag ht-button
 * @summary Action control. Submits or resets its form like a native button, or navigates when `href` is set.
 *
 * @slot - Button label.
 * @slot prefix - Icon or element before the label.
 * @slot suffix - Icon or element after the label.
 *
 * @csspart base - The inner native `<button>` or `<a>`.
 *
 * @cssprop [--ht-flush-radius=0] - Border radius used when `flush` is set. `ht-dialog` sets this for its footer.
 */
export class HtButton extends LitElement {
  /** @internal */
  static formAssociated = true;

  static properties = {
    /**
     * `primary` solid accent, `default` neutral, `secondary` outlined, `quiet` text only,
     * `danger` solid red, `glow` gradient sweep fill, `glow-outline` gradient border.
     */
    variant: { reflect: true },
    /** Height: xs 24px, sm 30px, md 40px, lg 48px. */
    size: { reflect: true },
    /** Disables interaction and form submission. */
    disabled: { type: Boolean, reflect: true },
    /** Native button behaviour inside a form. Ignored when `href` is set. */
    type: { reflect: true },
    /** Renders an `<a>` and navigates instead of acting as a button. */
    href: {},
    /** Link target. `_blank` also sets `rel="noopener noreferrer"`. */
    target: {},
    /** Fills its container's height with no border or shadow. Set automatically by `ht-dialog` footers. */
    flush: { type: Boolean, reflect: true },
  };

  declare variant: 'primary' | 'default' | 'secondary' | 'quiet' | 'danger' | 'glow' | 'glow-outline';
  declare size: 'xs' | 'sm' | 'md' | 'lg';
  declare disabled: boolean;
  declare type: 'button' | 'submit' | 'reset';
  declare href: string;
  declare target: string;
  declare flush: boolean;

  #internals = this.attachInternals();

  constructor() {
    super();
    this.variant = 'primary';
    this.size = 'md';
    this.disabled = false;
    this.type = 'button';
    this.href = '';
    this.target = '';
    this.flush = false;
    // On the host, so a programmatic `el.click()` also submits or resets the form.
    this.addEventListener('click', this.#onClick);
  }

  static styles = css`
    :host {
      display: inline-block;
      --_h: 2.5rem;
      --_px: 1rem;
      --_fs: 0.875rem;
    }
    :host([size='xs']) { --_h: 1.5rem; --_px: 0.5rem; --_fs: 0.6875rem; }
    :host([size='sm']) { --_h: 1.875rem; --_px: 0.75rem; --_fs: 0.75rem; }
    :host([size='lg']) { --_h: 3rem; --_px: 1.25rem; --_fs: 1rem; }
    :host([disabled]) { pointer-events: none; opacity: 0.5; }

    .btn {
      all: unset;
      box-sizing: border-box;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      height: var(--_h);
      padding-inline: var(--_px);
      font: 700 var(--_fs) / 1rem var(--ht-font-ui);
      letter-spacing: 0.2px;
      text-transform: uppercase;
      white-space: nowrap;
      text-align: center;
      cursor: pointer;
      user-select: none;
      color: var(--_fg);
      background: var(--_bg);
      border: 2px solid var(--_bd);
      border-radius: var(--ht-radius-md);
      box-shadow: var(--_shadow, none);
      transition: color 0.2s, border-color 0.2s, background-color 0.2s, box-shadow 0.2s,
        background-position 0.2s;
    }
    .btn:hover { color: var(--_fg-hover, var(--_fg)); background-color: var(--_bg-hover); border-color: var(--_bd-hover, var(--_bd)); }
    .btn:active { transform: translateY(1px); }
    .btn:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }

    /* solid accent, with Sentry's 2px underline shadow */
    :host([variant='primary']) {
      --_fg: var(--ht-accent-ink);
      --_bg: var(--ht-accent);
      --_bg-hover: var(--ht-accent-hover);
      --_bd: var(--ht-accent);
      --_bd-hover: var(--ht-accent-hover);
      --_shadow: 0 2px 0 color-mix(in oklch, var(--ht-text) 14%, transparent);
    }
    :host([variant='danger']) {
      --_fg: var(--ht-danger-ink);
      --_bg: var(--ht-danger);
      --_bg-hover: color-mix(in oklch, var(--ht-danger) 85%, black);
      --_bd: var(--ht-danger);
      --_bd-hover: color-mix(in oklch, var(--ht-danger) 85%, black);
      --_shadow: 0 2px 0 color-mix(in oklch, var(--ht-text) 14%, transparent);
    }
    /* neutral surface */
    :host([variant='default']) {
      --_fg: var(--ht-text);
      --_bg: var(--ht-surface-muted);
      --_bg-hover: var(--ht-surface-sunken);
      --_bd: var(--ht-border);
      --_bd-hover: var(--ht-border-strong);
    }
    /* outlined accent, fills on hover */
    :host([variant='secondary']) {
      --_fg: var(--ht-accent-text);
      --_fg-hover: var(--ht-accent-ink);
      --_bg: transparent;
      --_bg-hover: var(--ht-accent);
      --_bd: var(--ht-accent);
    }
    /* text only, tint on hover */
    :host([variant='quiet']) {
      --_fg: var(--ht-accent-text);
      --_bg: transparent;
      --_bg-hover: color-mix(in oklch, var(--ht-accent) 12%, transparent);
      --_bd: transparent;
    }

    /* glow: plain fill at rest, gradient sweeps across on hover */
    :host([variant='glow']) .btn,
    :host([variant='glow-outline']) .btn {
      background-size: 250% 100%;
      background-position: 98% 0;
      background-repeat: no-repeat;
      transition: color 0.2s, background-position 0.2s;
    }
    :host([variant='glow']) .btn {
      --_fg: var(--ht-glow-ink);
      border-color: transparent;
      background-color: var(--ht-glow-base);
      background-image: linear-gradient(120deg, var(--ht-glow-1) 0%, var(--ht-glow-2) 25%, var(--ht-glow-3) 50%, var(--ht-glow-base) 55%, var(--ht-glow-base) 100%);
    }
    :host([variant='glow']) .btn:hover { background-position: 2% 0; }

    :host([variant='glow-outline']) .btn {
      --_fg: var(--ht-text);
      --_fg-hover: var(--ht-glow-alt-ink);
      border-color: transparent;
      background-color: transparent;
      background-image: linear-gradient(120deg, var(--ht-glow-alt-1) 0%, var(--ht-glow-alt-2) 25%, var(--ht-glow-alt-3) 50%, transparent 55%, transparent 100%);
      z-index: 0;
    }
    :host([variant='glow-outline']) .btn:hover { background-position: 2% 0; }
    :host([variant='glow-outline']) .btn::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      padding: 2px;
      border-radius: inherit;
      background: linear-gradient(11deg, var(--ht-glow-1), var(--ht-glow-2) 50%, var(--ht-glow-3));
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      -webkit-mask-composite: xor;
      transition: opacity 0.2s;
    }
    :host([variant='glow-outline']) .btn:hover::before { opacity: 0; }

    :host([flush]) { display: flex; }
    :host([flush]) .btn {
      flex: 1;
      height: auto;
      min-height: 44px;
      padding-inline: 1.5rem;
      border: 0;
      border-radius: var(--ht-flush-radius, 0);
      box-shadow: none;
      position: relative;
      top: 1px;
    }
    :host([flush]) .btn::before { display: none; }
    :host([flush]) .btn:active { transform: none; top: 2px; }
  `;

  #onClick = () => {
    if (this.disabled || this.href) return;
    const form = this.#internals.form;
    if (!form) return;
    if (this.type === 'submit') form.requestSubmit();
    else if (this.type === 'reset') form.reset();
  };

  render() {
    const content = html`<slot name="prefix"></slot><slot></slot><slot name="suffix"></slot>`;
    if (this.href && !this.disabled) {
      const rel = this.target === '_blank' ? 'noopener noreferrer' : undefined;
      return html`<a
        part="base"
        class="btn"
        href=${this.href}
        target=${ifDefined(this.target || undefined)}
        rel=${ifDefined(rel)}
        >${content}</a
      >`;
    }
    return html`<button part="base" class="btn" type="button" ?disabled=${this.disabled}>${content}</button>`;
  }
}

if (!customElements.get('ht-button')) customElements.define('ht-button', HtButton);

declare global {
  interface HTMLElementTagNameMap {
    'ht-button': HtButton;
  }
}
