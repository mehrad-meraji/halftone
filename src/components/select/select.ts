import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

const CHECK = html`<svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/></svg>`;
const CHEVRON = html`<svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z"/></svg>`;
const CHEVRON_UP = html`<svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216.49,168.49a12,12,0,0,1-17,0L128,97,56.49,168.49a12,12,0,0,1-17-17l80-80a12,12,0,0,1,17,0l80,80A12,12,0,0,1,216.49,168.49Z"/></svg>`;

/** The text an option is known by: its `label`, else its text. Used for the trigger and for typeahead. */
const labelOf = (o: HtOption) => (o.label || o.textContent || '').replace(/\s+/g, ' ').trim();
/** The value an option stands for: its `value`, else its text (as a native `<option>` does). */
const valueOf = (o: HtOption) => o.value || labelOf(o);

type NativeOption = { kind: 'option'; value: string; text: string; disabled: boolean; selected: boolean };
type Native = NativeOption | { kind: 'group'; label: string; items: NativeOption[] } | { kind: 'separator' };

/**
 * Select field with a styled list you control, like Radix Select. Pressing the trigger opens a
 * listbox in the top layer, so it is never clipped and it stays above an open `ht-dialog`.
 * It flips above the trigger when there is no room below, and scroll arrows appear when the list
 * is longer than the room. Participates in forms.
 *
 * Put `ht-option` children in it (optionally inside `ht-option-group`, with `ht-separator` or
 * `<hr>` between). An `ht-option` can hold any content: icons, two lines, badges. Set its `label`
 * when the content is more than a name, so the trigger and typeahead have a short text.
 * Plain `<option>`, `<optgroup>` and `<hr>` children still work, as text only; do not mix them
 * with `ht-option` in one select.
 *
 * Keyboard, as in Radix: on the trigger, Enter, Space, ArrowDown and ArrowUp open it, and typing
 * picks a matching option without opening. In the list, arrows move, Home and End jump, PageUp and
 * PageDown move by ten, Enter or Space picks, Escape closes, and typing jumps to a match. Pressing
 * the trigger with a mouse and releasing over an option picks it. The trade: there is no native
 * mobile picker any more.
 *
 * @tag ht-select
 * @summary Select field.
 *
 * @slot - `ht-option`, `ht-option-group`, `ht-separator` (or plain `<option>`, `<optgroup>`, `<hr>`).
 *
 * @csspart label - The label element.
 * @csspart control - The bordered box.
 * @csspart select - The trigger button.
 * @csspart panel - The floating list.
 * @csspart message - The helper or error text.
 *
 * @cssprop [--ht-select-max-height=20rem] - Tallest the list gets before it scrolls.
 *
 * @fires change - A new option was chosen by the user. Re-dispatched from the host.
 * @fires open - The list opened. Does not bubble.
 * @fires close - The list closed. Does not bubble.
 */
export class HtSelect extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** Liquid glass look for the list: a translucent panel that blurs what is behind it. */
    glass: { type: Boolean, reflect: true },
    /** Visible label. With no visible label, set `aria-label` on the element instead; it is forwarded to the trigger. */
    label: {},
    /** Helper text under the field. */
    helper: {},
    /** Error text. Setting it marks the field invalid. */
    error: {},
    /** Muted text shown in the trigger until the user chooses. */
    placeholder: {},
    /** Selected option value. */
    value: {},
    name: {},
    /** Shows the list. Reflects, so closing from inside updates it. */
    open: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** Height: sm 32px, md 36px, lg 40px. */
    size: { reflect: true },
    _touched: { state: true },
    _formDisabled: { state: true },
    _text: { state: true },
    _native: { state: true },
    _canUp: { state: true },
    _canDown: { state: true },
  };

  declare glass: boolean;
  declare label: string;
  declare helper: string;
  declare error: string;
  declare placeholder: string;
  declare value: string;
  declare name: string;
  declare open: boolean;
  declare required: boolean;
  declare disabled: boolean;
  declare size: 'sm' | 'md' | 'lg';
  declare _touched: boolean;
  declare _formDisabled: boolean;
  declare _text: string;
  declare _native: Native[];
  declare _canUp: boolean;
  declare _canDown: boolean;

  #internals = this.attachInternals();
  #defaultValue = '';
  #ariaLabel: string | undefined;
  #observer?: MutationObserver;
  #ready = false;
  #wasOpen = false;
  #downAt: { x: number; y: number } | null = null;
  #suppressClick = false;
  #search = '';
  #searchTimer = 0;
  #scrollTimer = 0;

  constructor() {
    super();
    this.glass = false;
    this.label = '';
    this.helper = '';
    this.error = '';
    this.placeholder = '';
    this.value = '';
    this.name = '';
    this.open = false;
    this.required = false;
    this.disabled = false;
    this.size = 'md';
    this._touched = false;
    this._formDisabled = false;
    this._text = '';
    this._native = [];
    this._canUp = false;
    this._canDown = false;
    this.addEventListener('invalid', () => (this._touched = true));
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusout', (e) => {
      const next = e.relatedTarget as Node | null;
      if (!this.open && (!next || !this.contains(next))) this._touched = true;
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? '';
    // `aria-label` is not allowed on a generic host; move it to the trigger.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
    }
    this.#observer = new MutationObserver(() => queueMicrotask(this.#refresh));
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['value', 'label', 'disabled'],
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#unlisten();
    clearInterval(this.#scrollTimer);
    clearTimeout(this.#searchTimer);
  }

  static styles = css`
    :host { display: block; --_h: 2.25rem; }
    :host([size='sm']) { --_h: 2rem; }
    :host([size='lg']) { --_h: 2.5rem; }
    label {
      display: block;
      margin-bottom: 6px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .req { color: var(--ht-accent-text); margin-left: 2px; }
    .control {
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      height: var(--_h);
      color: var(--ht-text);
      background: color-mix(in oklch, var(--ht-text) 3%, transparent);
      border: 1px solid var(--ht-border-input);
      border-radius: var(--ht-radius-md);
      box-shadow: inset 0 1px 0 0 var(--ht-border-input);
      transition: border 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    .control:focus-within { box-shadow: inset 0 1px 0 0 var(--ht-border-input), 0 0 0 2px var(--ht-focus); }
    .control.invalid { border-color: var(--ht-danger); box-shadow: inset 0 1px 0 0 var(--ht-danger); }
    .control.invalid:focus-within { box-shadow: inset 0 1px 0 0 var(--ht-danger), 0 0 0 2px var(--ht-danger); }
    .trigger {
      all: unset;
      box-sizing: border-box;
      flex: 1;
      display: flex;
      align-items: center;
      min-width: 0;
      height: 100%;
      padding-inline: 1rem 2.25rem;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: inherit;
      cursor: pointer;
    }
    .trigger:disabled { color: var(--ht-text-subtle); cursor: not-allowed; }
    .value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .value.placeholder { color: var(--ht-text-subtle); }
    .chevron {
      position: absolute;
      right: 0.75rem;
      pointer-events: none;
      color: var(--ht-text-muted);
      transition: transform var(--ht-duration-in) var(--ht-ease-spring);
    }
    :host([open]) .chevron { transform: rotate(180deg); }
    .message { margin-top: 6px; font: 400 0.75rem/1.3 var(--ht-font-ui); color: var(--ht-text-muted); }
    .message.error { color: var(--ht-danger-text); }

    /* The list. It grows out of the side that faces the trigger, springs in and leaves faster. */
    .panel {
      position: fixed;
      inset: auto;
      margin: 0;
      box-sizing: border-box;
      width: max-content;
      min-width: var(--_w, 0);
      max-width: calc(100vw - 8px);
      max-height: min(var(--_room, 100vh), var(--ht-select-max-height, 20rem));
      padding: 0;
      overflow: hidden;
      flex-direction: column;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-md);
      opacity: 0;
      transform: translateY(var(--_dy, 0)) scale(0.96);
      transform-origin: var(--_origin, top);
      transition:
        opacity var(--ht-duration-out) ease-in,
        transform var(--ht-duration-out) ease-in,
        overlay var(--ht-duration-out) allow-discrete,
        display var(--ht-duration-out) allow-discrete;
    }
    .panel[data-side='bottom'] { --_dy: -6px; --_origin: top; }
    .panel[data-side='top'] { --_dy: 6px; --_origin: bottom; }
    .panel:popover-open {
      display: flex;
      opacity: 1;
      transform: none;
      transition-duration: var(--ht-duration-in);
      transition-timing-function: var(--ht-ease-spring);
    }
    @starting-style {
      .panel:popover-open { opacity: 0; transform: translateY(var(--_dy, 0)) scale(0.96); }
    }
    .panel:focus { outline: none; }
    .viewport {
      flex: 1;
      min-height: 0;
      padding: 4px;
      overflow: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scroll-padding-block: 26px; /* keep a focused option clear of the scroll arrows */
    }
    .sep, ::slotted(hr), ::slotted(ht-separator) { display: block; height: 1px; margin: 4px -4px; padding: 0; border: 0; background: var(--ht-border); }
    ::slotted(option), ::slotted(optgroup) { display: none; }
    .viewport[data-native] ::slotted(hr) { display: none; }
    .sb {
      all: unset;
      position: absolute;
      left: 0;
      right: 0;
      z-index: 1;
      display: none;
      place-items: center;
      height: 22px;
      color: var(--ht-text-muted);
      cursor: default;
      background: var(--ht-surface);
    }
    .sb.up { top: 0; border-radius: var(--ht-radius-lg) var(--ht-radius-lg) 0 0; }
    .sb.down { bottom: 0; border-radius: 0 0 var(--ht-radius-lg) var(--ht-radius-lg); }
    .sb.down svg { transform: rotate(180deg); }
    .sb[data-show] { display: grid; }
    :host([glass]) .panel {
      background: var(--ht-glass-panel-bg);
      border-color: transparent;
      box-shadow: var(--ht-glass-rim), var(--ht-glass-shadow);
      -webkit-backdrop-filter: var(--ht-glass-filter);
      backdrop-filter: var(--ht-glass-filter);
    }
    :host([glass]) .sb { background: transparent; }
    @media (prefers-reduced-motion: reduce) {
      .panel, .chevron { transition: none; }
    }
  `;

  get #trigger() {
    return this.renderRoot.querySelector<HTMLButtonElement>('.trigger');
  }
  get #panel() {
    return this.renderRoot.querySelector<HTMLElement>('.panel');
  }
  get #viewport() {
    return this.renderRoot.querySelector<HTMLElement>('.viewport');
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

  // ── options ──────────────────────────────────────────────────────────────

  /** Every option, in order: plain `<option>`s drawn here first, then slotted `ht-option`s. */
  #items(): HtOption[] {
    const out = [...this.renderRoot.querySelectorAll<HtOption>('.native ht-option')];
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])');
    for (const el of slot?.assignedElements() ?? []) {
      if (el instanceof HtOption) out.push(el);
      else if (el.localName === 'ht-option-group') out.push(...el.querySelectorAll<HtOption>(':scope > ht-option'));
    }
    return out;
  }

  #parseNative() {
    const opt = (o: HTMLOptionElement): NativeOption => ({
      kind: 'option',
      value: o.value,
      text: o.label || o.text,
      disabled: o.disabled,
      selected: o.defaultSelected,
    });
    const out: Native[] = [];
    for (const c of this.children) {
      if (c.localName === 'option') out.push(opt(c as HTMLOptionElement));
      else if (c.localName === 'hr') out.push({ kind: 'separator' });
      else if (c.localName === 'optgroup') {
        const g = c as HTMLOptGroupElement;
        out.push({ kind: 'group', label: g.label, items: [...g.querySelectorAll('option')].map(opt) });
      }
    }
    // A lone <hr> among ht-options is a separator the slot draws, not a native list.
    this._native = out.some((n) => n.kind !== 'separator') ? out : [];
  }

  #refresh = () => {
    this.#parseNative();
    // The native options render on the next update; sync after it.
    void this.updateComplete.then(() => this.#sync());
  };

  /** Marks the chosen option, sets the trigger text and the form value. */
  #sync() {
    // A listbox may own options and groups only, so a divider is hidden from the accessibility tree.
    for (const el of this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])')?.assignedElements() ?? []) {
      if (el.localName === 'hr' || el.localName === 'ht-separator') el.setAttribute('aria-hidden', 'true');
    }
    const items = this.#items();
    if (!this.#ready && items.length) {
      this.#ready = true;
      if (!this.value) {
        const flat = this._native.flatMap((n) => (n.kind === 'group' ? n.items : n.kind === 'option' ? [n] : []));
        const pre = items.find((i) => i.hasAttribute('selected'));
        const nat = flat.find((o) => o.selected);
        if (pre) this.value = valueOf(pre);
        else if (nat) this.value = nat.value;
        else if (!this.placeholder) {
          // Like a native select: with no placeholder the first option is chosen.
          const firstOn = items.find((i) => !i.disabled);
          if (firstOn) this.value = valueOf(firstOn);
        }
        if (this.value && !this.hasAttribute('value')) this.#defaultValue = this.value;
      }
    }
    this.#mark();
    this.#commit();
  }

  /** Marks the option that matches `value` and sets the trigger text. */
  #mark() {
    let chosen: HtOption | undefined;
    for (const i of this.#items()) {
      i.selected = !!this.value && valueOf(i) === this.value;
      if (i.selected && !chosen) chosen = i;
    }
    this._text = chosen ? labelOf(chosen) : '';
  }

  #commit() {
    this.#internals.setFormValue?.(this.value);
    if (this.required && !this.value) {
      this.#internals.setValidity?.({ valueMissing: true }, 'Please select an item in the list.', this.#trigger ?? undefined);
    } else {
      this.#internals.setValidity?.({});
    }
  }

  // State that follows from other state is set here, before render, never in updated():
  // a change there costs a second render and Lit warns "scheduled an update after an update completed".
  willUpdate(changed: Map<string, unknown>) {
    if (!this.hasUpdated) this.#parseNative();
    if (changed.has('value') && this.#ready) this.#mark();
  }

  firstUpdated() {
    // The native options render in this first update; sync once it is done.
    void this.updateComplete.then(() => this.#sync());
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('required') || changed.has('value')) this.#commit();
    if (changed.has('disabled') && this.disabled && this.open) this.open = false;
    if (changed.has('open')) {
      const panel = this.#panel;
      if (!panel) return;
      if (this.open && !this.disabled && !panel.matches(':popover-open')) this.#reveal(panel);
      else if (!this.open && panel.matches(':popover-open')) this.#conceal(panel);
      else if (this.open && this.disabled) this.open = false;
      const isOpen = this.open && panel.matches(':popover-open');
      if (isOpen !== this.#wasOpen) {
        this.#wasOpen = isOpen;
        this.dispatchEvent(isOpen ? new Event('open') : new Event('close'));
      }
    }
  }

  // ── open and close ───────────────────────────────────────────────────────

  #reveal(panel: HTMLElement) {
    panel.showPopover();
    this.#place(panel);
    document.addEventListener('pointerdown', this.#onOutside, true);
    window.addEventListener('resize', this.#reposition);
    window.addEventListener('scroll', this.#onScroll, true);
    // Focus moves into the list, onto the chosen option (or the first one).
    const items = this.#items().filter((i) => !i.disabled);
    const start = items.find((i) => i.selected) ?? items[0];
    if (start) this.#focusItem(start, 'center');
    else panel.focus({ preventScroll: true });
  }

  #conceal(panel: HTMLElement) {
    const hadFocus = this.#focusInside();
    panel.hidePopover();
    this.#unlisten();
    this.#downAt = null;
    clearInterval(this.#scrollTimer);
    if (hadFocus) this.#trigger?.focus({ preventScroll: true });
  }

  #unlisten() {
    document.removeEventListener('pointerdown', this.#onOutside, true);
    window.removeEventListener('resize', this.#reposition);
    window.removeEventListener('scroll', this.#onScroll, true);
  }

  #active(): Element | null {
    return this.renderRoot instanceof ShadowRoot ? (this.renderRoot.activeElement ?? document.activeElement) : document.activeElement;
  }

  #focusInside() {
    const a = this.#active();
    return !!a && a !== this.#trigger && (this.contains(a) || this.renderRoot.contains(a));
  }

  #onOutside = (e: Event) => {
    if (!e.composedPath().includes(this)) this.open = false;
  };

  #reposition = () => {
    const panel = this.#panel;
    if (panel && this.open) this.#place(panel);
  };

  #onScroll = (e: Event) => {
    // Scrolling the list itself must not move the list.
    if (!e.composedPath().includes(this.#panel as EventTarget)) this.#reposition();
  };

  #place(panel: HTMLElement) {
    const trigger = this.#trigger;
    if (!trigger) return;
    const gap = 4;
    const margin = 4;
    const t = trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    panel.style.setProperty('--_w', `${t.width}px`);
    panel.style.setProperty('--_room', `${vh - 2 * margin}px`);
    // offsetHeight and offsetWidth ignore the entry transform (the panel starts at 0.96 scale).
    const natural = panel.offsetHeight;
    const below = vh - t.bottom - gap - margin;
    const above = t.top - gap - margin;
    const side = natural <= below || below >= above ? 'bottom' : 'top';
    const room = Math.max(80, side === 'bottom' ? below : above);
    panel.style.setProperty('--_room', `${room}px`);
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    panel.dataset.side = side;
    const left = Math.min(Math.max(margin, t.left), Math.max(margin, vw - width - margin));
    panel.style.left = `${left}px`;
    panel.style.top = `${side === 'bottom' ? t.bottom + gap : t.top - gap - height}px`;
    this.#updateScroll();
  }

  #updateScroll = () => {
    const vp = this.#viewport;
    if (!vp) return;
    // 5px of slack: the list has 4px of padding that a scrolled-to option never reaches.
    this._canUp = vp.scrollTop > 5;
    this._canDown = vp.scrollTop + vp.clientHeight < vp.scrollHeight - 5;
  };

  #autoScroll(dir: -1 | 1) {
    const vp = this.#viewport;
    clearInterval(this.#scrollTimer);
    if (!vp) return;
    this.#scrollTimer = window.setInterval(() => {
      vp.scrollTop += dir * 8;
      this.#updateScroll();
    }, 16);
  }

  // ── choosing ─────────────────────────────────────────────────────────────

  #focusItem(item: HtOption, block: ScrollLogicalPosition = 'nearest') {
    item.focus({ preventScroll: true });
    item.scrollIntoView({ block });
    this.#updateScroll();
  }

  #current(): HtOption | undefined {
    const a = this.#active();
    return this.#items().find((i) => i === a);
  }

  #choose(item: HtOption, close = true) {
    if (item.disabled) return;
    const next = valueOf(item);
    const changed = next !== this.value;
    this.value = next;
    this._touched = true;
    this.#sync();
    if (changed) this.dispatchEvent(new Event('change', { bubbles: true }));
    if (close) this.open = false;
  }

  /** Radix typeahead: letters typed within a second make a prefix; the same letter repeated cycles. */
  #typeahead(char: string, items: HtOption[], from: HtOption | undefined): HtOption | undefined {
    clearTimeout(this.#searchTimer);
    this.#search += char.toLowerCase();
    this.#searchTimer = window.setTimeout(() => (this.#search = ''), 1000);
    const enabled = items.filter((i) => !i.disabled);
    const at = from ? enabled.indexOf(from) : -1;
    const repeated = this.#search.length > 1 && [...this.#search].every((c) => c === this.#search[0]);
    const needle = repeated ? this.#search[0] : this.#search;
    const skip = this.#search.length === 1 || repeated ? at + 1 : Math.max(at, 0);
    const ordered = [...enabled.slice(skip), ...enabled.slice(0, skip)];
    return ordered.find((i) => labelOf(i).toLowerCase().startsWith(needle));
  }

  #onKeydown = (e: KeyboardEvent) => {
    if (this.disabled || this._formDisabled) return;
    const printable = e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey;
    const items = this.#items();
    if (!this.open) {
      if (e.composedPath()[0] !== this.#trigger) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.#suppressClick = false;
        this.open = true;
      } else if (printable) {
        const hit = this.#typeahead(e.key, items, items.find((i) => i.selected));
        if (hit) this.#choose(hit, false);
      }
      return;
    }
    // Open: keys act on the list.
    const enabled = items.filter((i) => !i.disabled);
    const cur = this.#current();
    const at = cur ? enabled.indexOf(cur) : -1;
    const go = (i: number) => {
      const target = enabled[Math.min(Math.max(i, 0), enabled.length - 1)];
      if (target) this.#focusItem(target);
    };
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        this.open = false;
        break;
      case 'Tab':
        e.preventDefault(); // Focus stays in the list until it closes, as in Radix.
        break;
      case 'ArrowDown':
        e.preventDefault();
        go(at + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        go(at < 0 ? 0 : at - 1);
        break;
      case 'Home':
        e.preventDefault();
        go(0);
        break;
      case 'End':
        e.preventDefault();
        go(enabled.length - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        go(at + 10);
        break;
      case 'PageUp':
        e.preventDefault();
        go(at - 10);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (cur) this.#choose(cur);
        break;
      default:
        if (printable) {
          const hit = this.#typeahead(e.key, items, cur);
          if (hit) this.#focusItem(hit);
        }
    }
  };

  // ── pointer ──────────────────────────────────────────────────────────────

  #optionAt(e: Event) {
    return e.composedPath().find((n): n is HtOption => n instanceof HtOption);
  }

  /** A mouse press opens at once (as in Radix), so the same press can drag onto an option. */
  #onTriggerPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || e.ctrlKey || e.pointerType !== 'mouse' || this.disabled || this._formDisabled) return;
    e.preventDefault();
    this.#downAt = { x: e.clientX, y: e.clientY };
    this.#suppressClick = true;
    setTimeout(() => (this.#suppressClick = false), 400);
    this.open = !this.open;
  };

  #onTriggerClick = () => {
    if (this.#suppressClick) {
      this.#suppressClick = false;
      return;
    }
    if (!this.disabled && !this._formDisabled) this.open = !this.open;
  };

  #onPanelPointerMove = (e: PointerEvent) => {
    const item = this.#optionAt(e);
    if (item && !item.disabled && item !== this.#current()) item.focus({ preventScroll: true });
  };

  #onPanelPointerUp = (e: PointerEvent) => {
    const down = this.#downAt;
    this.#downAt = null;
    const item = this.#optionAt(e);
    // Press on the trigger, drag, release on an option: pick it.
    if (down && item && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) this.#choose(item);
  };

  #onPanelClick = (e: Event) => {
    const item = this.#optionAt(e);
    if (item) this.#choose(item);
  };

  // ── render ───────────────────────────────────────────────────────────────

  #renderNative() {
    if (!this._native.length) return nothing;
    const opt = (o: NativeOption) => html`<ht-option value=${o.value} ?disabled=${o.disabled}>${o.text}</ht-option>`;
    return html`<div class="native" style="display:contents">
      ${this._native.map((n) =>
        n.kind === 'option'
          ? opt(n)
          : n.kind === 'separator'
            ? html`<hr class="sep" aria-hidden="true" />`
            : html`<ht-option-group label=${n.label}>${n.items.map(opt)}</ht-option-group>`,
      )}
    </div>`;
  }

  render() {
    const native = this._touched ? this.#internals.validationMessage : '';
    const message = this.error || native || this.helper;
    const invalid = !!this.error || !!native;
    const off = this.disabled || this._formDisabled;
    return html`
      ${this.label
        ? html`<label part="label" for="control">${this.label}${this.required
            ? html`<span class="req" aria-hidden="true">*</span>`
            : nothing}</label>`
        : nothing}
      <div part="control" class="control ${invalid ? 'invalid' : ''}">
        <button
          id="control"
          part="select"
          class="trigger"
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="listbox"
          aria-required=${this.required ? 'true' : 'false'}
          aria-label=${ifDefined(this.label ? undefined : this.#ariaLabel)}
          aria-invalid=${invalid ? 'true' : 'false'}
          aria-describedby=${ifDefined(message ? 'message' : undefined)}
          ?disabled=${off}
          @pointerdown=${this.#onTriggerPointerDown}
          @click=${this.#onTriggerClick}
        >
          <span class="value ${this._text ? '' : 'placeholder'}">${this._text || this.placeholder || ' '}</span>
        </button>
        <span class="chevron">${CHEVRON}</span>
      </div>
      <div
        id="listbox"
        part="panel"
        class="panel"
        role="listbox"
        popover="manual"
        tabindex="-1"
        aria-label=${this.label || this.#ariaLabel || this.placeholder || 'Options'}
        @pointermove=${this.#onPanelPointerMove}
        @pointerup=${this.#onPanelPointerUp}
        @click=${this.#onPanelClick}
      >
        <button class="sb up" tabindex="-1" aria-hidden="true" ?data-show=${this._canUp}
          @pointerenter=${() => this.#autoScroll(-1)} @pointerleave=${() => clearInterval(this.#scrollTimer)}>${CHEVRON_UP}</button>
        <div class="viewport" part="viewport" ?data-native=${this._native.length > 0} @scroll=${this.#updateScroll}>
          ${this.#renderNative()}
          <slot @slotchange=${this.#refresh}></slot>
        </div>
        <button class="sb down" tabindex="-1" aria-hidden="true" ?data-show=${this._canDown}
          @pointerenter=${() => this.#autoScroll(1)} @pointerleave=${() => clearInterval(this.#scrollTimer)}>${CHEVRON_UP}</button>
      </div>
      ${message
        ? html`<div id="message" part="message" class="message ${invalid ? 'error' : ''}" role=${ifDefined(invalid ? 'alert' : undefined)}>${message}</div>`
        : nothing}
    `;
  }
}

/**
 * One choice in an `ht-select`. Put any content inside: text, an icon, two lines. Set `label` to the
 * short text the trigger and typeahead should use when the content is more than a name.
 *
 * @tag ht-option
 * @summary Select option.
 *
 * @slot - Content.
 * @slot prefix - Icon or avatar before the content.
 *
 * @csspart base - The row.
 */
export class HtOption extends LitElement {
  static properties = {
    /** Value submitted when chosen. Defaults to the text, as a native `<option>` does. */
    value: {},
    /** Short text for the trigger and typeahead. Defaults to the text content. */
    label: {},
    disabled: { type: Boolean, reflect: true },
    /** Set by `ht-select`. */
    selected: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare label: string;
  declare disabled: boolean;
  declare selected: boolean;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.disabled = false;
    this.selected = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'option');
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
  }

  static styles = css`
    :host { display: block; outline: none; cursor: default; user-select: none; }
    .row {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: var(--ht-radius-md);
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    :host(:focus) .row { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    :host([disabled]) .row { opacity: 0.55; cursor: not-allowed; }
    :host([disabled]:focus) .row { background: transparent; }
    .text { flex: 1; min-width: 0; }
    .check { flex: none; display: grid; place-items: center; width: 16px; height: 16px; color: var(--ht-accent-text); opacity: 0; }
    :host([selected]) .check { opacity: 1; }
    ::slotted([slot='prefix']) { flex: none; width: 16px; height: 16px; color: var(--ht-text-muted); }
    @media (prefers-reduced-motion: reduce) { .row { transition: none; } }
  `;

  updated() {
    this.setAttribute('aria-selected', String(this.selected));
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  render() {
    return html`<div part="base" class="row"><slot name="prefix"></slot><span class="text"><slot></slot></span><span class="check">${CHECK}</span></div>`;
  }
}

/**
 * A labelled group of `ht-option`s inside an `ht-select`.
 *
 * @tag ht-option-group
 * @summary Select option group.
 *
 * @slot - `ht-option` elements.
 * @slot label - Replaces the `label` text.
 *
 * @csspart label - The group label.
 */
export class HtOptionGroup extends LitElement {
  static properties = {
    /** Group name, shown above its options. */
    label: {},
  };

  declare label: string;

  constructor() {
    super();
    this.label = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'group');
  }

  static styles = css`
    :host { display: block; }
    .label {
      padding: 6px 8px 2px;
      font: 600 0.75rem/1rem var(--ht-font-ui);
      color: var(--ht-text-muted);
      user-select: none;
    }
  `;

  updated() {
    if (this.label) this.setAttribute('aria-label', this.label);
    else this.removeAttribute('aria-label');
  }

  render() {
    return html`<div part="label" class="label"><slot name="label">${this.label}</slot></div><slot></slot>`;
  }
}

for (const [tag, ctor] of [
  ['ht-select', HtSelect],
  ['ht-option', HtOption],
  ['ht-option-group', HtOptionGroup],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-select': HtSelect;
    'ht-option': HtOption;
    'ht-option-group': HtOptionGroup;
  }
}
