import { LitElement, css, html, nothing } from 'lit';

/**
 * A row of toggle buttons on a sunken track. The pressed item lifts out as a raised face with
 * a 3:1 outline. Not `ht-tabs`: nothing switches panels, and `type="multiple"` lets several
 * items be pressed. Use it for view modes, filters and formatting.
 *
 * Give an item a `count` to show a number after its label (results per filter, say).
 *
 * `type="single"` is a radio group: one item is on, arrows move focus and select, and the
 * selected item cannot be cleared. `type="multiple"` is a group of toggle buttons: arrows
 * move focus, Space or Enter toggles. Both have one tab stop (roving tabindex), wrap at the
 * ends, and honour Home and End.
 *
 * Give the group an accessible name with `aria-label` (valid on the host, which carries a
 * role). An item with no text needs its own `aria-label`.
 *
 * @tag ht-toggle-group
 * @summary Joined toggle buttons, single or multiple choice.
 *
 * @slot - `ht-toggle-item` elements.
 *
 * @fires change - Selection changed by user action. Read `value` (or `values`) from the host.
 */
export class HtToggleGroup extends LitElement {
  static properties = {
    /** `single` allows one pressed item (radio semantics), `multiple` any number. */
    type: { reflect: true },
    /** Pressed item values. One value for `single`; comma-separated for `multiple` (so a value cannot contain a comma). Defaults to the items marked `pressed`. */
    value: { reflect: true },
    /** Group height, track included: sm 24px, md 28px, lg 32px. Items are 4px shorter. */
    size: { reflect: true },
    /** Disables every item. */
    disabled: { type: Boolean, reflect: true },
  };

  declare type: 'single' | 'multiple';
  declare value: string;
  declare size: 'sm' | 'md' | 'lg';
  declare disabled: boolean;

  #active: HtToggleItem | null = null;

  constructor() {
    super();
    this.type = 'single';
    this.value = '';
    this.size = 'md';
    this.disabled = false;
    this.addEventListener('click', (e) => {
      const item = (e.target as Element).closest('ht-toggle-item') as HtToggleItem | null;
      if (item && item.parentElement === this && this.#enabled(item)) {
        item.focus();
        this.#activate(item);
      }
    });
    this.addEventListener('focusin', (e) => {
      const item = (e.target as Element).closest('ht-toggle-item') as HtToggleItem | null;
      if (item && item.parentElement === this && this.#active !== item) {
        this.#active = item;
        this.#sync();
      }
    });
  }

  /** The pressed values as an array. Setting it updates `value`. */
  get values(): string[] {
    return this.value ? this.value.split(',').filter(Boolean) : [];
  }
  set values(v: string[]) {
    this.value = this.type === 'multiple' ? v.join(',') : (v[0] ?? '');
  }

  connectedCallback() {
    super.connectedCallback();
    this.#updateRole();
  }

  static styles = css`
    /* Sentry's segmented control: a sunken track with a 1px rim; the pressed item is a raised face. */
    :host {
      box-sizing: border-box;
      display: inline-flex;
      gap: 2px;
      padding: 2px;
      vertical-align: middle;
      background: var(--ht-surface-sunken);
      border-radius: var(--ht-radius-md);
      box-shadow: inset 0 0 0 1px var(--ht-border);
      --_h: 1.75rem;
      --_px: 0.625rem;
      --_fs: 0.875rem;
    }
    :host([size='sm']) { --_h: 1.5rem; --_px: 0.5rem; --_fs: 0.75rem; }
    :host([size='lg']) { --_h: 2rem; --_px: 0.75rem; }
    @media (forced-colors: active) {
      :host { border: 1px solid CanvasText; padding: 1px; }
    }
  `;

  #items() {
    return [...this.children].filter((c): c is HtToggleItem => c.localName === 'ht-toggle-item');
  }
  #enabled(item: HtToggleItem) {
    return !this.disabled && !item.disabled;
  }
  #updateRole() {
    this.setAttribute('role', this.type === 'single' ? 'radiogroup' : 'group');
  }

  /** Applies group state to the items: pressed, role, aria state and the roving tab stop. */
  #sync = () => {
    const items = this.#items();
    const single = this.type === 'single';
    items.forEach((it, i) => {
      if (!it.value) it.value = String(i);
    });
    const on = new Set(this.values);
    // Without a value, adopt items authored as `pressed`.
    if (!this.value && items.some((it) => it.pressed)) {
      const authored = items.filter((it) => it.pressed).map((it) => it.value);
      this.value = single ? authored[0] : authored.join(',');
      return;
    }
    for (const it of items) {
      it.pressed = on.has(it.value) && (!single || it.value === this.values[0]);
      it.setAttribute('role', single ? 'radio' : 'button');
    }
    const enabled = items.filter((it) => this.#enabled(it));
    // Single: the checked item is the tab stop, else the first enabled one.
    // Multiple: the last focused item, else the first enabled one.
    const last = this.#active && enabled.includes(this.#active) ? this.#active : undefined;
    const stop = single ? (enabled.find((it) => it.pressed) ?? last ?? enabled[0]) : (last ?? enabled[0]);
    for (const it of items) {
      it.tabIndex = it === stop ? 0 : -1;
      it.groupDisabled = this.disabled;
    }
  };

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('type')) this.#updateRole();
  }

  updated() {
    this.#sync();
  }

  #activate(item: HtToggleItem) {
    if (this.type === 'single') {
      if (this.value === item.value) return;
      this.value = item.value;
    } else {
      const next = new Set(this.values);
      if (!next.delete(item.value)) next.add(item.value);
      // Keep document order.
      this.value = this.#items()
        .map((it) => it.value)
        .filter((v) => next.has(v))
        .join(',');
    }
    this.#sync();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onKeydown = (e: KeyboardEvent) => {
    const item = (e.target as Element).closest('ht-toggle-item') as HtToggleItem | null;
    if (!item || item.parentElement !== this) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (this.#enabled(item)) this.#activate(item);
      return;
    }
    const enabled = this.#items().filter((it) => this.#enabled(it));
    const i = enabled.indexOf(item);
    if (i < 0) return;
    const rtl = getComputedStyle(this).direction === 'rtl';
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next = -1;
    if (e.key === fwd || e.key === 'ArrowDown') next = (i + 1) % enabled.length;
    else if (e.key === back || e.key === 'ArrowUp') next = (i - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    if (next < 0) return;
    e.preventDefault();
    enabled[next].focus();
    // Radio pattern: arrows also select. Toggle buttons only move focus.
    if (this.type === 'single') this.#activate(enabled[next]);
  };

  render() {
    return html`<slot @slotchange=${this.#sync} @keydown=${this.#onKeydown}></slot>`;
  }
}

/**
 * One item inside `ht-toggle-group`. Its role (`radio` or `button`), `aria-checked` or
 * `aria-pressed`, and tab stop are managed by the group. An icon-only item needs an
 * `aria-label` (valid here, because the host carries the role).
 *
 * @tag ht-toggle-item
 * @summary Item in a toggle group.
 *
 * @slot - Item label.
 * @slot prefix - Icon or element before the label.
 *
 * @csspart base - The item face.
 * @csspart count - The number after the label.
 */
export class HtToggleItem extends LitElement {
  static properties = {
    /** Identifier listed in the group's `value`. Defaults to the item's index. */
    value: {},
    /** Set by the group from its `value`. Mark an item `pressed` to start with it on. */
    pressed: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** Number shown after the label, in mono. A string, so `1.2k` works. Read as part of the item's name. */
    count: {},
    /** @internal */
    groupDisabled: { type: Boolean, attribute: false },
  };

  declare value: string;
  declare pressed: boolean;
  declare disabled: boolean;
  declare count: string;
  /** @internal */
  declare groupDisabled: boolean;

  constructor() {
    super();
    this.value = '';
    this.pressed = false;
    this.disabled = false;
    this.count = '';
    this.groupDisabled = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
  }

  static styles = css`
    :host {
      display: flex;
      position: relative;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    :host([disabled]) .item,
    :host([aria-disabled='true']) .item { opacity: 0.55; cursor: not-allowed; background: transparent; }
    .item {
      box-sizing: border-box;
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: calc(var(--_h, 1.75rem) - 4px);
      min-width: calc(var(--_h, 1.75rem) - 4px);
      padding-inline: var(--_px, 0.625rem);
      font: 500 var(--_fs, 0.875rem) / 1rem var(--ht-font-ui);
      white-space: nowrap;
      color: var(--ht-text-muted);
      cursor: pointer;
      user-select: none;
      background: transparent;
      /* Concentric with the track: its radius minus the 2px padding. */
      border-radius: calc(var(--ht-radius-md) - 2px);
      transition: background-color var(--ht-duration) var(--ht-ease), box-shadow var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease);
    }
    .count {
      font: 500 0.75rem / 1rem var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-subtle);
    }
    :host(:hover:not([aria-disabled='true']):not([pressed])) .item {
      color: var(--ht-text);
      background: color-mix(in oklab, var(--ht-text) 7.5%, transparent);
    }
    /* text-subtle drops under 4.5:1 on the hover fill in light mode. */
    :host(:hover:not([aria-disabled='true']):not([pressed])) .count { color: var(--ht-text-muted); }
    /* The face is barely lighter than the track, so the outline carries the state: border-input mixed toward text keeps 3:1 against both. */
    :host([pressed]) .item {
      color: var(--ht-text);
      background: var(--ht-surface-raised);
      box-shadow: 0 0 0 1px color-mix(in oklab, var(--ht-border-input) 85%, var(--ht-text)), var(--ht-shadow-xs);
    }
    :host([pressed]) .count { color: var(--ht-accent-text); }
    :host(:focus-visible) { z-index: 1; }
    /* Offset 0: the items sit 2px apart, so a wider ring would cover the neighbour. */
    :host(:focus-visible) .item { outline: 2px solid var(--ht-focus); outline-offset: 0; }
    ::slotted([slot='prefix']) { flex: none; width: 16px; height: 16px; }
    @media (forced-colors: active) {
      .item { forced-color-adjust: none; color: ButtonText; background: ButtonFace; }
      .count { color: inherit; }
      :host([pressed]) .item { color: HighlightText; background: Highlight; box-shadow: none; }
      :host([disabled]) .item, :host([aria-disabled='true']) .item { color: GrayText; opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .item { transition: none; }
    }
  `;

  updated() {
    // Radios report `aria-checked`, toggle buttons `aria-pressed`.
    if (this.getAttribute('role') === 'radio') {
      this.setAttribute('aria-checked', String(this.pressed));
      this.removeAttribute('aria-pressed');
    } else {
      this.setAttribute('aria-pressed', String(this.pressed));
      this.removeAttribute('aria-checked');
    }
    if (this.disabled || this.groupDisabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  render() {
    return html`<span part="base" class="item"><slot name="prefix"></slot><slot></slot>${this.count
      ? html`<span part="count" class="count">${this.count}</span>`
      : nothing}</span>`;
  }
}

for (const [tag, ctor] of [
  ['ht-toggle-group', HtToggleGroup],
  ['ht-toggle-item', HtToggleItem],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-toggle-group': HtToggleGroup;
    'ht-toggle-item': HtToggleItem;
  }
}
