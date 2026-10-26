import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

let uid = 0;

type Active = HtComboboxOption | 'create' | null;

/**
 * Text field with a suggestions list, after the ARIA 1.2 combobox pattern. The app feeds the
 * suggestions: on each keystroke the field fires `ht-input` and the app replaces the
 * `ht-combobox-option` children (optionally inside `ht-combobox-group`). The combobox never
 * filters, sorts or fetches.
 *
 * The list is a listbox in a manual popover in the top layer, under the field and as wide as it.
 * It flips above the field when there is no room below. It opens on typing, on Up or Down, and
 * on a click in the field, and only when it has something to show: options, the loading row, the
 * empty row, or the create row. Focus stays in the text box; the highlighted option is linked
 * with `aria-activedescendant`.
 *
 * Keys: Up and Down move through the options and the create row, and wrap. Nothing is
 * highlighted until you press one, so Enter on its own submits the text (`ht-submit`); with an
 * option highlighted, Enter picks it (`ht-select`). Escape closes the list and keeps the text; a
 * second Escape clears it. Alt+Down opens the list without moving, Alt+Up closes it. Home and End
 * stay in the text box. Hovering an option only highlights it visually, so a resting pointer
 * never changes what Enter does.
 *
 * Picking an option fills the field with the option's text, unless the `ht-select` handler set
 * `value` itself (for example to clear the field after linking a ticket).
 *
 * Prefix and suffix content (a scope picker, a project) sits inside the field as inset chips.
 * The combobox does not disable slotted controls: disable them yourself along with the field.
 *
 * Screen readers: a polite status region reads "Searching…", the empty text, or the result
 * count while the list is open. Where the browser cannot link the text box to a slotted option
 * by reference (`ariaActiveDescendantElement`), the highlighted option is read there instead.
 *
 * @tag ht-combobox
 * @summary Text field with app-fed suggestions.
 *
 * @slot - `ht-combobox-option` and `ht-combobox-group` elements.
 * @slot prefix - Content before the text, drawn as an inset chip (a scope button, an icon).
 * @slot suffix - Content after the text, drawn as an inset chip (a project picker).
 *
 * @csspart label - The visible label.
 * @csspart control - The bordered field around the chips and the text box.
 * @csspart input - The native `<input>`.
 * @csspart listbox - The floating list.
 * @csspart loading - The "Searching…" row.
 * @csspart empty - The row shown when there are no options.
 * @csspart create - The create row.
 * @csspart create-heading - The eyebrow above the create row (with `create-heading`).
 *
 * @cssprop [--ht-combobox-list-height=18rem] - Maximum height of the list before it scrolls.
 *
 * @fires ht-input - The user changed the text (typing, or the second Escape clearing it). `detail`: `{ value }`. Bubbles, composed. Replace the options in response.
 * @fires ht-select - An option was picked by Enter or click. `detail`: `{ value, option }`, where `value` is the option's `value` or, without one, its text. Bubbles, composed, cancelable: `preventDefault()` keeps the list open and the text unchanged.
 * @fires ht-submit - Enter with no option highlighted, or the create row picked. `detail`: `{ value }` (the text). Never fires for empty text. Bubbles, composed, cancelable: `preventDefault()` keeps the list open.
 * @fires change - The committed text changed: on blur, on a pick, or on Enter. Bubbles.
 * @fires input - The text changed by typing. Native event, crosses the shadow boundary.
 */
export class HtCombobox extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** The text in the field. Also the form value. */
    value: {},
    /** Visible label. With no visible label, set `aria-label` on the element instead; it is forwarded to the text box. */
    label: {},
    /** Placeholder in the text box. */
    placeholder: {},
    /** Form field name. */
    name: {},
    /** Must not be empty to submit the form. */
    required: { type: Boolean, reflect: true },
    /** Dims the field, blocks typing and closes the list. */
    disabled: { type: Boolean, reflect: true },
    /** Shows the spinner row at the end of the list and marks the list busy. Set it while results are on their way. */
    loading: { type: Boolean, reflect: true },
    /** Text of the loading row. */
    loadingText: { attribute: 'loading-text' },
    /** Text of the row shown when there are no options and the text is not empty. `{value}` is replaced by the text. Empty hides the row. */
    emptyText: { attribute: 'empty-text' },
    /** Adds a create row at the end of the list while the text is not empty, e.g. `Add task “{value}”`. Picking it fires `ht-submit`. Empty means no create row. */
    createLabel: { attribute: 'create-label' },
    /** Optional eyebrow above the create row, e.g. `Create`. Without it a hairline separates the row. */
    createHeading: { attribute: 'create-heading' },
    /** Field height: sm 32px, md 36px, lg 40px, as `ht-input`. */
    size: { reflect: true },
    _open: { state: true },
    _count: { state: true },
    _status: { state: true },
    _createActive: { state: true },
    _prefix: { state: true },
    _suffix: { state: true },
    _formDisabled: { state: true },
  };

  declare value: string;
  declare label: string;
  declare placeholder: string;
  declare name: string;
  declare required: boolean;
  declare disabled: boolean;
  declare loading: boolean;
  declare loadingText: string;
  declare emptyText: string;
  declare createLabel: string;
  declare createHeading: string;
  declare size: 'sm' | 'md' | 'lg';
  declare _open: boolean;
  declare _count: number;
  declare _status: string;
  declare _createActive: boolean;
  declare _prefix: boolean;
  declare _suffix: boolean;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #defaultValue = '';
  #committed = '';
  #ariaLabel: string | undefined;
  #active: Active = null;
  #observer: MutationObserver | null = null;
  #refreshQueued = false;
  #shown = false;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.placeholder = '';
    this.name = '';
    this.required = false;
    this.disabled = false;
    this.loading = false;
    this.loadingText = 'Searching…';
    this.emptyText = 'No matches.';
    this.createLabel = '';
    this.createHeading = '';
    this.size = 'md';
    this._open = false;
    this._count = 0;
    this._status = '';
    this._createActive = false;
    this._prefix = false;
    this._suffix = false;
    this._formDisabled = false;
  }

  static styles = css`
    :host {
      display: block;
      --_h: 2.25rem;
    }
    :host([size='sm']) { --_h: 2rem; }
    :host([size='lg']) { --_h: 2.5rem; }
    [hidden] { display: none !important; }
    label {
      display: block;
      margin-bottom: 6px;
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .req { color: var(--ht-accent-text); margin-left: 2px; }

    /* The field is ht-input's: faint tint, 1px input border, a 1px inset line along the top, 2px focus ring. */
    .control {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 4px;
      height: var(--_h);
      padding-inline: 1rem;
      color: var(--ht-text-subtle);
      background: color-mix(in oklch, var(--ht-text) 3%, transparent);
      border: 1px solid var(--ht-border-input);
      border-radius: var(--ht-radius-md);
      box-shadow: inset 0 1px 0 0 var(--ht-border-input);
      transition: border 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1);
    }
    /* Chips sit close to the edge; the text keeps a little air next to them. */
    .control.has-prefix { padding-inline-start: 4px; }
    .control.has-suffix { padding-inline-end: 4px; }
    .control.has-prefix input { padding-inline-start: 4px; }
    .control.has-suffix input { padding-inline-end: 4px; }
    .control:focus-within {
      box-shadow: inset 0 1px 0 0 var(--ht-border-input), 0 0 0 2px var(--ht-focus);
    }
    :host([disabled]) .control { cursor: not-allowed; }
    :host([disabled]) ::slotted(*) { opacity: 0.6; }

    /* Inset chip: sunken fill, hairline border, small radius, a faint inner shadow. */
    ::slotted([slot='prefix']),
    ::slotted([slot='suffix']) {
      box-sizing: border-box;
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: calc(var(--_h) - 12px);
      margin: 0;
      padding: 0 7px;
      font: 500 0.75rem/1 var(--ht-font-ui);
      color: var(--ht-text-muted);
      background: var(--ht-surface-sunken);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-sm);
      box-shadow: inset 0 1px 1px color-mix(in oklab, var(--ht-text) 6%, transparent);
      white-space: nowrap;
      appearance: none;
    }
    ::slotted(button[slot]) { cursor: pointer; }
    ::slotted(button[slot]:hover) { color: var(--ht-text); }
    ::slotted([slot]:focus-visible) { outline: 2px solid var(--ht-focus); outline-offset: 1px; }

    input {
      all: unset;
      /* After all: unset the field would inherit the page's alignment (a centred hero centred the text). */
      text-align: start;
      flex: 1;
      min-width: 0;
      height: 100%;
      font: 400 0.875rem/1rem var(--ht-font-ui);
      color: var(--ht-text);
    }
    input:disabled { color: var(--ht-text-subtle); cursor: not-allowed; }
    input::placeholder { color: var(--ht-text-subtle); }

    /* The list. */
    .panel {
      position: fixed;
      inset: auto;
      margin: 0;
      box-sizing: border-box;
      max-height: min(var(--ht-combobox-list-height, 18rem), calc(100vh - 8px));
      padding: 4px;
      overflow: auto;
      overscroll-behavior: contain;
      font: 400 0.8125rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface-raised);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-md);
      box-shadow: var(--ht-shadow-md);
      /* Closed state. It drops out of the field (or rises, when flipped), springs in and leaves faster. */
      opacity: 0;
      transform: translateY(var(--_dy, -4px));
      transition:
        opacity var(--ht-duration-out) ease-in,
        transform var(--ht-duration-out) ease-in,
        overlay var(--ht-duration-out) allow-discrete,
        display var(--ht-duration-out) allow-discrete;
    }
    .panel[data-side='top'] { --_dy: 4px; }
    .panel:popover-open {
      opacity: 1;
      transform: none;
      transition-duration: var(--ht-duration-in);
      transition-timing-function: var(--ht-ease-spring);
    }
    @starting-style {
      .panel:popover-open { opacity: 0; transform: translateY(var(--_dy, -4px)); }
    }

    .row {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 2.125rem;
      padding: 4px 8px;
      border-radius: var(--ht-radius-sm);
      cursor: default;
      user-select: none;
    }
    .row svg { flex: none; width: 16px; height: 16px; }
    .text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .loading { color: var(--ht-text-subtle); }
    .spin {
      box-sizing: border-box;
      flex: none;
      width: 14px;
      height: 14px;
      margin-inline: 1px;
      border: 2px solid var(--ht-border);
      border-top-color: var(--ht-accent);
      border-radius: 50%;
      animation: spin 700ms linear infinite;
    }
    @keyframes spin { to { transform: rotate(1turn); } }
    .empty {
      padding: 8px 8px 10px;
      font-size: 0.75rem;
      line-height: 1.4;
      color: var(--ht-text-muted);
      cursor: default;
    }
    .create-section { margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--ht-border); }
    .create-section:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
    .create-heading {
      padding: 4px 8px;
      font: 500 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
      cursor: default;
      user-select: none;
    }
    .create:hover { background: color-mix(in oklab, var(--ht-text) 5%, transparent); }
    .create[aria-selected='true'] { color: var(--ht-accent-text); background: var(--ht-accent-soft); }
    .kbd {
      box-sizing: border-box;
      flex: none;
      display: inline-flex;
      align-items: center;
      height: 18px;
      padding: 0 5px;
      font: 400 0.625rem/1 var(--ht-font-mono);
      color: var(--ht-text-muted);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-bottom-width: 2px;
      border-radius: var(--ht-radius-sm);
    }
    @media (forced-colors: active) {
      .create[aria-selected='true'] { outline: 2px solid Highlight; outline-offset: -2px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel { transition: none; }
      .spin { animation: none; }
    }
    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;

  get #input() {
    return this.renderRoot.querySelector<HTMLInputElement>('input');
  }
  get #panel() {
    return this.renderRoot.querySelector<HTMLElement>('.panel');
  }
  get #control() {
    return this.renderRoot.querySelector<HTMLElement>('.control');
  }
  get #createRow() {
    return this.renderRoot.querySelector<HTMLElement>('#create');
  }

  /** Every option that is not hidden, in document order. */
  get options(): HtComboboxOption[] {
    // Skips options that have not been upgraded yet, and options inside a hidden group.
    return Array.from(this.querySelectorAll<HtComboboxOption>('ht-combobox-option')).filter(
      (o) => typeof o.label === 'string' && !o.closest('[hidden]'),
    );
  }

  /** The owning form, if any. */
  get form() {
    return this.#internals.form;
  }
  get validity() {
    return this.#internals.validity;
  }
  get validationMessage() {
    return this.#internals.validationMessage;
  }
  checkValidity() {
    return this.#internals.checkValidity();
  }
  reportValidity() {
    return this.#internals.reportValidity();
  }

  /** Moves focus to the text box. */
  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  formResetCallback() {
    this.value = this.#defaultValue;
    this.#committed = this.value;
    this.#close();
  }
  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
  }
  formStateRestoreCallback(state: string) {
    this.value = state;
    this.#committed = state;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value') ?? '';
    this.#committed = this.value;
    // `aria-label` is not allowed on a generic host; move it to the native input.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
    }
    this.#observer = new MutationObserver(() => this.#queueRefresh());
    this.#observer.observe(this, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['hidden', 'disabled'],
    });
    this.#queueRefresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = null;
    this.#unlisten();
    this.#shown = false;
  }

  willUpdate(changed: Map<string, unknown>) {
    if ((changed.has('disabled') || changed.has('_formDisabled')) && this.#isDisabled) this._open = false;
    // A highlighted create row that is going away (text cleared, label removed) is no longer active.
    if (this.#active === 'create' && !this.#showCreate) this.#setActive(null, false);
    if (['loading', '_count', 'value', '_open', 'emptyText', 'loadingText'].some((k) => changed.has(k))) {
      this._status = this.#summary();
    }
  }

  updated() {
    const input = this.#input;
    if (input) {
      this.#internals.setFormValue(this.value);
      this.#internals.setValidity(input.validity, input.validationMessage, input);
    }
    this.#syncPanel();
  }

  // ---- state ----

  get #isDisabled() {
    return this.disabled || this._formDisabled;
  }

  get #text() {
    return this.value.trim();
  }

  get #showCreate() {
    return !!this.createLabel && !!this.#text;
  }

  get #showEmpty() {
    return !this.loading && this._count === 0 && !!this.emptyText && !!this.#text;
  }

  get #hasContent() {
    return this._count > 0 || this.loading || this.#showEmpty || this.#showCreate;
  }

  get #expanded() {
    return this._open && !this.#isDisabled && this.#hasContent;
  }

  #fill(template: string) {
    return template.replaceAll('{value}', this.#text);
  }

  #summary() {
    if (!this.#expanded) return '';
    if (this.loading) return this.loadingText;
    if (this._count === 0) return this.#showEmpty ? this.#fill(this.emptyText) : '';
    return `${this._count} result${this._count === 1 ? '' : 's'}`;
  }

  #queueRefresh() {
    if (this.#refreshQueued) return;
    this.#refreshQueued = true;
    queueMicrotask(() => {
      this.#refreshQueued = false;
      this.#refresh();
    });
  }

  /** Recounts the options after the app replaced them, and drops a highlight whose option is gone. */
  #refresh() {
    const options = this.options;
    this._count = options.length;
    const a = this.#active;
    if (a && a !== 'create' && (!options.includes(a) || a.disabled)) this.#setActive(null, false);
  }

  #navigable(): Exclude<Active, null>[] {
    const list: Exclude<Active, null>[] = this.options.filter((o) => !o.disabled);
    if (this.#showCreate) list.push('create');
    return list;
  }

  // ---- popover ----

  #syncPanel() {
    const panel = this.#panel;
    if (!panel || !this.isConnected) return;
    const want = this.#expanded;
    const isOpen = panel.matches(':popover-open');
    if (want && !isOpen) {
      panel.showPopover();
      window.addEventListener('resize', this.#reposition);
      window.addEventListener('scroll', this.#reposition, true);
    } else if (!want && isOpen) {
      panel.hidePopover();
      this.#unlisten();
    }
    // Rows come and go while it is open, so place it on every update: it may need to flip.
    if (want) this.#place(panel);
    this.#shown = want;
  }

  #unlisten() {
    window.removeEventListener('resize', this.#reposition);
    window.removeEventListener('scroll', this.#reposition, true);
  }

  #reposition = () => {
    const panel = this.#panel;
    if (panel && this.#shown) this.#place(panel);
  };

  /**
   * The flip-and-clamp helper from `ht-popover`, cut down to one case: under the field, start
   * aligned, as wide as the field. It flips above when there is no room below, and is clamped to
   * the viewport.
   */
  #place(panel: HTMLElement) {
    const gap = 6;
    const margin = 4;
    const t = (this.#control ?? this).getBoundingClientRect();
    panel.style.width = `${t.width}px`;
    // offsetHeight ignores the entry transform, which getBoundingClientRect would include.
    const h = panel.offsetHeight;
    const w = panel.offsetWidth;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const below = t.bottom + gap;
    const above = t.top - h - gap;
    const fitsBelow = below + h <= vh - margin;
    const fitsAbove = above >= margin;
    const side = !fitsBelow && fitsAbove ? 'top' : 'bottom';
    panel.dataset.side = side;
    const y = side === 'top' ? above : below;
    const left = Math.min(Math.max(margin, t.left), Math.max(margin, vw - w - margin));
    const top = Math.min(Math.max(margin, y), Math.max(margin, vh - h - margin));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  #openList() {
    if (this.#isDisabled) return;
    this._open = true;
  }

  #close() {
    this._open = false;
    this.#setActive(null, false);
  }

  // ---- highlight ----

  #setActive(next: Active, scroll = true) {
    const prev = this.#active;
    if (prev && prev !== 'create' && prev !== next) prev.active = false;
    this.#active = next;
    this._createActive = next === 'create';
    const input = this.#input;
    if (!input) return;
    const reflect = 'ariaActiveDescendantElement' in Element.prototype;
    const target = input as unknown as { ariaActiveDescendantElement: Element | null };
    if (!next) {
      if (reflect) target.ariaActiveDescendantElement = null;
      input.removeAttribute('aria-activedescendant');
      return;
    }
    if (next === 'create') {
      // The create row lives in the same shadow root as the input, so a plain id reference works.
      if (reflect) target.ariaActiveDescendantElement = null;
      input.setAttribute('aria-activedescendant', 'create');
      if (scroll) this.updateComplete.then(() => this.#createRow?.scrollIntoView({ block: 'nearest' }));
      return;
    }
    next.active = true;
    if (!next.id) next.id = `ht-combobox-option-${++uid}`;
    if (reflect) {
      // The option is in the light DOM and the input in the shadow root, so an id reference cannot reach it.
      target.ariaActiveDescendantElement = next;
    } else {
      input.setAttribute('aria-activedescendant', next.id);
      const list = this.#navigable();
      this._status = `${next.label}, ${list.indexOf(next) + 1} of ${list.length}`;
    }
    if (scroll) next.scrollIntoView({ block: 'nearest' });
  }

  #move(delta: 1 | -1) {
    const list = this.#navigable();
    if (!list.length) return;
    const cur = this.#active ? list.indexOf(this.#active) : -1;
    const next = cur < 0 ? (delta === 1 ? 0 : list.length - 1) : (cur + delta + list.length) % list.length;
    this.#setActive(list[next]);
  }

  // ---- actions ----

  #commit() {
    if (this.value === this.#committed) return;
    this.#committed = this.value;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #pick(option: HtComboboxOption) {
    if (option.disabled) return;
    const before = this.value;
    const ok = this.dispatchEvent(
      new CustomEvent('ht-select', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { value: option.value || option.label, option },
      }),
    );
    if (!ok) return;
    // A handler that set the text itself (to clear it, say) wins over filling in the option.
    if (this.value === before) this.value = option.label;
    this.#close();
    this.#commit();
  }

  #submit() {
    const value = this.#text;
    if (!value) return;
    const ok = this.dispatchEvent(
      new CustomEvent('ht-submit', { bubbles: true, composed: true, cancelable: true, detail: { value } }),
    );
    if (!ok) return;
    this.#close();
    this.#commit();
  }

  #emitInput() {
    this.dispatchEvent(new CustomEvent('ht-input', { bubbles: true, composed: true, detail: { value: this.value } }));
  }

  // ---- events ----

  #onInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
    this.#setActive(null, false);
    this.#openList();
    this.#emitInput();
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || this.#isDisabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (e.altKey) return this.#openList();
        if (!this._open) {
          this.#openList();
          // Wait for the rows that depend on the open state before picking the first one.
          return void this.updateComplete.then(() => this.#move(1));
        }
        return this.#move(1);
      case 'ArrowUp':
        e.preventDefault();
        if (e.altKey) return this.#close();
        if (!this._open) {
          this.#openList();
          return void this.updateComplete.then(() => this.#move(-1));
        }
        return this.#move(-1);
      case 'Enter': {
        const a = this.#expanded ? this.#active : null;
        if (a === 'create') {
          e.preventDefault();
          return this.#submit();
        }
        if (a) {
          e.preventDefault();
          return this.#pick(a);
        }
        if (this.#text) {
          e.preventDefault();
          this.#submit();
        }
        return;
      }
      case 'Escape':
        // Closing (or clearing) is this field's job; stop an enclosing dialog from closing on the same press.
        if (this.#expanded) {
          e.preventDefault();
          e.stopPropagation();
          return this.#close();
        }
        if (this.value) {
          e.preventDefault();
          e.stopPropagation();
          this.value = '';
          this.#close();
          this.#emitInput();
        }
    }
  };

  #onInputClick = () => {
    if (!this._open) this.#openList();
  };

  #onBlur = () => {
    this.#close();
    this.#commit();
  };

  #rowFrom(e: Event): HtComboboxOption | 'create' | undefined {
    for (const el of e.composedPath()) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.localName === 'ht-combobox-option') return el as HtComboboxOption;
      if (el.id === 'create' && this.renderRoot.contains(el)) return 'create';
    }
    return undefined;
  }

  #onListClick = (e: MouseEvent) => {
    const row = this.#rowFrom(e);
    if (row === 'create') this.#submit();
    else if (row && !row.disabled) this.#pick(row);
  };

  // Keep focus in the text box when a row is pressed.
  #onListMouseDown = (e: MouseEvent) => e.preventDefault();

  #onPrefixChange = (e: Event) => {
    this._prefix = (e.target as HTMLSlotElement).assignedElements().length > 0;
  };
  #onSuffixChange = (e: Event) => {
    this._suffix = (e.target as HTMLSlotElement).assignedElements().length > 0;
  };

  render() {
    const name = this.label || this.#ariaLabel;
    const expanded = this.#expanded;
    const showCreate = this.#showCreate;
    return html`
      ${this.label
        ? html`<label part="label" for="input">${this.label}${this.required
            ? html`<span class="req" aria-hidden="true">*</span>`
            : nothing}</label>`
        : nothing}
      <div part="control" class="control ${this._prefix ? 'has-prefix' : ''} ${this._suffix ? 'has-suffix' : ''}">
        <slot name="prefix" @slotchange=${this.#onPrefixChange}></slot>
        <input
          id="input"
          part="input"
          type="text"
          role="combobox"
          aria-expanded=${expanded ? 'true' : 'false'}
          aria-controls="listbox"
          aria-autocomplete="list"
          aria-label=${ifDefined(this.label ? undefined : this.#ariaLabel)}
          autocomplete="off"
          .value=${live(this.value)}
          placeholder=${ifDefined(this.placeholder || undefined)}
          ?required=${this.required}
          ?disabled=${this.#isDisabled}
          @input=${this.#onInput}
          @keydown=${this.#onKeydown}
          @click=${this.#onInputClick}
          @blur=${this.#onBlur}
        />
        <slot name="suffix" @slotchange=${this.#onSuffixChange}></slot>
      </div>
      <div
        part="listbox"
        class="panel"
        id="listbox"
        role="listbox"
        popover="manual"
        aria-label=${ifDefined(name || undefined)}
        aria-busy=${this.loading ? 'true' : 'false'}
        @click=${this.#onListClick}
        @mousedown=${this.#onListMouseDown}
      >
        <slot @slotchange=${() => this.#queueRefresh()}></slot>
        ${this.loading
          ? html`<div part="loading" class="row loading" aria-hidden="true"><span class="spin"></span><span class="text">${this.loadingText}</span></div>`
          : nothing}
        ${this.#showEmpty ? html`<div part="empty" class="empty" aria-hidden="true">${this.#fill(this.emptyText)}</div>` : nothing}
        ${showCreate
          ? html`<div class="create-section" role="presentation">
              ${this.createHeading
                ? html`<div part="create-heading" class="create-heading" aria-hidden="true">${this.createHeading}</div>`
                : nothing}
              <div part="create" class="row create" id="create" role="option" aria-selected=${this._createActive ? 'true' : 'false'}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>
                <span class="text">${this.#fill(this.createLabel)}</span>
                ${this._createActive ? html`<span class="kbd" aria-hidden="true">↵</span>` : nothing}
              </div>
            </div>`
          : nothing}
      </div>
      <div class="sr" role="status" aria-live="polite">${this._status}</div>
    `;
  }
}

/**
 * One suggestion in an `ht-combobox`. The app renders these from its results; the combobox
 * neither filters nor sorts them. Picked by Enter (while highlighted) or click; the combobox
 * fires `ht-select`.
 *
 * @tag ht-combobox-option
 * @summary Combobox suggestion row.
 *
 * @slot - The option's text. Picking the option fills the field with it.
 * @slot prefix - Before the text: an id such as `sc-482` (drawn in mono) or an icon.
 * @slot suffix - After the text: a tag, a project, a count.
 *
 * @csspart base - The row.
 */
export class HtComboboxOption extends LitElement {
  static properties = {
    /** Value reported in `ht-select`. Defaults to the text. */
    value: {},
    /** Dimmed, skipped by the arrow keys, and not pickable. */
    disabled: { type: Boolean, reflect: true },
    /** Highlighted. Managed by the combobox. */
    active: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare disabled: boolean;
  declare active: boolean;

  constructor() {
    super();
    this.value = '';
    this.disabled = false;
    this.active = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'option');
    this.#syncAria();
  }

  /** The option's text, without the prefix and suffix slots. */
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
    .row {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 2.125rem;
      padding: 4px 8px;
      font: 400 0.8125rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      border-radius: var(--ht-radius-sm);
      cursor: default;
      user-select: none;
    }
    :host(:hover:not([disabled]):not([active])) .row { background: color-mix(in oklab, var(--ht-text) 5%, transparent); }
    :host([active]) .row { color: var(--ht-accent-text); background: var(--ht-accent-soft); }
    :host([disabled]) .row { opacity: 0.55; cursor: not-allowed; }
    .text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    ::slotted([slot='prefix']),
    ::slotted([slot='suffix']) { flex: none; }
    ::slotted([slot='prefix']) {
      font-family: var(--ht-font-mono);
      font-size: 0.6875rem;
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-subtle);
    }
    :host([active]) ::slotted([slot='prefix']) { color: inherit; }
    ::slotted(ht-icon:not([size])), ::slotted(svg) { width: 16px; height: 16px; }
    @media (forced-colors: active) {
      :host([active]) .row { outline: 2px solid Highlight; outline-offset: -2px; }
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
    return html`<div part="base" class="row">
      <slot name="prefix"></slot>
      <span class="text"><slot></slot></span>
      <slot name="suffix"></slot>
    </div>`;
  }
}

/**
 * A labelled group of `ht-combobox-option`s, under a mono eyebrow. Groups after the first get
 * a hairline above them.
 *
 * @tag ht-combobox-group
 * @summary Combobox option group.
 *
 * @slot - `ht-combobox-option` elements.
 *
 * @csspart heading - The eyebrow.
 */
export class HtComboboxGroup extends LitElement {
  static properties = {
    /** The eyebrow text. Also the group's accessible name. */
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
    this.#syncAria();
  }

  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }
    :host(:not(:first-child)) { margin-top: 4px; border-top: 1px solid var(--ht-border); }
    .heading {
      padding: 8px 8px 4px;
      font: 500 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
      cursor: default;
      user-select: none;
    }
  `;

  #syncAria() {
    if (this.label) this.setAttribute('aria-label', this.label);
    else this.removeAttribute('aria-label');
  }

  updated() {
    this.#syncAria();
  }

  render() {
    return html`${this.label ? html`<div part="heading" class="heading" aria-hidden="true">${this.label}</div>` : nothing}<slot></slot>`;
  }
}

if (!customElements.get('ht-combobox')) customElements.define('ht-combobox', HtCombobox);
if (!customElements.get('ht-combobox-option')) customElements.define('ht-combobox-option', HtComboboxOption);
if (!customElements.get('ht-combobox-group')) customElements.define('ht-combobox-group', HtComboboxGroup);

declare global {
  interface HTMLElementTagNameMap {
    'ht-combobox': HtCombobox;
    'ht-combobox-option': HtComboboxOption;
    'ht-combobox-group': HtComboboxGroup;
  }
}
