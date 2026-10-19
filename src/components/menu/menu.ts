import { LitElement, css, html, nothing, svg } from 'lit';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

// Phosphor "check", bold.
const CHECK = svg`<path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/>`;

/**
 * Dropdown or context menu. The panel is a manual popover in the top layer, positioned in
 * JavaScript (flips and clamps like `ht-tooltip`). Put `ht-menu-item`, `ht-menu-separator` and
 * `ht-menu-label` children in it, and the trigger in the `trigger` slot.
 *
 * Keyboard (WAI-ARIA menu button pattern): Enter, Space or Arrow Down on the trigger opens with the first
 * item focused, Arrow Up with the last. Inside, Arrow Up/Down move (wrapping), Home and End jump,
 * typing jumps to the next item starting with those letters, Enter or Space activates, Escape
 * closes and returns focus to the trigger, Tab closes. Disabled items stay focusable but cannot
 * be activated, as the pattern says. Submenus are not supported.
 *
 * With `contextmenu`, the `trigger` slot becomes a right-click target and the menu opens at the
 * pointer. Keyboard users get it from the ContextMenu key or Shift+F10 on a focused target,
 * so make the target focusable if the menu is the only route to an action.
 *
 * `ht-select` is cancelable: call `preventDefault()` to keep the menu open after a pick.
 *
 * @tag ht-menu
 * @summary Dropdown and context menu.
 *
 * @slot - `ht-menu-item`, `ht-menu-separator` and `ht-menu-label` elements.
 * @slot trigger - The element that opens the menu (or, with `contextmenu`, the right-click target).
 *
 * @csspart panel - The floating menu.
 *
 * @cssprop [--ht-menu-min-width=10rem] - Minimum panel width.
 *
 * @fires ht-select - An item was activated. `detail`: `{ value, item, checked }` (`checked` only for checkbox and radio items). Bubbles, composed, cancelable.
 * @fires open - The menu opened. Does not bubble.
 * @fires close - The menu closed. Does not bubble.
 */
export class HtMenu extends LitElement {
  static properties = {
    /** Shows the menu. Reflects. */
    open: { type: Boolean, reflect: true },
    /**
     * Preferred side and alignment: `top`, `bottom`, `left`, `right`, optionally with `-start`
     * or `-end`. Flips if there is no room. Ignored by `contextmenu` menus, which open at the pointer.
     */
    placement: { reflect: true },
    /** Accessible name for the menu. Defaults to the trigger's name. */
    label: {},
    /** Opens on right-click (and the ContextMenu key) of the `trigger` slot instead of on click. */
    contextmenu: { type: Boolean, reflect: true },
    /** Stops the menu from opening. */
    disabled: { type: Boolean, reflect: true },
  };

  declare open: boolean;
  declare placement: string;
  declare label: string;
  declare contextmenu: boolean;
  declare disabled: boolean;

  #wasOpen = false;
  #mounted = false;
  #openFocus: 'first' | 'last' | 'panel' = 'first';
  #point: { x: number; y: number } | null = null;
  #returnTo: HTMLElement | null = null;
  #buffer = '';
  #bufferTimer = 0;

  constructor() {
    super();
    this.open = false;
    this.placement = 'bottom-start';
    this.label = '';
    this.contextmenu = false;
    this.disabled = false;
    this.addEventListener('contextmenu', this.#onContextMenu);
  }

  static styles = css`
    :host { display: inline-block; }
    :host([contextmenu]) { display: block; }
    .panel {
      position: fixed;
      inset: auto;
      margin: 0;
      box-sizing: border-box;
      min-width: var(--ht-menu-min-width, 10rem);
      max-width: calc(100vw - 8px);
      max-height: calc(100vh - 8px);
      padding: 4px;
      overflow: auto;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-md);
      opacity: 0;
      transform: translate(var(--_dx, 0), var(--_dy, 0));
      transition:
        opacity var(--ht-duration) var(--ht-ease),
        transform var(--ht-duration) var(--ht-ease);
    }
    .panel[data-side='bottom'] { --_dy: -4px; }
    .panel[data-side='top'] { --_dy: 4px; }
    .panel[data-side='left'] { --_dx: 4px; }
    .panel[data-side='right'] { --_dx: -4px; }
    .panel.on { opacity: 1; transform: none; }
    .panel:focus { outline: none; }
    @media (prefers-reduced-motion: reduce) {
      .panel { transition: none; transform: none; }
    }
  `;

  get #panel() {
    return this.renderRoot.querySelector<HTMLElement>('.panel');
  }

  get #trigger(): HTMLElement | null {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    return (slot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined) ?? null;
  }

  /** The menu's items, in document order. */
  get items(): HtMenuItem[] {
    return Array.from(this.querySelectorAll<HtMenuItem>('ht-menu-item'));
  }

  /** Opens the menu below its trigger. */
  show() {
    if (this.disabled) return;
    this.#point = null;
    this.open = true;
  }
  /** Opens the menu with its top-left corner at a viewport point. */
  showAt(x: number, y: number) {
    if (this.disabled) return;
    this.#point = { x, y };
    if (this.open) this.#reposition();
    else this.open = true;
  }
  /** Closes the menu. Focus returns to where it was before the menu opened. */
  hide() {
    this.open = false;
  }
  /** Toggles the menu. */
  toggle() {
    if (this.open) this.hide();
    else this.show();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      const panel = this.#panel;
      if (panel && this.open && !this.disabled && !panel.matches(':popover-open')) this.#reveal(panel);
      else if (panel && !this.open && panel.matches(':popover-open')) this.#conceal(panel);
      else if (this.open && this.disabled) this.open = false;
      const isOpen = this.open && !!panel?.matches(':popover-open');
      if (isOpen !== this.#wasOpen) {
        this.#wasOpen = isOpen;
        this.dispatchEvent(new Event(isOpen ? 'open' : 'close'));
      }
      this.#syncTrigger();
    }
    if (changed.has('disabled') && this.disabled && this.open) this.open = false;
    if (changed.has('contextmenu')) this.#syncTrigger();
    this.#mounted = true;
  }

  #reveal(panel: HTMLElement) {
    this.#syncInset();
    panel.setAttribute('aria-label', this.label || this.#triggerName());
    const active = document.activeElement;
    this.#returnTo = this.contextmenu ? (active instanceof HTMLElement ? active : null) : this.#trigger;
    panel.showPopover();
    this.#place(panel);
    // Rows re-render when `inset` changes; place again once they have settled.
    Promise.all(this.items.map((i) => i.updateComplete)).then(() => this.#reposition());
    requestAnimationFrame(() => panel.classList.add('on'));
    document.addEventListener('pointerdown', this.#onOutside, true);
    window.addEventListener('resize', this.#onViewport);
    window.addEventListener('scroll', this.#onViewport, true);
    // An initially open menu must not steal focus on page load.
    if (!this.#mounted) return;
    const items = this.items;
    const target = this.#openFocus === 'first' ? items[0] : this.#openFocus === 'last' ? items[items.length - 1] : null;
    (target ?? panel).focus({ preventScroll: true });
  }

  #conceal(panel: HTMLElement) {
    const hadFocus = this.#focusInside();
    panel.classList.remove('on');
    panel.hidePopover();
    document.removeEventListener('pointerdown', this.#onOutside, true);
    window.removeEventListener('resize', this.#onViewport);
    window.removeEventListener('scroll', this.#onViewport, true);
    if (hadFocus) this.#returnTo?.focus({ preventScroll: true });
    this.#openFocus = 'first';
    clearTimeout(this.#bufferTimer);
    this.#buffer = '';
  }

  #focusInside() {
    const panel = this.#panel;
    let a: Element | null = document.activeElement;
    while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
    return !!a && !!panel && (a === panel || this.items.includes(a as HtMenuItem) || panel.contains(a));
  }

  #triggerName() {
    const t = this.#trigger;
    return t?.getAttribute('aria-label') || t?.textContent?.trim() || 'Menu';
  }

  #syncTrigger() {
    const t = this.#trigger;
    if (!t || this.contextmenu) return;
    t.setAttribute('aria-haspopup', 'menu');
    t.setAttribute('aria-expanded', String(this.open));
  }

  /** Items with no check column line up with checkable ones when any item has one. */
  #syncInset() {
    const items = this.items;
    const any = items.some((i) => i.type !== 'normal');
    for (const i of items) i.inset = any && i.type === 'normal';
    for (const l of this.querySelectorAll<HtMenuLabel>('ht-menu-label')) l.inset = any;
  }

  // ---- opening ----

  #onTriggerClick = (e: MouseEvent) => {
    if (this.contextmenu || e.defaultPrevented) return;
    // A click with no pointer (Enter or Space on a button) focuses the first item; a mouse click leaves focus on the panel.
    this.#openFocus = this.open ? 'first' : e.detail === 0 ? 'first' : 'panel';
    this.toggle();
  };

  #onTriggerKeydown = (e: KeyboardEvent) => {
    if (this.contextmenu || this.disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.#openFocus = e.key === 'ArrowDown' ? 'first' : 'last';
      if (this.open) this.#focusItem(e.key === 'ArrowDown' ? 0 : -1);
      else this.show();
    }
  };

  #onContextMenu = (e: MouseEvent) => {
    if (!this.contextmenu || this.disabled) return;
    const path = e.composedPath();
    const panel = this.#panel;
    if (panel && path.includes(panel)) return;
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    const target = e.target;
    if (!slot || !(target instanceof Node) || !slot.assignedElements().some((el) => el.contains(target))) return;
    e.preventDefault();
    this.#openFocus = 'panel';
    let { clientX: x, clientY: y } = e;
    // From the keyboard there is no pointer position: anchor to the focused target.
    if (x === 0 && y === 0 && e.target instanceof Element) {
      const r = e.target.getBoundingClientRect();
      x = r.left;
      y = r.bottom;
    }
    this.showAt(x, y);
  };

  #onOutside = (e: Event) => {
    const path = e.composedPath();
    const panel = this.#panel;
    // A context menu closes on any press outside the panel. A dropdown ignores its trigger, which toggles itself.
    const outside = this.contextmenu ? !!panel && !path.includes(panel) : !path.includes(this);
    if (outside) this.hide();
  };

  #onViewport = () => {
    if (this.contextmenu) this.hide();
    else this.#reposition();
  };

  // ---- keyboard and pointer inside the panel ----

  /** The item that has focus, if any. Compares against the root's activeElement: it works whether or not the window is focused. */
  #focused(): HtMenuItem | undefined {
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    return this.items.find((i) => i === active);
  }

  #focusItem(index: number) {
    const items = this.items;
    if (!items.length) return;
    const i = index < 0 ? items.length + index : index;
    items[Math.min(Math.max(i, 0), items.length - 1)].focus({ preventScroll: false });
  }

  #move(delta: 1 | -1) {
    const items = this.items;
    if (!items.length) return;
    const focused = this.#focused();
    const cur = focused ? items.indexOf(focused) : -1;
    if (cur < 0) return this.#focusItem(delta === 1 ? 0 : -1);
    items[(cur + delta + items.length) % items.length].focus();
  }

  #typeahead(char: string) {
    clearTimeout(this.#bufferTimer);
    this.#buffer += char.toLowerCase();
    this.#bufferTimer = window.setTimeout(() => (this.#buffer = ''), 500);
    const items = this.items;
    const focused = this.#focused();
    const cur = focused ? items.indexOf(focused) : -1;
    // The same letter typed again and again cycles through the items that start with it.
    const repeated = [...this.#buffer].every((c) => c === this.#buffer[0]);
    const needle = repeated ? this.#buffer[0] : this.#buffer;
    const start = repeated ? cur + 1 : Math.max(cur, 0);
    const ordered = [...items.slice(start), ...items.slice(0, start)];
    const hit = ordered.find((i) => i.label.toLowerCase().startsWith(needle));
    hit?.focus();
  }

  #onPanelKeydown = (e: KeyboardEvent) => {
    const focused = this.#focused();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        return this.#move(1);
      case 'ArrowUp':
        e.preventDefault();
        return this.#move(-1);
      case 'Home':
        e.preventDefault();
        return this.#focusItem(0);
      case 'End':
        e.preventDefault();
        return this.#focusItem(-1);
      case 'Escape':
        // Cancelling the keydown also stops an enclosing modal dialog from closing on this press.
        e.preventDefault();
        e.stopPropagation();
        return this.hide();
      case 'Tab':
        // Focus goes back to the trigger first, so Tab continues from there.
        return this.hide();
      case 'Enter':
        e.preventDefault();
        if (focused) this.#activate(focused);
        return;
      case ' ':
        if (!this.#buffer) {
          e.preventDefault();
          if (focused) this.#activate(focused);
          return;
        }
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.#typeahead(e.key);
    }
  };

  #itemFrom(e: Event): HtMenuItem | undefined {
    return e.composedPath().find((el): el is HtMenuItem => el instanceof HTMLElement && el.localName === 'ht-menu-item');
  }

  #onPanelClick = (e: MouseEvent) => {
    const item = this.#itemFrom(e);
    if (item) this.#activate(item);
  };

  #onPanelPointerMove = (e: PointerEvent) => {
    const item = this.#itemFrom(e);
    if (item && item !== this.#focused()) item.focus({ preventScroll: true });
  };

  #onPanelPointerLeave = () => {
    if (this.#focused()) this.#panel?.focus({ preventScroll: true });
  };

  #activate(item: HtMenuItem) {
    if (item.disabled) return;
    if (item.type === 'checkbox') {
      item.checked = !item.checked;
    } else if (item.type === 'radio') {
      for (const other of this.items) {
        if (other !== item && other.type === 'radio' && other.name === item.name) other.checked = false;
      }
      item.checked = true;
    }
    const checkable = item.type !== 'normal';
    const proceed = this.dispatchEvent(
      new CustomEvent('ht-select', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { value: item.value || item.label, item, checked: checkable ? item.checked : undefined },
      }),
    );
    if (proceed) this.hide();
  }

  // ---- positioning (same approach as ht-tooltip: flip on the main axis, clamp on the cross axis) ----

  #reposition() {
    const panel = this.#panel;
    if (panel && this.open) this.#place(panel);
  }

  #place(panel: HTMLElement) {
    const margin = 4;
    const b = panel.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let x: number;
    let y: number;
    let side: Side = 'bottom';
    if (this.#point) {
      // Context menu: top-left at the pointer, flipped to the other side of it when it would overflow.
      x = this.#point.x;
      y = this.#point.y;
      if (x + b.width > vw - margin) x -= b.width;
      if (y + b.height > vh - margin) y -= b.height;
    } else {
      const gap = 4;
      const [sideRaw, alignRaw] = this.placement.split('-');
      const preferred: Side = (['top', 'bottom', 'left', 'right'] as const).includes(sideRaw as Side)
        ? (sideRaw as Side)
        : 'bottom';
      const align: Align = alignRaw === 'end' ? 'end' : alignRaw === 'start' ? 'start' : 'center';
      const t = (this.#trigger ?? this).getBoundingClientRect();
      const across = (start: number, size: number, box: number) =>
        align === 'start' ? start : align === 'end' ? start + size - box : start + (size - box) / 2;
      const pos = {
        top: { x: across(t.left, t.width, b.width), y: t.top - b.height - gap },
        bottom: { x: across(t.left, t.width, b.width), y: t.bottom + gap },
        left: { x: t.left - b.width - gap, y: across(t.top, t.height, b.height) },
        right: { x: t.right + gap, y: across(t.top, t.height, b.height) },
      };
      const flip = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
      const fits = (s: Side) =>
        s === 'top' || s === 'bottom'
          ? pos[s].y >= margin && pos[s].y + b.height <= vh - margin
          : pos[s].x >= margin && pos[s].x + b.width <= vw - margin;
      side = preferred;
      if (!fits(side) && fits(flip[side])) side = flip[side];
      x = pos[side].x;
      y = pos[side].y;
    }
    panel.dataset.side = side;
    panel.style.left = `${Math.min(Math.max(margin, x), Math.max(margin, vw - b.width - margin))}px`;
    panel.style.top = `${Math.min(Math.max(margin, y), Math.max(margin, vh - b.height - margin))}px`;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#bufferTimer);
    document.removeEventListener('pointerdown', this.#onOutside, true);
    window.removeEventListener('resize', this.#onViewport);
    window.removeEventListener('scroll', this.#onViewport, true);
  }

  render() {
    return html`<slot
        name="trigger"
        @click=${this.#onTriggerClick}
        @keydown=${this.#onTriggerKeydown}
        @slotchange=${() => this.#syncTrigger()}
      ></slot>
      <div
        part="panel"
        class="panel"
        role="menu"
        popover="manual"
        tabindex="-1"
        @keydown=${this.#onPanelKeydown}
        @click=${this.#onPanelClick}
        @pointermove=${this.#onPanelPointerMove}
        @pointerleave=${this.#onPanelPointerLeave}
      >
        <slot @slotchange=${() => this.#syncInset()}></slot>
      </div>`;
  }
}

/**
 * One row in an `ht-menu`. Set `type` to `checkbox` or `radio` for a toggleable row; radio
 * items with the same `name` act as one group. A `shortcut` renders as keycaps on the right
 * (the same look as `ht-kbd`, drawn locally).
 *
 * The menu owns activation: it flips `checked`, fires `ht-select`, and closes.
 *
 * @tag ht-menu-item
 * @summary Menu row.
 *
 * @slot - Label.
 * @slot prefix - Icon before the label.
 * @slot shortcut - Replaces the `shortcut` keycaps.
 *
 * @csspart base - The row.
 *
 * @cssprop [--ht-menu-item-height=1.75rem] - Row height.
 */
export class HtMenuItem extends LitElement {
  static properties = {
    /** Value reported in `ht-select`. Defaults to the label text. */
    value: {},
    /** `normal`, `checkbox` (`menuitemcheckbox`) or `radio` (`menuitemradio`). */
    type: { reflect: true },
    /** Checked state for `checkbox` and `radio` items. */
    checked: { type: Boolean, reflect: true },
    /** Radio group name. Radio items sharing a name are mutually exclusive. */
    name: {},
    /** Keys, space-separated, e.g. `⌘ K` or `Ctrl Shift P`. Each becomes a keycap. */
    shortcut: {},
    /** Destructive action: danger text colour. */
    danger: { type: Boolean, reflect: true },
    /** Focusable but not activatable. */
    disabled: { type: Boolean, reflect: true },
    /** Reserves the check column so rows line up with checkable siblings. The menu sets this itself. */
    inset: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare type: 'normal' | 'checkbox' | 'radio';
  declare checked: boolean;
  declare name: string;
  declare shortcut: string;
  declare danger: boolean;
  declare disabled: boolean;
  declare inset: boolean;

  constructor() {
    super();
    this.value = '';
    this.type = 'normal';
    this.checked = false;
    this.name = '';
    this.shortcut = '';
    this.danger = false;
    this.disabled = false;
    this.inset = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#syncAria();
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
  }

  /** The row's text, without the prefix and shortcut slots. */
  get label(): string {
    let text = '';
    for (const n of Array.from(this.childNodes)) {
      if (n.nodeType === Node.TEXT_NODE) text += n.textContent;
      else if (n instanceof Element && !n.hasAttribute('slot')) text += n.textContent;
    }
    return text.replace(/\s+/g, ' ').trim();
  }

  static styles = css`
    :host { display: block; outline: none; }
    :host([hidden]) { display: none; }
    .item {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: var(--ht-menu-item-height, 1.75rem);
      padding: 4px 8px;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      cursor: default;
      user-select: none;
      border-radius: var(--ht-radius-md);
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    :host(:focus) .item { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    :host(:focus-visible) .item { box-shadow: inset 0 0 0 2px var(--ht-focus); }
    :host([danger]) .item { color: var(--ht-danger-text); }
    :host([danger]:focus) .item { background: color-mix(in oklab, var(--ht-danger) 12%, transparent); }
    :host([disabled]) .item { opacity: 0.55; cursor: not-allowed; }
    .ind {
      flex: none;
      display: grid;
      place-items: center;
      width: 16px;
      height: 16px;
      margin-left: -2px;
      color: var(--ht-accent-text);
    }
    .ind svg { width: 14px; height: 14px; }
    .dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }
    .text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    ::slotted([slot='prefix']) { flex: none; width: 16px; height: 16px; color: var(--ht-text-muted); }
    :host([danger]) ::slotted([slot='prefix']) { color: inherit; }
    .shortcut { flex: none; display: inline-flex; gap: 2px; margin-left: 16px; color: var(--ht-text-muted); }
    .key {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 2px 4px;
      font: 400 0.75rem/1rem var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-bottom-width: 2px;
      border-radius: var(--ht-radius-sm);
    }
    @media (prefers-reduced-motion: reduce) {
      .item { transition: none; }
    }
  `;

  #syncAria() {
    const role = this.type === 'checkbox' ? 'menuitemcheckbox' : this.type === 'radio' ? 'menuitemradio' : 'menuitem';
    this.setAttribute('role', role);
    if (this.type === 'normal') this.removeAttribute('aria-checked');
    else this.setAttribute('aria-checked', String(this.checked));
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  updated() {
    this.#syncAria();
  }

  render() {
    const keys = this.shortcut.split(/\s+/).filter(Boolean);
    const indicator =
      this.type === 'checkbox'
        ? this.checked
          ? html`<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${CHECK}</svg>`
          : nothing
        : this.type === 'radio'
          ? this.checked
            ? html`<span class="dot"></span>`
            : nothing
          : nothing;
    return html`<div part="base" class="item">
      ${this.type !== 'normal' || this.inset ? html`<span class="ind" aria-hidden="true">${indicator}</span>` : nothing}
      <slot name="prefix"></slot>
      <span class="text"><slot></slot></span>
      <span class="shortcut"><slot name="shortcut">${keys.map((k) => html`<kbd class="key">${k}</kbd>`)}</slot></span>
    </div>`;
  }
}

/**
 * Thin rule between groups of items in an `ht-menu`.
 *
 * @tag ht-menu-separator
 * @summary Menu divider.
 */
export class HtMenuSeparator extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'separator');
  }

  static styles = css`
    :host { display: block; height: 1px; margin: 4px -4px; background: var(--ht-border); }
  `;

  render() {
    return nothing;
  }
}

/**
 * Small uppercase heading above a group of items in an `ht-menu`. Purely visual: it is
 * presentational to assistive technology, so do not put information there that the items need.
 *
 * @tag ht-menu-label
 * @summary Menu group heading.
 *
 * @slot - Heading text.
 */
export class HtMenuLabel extends LitElement {
  static properties = {
    /** Reserves the check column so the text lines up with checkable rows. The menu sets this itself. */
    inset: { type: Boolean, reflect: true },
  };

  declare inset: boolean;

  constructor() {
    super();
    this.inset = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'presentation');
  }

  static styles = css`
    :host {
      display: block;
      padding: 6px 8px 2px;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
      cursor: default;
      user-select: none;
    }
    :host([inset]) { padding-left: 30px; }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('ht-menu')) customElements.define('ht-menu', HtMenu);
if (!customElements.get('ht-menu-item')) customElements.define('ht-menu-item', HtMenuItem);
if (!customElements.get('ht-menu-separator')) customElements.define('ht-menu-separator', HtMenuSeparator);
if (!customElements.get('ht-menu-label')) customElements.define('ht-menu-label', HtMenuLabel);

declare global {
  interface HTMLElementTagNameMap {
    'ht-menu': HtMenu;
    'ht-menu-item': HtMenuItem;
    'ht-menu-separator': HtMenuSeparator;
    'ht-menu-label': HtMenuLabel;
  }
}
