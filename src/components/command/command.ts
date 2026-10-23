import { LitElement, css, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';

let uid = 0;

/** Case-insensitive match: a substring, or (3+ letters) the letters in order. */
function matches(haystack: string, token: string, loose: string) {
  if (haystack.includes(token)) return true;
  if (token.length < 3) return false;
  let i = 0;
  for (const ch of loose) if (ch === token[i] && ++i === token.length) return true;
  return false;
}

/**
 * Search box over a filtered list of commands: a combobox with a listbox, in the style of a
 * command palette. Items are `ht-command-item` children, optionally inside `ht-command-group`.
 * Typing filters them; Arrow keys move the highlight while focus stays in the search box
 * (`aria-activedescendant`); Enter picks.
 *
 * Inline by default. With `palette`, the same content opens in a native `<dialog>` near the
 * top of the page: set `open`, call `show()`, or give it a `hotkey` such as `mod+k` (`mod` is
 * Command on Apple platforms and Control elsewhere). Escape closes it, and focus returns to
 * where it was.
 *
 * Filtering matches each word of the query against the item text and its `keywords`, as a
 * substring, or (for words of 3+ letters) as the item text's letters in order. Items keep
 * their authored order. Groups with no match hide.
 *
 * Screen readers: results are announced through a polite status region ("3 results"). Where
 * the browser cannot link the search box to a slotted option by reference
 * (`ariaActiveDescendantElement`), the highlighted option is announced there instead.
 *
 * Home and End jump to the first and last result, so they do not move the text caret.
 *
 * @tag ht-command
 * @summary Searchable command list and palette.
 *
 * @slot - `ht-command-item` and `ht-command-group` elements.
 * @slot empty - Shown when nothing matches. Defaults to "No results."
 *
 * @csspart base - The bordered box (inline mode) or the box inside the dialog.
 * @csspart dialog - The native `<dialog>` (palette mode).
 * @csspart search - The row holding the search icon and input.
 * @csspart input - The native `<input>`.
 * @csspart list - The scrolling list.
 * @csspart empty - The empty-state area.
 *
 * @cssprop [--ht-command-width=32rem] - Palette width.
 * @cssprop [--ht-command-list-height=18.75rem] - Maximum height of the list before it scrolls.
 *
 * @fires ht-select - An item was picked by Enter or click. `detail`: `{ value, item }`. Bubbles, composed, cancelable: in palette mode, `preventDefault()` keeps the palette open.
 * @fires input - The search text changed. Native event, crosses the shadow boundary.
 * @fires ht-open - The palette opened.
 * @fires ht-close - The palette closed, by any route.
 */
export class HtCommand extends LitElement {
  static properties = {
    /** Liquid glass look: a translucent, blurred panel with glass rows. Best over a colourful or photographic backdrop. */
    glass: { type: Boolean, reflect: true },
    /** The search text. */
    value: {},
    /** Placeholder in the search box. */
    placeholder: {},
    /** Accessible name for the search box and the palette dialog. */
    label: {},
    /** Opens the command in a modal dialog. */
    palette: { type: Boolean, reflect: true },
    /** Shows the palette. Only meaningful with `palette`. Reflects. */
    open: { type: Boolean, reflect: true },
    /** Key combination that toggles the palette (or focuses the search box when inline), e.g. `mod+k`, `ctrl+shift+p`, `/`. */
    hotkey: {},
    _count: { state: true },
    _status: { state: true },
  };

  declare value: string;
  declare placeholder: string;
  declare label: string;
  declare palette: boolean;
  declare open: boolean;
  declare hotkey: string;
  declare _count: number;
  declare _status: string;

  #active: HtCommandItem | null = null;
  #observer: MutationObserver | null = null;
  #refilterQueued = false;

  declare glass: boolean;

  constructor() {
    super();
    this.glass = false;
    this.value = '';
    this.placeholder = 'Type A Command Or Search';
    this.label = 'Search';
    this.palette = false;
    this.open = false;
    this.hotkey = '';
    this._count = -1; // unknown until the first filter pass
    this._status = '';
  }

  static styles = css`
    :host { display: block; }
    :host([palette]) { display: contents; }
    [hidden] { display: none !important; }
    .shell {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      font: 400 0.875rem/1.5 var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-md);
    }
    :host([glass]) .shell {
      background: var(--ht-glass-panel-bg);
      border-color: transparent;
      box-shadow: var(--ht-glass-rim), var(--ht-glass-shadow);
    -webkit-backdrop-filter: var(--ht-glass-filter);
    backdrop-filter: var(--ht-glass-filter);
    --_row-bg: var(--ht-glass-row-bg);
    --_row-bg-on: var(--ht-glass-row-bg-on);
    --_row-rim: var(--ht-glass-rim);
    --_row-rim-on: var(--ht-glass-rim-on);
    --_row-gap: 1px;
    }
    :host([glass]) .search { border-bottom-color: color-mix(in oklab, var(--ht-text) 12%, transparent); }
    dialog {
      box-sizing: border-box;
      width: min(var(--ht-command-width, 32rem), calc(100vw - 2rem));
      max-height: calc(100vh - 8rem);
      margin: 12vh auto auto;
      padding: 0;
      overflow: hidden;
      color: inherit;
      background: transparent;
      border: 0;
    }
    dialog[open] { display: flex; flex-direction: column; }
    /* Motion, as in ht-dialog: spring in, faster ease-in out, scrim fades and blurs the page. */
    dialog, dialog::backdrop {
      transition:
        opacity var(--ht-duration-out) ease-in,
        transform var(--ht-duration-out) ease-in,
        backdrop-filter var(--ht-duration-out) ease-in,
        overlay var(--ht-duration-out) allow-discrete,
        display var(--ht-duration-out) allow-discrete;
    }
    dialog { opacity: 0; transform: translateY(-8px) scale(0.96); }
    dialog::backdrop { opacity: 0; backdrop-filter: blur(0); }
    dialog[open] { opacity: 1; transform: none; }
    dialog[open]::backdrop { opacity: 1; backdrop-filter: blur(3px); }
    dialog[open], dialog[open]::backdrop { transition-duration: var(--ht-duration-in); transition-timing-function: var(--ht-ease-spring); }
    dialog[open]::backdrop { transition-timing-function: var(--ht-ease); }
    @starting-style {
      dialog[open] { opacity: 0; transform: translateY(-8px) scale(0.96); }
      dialog[open]::backdrop { opacity: 0; backdrop-filter: blur(0); }
    }
    dialog::backdrop { background: oklch(0.12 0.02 295 / 0.55); }
    dialog .shell { max-height: calc(100vh - 8rem); }
    @media (prefers-reduced-motion: reduce) {
      dialog, dialog::backdrop { transition: none; }
    }

    .search {
      flex: none;
      display: flex;
      align-items: center;
      gap: 8px;
      height: 2.5rem;
      padding-inline: 12px;
      border-bottom: 1px solid var(--ht-border);
    }
    .search svg { flex: none; width: 16px; height: 16px; color: var(--ht-text-muted); }
    input {
      all: unset;
      /* After all: unset the field would inherit the page's alignment (a centred hero centred the text). */
      text-align: start;
      box-sizing: border-box;
      flex: 1;
      min-width: 0;
      height: 100%;
      font: 400 0.875rem/1.5 var(--ht-font-ui);
      color: var(--ht-text);
    }
    input::placeholder { color: var(--ht-text-muted); opacity: 1; }
    .search:focus-within { box-shadow: inset 0 -2px 0 0 var(--ht-focus); }
    .list {
      flex: 1;
      min-height: 0;
      max-height: var(--ht-command-list-height, 18.75rem);
      padding: 4px;
      overflow: auto;
      overscroll-behavior: contain;
    }
    .empty { padding: 24px 12px; text-align: center; color: var(--ht-text-muted); }
    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    /* A lighter scrim, so the glass has colour to blur. */
    :host([glass]) dialog::backdrop { background: oklch(0.12 0.02 295 / 0.2); }
  `;

  get #input() {
    return this.renderRoot.querySelector<HTMLInputElement>('input');
  }
  get #dialog() {
    return this.renderRoot.querySelector('dialog');
  }

  /** Every item, in document order. */
  get items(): HtCommandItem[] {
    // Skips items that have not been upgraded yet.
    return Array.from(this.querySelectorAll<HtCommandItem>('ht-command-item')).filter((i) => typeof i.label === 'string');
  }

  /** Opens the palette. */
  show() {
    this.open = true;
  }
  /** Closes the palette. */
  close() {
    this.open = false;
  }
  /** Moves focus to the search box. */
  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.#onHotkey);
    this.#observer = new MutationObserver(() => this.#queueRefilter());
    this.#observer.observe(this, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['keywords', 'disabled', 'value'],
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.#onHotkey);
    this.#observer?.disconnect();
    this.#observer = null;
    this.#dialog?.close();
  }

  firstUpdated() {
    this.#filter(true);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('value')) this.#filter(true);
    if (changed.has('open') || changed.has('palette')) {
      const dialog = this.#dialog;
      if (dialog) {
        if (this.open && !dialog.open) {
          dialog.showModal();
          this.#filter(true);
          this.#input?.focus();
          this.dispatchEvent(new Event('ht-open', { bubbles: true, composed: true }));
        } else if (!this.open && dialog.open) {
          dialog.close();
        }
      }
    }
  }

  // ---- filtering ----

  #queueRefilter() {
    if (this.#refilterQueued) return;
    this.#refilterQueued = true;
    queueMicrotask(() => {
      this.#refilterQueued = false;
      this.#filter(false);
    });
  }

  #filter(resetActive: boolean) {
    const tokens = this.value.toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const item of this.items) {
      const text = item.label.toLowerCase();
      const hay = `${text} ${item.keywords.toLowerCase()}`;
      const loose = text.replace(/\s+/g, '');
      const hit = tokens.every((t) => matches(hay, t, loose));
      item.toggleAttribute('hidden', !hit);
      if (hit) count++;
    }
    for (const group of this.querySelectorAll<HtCommandGroup>('ht-command-group')) {
      group.toggleAttribute('hidden', !group.querySelector('ht-command-item:not([hidden])'));
    }
    this._count = count;
    this._status = count === 0 ? 'No results' : `${count} result${count === 1 ? '' : 's'}`;
    const navigable = this.#navigable();
    if (resetActive || !this.#active || !navigable.includes(this.#active)) this.#setActive(navigable[0] ?? null, false);
  }

  #navigable() {
    return this.items.filter((i) => !i.hidden && !i.disabled);
  }

  // ---- highlight ----

  #setActive(item: HtCommandItem | null, scroll = true) {
    if (this.#active && this.#active !== item) this.#active.active = false;
    this.#active = item;
    if (item) item.active = true;
    const input = this.#input;
    if (input) {
      if (item) {
        if (!item.id) item.id = `ht-command-item-${++uid}`;
        if ('ariaActiveDescendantElement' in Element.prototype) {
          // The option is in the light DOM and the input in the shadow root, so an id reference cannot reach it.
          (input as unknown as { ariaActiveDescendantElement: Element | null }).ariaActiveDescendantElement = item;
        } else {
          input.setAttribute('aria-activedescendant', item.id);
          const list = this.#navigable();
          this._status = `${item.label}, ${list.indexOf(item) + 1} of ${list.length}`;
        }
      } else {
        (input as unknown as { ariaActiveDescendantElement: Element | null }).ariaActiveDescendantElement = null;
        input.removeAttribute('aria-activedescendant');
      }
    }
    if (item && scroll) {
      const list = this.renderRoot.querySelector<HTMLElement>('.list');
      // The first item scrolls to the very top so its group heading shows too.
      if (list && this.#navigable()[0] === item) list.scrollTop = 0;
      else item.scrollIntoView({ block: 'nearest' });
    }
  }

  #move(delta: 1 | -1) {
    const list = this.#navigable();
    if (!list.length) return;
    const cur = this.#active ? list.indexOf(this.#active) : -1;
    const next = cur < 0 ? (delta === 1 ? 0 : list.length - 1) : (cur + delta + list.length) % list.length;
    this.#setActive(list[next]);
  }

  #select(item: HtCommandItem | null) {
    if (!item || item.disabled) return;
    const proceed = this.dispatchEvent(
      new CustomEvent('ht-select', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { value: item.value || item.label, item },
      }),
    );
    if (proceed && this.palette) this.close();
  }

  // ---- events ----

  #onInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        return this.#move(1);
      case 'ArrowUp':
        e.preventDefault();
        return this.#move(-1);
      case 'Home': {
        e.preventDefault();
        return this.#setActive(this.#navigable()[0] ?? null);
      }
      case 'End': {
        e.preventDefault();
        const list = this.#navigable();
        return this.#setActive(list[list.length - 1] ?? null);
      }
      case 'Enter':
        e.preventDefault();
        return this.#select(this.#active);
      case 'Escape':
        // In a palette the native dialog closes itself. Inline, Escape clears the text first.
        if (!this.palette && this.value) {
          e.preventDefault();
          e.stopPropagation();
          this.value = '';
        }
    }
  };

  #itemFrom(e: Event): HtCommandItem | undefined {
    return e.composedPath().find((el): el is HtCommandItem => el instanceof HTMLElement && el.localName === 'ht-command-item');
  }

  #onListClick = (e: MouseEvent) => {
    const item = this.#itemFrom(e);
    if (item && !item.disabled) {
      this.#setActive(item, false);
      this.#select(item);
    }
  };

  #onListPointerMove = (e: PointerEvent) => {
    const item = this.#itemFrom(e);
    if (item && !item.disabled && item !== this.#active) this.#setActive(item, false);
  };

  // Keep focus in the search box when an item is pressed.
  #onListMouseDown = (e: MouseEvent) => e.preventDefault();

  #onHotkey = (e: KeyboardEvent) => {
    if (!this.hotkey || e.repeat || e.isComposing) return;
    const parts = this.hotkey.toLowerCase().split('+').map((p) => p.trim());
    const key = parts.pop() ?? '';
    const mac = /mac|iphone|ipad/i.test(navigator.platform);
    const want = {
      meta: parts.includes('meta') || parts.includes('cmd') || (parts.includes('mod') && mac),
      ctrl: parts.includes('ctrl') || parts.includes('control') || (parts.includes('mod') && !mac),
      alt: parts.includes('alt') || parts.includes('option'),
      shift: parts.includes('shift'),
    };
    if (e.metaKey !== want.meta || e.ctrlKey !== want.ctrl || e.altKey !== want.alt || e.shiftKey !== want.shift) return;
    const name = key === 'esc' ? 'escape' : key;
    // Option rewrites `e.key` on macOS, so fall back to the physical key for letters and digits.
    const physical = e.code === `Key${name.toUpperCase()}` || e.code === `Digit${name}`;
    if (e.key.toLowerCase() !== name && !(want.alt && physical)) return;
    e.preventDefault();
    if (this.palette) this.open = !this.open;
    else this.#input?.focus();
  };

  #onDialogClose = () => {
    this.open = false;
    this.value = '';
    this.dispatchEvent(new Event('ht-close', { bubbles: true, composed: true }));
  };
  #onDialogClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) this.close();
  };

  render() {
    const shell = html`
      <div part="base" class="shell">
        <div part="search" class="search">
          <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z"/></svg>
          <input
            part="input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="list"
            aria-autocomplete="list"
            aria-label=${this.label}
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder=${this.placeholder}
            .value=${live(this.value)}
            @input=${this.#onInput}
            @keydown=${this.#onKeydown}
          />
        </div>
        <div
          part="list"
          class="list"
          id="list"
          role="listbox"
          aria-label=${this.label}
          ?hidden=${this._count === 0}
          @click=${this.#onListClick}
          @pointermove=${this.#onListPointerMove}
          @mousedown=${this.#onListMouseDown}
        >
          <slot @slotchange=${() => this.#queueRefilter()}></slot>
        </div>
        <div part="empty" class="empty" ?hidden=${this._count !== 0}><slot name="empty">No results.</slot></div>
        <div class="sr" role="status" aria-live="polite">${this._status}</div>
      </div>
    `;
    if (!this.palette) return shell;
    return html`<dialog
      part="dialog"
      aria-label=${this.label}
      @close=${this.#onDialogClose}
      @click=${this.#onDialogClick}
    >
      ${shell}
    </dialog>`;
  }
}

/**
 * One row in an `ht-command`. Searchable by its text and `keywords`. Picked by Enter (while
 * highlighted) or click; the command fires `ht-select`.
 *
 * @tag ht-command-item
 * @summary Command list row.
 *
 * @slot - Label.
 * @slot prefix - Icon before the label.
 * @slot shortcut - Replaces the `shortcut` keycaps.
 *
 * @csspart base - The row.
 *
 * @cssprop [--ht-command-item-height=2rem] - Row height.
 */
export class HtCommandItem extends LitElement {
  static properties = {
    /** Value reported in `ht-select`. Defaults to the label text. */
    value: {},
    /** Extra search terms, space-separated, that match without being shown. */
    keywords: {},
    /** Keys, space-separated, e.g. `⌘ K`. Each becomes a keycap. A hint only: nothing binds it. */
    shortcut: {},
    /** Dimmed, skipped by the arrow keys, and not pickable. */
    disabled: { type: Boolean, reflect: true },
    /** Highlighted. Managed by the command. */
    active: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare keywords: string;
  declare shortcut: string;
  declare disabled: boolean;
  declare active: boolean;

  constructor() {
    super();
    this.value = '';
    this.keywords = '';
    this.shortcut = '';
    this.disabled = false;
    this.active = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'option');
    this.#syncAria();
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
    :host { display: block; }
    :host([hidden]) { display: none; }
    .item {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: var(--ht-command-item-height, 2rem);
      padding: 4px 8px;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      cursor: default;
      user-select: none;
      border-radius: var(--ht-radius-md);
      background: var(--_row-bg, transparent);
      box-shadow: var(--_row-rim, none);
      margin-block: var(--_row-gap, 0);
    }
    :host([active]) .item {
      background: var(--_row-bg-on, color-mix(in oklab, var(--ht-text) 7.5%, transparent));
      box-shadow: var(--_row-rim-on, 0 0 0 0 transparent), inset 2px 0 0 0 var(--ht-focus);
    }
    :host([disabled]) .item { opacity: 0.55; cursor: not-allowed; }
    .text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    ::slotted([slot='prefix']) { flex: none; width: 16px; height: 16px; color: var(--ht-text-muted); }
    .shortcut { flex: none; display: inline-flex; gap: 2px; margin-left: 16px; }
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
  `;

  #syncAria() {
    this.setAttribute('aria-selected', String(this.active));
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  updated() {
    this.#syncAria();
  }

  render() {
    const keys = this.shortcut.split(/\s+/).filter(Boolean);
    return html`<div part="base" class="item">
      <slot name="prefix"></slot>
      <span class="text"><slot></slot></span>
      <span class="shortcut"><slot name="shortcut">${keys.map((k) => html`<kbd class="key">${k}</kbd>`)}</slot></span>
    </div>`;
  }
}

/**
 * A titled group of `ht-command-item`s. It hides itself when the filter leaves it empty.
 *
 * @tag ht-command-group
 * @summary Command list group.
 *
 * @slot - `ht-command-item` elements.
 *
 * @csspart heading - The group heading.
 */
export class HtCommandGroup extends LitElement {
  static properties = {
    /** Group heading. Also the group's accessible name. */
    heading: {},
  };

  declare heading: string;

  constructor() {
    super();
    this.heading = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'group');
    this.#syncAria();
  }

  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }
    :host(:not(:first-child)) { margin-top: 4px; }
    .heading {
      padding: 6px 8px 2px;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
      cursor: default;
      user-select: none;
    }
  `;

  #syncAria() {
    if (this.heading) this.setAttribute('aria-label', this.heading);
    else this.removeAttribute('aria-label');
  }

  updated() {
    this.#syncAria();
  }

  render() {
    return html`${this.heading ? html`<div part="heading" class="heading" aria-hidden="true">${this.heading}</div>` : nothing}<slot></slot>`;
  }
}

if (!customElements.get('ht-command')) customElements.define('ht-command', HtCommand);
if (!customElements.get('ht-command-item')) customElements.define('ht-command-item', HtCommandItem);
if (!customElements.get('ht-command-group')) customElements.define('ht-command-group', HtCommandGroup);

declare global {
  interface HTMLElementTagNameMap {
    'ht-command': HtCommand;
    'ht-command-item': HtCommandItem;
    'ht-command-group': HtCommandGroup;
  }
}
