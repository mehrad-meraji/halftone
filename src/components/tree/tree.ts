import { LitElement, css, html, nothing, svg, type SVGTemplateResult } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

// Glyphs: Phosphor (https://phosphoricons.com), MIT, Copyright (c) 2023 Phosphor Icons.
const glyph = (inner: SVGTemplateResult, size: number) =>
  svg`<svg width=${size} height=${size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${inner}</svg>`;
const CARET = svg`<path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>`;
const FOLDER = svg`<path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z"/>`;
const FOLDER_OPEN = svg`<path d="M245,110.64A16,16,0,0,0,232,104H216V88a16,16,0,0,0-16-16H130.67L102.94,51.2a16.14,16.14,0,0,0-9.6-3.2H40A16,16,0,0,0,24,64V208h0a8,8,0,0,0,8,8H211.1a8,8,0,0,0,7.59-5.47l28.49-85.47A16.05,16.05,0,0,0,245,110.64ZM93.34,64,123.2,86.4A8,8,0,0,0,128,88h72v16H69.77a16,16,0,0,0-15.18,10.94L40,158.7V64Zm112,136H43.1l26.67-80H232Z"/>`;
const FILE = svg`<path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"/>`;

/**
 * File-tree style navigation. Nest `ht-tree-item` elements to any depth; the tree gives
 * them the ARIA tree pattern: one tab stop, arrow keys, type-ahead, expand and collapse.
 *
 * Keys: Up and Down move; Right expands or enters a folder; Left collapses or goes to the
 * parent; Home and End jump; Enter or Space selects; `*` expands the siblings; typing a
 * letter jumps to the next item starting with it.
 *
 * @tag ht-tree
 * @summary Tree view.
 *
 * @slot - `ht-tree-item` elements.
 *
 * @fires change - The selected item changed by user action. Read `value` from the host.
 * @fires ht-toggle - An item expanded or collapsed (bubbles from the item).
 */
export class HtTree extends LitElement {
  static properties = {
    /** `value` of the selected item. */
    value: { reflect: true },
    /** Accessible name for the tree. */
    label: {},
    /** Draws vertical guide lines at each level. */
    guides: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare label: string;
  declare guides: boolean;

  #observer?: MutationObserver;
  #typed = '';
  #typedTimer = 0;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.guides = false;
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusin', this.#onFocusin);
  }

  static styles = css`
    :host { display: block; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'tree');
    this.#observer = new MutationObserver(() => this.#sync());
    this.#observer.observe(this, { childList: true, subtree: true });
    queueMicrotask(() => this.#sync());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
  }

  willUpdate() {
    if (this.label) this.setAttribute('aria-label', this.label);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('guides')) this.#sync();
  }

  /** Every item, in document order. */
  get items(): HtTreeItem[] {
    return [...this.querySelectorAll('ht-tree-item')] as HtTreeItem[];
  }

  #visible(): HtTreeItem[] {
    return this.items.filter((i) => !i.disabled && i.isVisible());
  }

  #sync() {
    const items = this.items;
    for (const item of items) {
      item.slot = item.parentElement instanceof HtTreeItem ? 'children' : '';
      if (!item.slot) item.removeAttribute('slot');
    }
    for (const item of items) {
      const parent = item.parentElement;
      const siblings = [...(parent?.children ?? [])].filter((c) => c.localName === 'ht-tree-item');
      item._level = item.ancestors().length;
      item._hasChildren = [...item.children].some((c) => c.localName === 'ht-tree-item');
      item.setAttribute('aria-level', String(item._level + 1));
      item.setAttribute('aria-setsize', String(siblings.length));
      item.setAttribute('aria-posinset', String(siblings.indexOf(item) + 1));
      item.selected = this.value !== '' && item.value === this.value;
      item._guides = this.guides;
    }
    // roving tab stop: selected visible item, else the first visible one
    const visible = this.#visible();
    const stop = visible.find((i) => i.selected) ?? visible[0];
    for (const item of items) item.tabIndex = item === stop ? 0 : -1;
  }

  #itemFrom(e: Event): HtTreeItem | null {
    return (e.target as Element).closest?.('ht-tree-item') as HtTreeItem | null;
  }

  #select(item: HtTreeItem) {
    if (item.value === this.value) return;
    this.value = item.value;
    this.#sync();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onClick = (e: Event) => {
    const item = this.#itemFrom(e);
    if (!item || item.disabled) return;
    this.#select(item);
    if (item._hasChildren) item.toggle();
  };

  #onFocusin = (e: Event) => {
    const item = this.#itemFrom(e);
    if (!item) return;
    for (const i of this.items) i.tabIndex = i === item ? 0 : -1;
  };

  #focus(item: HtTreeItem | undefined) {
    if (!item) return;
    for (const i of this.items) i.tabIndex = i === item ? 0 : -1;
    item.focus();
  }

  #onKeydown = (e: KeyboardEvent) => {
    const current = this.#itemFrom(e);
    if (!current || e.target !== current || e.altKey || e.ctrlKey || e.metaKey) return;
    const visible = this.#visible();
    const i = visible.indexOf(current);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.#focus(visible[Math.min(i + 1, visible.length - 1)]);
        return;
      case 'ArrowUp':
        e.preventDefault();
        this.#focus(visible[Math.max(i - 1, 0)]);
        return;
      case 'Home':
        e.preventDefault();
        this.#focus(visible[0]);
        return;
      case 'End':
        e.preventDefault();
        this.#focus(visible[visible.length - 1]);
        return;
      case 'ArrowRight':
        e.preventDefault();
        if (current._hasChildren) {
          if (!current.expanded) current.toggle();
          else this.#focus(this.#visible().find((c) => c.parentElement === current));
        }
        return;
      case 'ArrowLeft':
        e.preventDefault();
        if (current._hasChildren && current.expanded) current.toggle();
        else if (current.parentElement instanceof HtTreeItem) this.#focus(current.parentElement);
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.#select(current);
        if (current._hasChildren && e.key === ' ') current.toggle();
        if (e.key === 'Enter') current.activate();
        return;
      case '*': {
        e.preventDefault();
        const sibs = [...(current.parentElement?.children ?? [])].filter((c): c is HtTreeItem => c instanceof HtTreeItem);
        for (const s of sibs) if (s._hasChildren && !s.expanded) s.toggle();
        return;
      }
    }
    if (e.key.length === 1 && /\S/.test(e.key)) {
      clearTimeout(this.#typedTimer);
      this.#typed += e.key.toLowerCase();
      this.#typedTimer = window.setTimeout(() => (this.#typed = ''), 500);
      const order = [...visible.slice(i + 1), ...visible.slice(0, i + 1)];
      const hit = order.find((c) => c.label.toLowerCase().startsWith(this.#typed));
      if (hit) this.#focus(hit);
    }
  };

  /** Expands every item that has children. */
  expandAll() {
    for (const i of this.items) if (i._hasChildren && !i.expanded) i.toggle();
  }

  /** Collapses every item. */
  collapseAll() {
    for (const i of this.items) if (i._hasChildren && i.expanded) i.toggle();
  }

  render() {
    return html`<slot></slot>`;
  }
}

/**
 * One row in an `ht-tree`. Nest more `ht-tree-item` elements inside to make it a folder.
 * Folders get a caret and a folder icon, leaves get a file icon; override with the `icon` slot.
 *
 * @tag ht-tree-item
 * @summary Tree row.
 *
 * @slot - Label text.
 * @slot icon - Replaces the folder / file icon.
 * @slot suffix - Trailing content such as a count or `ht-tag`.
 *
 * @csspart row - The row.
 * @csspart label - The label.
 *
 * @cssprop [--ht-tree-indent=16px] - Indent per level.
 * @cssprop [--ht-tree-row-height=28px] - Row height.
 */
export class HtTreeItem extends LitElement {
  static properties = {
    /** Identifier reported by the tree's `value`. Defaults to the label text. */
    value: {},
    /** Folders only: shows the children. */
    expanded: { type: Boolean, reflect: true },
    /** Set by the tree. */
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** Makes the row a link, for navigation trees. The selected item gets `aria-current="page"`. */
    href: {},
    _level: { state: true },
    _hasChildren: { state: true },
    _guides: { state: true },
    _label: { state: true },
  };

  declare value: string;
  declare expanded: boolean;
  declare selected: boolean;
  declare disabled: boolean;
  declare href: string;
  declare _level: number;
  declare _hasChildren: boolean;
  declare _guides: boolean;
  declare _label: string;

  constructor() {
    super();
    this.value = '';
    this.expanded = false;
    this.selected = false;
    this.disabled = false;
    this.href = '';
    this._level = 0;
    this._hasChildren = false;
    this._guides = false;
    this._label = '';
  }

  static styles = css`
    :host {
      display: block;
      outline: none;
      --_indent: var(--ht-tree-indent, 16px);
      --_h: var(--ht-tree-row-height, 28px);
    }
    .row {
      all: unset;
      box-sizing: border-box;
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      height: var(--_h);
      padding-inline-start: calc(6px + var(--_level, 0) * var(--_indent));
      padding-inline-end: 6px;
      font: 400 0.8125rem/1.25rem var(--ht-font-ui);
      color: var(--ht-text);
      cursor: pointer;
      border-radius: var(--ht-radius-md);
      transition: background-color 120ms;
    }
    .row:hover { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    :host([selected]) .row { background: color-mix(in oklab, var(--ht-text) 5%, transparent); font-weight: 500; }
    :host(:focus-visible) .row { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    :host([disabled]) .row { opacity: 0.5; cursor: not-allowed; background: transparent; }

    .guides {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 6px;
      width: calc(var(--_level, 0) * var(--_indent));
      pointer-events: none;
      background-image: repeating-linear-gradient(
        to right,
        var(--ht-border) 0,
        var(--ht-border) 1px,
        transparent 1px,
        transparent var(--_indent)
      );
      background-position: 7px 0;
    }
    .caret {
      display: grid;
      place-items: center;
      flex: none;
      width: 16px;
      height: 16px;
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-sm);
    }
    .caret svg { transition: transform 120ms; }
    :host([expanded]) .caret svg { transform: rotate(90deg); }
    .caret.has:hover { background: color-mix(in oklab, var(--ht-text) 8%, transparent); }
    .icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--ht-text-muted); }
    .label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    ::slotted([slot='icon']) { width: 16px; height: 16px; }
    [hidden] { display: none; }
  `;

  /** The item's own label text, without children. */
  get label(): string {
    return this._label || this.#ownLabel();
  }

  #ownLabel() {
    return [...this.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE || (n instanceof Element && n.localName !== 'ht-tree-item' && !n.hasAttribute('slot')))
      .map((n) => n.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Parent items, outermost first. */
  ancestors(): HtTreeItem[] {
    const out: HtTreeItem[] = [];
    for (let p = this.parentElement; p instanceof HtTreeItem; p = p.parentElement) out.unshift(p);
    return out;
  }

  /** True when every ancestor is expanded. */
  isVisible() {
    return this.ancestors().every((a) => a.expanded);
  }

  /** Expands or collapses a folder. */
  toggle() {
    if (!this._hasChildren) return;
    this.expanded = !this.expanded;
    this.dispatchEvent(new CustomEvent('ht-toggle', { detail: { expanded: this.expanded }, bubbles: true, composed: true }));
  }

  /** Follows `href` if there is one. */
  activate() {
    this.renderRoot.querySelector<HTMLAnchorElement>('a.row')?.click();
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'treeitem');
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
  }

  willUpdate() {
    this._label = this.#ownLabel();
    if (!this.value) this.value = this._label;
  }

  updated() {
    if (this._hasChildren) this.setAttribute('aria-expanded', String(this.expanded));
    else this.removeAttribute('aria-expanded');
    this.setAttribute('aria-selected', String(this.selected));
    if (this._label) this.setAttribute('aria-label', this._label);
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
    if (this.href && this.selected) this.setAttribute('aria-current', 'page');
    else this.removeAttribute('aria-current');
    this.style.setProperty('--_level', String(this._level));
  }

  #onCaret = (e: Event) => {
    e.stopPropagation();
    if (!this.disabled) this.toggle();
  };

  render() {
    const inner = html`
      ${this._guides && this._level > 0 ? html`<span class="guides" aria-hidden="true"></span>` : nothing}
      <span class="caret ${this._hasChildren ? 'has' : ''}" aria-hidden="true" @click=${this._hasChildren ? this.#onCaret : nothing}>
        ${this._hasChildren ? glyph(CARET, 12) : nothing}
      </span>
      <span class="icon"><slot name="icon">${this._hasChildren ? glyph(this.expanded ? FOLDER_OPEN : FOLDER, 16) : glyph(FILE, 16)}</slot></span>
      <span part="label" class="label"><slot @slotchange=${() => (this._label = this.#ownLabel())}></slot></span>
      <slot name="suffix"></slot>
    `;
    return html`
      ${this.href && !this.disabled
        ? html`<a part="row" class="row" href=${ifDefined(this.href)} tabindex="-1">${inner}</a>`
        : html`<div part="row" class="row">${inner}</div>`}
      <div role="group" class="children" ?hidden=${!this.expanded || !this._hasChildren}>
        <slot name="children"></slot>
      </div>
    `;
  }
}

for (const [tag, ctor] of [
  ['ht-tree', HtTree],
  ['ht-tree-item', HtTreeItem],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-tree': HtTree;
    'ht-tree-item': HtTreeItem;
  }
}
