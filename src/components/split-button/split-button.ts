import { LitElement, css, html } from 'lit';

/**
 * A main action with a small key beside it that opens a menu of related actions: "Resolve",
 * then a chevron with "In the next release" and so on. It joins two keycap buttons into one
 * control. It does not draw the buttons or the menu: put an `ht-button` and an `ht-menu` in it,
 * with the menu's `trigger` an icon-only `ht-button` (give it a `label`).
 *
 * ```html
 * <ht-split-button variant="primary">
 *   <ht-button>Resolve</ht-button>
 *   <ht-menu placement="bottom-end">
 *     <ht-button slot="trigger" icon label="More resolve options"><ht-icon name="caret-down" weight="bold"></ht-icon></ht-button>
 *     <ht-menu-item value="next-release">In the next release</ht-menu-item>
 *   </ht-menu>
 * </ht-split-button>
 * ```
 *
 * `variant`, `size` and `disabled` here are passed to both keys. Each key lifts on its own,
 * because each is a real button. Listen for `click` on the main `ht-button` and `ht-select` on the menu.
 * A caret icon in the trigger (`caret-down`) turns to `caret-up` while the menu is open.
 *
 * @tag ht-split-button
 * @summary A button with a menu of related actions beside it.
 *
 * @slot - One `ht-button` (the main action), then one `ht-menu` whose `trigger` is an icon-only `ht-button`.
 */
export class HtSplitButton extends LitElement {
  static properties = {
    /** Passed to both keys. Not `quiet`: a flat key has no edge to join. */
    variant: { reflect: true },
    /** Passed to both keys: xs 24px, sm 28px, md 32px, lg 36px. */
    size: { reflect: true },
    /** Disables both keys and the menu. */
    disabled: { type: Boolean, reflect: true },
  };

  declare variant: 'primary' | 'default' | 'danger';
  declare size: 'xs' | 'sm' | 'md' | 'lg';
  declare disabled: boolean;

  constructor() {
    super();
    this.variant = 'default';
    this.size = 'md';
    this.disabled = false;
  }

  static styles = css`
    :host { display: inline-flex; align-items: flex-start; vertical-align: middle; }
    :host([hidden]) { display: none; }
  `;

  #menu: Element | null = null;

  get #main(): HTMLElement | null {
    return this.querySelector(':scope > ht-button');
  }

  get #trigger(): HTMLElement | null {
    return this.querySelector(':scope > ht-menu > [slot="trigger"]');
  }

  #sync() {
    const main = this.#main;
    const menu = this.querySelector(':scope > ht-menu');
    const trigger = this.#trigger;
    for (const [el, join] of [[main, 'end'], [trigger, 'start']] as const) {
      if (!el) continue;
      el.setAttribute('data-join', join);
      el.setAttribute('variant', this.variant);
      el.setAttribute('size', this.size);
      el.toggleAttribute('disabled', this.disabled);
    }
    menu?.toggleAttribute('disabled', this.disabled);
    if (menu !== this.#menu) {
      this.#menu?.removeEventListener('open', this.#onToggle);
      this.#menu?.removeEventListener('close', this.#onToggle);
      menu?.addEventListener('open', this.#onToggle);
      menu?.addEventListener('close', this.#onToggle);
      this.#menu = menu;
    }
  }

  // The chevron points up while the menu is open.
  #onToggle = (e: Event) => {
    const icon = this.#trigger?.querySelector('ht-icon');
    if (!icon || !/^caret-(down|up)$/.test(icon.getAttribute('name') ?? '')) return;
    icon.setAttribute('name', e.type === 'open' ? 'caret-up' : 'caret-down');
  };

  updated() {
    this.#sync();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#menu?.removeEventListener('open', this.#onToggle);
    this.#menu?.removeEventListener('close', this.#onToggle);
    this.#menu = null;
  }

  render() {
    return html`<slot @slotchange=${() => this.#sync()}></slot>`;
  }
}

if (!customElements.get('ht-split-button')) customElements.define('ht-split-button', HtSplitButton);

declare global {
  interface HTMLElementTagNameMap {
    'ht-split-button': HtSplitButton;
  }
}
