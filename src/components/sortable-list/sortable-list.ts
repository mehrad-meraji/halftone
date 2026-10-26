import { LitElement, css, html, nothing } from 'lit';

/**
 * `detail` of the drag protocol events (`ht-drag-over`, `ht-drag-leave`, `ht-drag-drop`). The same
 * object shape is shared by every component that takes drops, so apps and other files can type
 * against it without importing each other.
 */
export interface HtDragDetail {
  /** The dragged `ht-sortable-item`'s `item-id`. */
  itemId: string;
  /** The dragged `ht-sortable-item`. */
  item: HTMLElement;
  /** The `ht-sortable-list` the item comes from. */
  source: HTMLElement;
  /** The source list's `group` (`''` when unset). */
  group: string;
  /** Pointer position in viewport coordinates. */
  clientX: number;
  clientY: number;
  /** Set by the target that accepts the item. */
  target: HTMLElement | null;
  /** Set by the target: `{ index }` for a list, `{ time }`, `{ date }`, … for others. */
  data: unknown;
  /** Set by the target: text for the screen-reader announcement, such as `13:15 on Mon 26`. */
  label: string;
}

/** `detail` of `ht-reorder`. */
export interface HtReorderDetail {
  /** The moved item's `item-id`. */
  itemId: string;
  /** The source list. */
  from: HTMLElement;
  /** The list or element the item was dropped on. */
  to: HTMLElement;
  /** New index when `to` is a list, counted without the moved item. `null` otherwise. */
  index: number | null;
  /** The target's `detail.data`. */
  data: unknown;
}

/* ------------------------------------------------------------------------------------------ */
/* Drag engine. One drag at a time, shared by every list in the page.                          */
/* ------------------------------------------------------------------------------------------ */

const SLOP = 5; // px of movement before a pointer drag starts, or before a touch hold gives up
const HOLD = 250; // ms a finger rests before a touch drag starts
const EDGE = 40; // px from a scroller's edge where auto-scroll starts
const SPEED = 18; // px per frame at the very edge

interface Drag {
  mode: 'pointer' | 'keyboard';
  list: HtSortableList;
  item: HtSortableItem;
  itemId: string;
  group: string;
  /** Index of the item when the drag started. */
  from: number;
  /** Keyboard only: the landing index, counted without the moved item. */
  index: number;
  pointerId: number;
  x: number;
  y: number;
  /** Pointer offset inside the item, so the preview keeps its grip point. */
  dx: number;
  dy: number;
  preview: HTMLElement | null;
  target: HTMLElement | null;
  detail: HtDragDetail | null;
  hit: Element | null;
  vy: number;
  scroller: Element | null;
  dirty: boolean;
  raf: number;
}

let drag: Drag | null = null;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Next node up the flattened tree: through slots and out of shadow roots, as a composed event goes. */
function up(n: Node): Node | null {
  if ((n as Element | Text).assignedSlot) return (n as Element | Text).assignedSlot;
  const p = n.parentNode;
  return p instanceof ShadowRoot ? p.host : p;
}

function composedContains(ancestor: Node, node: Node | null): boolean {
  for (let n = node; n; n = up(n)) if (n === ancestor) return true;
  return false;
}

/** The deepest element under a point, inside open shadow roots. The preview never catches the pointer, so it is skipped. */
function deepestAt(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

function scrollerOf(start: Element): Element {
  const page = document.scrollingElement ?? document.documentElement;
  for (let n: Node | null = start; n; n = up(n)) {
    if (!(n instanceof Element) || n === page) continue;
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && n.scrollHeight > n.clientHeight) return n;
  }
  return page;
}

function makeDetail(d: Drag): HtDragDetail {
  return { itemId: d.itemId, item: d.item, source: d.list, group: d.group, clientX: d.x, clientY: d.y, target: null, data: null, label: '' };
}

function fire(el: EventTarget, type: string, detail: HtDragDetail, bubbles: boolean) {
  const ev = new CustomEvent<HtDragDetail>(type, { detail, bubbles, cancelable: bubbles, composed: true });
  el.dispatchEvent(ev);
  return ev;
}

/** Asks the element under the pointer whether it takes the item. Returns the filled detail when one does. */
function ask(el: Element, d: Drag): HtDragDetail | null {
  const detail = makeDetail(d);
  if (!fire(el, 'ht-drag-over', detail, true).defaultPrevented) return null;
  detail.target ??= el as HTMLElement;
  return detail;
}

function leave(d: Drag) {
  const t = d.target;
  if (!t) return;
  const detail = d.detail ?? makeDetail(d);
  d.target = null;
  d.detail = null;
  fire(t, 'ht-drag-leave', detail, false);
}

/** Runs the protocol at the current pointer position: leave before over, deepest target wins. */
function track(d: Drag) {
  const el = deepestAt(d.x, d.y);
  d.hit = el;
  // Left the current target altogether: it hears the leave before anyone hears the over.
  if (d.target && !composedContains(d.target, el)) leave(d);
  let next = el ? ask(el, d) : null;
  if (d.target && d.target !== next?.target) {
    // Still inside the old target, but another one (nested) took over, or the old one declined.
    // Leave first, then ask again so the new target's last word is an over.
    leave(d);
    if (next && el) next = ask(el, d);
  }
  d.target = next?.target ?? null;
  d.detail = next;

  // Edge scroll: speed grows toward the edge of the nearest scroller under the pointer.
  const sc = scrollerOf(el ?? d.list);
  const page = sc === (document.scrollingElement ?? document.documentElement);
  const top = page ? 0 : sc.getBoundingClientRect().top;
  const bottom = page ? innerHeight : sc.getBoundingClientRect().bottom;
  const f = (p: number) => Math.ceil(SPEED * Math.min(1, p / EDGE));
  d.scroller = sc;
  d.vy = d.y < top + EDGE ? -f(top + EDGE - d.y) : d.y > bottom - EDGE ? f(d.y - (bottom - EDGE)) : 0;
}

function frame() {
  const d = drag;
  if (!d || d.mode !== 'pointer') return;
  if (d.vy && d.scroller) {
    const before = d.scroller.scrollTop;
    d.scroller.scrollTop += d.vy;
    if (d.scroller.scrollTop !== before) d.dirty = true;
  }
  if (d.dirty) {
    d.dirty = false;
    track(d);
  }
  d.raf = requestAnimationFrame(frame);
}

function place(d: Drag) {
  if (d.preview) d.preview.style.transform = `translate(${d.x - d.dx}px, ${d.y - d.dy}px)`;
}

const previewStyles = css`
  .card {
    box-sizing: border-box;
    overflow: hidden;
    background: var(--ht-surface-raised);
    border: 1px solid var(--ht-border-strong);
    border-radius: var(--ht-radius-md);
    box-shadow: var(--ht-shadow-md);
    transform: rotate(-1.2deg);
  }
  ::slotted(*) { pointer-events: none !important; }
  @media (prefers-reduced-motion: no-preference) {
    .card { animation: lift var(--ht-duration) var(--ht-ease-spring) both; }
    @keyframes lift {
      from { transform: none; box-shadow: var(--ht-shadow-sm); }
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .card { transform: none; }
  }
`;

/**
 * A copy of the item in the top layer that follows the pointer. It is a light-DOM child of the
 * source list (slot `preview`, outside the list role), so the page's styles and theme reach the copy
 * the same way they reach the item. Removed when the drag ends.
 */
function makePreview(d: Drag): HTMLElement {
  const { item, list } = d;
  const host = document.createElement('div');
  host.slot = 'preview';
  host.setAttribute('popover', 'manual');
  host.setAttribute('aria-hidden', 'true');
  host.inert = true;
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${previewStyles.cssText}</style><div class="card"><slot></slot></div>`;
  const copy = item.cloneNode(true) as HTMLElement;
  copy.removeAttribute('dragging');
  copy.removeAttribute('id');
  copy.setAttribute('data-ht-preview', '');
  for (const n of copy.querySelectorAll('[id]')) n.removeAttribute('id');
  host.append(copy);
  // Inline, so no page rule on `div` or `[popover]` can move it.
  host.style.cssText = `position:fixed;inset:auto;left:0;top:0;z-index:2147483000;box-sizing:border-box;width:${
    item.getBoundingClientRect().width
  }px;height:auto;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;color:inherit;overflow:visible;pointer-events:none`;
  list.append(host);
  try {
    host.showPopover();
  } catch {
    /* No top layer: the fixed position and z-index above still float it. */
  }
  return host;
}

/** Eats the click that follows a pointer release: it belongs to the drag, not to the row. */
const swallowClick = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  window.removeEventListener('click', swallowClick, true);
};

const onMove = (e: PointerEvent) => {
  const d = drag;
  if (!d || d.mode !== 'pointer' || e.pointerId !== d.pointerId) return;
  d.x = e.clientX;
  d.y = e.clientY;
  place(d);
  d.dirty = true;
};

const onUp = (e: PointerEvent) => {
  const d = drag;
  if (!d || d.mode !== 'pointer' || e.pointerId !== d.pointerId) return;
  d.x = e.clientX;
  d.y = e.clientY;
  track(d);
  window.addEventListener('click', swallowClick, true);
  setTimeout(() => window.removeEventListener('click', swallowClick, true));
  dropPointer(d);
};

const onCancel = (e: PointerEvent) => {
  if (drag?.mode === 'pointer' && e.pointerId === drag.pointerId) cancel(drag);
};

const onKey = (e: KeyboardEvent) => {
  if (drag?.mode !== 'pointer' || e.key !== 'Escape') return;
  e.preventDefault();
  e.stopPropagation();
  cancel(drag);
};

const onBlur = () => {
  if (drag?.mode === 'pointer') cancel(drag);
};

const onScroll = () => {
  if (drag) drag.dirty = true;
};

const block = (e: Event) => {
  if (drag?.mode === 'pointer') e.preventDefault();
};

const handlers: [EventTarget, string, EventListener][] = [
  [window, 'pointermove', onMove as EventListener],
  [window, 'pointerup', onUp as EventListener],
  [window, 'pointercancel', onCancel as EventListener],
  [window, 'keydown', onKey as EventListener],
  [window, 'blur', onBlur],
  [document, 'scroll', onScroll],
  [window, 'selectstart', block],
  [window, 'contextmenu', block],
  [window, 'dragstart', block],
];

function listen(on: boolean) {
  for (const [t, type, fn] of handlers) {
    if (on) t.addEventListener(type, fn, { capture: true, passive: type === 'pointermove' || type === 'scroll' });
    else t.removeEventListener(type, fn, { capture: true });
  }
}

function startPointer(list: HtSortableList, item: HtSortableItem, p: Press) {
  if (drag) return;
  const d: Drag = {
    mode: 'pointer',
    list,
    item,
    itemId: item.itemId,
    group: list.group,
    from: list._items().indexOf(item),
    index: -1,
    pointerId: p.id,
    x: p.x,
    y: p.y,
    dx: p.dx,
    dy: p.dy,
    preview: null,
    target: null,
    detail: null,
    hit: null,
    vy: 0,
    scroller: null,
    dirty: false,
    raf: 0,
  };
  drag = d;
  d.preview = makePreview(d);
  item.dragging = true;
  place(d);
  listen(true);
  track(d);
  d.raf = requestAnimationFrame(frame);
}

/** Tears a drag down. Fires nothing: callers fire leave or drop first. */
function end(d: Drag) {
  if (drag !== d) return;
  drag = null;
  cancelAnimationFrame(d.raf);
  if (d.mode === 'pointer') listen(false);
  const pv = d.preview;
  if (pv) {
    try {
      pv.hidePopover();
    } catch {
      /* not open */
    }
    pv.remove();
  }
  d.item.dragging = false;
  d.item._released();
  d.list._hideLine();
}

/** Every end leaves: a cancelled drag clears the current target's highlight. */
function cancel(d: Drag) {
  if (d.mode === 'pointer') leave(d);
  else d.list._cancelKeyboard(d);
  end(d);
}

function dropPointer(d: Drag) {
  const { target, detail, list } = d;
  end(d);
  if (!target || !detail) return;
  fire(target, 'ht-drag-drop', detail, false);
  const raw = (detail.data as { index?: unknown } | null)?.index;
  const index = target.localName === 'ht-sortable-list' && typeof raw === 'number' ? raw : null;
  if (target === list && index === d.from) return;
  const ok = list._reorder({ itemId: d.itemId, from: list, to: target, index, data: detail.data });
  if (ok && target !== list && detail.label) list._announce(`Dropped. ${d.item._name} moved to ${detail.label}.`);
}

interface Press {
  id: number;
  type: string;
  x: number;
  y: number;
  sx: number;
  sy: number;
  dx: number;
  dy: number;
  timer: number;
}

/** Controls a press inside a whole-row item must leave alone. */
const INTERACTIVE =
  'a[href],button,input,select,textarea,label,summary,[contenteditable]:not([contenteditable="false"]),[tabindex]:not([tabindex="-1"])';

/* ------------------------------------------------------------------------------------------ */

/**
 * A list the user reorders by dragging, and the source of every drag in Halftone. Items are
 * `ht-sortable-item` children. A grip at the start of each row starts the drag; the row keeps its
 * own buttons and clicks. A 2px accent line with a ring dot marks the landing spot, and a lifted,
 * slightly tilted copy of the item follows the pointer while the original stays in place at 35%.
 *
 * **It never moves DOM.** On drop it fires `ht-reorder`; the app saves the new order and renders
 * it. Same rule as `ht-table`, which fires `sort` and never sorts.
 *
 * Pointer: the drag starts after 5px of movement on the grip. Touch: press and hold the grip for
 * 250ms (moving first scrolls the page instead). Near the top or bottom edge of the nearest
 * scrolling area the area scrolls, faster closer to the edge. Esc cancels.
 *
 * Keyboard, on the grip: Space or Enter picks the item up, Up and Down (and Home, End) move the
 * landing line, Space or Enter drops, Esc or Tab cancels. Each step is announced in a polite live
 * region. Keyboard moves stay inside the list; a move to another list or day belongs in the app's
 * Move To menu.
 *
 * `handle="none"` drops the grip and lets the whole row drag. A press on a control inside the row
 * (button, link, field, checkbox) does not start a drag. On touch the row keeps page scrolling: a
 * hold of 250ms without moving picks the item up. Keyboard users still get a grip button: it is
 * visually hidden and draws a focus ring around the row when focused.
 *
 * **Drag protocol.** Drops cross components through DOM events, so no file imports another. While
 * a pointer drag runs, the list fires these on other elements (all `CustomEvent`, `composed`, with
 * an `HtDragDetail`):
 *
 * - `ht-drag-over` on the deepest element under the pointer: bubbles, cancelable. A target that
 *   takes the item calls `preventDefault()` and fills `detail.target` (defaults to the element it
 *   was fired on), and may fill `detail.data` and `detail.label`. A handler that sees
 *   `defaultPrevented` already set does nothing, so the deepest target wins. Fired once per
 *   animation frame while the pointer moves or the page scrolls.
 * - `ht-drag-leave` on the previous target, directly (no bubbling): the pointer left it, or the
 *   drag ended without a drop on it (Esc, a drop on nothing, the pointer cancelled, the item
 *   removed). Fired before the next target hears `ht-drag-over`.
 * - `ht-drag-drop` on the accepting target, directly: the item was dropped on it. Same detail as
 *   the last `ht-drag-over`.
 *
 * A list takes items from itself and from lists with the same non-empty `group`, and sets
 * `detail.data` to `{ index }`. Lists without a `group` keep their items to themselves.
 *
 * @tag ht-sortable-list
 * @summary Drag-to-reorder list, and the source of drags to other drop targets.
 *
 * @slot - `ht-sortable-item` elements.
 *
 * @csspart list - The list element.
 * @csspart drop-line - The 2px landing line with its ring dot.
 *
 * @cssprop [--ht-sortable-item-height=40px] - Minimum row height. Also the minimum height of an empty list, so it still takes drops.
 * @cssprop [--ht-sortable-item-padding=0 12px] - Row padding.
 * @cssprop [--ht-sortable-item-gap=10px] - Space between the grip and the row's content.
 *
 * @fires ht-reorder - An item was dropped somewhere new. Fired on the source list; bubbles, composed, cancelable. `detail: { itemId, from, to, index, data }` (`HtReorderDetail`): `to` is the target list or element, `index` the new index when `to` is a list (counted without the moved item) and `null` otherwise, `data` the target's `detail.data`. Not fired for a drop where the item started, or a cancel. Cancel it to tell a keyboard user the move was refused.
 */
export class HtSortableList extends LitElement {
  static properties = {
    /** Accessible name of the list, such as `Mon 27`. Also used in announcements. A host `aria-label` works too. */
    label: {},
    /** Lists with the same `group` trade items. Also passed to drop targets as `detail.group`. */
    group: { reflect: true },
    /** No drags start here and nothing can be dropped here. */
    disabled: { type: Boolean, reflect: true },
    /** `grip` (default): only the grip starts a drag. `none`: no visible grip, the whole row drags. */
    handle: { reflect: true },
    _lineY: { state: true },
    _say: { state: true },
  };

  declare label: string;
  declare group: string;
  declare disabled: boolean;
  declare handle: 'grip' | 'none';
  declare _lineY: number | null;
  declare _say: string;

  #ariaLabel = '';

  constructor() {
    super();
    this.label = '';
    this.group = '';
    this.disabled = false;
    this.handle = 'grip';
    this._lineY = null;
    this._say = '';
    this.addEventListener('ht-drag-over', this.#onOver);
    this.addEventListener('ht-drag-leave', this.#onEnd);
    this.addEventListener('ht-drag-drop', this.#onEnd);
  }

  connectedCallback() {
    super.connectedCallback();
    // `aria-label` is not allowed on a generic host; move it to the list.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
      this.requestUpdate();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (drag?.list === this) cancel(drag);
    else if (drag?.target === this) {
      drag.target = null;
      drag.detail = null;
    }
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('handle') || changed.has('disabled')) for (const i of this._items()) i.requestUpdate();
    if (changed.has('disabled') && this.disabled && drag?.list === this) cancel(drag);
  }

  /** @internal The items, in order. */
  _items(): HtSortableItem[] {
    return Array.from(this.children).filter(
      (c): c is HtSortableItem => c.localName === 'ht-sortable-item' && !(c as HTMLElement).hidden,
    );
  }

  get #name() {
    return this.label || this.#ariaLabel;
  }

  /** Landing index for a pointer at `y`, counted without the moved item. */
  #indexAt(y: number, moved: HTMLElement) {
    let i = 0;
    for (const it of this._items()) {
      if (it === moved) continue;
      const r = it.getBoundingClientRect();
      if (y > r.top + r.height / 2) i++;
      else break;
    }
    return i;
  }

  #showLine(index: number, moved: HTMLElement) {
    const wrap = this.renderRoot.querySelector('.wrap');
    if (!wrap) return;
    const box = wrap.getBoundingClientRect();
    const all = this._items();
    const others = all.filter((i) => i !== moved);
    // Above the first row, or under the row it follows. When the moved row sits in that gap (its own
    // place), the line lands on its top edge either way.
    let y = 0;
    if (all.length && index === 0) y = all[0].getBoundingClientRect().top - box.top;
    else if (others.length) y = others[Math.min(index, others.length) - 1].getBoundingClientRect().bottom - box.top;
    // Keep the ring dot inside the list, which may clip.
    this._lineY = Math.round(Math.min(Math.max(y, 5), Math.max(box.height - 5, 5)));
  }

  /** @internal */
  _hideLine() {
    this._lineY = null;
  }

  #onOver = (e: Event) => {
    const ev = e as CustomEvent<HtDragDetail>;
    const d = ev.detail;
    if (ev.defaultPrevented || this.disabled || !d) return;
    if (d.source !== this && !(this.group && d.group === this.group)) return;
    // An item cannot land inside itself (a list nested in the dragged row).
    if (composedContains(d.item, this)) return;
    ev.preventDefault();
    const index = this.#indexAt(d.clientY, d.item);
    const n = this._items().filter((i) => i !== d.item).length + 1;
    d.target = this;
    d.data = { index };
    d.label = `${index + 1} of ${n}${this.#name ? ` in ${this.#name}` : ''}`;
    this.#showLine(index, d.item);
  };

  #onEnd = () => this._hideLine();

  /** @internal Fires `ht-reorder`. Returns false when the app cancelled it. */
  _reorder(detail: HtReorderDetail): boolean {
    return this.dispatchEvent(new CustomEvent<HtReorderDetail>('ht-reorder', { detail, bubbles: true, composed: true, cancelable: true }));
  }

  /** @internal Says `msg` in the live region. A repeat gets a no-break space so it is read again. */
  _announce(msg: string) {
    this._say = this._say === msg ? `${msg} ` : msg;
  }

  /** @internal Called by an item's grip. */
  _startPointer(item: HtSortableItem, p: Press) {
    if (!this.disabled) startPointer(this, item, p);
  }

  /** @internal Space or Enter on a grip. */
  _toggleKeyboard(item: HtSortableItem) {
    if (this.disabled) return;
    if (drag?.mode === 'keyboard' && drag.item === item) return this.#dropKeyboard(drag);
    if (drag) return;
    const items = this._items();
    const from = items.indexOf(item);
    if (from < 0) return;
    const d: Drag = {
      mode: 'keyboard',
      list: this,
      item,
      itemId: item.itemId,
      group: this.group,
      from,
      index: from,
      pointerId: -1,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      preview: null,
      target: null,
      detail: null,
      hit: null,
      vy: 0,
      scroller: null,
      dirty: false,
      raf: 0,
    };
    drag = d;
    item.dragging = true;
    this.#showLine(from, item);
    this._announce(`Picked up ${item._name}. Item ${from + 1} of ${items.length}${this.#name ? ` in ${this.#name}` : ''}.`);
  }

  /** @internal Arrow keys while carrying. */
  _stepKeyboard(to: number | 'first' | 'last') {
    const d = drag;
    if (d?.mode !== 'keyboard' || d.list !== this) return;
    const n = this._items().length;
    const index = to === 'first' ? 0 : to === 'last' ? n - 1 : Math.min(Math.max(d.index + to, 0), n - 1);
    d.index = index;
    this.#showLine(index, d.item);
    const others = this._items().filter((i) => i !== d.item);
    (others[index] ?? others[index - 1])?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    this._announce(`Position ${index + 1} of ${n}.`);
  }

  /** @internal Esc or Tab while carrying. */
  _cancelKeyboard(d: Drag | null = drag) {
    if (d?.mode !== 'keyboard' || d.list !== this) return;
    end(d);
    this._announce(`Cancelled. ${d.item._name} is back at ${d.from + 1} of ${this._items().length}.`);
  }

  #dropKeyboard(d: Drag) {
    const { item, from, index } = d;
    const n = this._items().length;
    const name = item._name;
    end(d);
    if (index === from) {
      this._announce(`Dropped. ${name} is now ${from + 1} of ${n}.`);
      return;
    }
    const ok = this._reorder({ itemId: d.itemId, from: this, to: this, index, data: { index } });
    this._announce(ok ? `Dropped. ${name} is now ${index + 1} of ${n}.` : `Cancelled. ${name} is back at ${from + 1} of ${n}.`);
    // The app re-renders the order; a moved node loses focus, so give it back to the grip.
    const id = d.itemId;
    requestAnimationFrame(() => {
      const it = this._items().find((i) => i.itemId === id);
      if (it && !it.matches(':focus-within')) it._focusHandle();
    });
  }

  static styles = css`
    :host {
      display: block;
      --ht-sortable-item-height: 40px;
      --ht-sortable-item-padding: 0 12px;
      --ht-sortable-item-gap: 10px;
    }
    :host([hidden]) { display: none; }
    .wrap { position: relative; }
    .list { display: block; min-height: var(--ht-sortable-item-height); }
    .line {
      position: absolute;
      inset-inline: 0;
      height: 0;
      z-index: 2;
      pointer-events: none;
    }
    .line::before {
      content: '';
      position: absolute;
      inset-inline: 14px 12px;
      top: -1px;
      height: 2px;
      border-radius: var(--ht-radius-sm);
      background: var(--ht-accent);
    }
    .line::after {
      content: '';
      position: absolute;
      inset-inline-start: 8px;
      top: -4px;
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid var(--ht-accent);
      background: var(--ht-surface);
    }
    @media (prefers-reduced-motion: no-preference) {
      .line { transition: top var(--ht-duration) var(--ht-ease); }
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

  render() {
    const y = this._lineY;
    return html`
      <div class="wrap">
        <div part="list" class="list" role="list" aria-label=${this.#name || nothing}><slot></slot></div>
        <div part="drop-line" class="line" aria-hidden="true" ?hidden=${y === null} style=${y === null ? nothing : `top:${y}px`}></div>
      </div>
      <slot name="preview"></slot>
      <div class="sr" role="status" aria-live="polite" aria-atomic="true">${this._say}</div>
    `;
  }
}

const GRIP = html`<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
  <g fill="currentColor">
    <circle cx="6" cy="4" r="1.1"></circle><circle cx="10" cy="4" r="1.1"></circle>
    <circle cx="6" cy="8" r="1.1"></circle><circle cx="10" cy="8" r="1.1"></circle>
    <circle cx="6" cy="12" r="1.1"></circle><circle cx="10" cy="12" r="1.1"></circle>
  </g>
</svg>`;

/**
 * One row of an `ht-sortable-list`. Put the row's content in it: a checkbox, the title, an id,
 * buttons. The item is a `listitem`, never a button, so it can hold controls of its own.
 *
 * It renders a grip button before its content (hidden with `handle="none"` on the list). The grip
 * is named "Move {label}", where the label is `label` or the item's text; set `handle-label` to
 * replace the whole name.
 *
 * @tag ht-sortable-item
 * @summary Draggable row of an `ht-sortable-list`.
 *
 * @slot - Row content.
 *
 * @csspart handle - The grip button (24px hit area, six-dot icon).
 */
export class HtSortableItem extends LitElement {
  static properties = {
    /** Your id for the item. Required: `ht-reorder` and the drag events report it as `itemId`. */
    itemId: { attribute: 'item-id' },
    /** This item cannot be dragged. Others can still land around it. */
    disabled: { type: Boolean, reflect: true },
    /** Name used in the grip's label and in announcements. Defaults to the item's text. */
    label: {},
    /** Replaces the grip's whole accessible name ("Move {label}"). */
    handleLabel: { attribute: 'handle-label' },
    /** Set while the item is carried. Read-only: style the origin row with `ht-sortable-item[dragging]`. */
    dragging: { type: Boolean, reflect: true },
  };

  declare itemId: string;
  declare disabled: boolean;
  declare label: string;
  declare handleLabel: string;
  declare dragging: boolean;

  #press: Press | null = null;
  #observer = new MutationObserver(() => this.requestUpdate());

  constructor() {
    super();
    this.itemId = '';
    this.disabled = false;
    this.label = '';
    this.handleLabel = '';
    this.dragging = false;
    this.addEventListener('pointerdown', this.#onPointerDown);
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'listitem');
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
    this.#endPress();
    // Every end leaves: an item removed mid-drag cancels it.
    if (drag?.item === this) cancel(drag);
  }

  get #list(): HtSortableList | null {
    return this.parentElement?.closest('ht-sortable-list') ?? null;
  }

  // Read from attributes (both reflect), so an item that upgrades before its list still knows.
  get #wholeRow() {
    return this.#list?.getAttribute('handle') === 'none';
  }

  get #off() {
    const list = this.#list;
    return this.disabled || !list || list.hasAttribute('disabled');
  }

  /** @internal The name read out in announcements. */
  get _name() {
    return (this.label || this.textContent || '').replace(/\s+/g, ' ').trim() || this.itemId || 'Item';
  }

  /** @internal */
  _focusHandle() {
    this.renderRoot.querySelector<HTMLButtonElement>('.grip')?.focus();
  }

  /** @internal The drag that started here has ended. */
  _released() {
    this.removeEventListener('touchmove', this.#onTouchMove);
    this.toggleAttribute('data-ht-carry', false);
  }

  willUpdate() {
    // A whole-row item drags from anywhere, so it gets the grab cursor and no touch callout.
    this.toggleAttribute('data-ht-row', this.#wholeRow && !this.#off);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('disabled') && this.disabled && drag?.item === this) cancel(drag);
  }

  #onPointerDown = (e: PointerEvent) => {
    if (drag || this.#press || this.#off || e.button !== 0 || !e.isPrimary) return;
    if (this.hasAttribute('data-ht-preview')) return;
    const path = e.composedPath();
    const grip = this.renderRoot.querySelector('.grip');
    if (this.#wholeRow) {
      for (const n of path) {
        if (n === this) break;
        if (n instanceof Element && n.matches(INTERACTIVE)) return;
      }
    } else if (!grip || !path.includes(grip)) return;

    const r = this.getBoundingClientRect();
    const p: Press = {
      id: e.pointerId,
      type: e.pointerType,
      x: e.clientX,
      y: e.clientY,
      sx: e.clientX,
      sy: e.clientY,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      timer: 0,
    };
    this.#press = p;
    if (p.type === 'touch') {
      p.timer = window.setTimeout(() => this.#commit(), HOLD);
      // The row keeps touch-action, so the drag claims the finger by cancelling touchmove once it starts.
      this.addEventListener('touchmove', this.#onTouchMove, { passive: false });
    } else {
      // No text selection or native drag from the press.
      e.preventDefault();
    }
    window.addEventListener('pointermove', this.#onPressMove, true);
    window.addEventListener('pointerup', this.#endPress, true);
    window.addEventListener('pointercancel', this.#endPress, true);
  };

  #onPressMove = (e: PointerEvent) => {
    const p = this.#press;
    if (!p || e.pointerId !== p.id) return;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) <= SLOP) return;
    // Touch moved before the hold: it is a scroll, not a drag.
    if (p.type === 'touch') this.#endPress();
    else this.#commit();
  };

  #onTouchMove = (e: TouchEvent) => {
    if (drag?.item === this && drag.mode === 'pointer') {
      if (e.cancelable) e.preventDefault();
      return;
    }
    const p = this.#press;
    const t = e.touches[0];
    if (p && t && Math.hypot(t.clientX - p.sx, t.clientY - p.sy) > SLOP) this.#endPress();
  };

  #commit() {
    const p = this.#press;
    const list = this.#list;
    this.#endPress(true);
    if (p && list && !this.#off) list._startPointer(this, p);
    if (drag?.item !== this) this.removeEventListener('touchmove', this.#onTouchMove);
  }

  #endPress = (keep: boolean | Event = false) => {
    const p = this.#press;
    if (!p) return;
    clearTimeout(p.timer);
    this.#press = null;
    window.removeEventListener('pointermove', this.#onPressMove, true);
    window.removeEventListener('pointerup', this.#endPress, true);
    window.removeEventListener('pointercancel', this.#endPress, true);
    if (keep !== true) this.removeEventListener('touchmove', this.#onTouchMove);
  };

  /** Space and Enter reach here as a click with `detail` 0, also from a screen reader's browse mode. */
  #onClick = (e: MouseEvent) => {
    if (e.detail !== 0 || this.#off) return;
    const list = this.#list;
    if (!list) return;
    list._toggleKeyboard(this);
    this.toggleAttribute('data-ht-carry', drag?.mode === 'keyboard' && drag.item === this);
  };

  #onKeydown = (e: KeyboardEvent) => {
    const d = drag;
    const list = this.#list;
    if (!list || d?.mode !== 'keyboard' || d.item !== this) return;
    if (e.key === 'ArrowUp') list._stepKeyboard(-1);
    else if (e.key === 'ArrowDown') list._stepKeyboard(1);
    else if (e.key === 'Home') list._stepKeyboard('first');
    else if (e.key === 'End') list._stepKeyboard('last');
    else if (e.key === 'Escape') {
      e.stopPropagation();
      list._cancelKeyboard();
    } else if (e.key === 'Tab') {
      list._cancelKeyboard();
      return;
    } else return;
    e.preventDefault();
  };

  #onFocusOut = () => {
    if (drag?.mode === 'keyboard' && drag.item === this) this.#list?._cancelKeyboard();
  };

  static styles = css`
    :host {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--ht-sortable-item-gap, 10px);
      box-sizing: border-box;
      min-height: var(--ht-sortable-item-height, 40px);
      padding: var(--ht-sortable-item-padding, 0 12px);
      font: 400 0.8125rem/1.4 var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface);
      border-bottom: 1px solid var(--ht-border);
    }
    :host([hidden]) { display: none; }
    :host(:last-of-type) { border-bottom: 0; }
    :host([dragging]:not([data-ht-carry])) { opacity: 0.35; }
    /* Carried by keyboard: the row stays readable, tinted, so the focus ring stays visible. */
    :host([data-ht-carry]) { background: var(--ht-accent-soft); }
    :host([data-ht-preview]) { background: transparent; border-bottom: 0; opacity: 1; }
    :host([data-ht-row]) {
      cursor: grab;
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    @media (prefers-reduced-motion: no-preference) {
      :host { transition: opacity var(--ht-duration) var(--ht-ease), background-color var(--ht-duration) var(--ht-ease); }
    }
    .grip {
      appearance: none;
      display: inline-grid;
      place-items: center;
      flex: none;
      box-sizing: border-box;
      width: 24px;
      height: 24px;
      margin-inline: -8px -4px;
      padding: 0;
      border: 0;
      border-radius: var(--ht-radius-md);
      background: transparent;
      color: var(--ht-text-subtle);
      font: inherit;
      cursor: grab;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    .grip svg { width: 16px; height: 16px; }
    .grip:hover:not(:disabled) { color: var(--ht-text); background: color-mix(in oklab, var(--ht-text) 7%, transparent); }
    .grip:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    .grip:disabled { cursor: not-allowed; opacity: 0.45; }
    :host([dragging]) .grip { cursor: grabbing; }
    /* Whole row: the grip stays for keyboard users only, and rings the row when focused. */
    .grip.hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .ring {
      display: none;
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: var(--ht-radius-sm);
      outline: 2px solid var(--ht-focus);
      outline-offset: -2px;
    }
    .grip.hidden:focus-visible ~ .ring { display: block; }
    @media (prefers-reduced-motion: no-preference) {
      .grip { transition: color var(--ht-duration) var(--ht-ease), background-color var(--ht-duration) var(--ht-ease); }
    }
  `;

  render() {
    const whole = this.#wholeRow;
    const preview = this.hasAttribute('data-ht-preview');
    return html`
      <button
        part="handle"
        class="grip ${whole ? 'hidden' : ''}"
        type="button"
        tabindex=${preview ? '-1' : nothing}
        aria-label=${this.handleLabel || `Move ${this._name}`}
        aria-describedby="hint"
        ?disabled=${this.#off && !preview}
        @click=${this.#onClick}
        @keydown=${this.#onKeydown}
        @focusout=${this.#onFocusOut}
      >${GRIP}</button>
      ${whole ? html`<span class="ring"></span>` : nothing}
      <span id="hint" hidden>Space or Enter picks up. Arrow keys move. Space or Enter drops. Escape cancels.</span>
      <slot></slot>
    `;
  }
}

for (const [tag, ctor] of [
  ['ht-sortable-list', HtSortableList],
  ['ht-sortable-item', HtSortableItem],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-sortable-list': HtSortableList;
    'ht-sortable-item': HtSortableItem;
  }
}
