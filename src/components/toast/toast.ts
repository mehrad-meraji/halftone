import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';

const icon = (d: string) =>
  html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d=${d} /></svg>`;

const ICONS: Record<string, TemplateResult> = {
  info: icon('M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z'),
  success: icon('M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z'),
  warning: icon('M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z'),
  danger: icon('M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z'),
};
const SPINNER = icon('M232,128a104,104,0,0,1-208,0c0-41,23.81-78.36,60.66-95.27a8,8,0,0,1,6.68,14.54C60.15,61.59,40,93.27,40,128a88,88,0,0,0,176,0c0-34.73-20.15-66.41-51.34-80.73a8,8,0,0,1,6.68-14.54C208.19,49.64,232,87,232,128Z');
const CLOSE = html`<svg width="10" height="10" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"/></svg>`;

/** Lets a toast ask its toaster to lay the stack out again. Module-private, so it stays out of the API. */
const relayout = new WeakMap<Element, () => void>();

/** A button drawn inside a toast. `onClick` runs, then the toast closes unless the handler calls `preventDefault()`. */
export interface ToastButton {
  label: string;
  /** Read out instead of `label`. Say how to do the same thing another way. */
  altText?: string;
  onClick?: (event: MouseEvent) => void;
}

/**
 * A single notification in the style of Sonner (the toast shadcn/ui uses): a surface card with a
 * title, an optional description, a tone icon and optional action and cancel buttons. Normally
 * created through `toast()`, which stacks it in an `ht-toaster`, but usable on its own.
 *
 * The timer pauses while the pointer is over the stack, while focus is inside it and while the
 * window is in the background. Escape on a focused toast closes it. Drag it toward the edge it sits
 * on (or set `swipe`) past `swipe-threshold`, or flick it, to dismiss it; a shorter drag snaps back.
 * `data-swipe` is `start`, `move`, `cancel` or `end` during a swipe. `type` picks how a screen reader
 * announces it: `foreground` is assertive, `background` polite.
 *
 * @tag ht-toast
 * @summary Notification message.
 *
 * @slot - The title: the main line of the toast.
 * @slot description - Second, lighter line. Or set `description`.
 * @slot icon - Replaces the tone icon.
 * @slot action - Replaces the `action` button, e.g. an `ht-button`.
 * @slot cancel - Replaces the `cancel` button.
 *
 * @csspart base - The toast card.
 * @csspart icon - The icon box.
 * @csspart title - The title line.
 * @csspart description - The description line.
 * @csspart action - The built-in action button.
 * @csspart cancel - The built-in cancel button.
 * @csspart close - The close button.
 *
 * @cssprop [--ht-toast-width=356px] - Width of a toast and of the toaster.
 *
 * @fires ht-dismiss - The toast was removed, by timeout, a button, Escape, a swipe or `dismiss()`.
 * @fires ht-pause - The timer paused (hover, focus, window blur or the stack being held).
 * @fires ht-resume - The timer resumed.
 */
export class HtToast extends LitElement {
  static properties = {
    /** Colour of the icon, or of the whole card with `rich`. `neutral` has no icon. */
    tone: { reflect: true },
    /** Second, lighter line under the title. */
    description: {},
    /** Shows a spinner in place of the icon. A loading toast has no timer and cannot be swiped or closed by the user. */
    loading: { type: Boolean, reflect: true },
    /** Tints the whole card with the tone colour (Sonner's `richColors`). */
    rich: { type: Boolean, reflect: true },
    /** Milliseconds before it dismisses itself. `0` keeps it until closed. */
    duration: { type: Number },
    /**
     * How a screen reader announces it. `foreground` is assertive (`role=alert`) and `background` is
     * polite (`role=status`). Unset, `danger` is foreground and every other tone is background.
     */
    type: { reflect: true },
    /** Shows a small close button on the top corner. */
    closeButton: { type: Boolean, attribute: 'close-button', reflect: true },
    /** Primary button, drawn solid at the end of the toast. Property only. */
    action: { attribute: false },
    /** Secondary button, drawn quiet before the action. Property only. */
    cancel: { attribute: false },
    /** Pixels a swipe must travel to dismiss the toast. */
    swipeThreshold: { type: Number, attribute: 'swipe-threshold' },
    /**
     * Direction a swipe dismisses it. Defaults to the side the toaster sits on: `left` or `right`,
     * or `up` or `down` for a centred toaster. `none` turns swiping off.
     */
    swipe: { reflect: true },
    _hasIcon: { state: true },
    _hasDescription: { state: true },
    _hasButtons: { state: true },
  };

  declare tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  declare description: string;
  declare loading: boolean;
  declare rich: boolean;
  declare duration: number;
  declare type: '' | 'foreground' | 'background';
  declare closeButton: boolean;
  declare action: ToastButton | null;
  declare cancel: ToastButton | null;
  declare swipeThreshold: number;
  declare swipe: '' | 'left' | 'right' | 'up' | 'down' | 'none';
  declare _hasIcon: boolean;
  declare _hasDescription: boolean;
  declare _hasButtons: boolean;

  #timer = 0;
  #remaining = 0;
  #started = 0;
  #resize?: ResizeObserver;

  constructor() {
    super();
    this.tone = 'neutral';
    this.description = '';
    this.loading = false;
    this.rich = false;
    this.duration = 4000;
    this.type = '';
    this.closeButton = false;
    this.action = null;
    this.cancel = null;
    this.swipeThreshold = 45;
    this.swipe = '';
    this._hasIcon = false;
    this._hasDescription = false;
    this._hasButtons = false;
    this.addEventListener('pointerdown', this.#onDown);
    this.addEventListener('pointermove', this.#onMove);
    this.addEventListener('pointerup', this.#onUp);
    this.addEventListener('pointercancel', this.#onUp);
    this.addEventListener('pointerenter', () => this.#hold('pointer'));
    this.addEventListener('pointerleave', () => this.#release('pointer'));
    this.addEventListener('focusin', () => this.#hold('focus'));
    this.addEventListener('focusout', () => this.#release('focus'));
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !this.loading) {
        e.preventDefault();
        this.dismiss();
      }
    });
  }

  static styles = css`
    /* On its own: a block in the flow. */
    :host {
      --_sx: 0px;
      --_sy: 0px;
      display: block;
      position: relative;
      box-sizing: border-box;
      width: var(--ht-toast-width, 356px);
      max-width: 100%;
      transform: translate(var(--_sx), var(--_sy));
      transition: transform 400ms var(--ht-ease), opacity 400ms var(--ht-ease), height 400ms var(--ht-ease);
      touch-action: pan-y;
    }
    :host(:not([data-stacked])) { animation: in var(--ht-duration-in) var(--ht-ease-spring); }
    :host(:not([data-stacked])[data-removed]) { animation: out 200ms ease-in forwards; }
    @keyframes in { from { opacity: 0; transform: translateY(12px) scale(0.96); } }
    @keyframes out { to { opacity: 0; transform: translateY(8px) scale(0.96); } }

    /*
     * In an ht-toaster: Sonner's stack. The toaster sets data-stacked, data-y, data-front,
     * data-expanded, data-hidden and --_index, --_z, --_offset, --_height on each toast, and --_gap
     * and --_front-height on itself.
     */
    :host([data-stacked]) {
      position: absolute;
      left: 0;
      right: 0;
      width: auto;
      z-index: var(--_z, 1);
      opacity: 0;
      --_y: translateY(calc(var(--_lift) * -100%));
      transform: var(--_y) translate(var(--_sx), var(--_sy));
    }
    :host([data-stacked][data-y='bottom']) { bottom: 0; --_lift: -1; }
    :host([data-stacked][data-y='top']) { top: 0; --_lift: 1; }
    :host([data-stacked][data-mounted]) { --_y: translateY(0); opacity: 1; }
    /* Collapsed: each older toast peeks out 'gap' px behind the one in front, 5% smaller, cut to the front toast's height. */
    :host([data-stacked][data-mounted]:not([data-expanded]):not([data-front])) {
      --_y: translateY(calc(var(--_lift) * var(--_gap) * var(--_index))) scale(calc(1 - 0.05 * var(--_index)));
      height: var(--_front-height);
    }
    :host([data-stacked][data-mounted][data-expanded]) {
      --_y: translateY(calc(var(--_lift) * var(--_offset)));
      height: var(--_height);
    }
    :host([data-stacked][data-mounted][data-hidden]) { opacity: 0; pointer-events: none; }
    :host([data-stacked]:not([data-expanded]):not([data-front])) .toast > * { opacity: 0; }
    /* Bridges the gap between expanded toasts so the stack does not collapse while the pointer crosses it. */
    :host([data-stacked][data-expanded])::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 100%;
      width: 100%;
      height: calc(var(--_gap) + 1px);
    }
    /* Leaving. */
    :host([data-stacked][data-removed][data-front]:not([swiped])) {
      --_y: translateY(calc(var(--_lift) * -100%));
      opacity: 0;
    }
    :host([data-stacked][data-removed][data-expanded]:not([data-front]):not([swiped])) {
      --_y: translateY(calc(var(--_lift) * var(--_offset) + var(--_lift) * -100%));
      opacity: 0;
    }
    :host([data-stacked][data-removed]:not([data-expanded]):not([data-front]):not([swiped])) {
      --_y: translateY(40%);
      opacity: 0;
      transition: transform 500ms, opacity 200ms;
    }

    /* Swipe: the toast follows the pointer through --_sx and --_sy. */
    :host([data-x='center']), :host([swipe='up']), :host([swipe='down']) { touch-action: pan-x; }
    :host([swipe='left']), :host([swipe='right']) { touch-action: pan-y; }
    :host([swipe='none']), :host([loading]) { touch-action: auto; }
    :host([swiping]) { transition: none; cursor: grabbing; user-select: none; }
    :host([swiped]) { opacity: 0; transition: transform 200ms ease-out, opacity 200ms ease-out; }

    @media (prefers-reduced-motion: reduce) {
      :host, :host([data-removed]), .toast > * { animation-duration: 1ms; transition-duration: 1ms; }
    }

    :host {
      --_bg: var(--ht-surface);
      --_bd: var(--ht-border);
      --_fg: var(--ht-text);
      --_muted: var(--ht-text-muted);
      --_ic: var(--ht-text);
    }
    :host([tone='info']) { --_ic: color-mix(in oklab, var(--ht-info) 80%, var(--ht-text)); }
    :host([tone='success']) { --_ic: color-mix(in oklab, var(--ht-success) 80%, var(--ht-text)); }
    :host([tone='warning']) { --_ic: color-mix(in oklab, var(--ht-warning) 55%, var(--ht-text)); }
    :host([tone='danger']) { --_ic: var(--ht-danger-text); }
    :host([rich][tone='info']) {
      --_bg: color-mix(in oklab, var(--ht-info) 10%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-info) 35%, var(--ht-surface));
      --_fg: color-mix(in oklab, var(--ht-info) 55%, var(--ht-text));
    }
    :host([rich][tone='success']) {
      --_bg: color-mix(in oklab, var(--ht-success) 10%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-success) 40%, var(--ht-surface));
      --_fg: color-mix(in oklab, var(--ht-success) 55%, var(--ht-text));
    }
    :host([rich][tone='warning']) {
      --_bg: color-mix(in oklab, var(--ht-warning) 14%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-warning) 50%, var(--ht-surface));
      --_fg: color-mix(in oklab, var(--ht-warning) 40%, var(--ht-text));
    }
    :host([rich][tone='danger']) {
      --_bg: var(--ht-danger-soft);
      --_bd: color-mix(in oklab, var(--ht-danger) 45%, var(--ht-surface));
      --_fg: var(--ht-danger-text);
    }
    :host([rich]:not([tone='neutral'])) { --_muted: var(--_fg); --_ic: var(--_fg); }

    .toast {
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 6px;
      height: 100%;
      padding: 16px;
      font: 400 0.8125rem/1.4 var(--ht-font-ui);
      color: var(--_fg);
      background: var(--_bg);
      border: 1px solid var(--_bd);
      border-radius: var(--ht-radius-md);
      box-shadow: var(--ht-shadow-sm);
      overflow-wrap: anywhere;
    }
    .toast > * { transition: opacity 400ms; }
    .icon {
      display: flex;
      align-items: center;
      flex: none;
      width: 16px;
      height: 16px;
      margin-inline: -3px 4px;
      color: var(--_ic);
    }
    .icon[hidden] { display: none; }
    :host([loading]) .icon svg { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(1turn); } }
    .content { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .title { font-weight: 500; line-height: 1.5; }
    .description { color: var(--_muted); }
    .description[hidden] { display: none; }
    .buttons { display: flex; gap: 6px; flex: none; margin-inline-start: auto; }
    .buttons[hidden] { display: none; }
    .action,
    .cancel {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      height: 24px;
      padding-inline: 8px;
      font: 500 0.75rem/1 var(--ht-font-ui);
      border-radius: var(--ht-radius-md);
      cursor: pointer;
      white-space: nowrap;
      transition: filter var(--ht-duration) var(--ht-ease);
    }
    .action { color: var(--ht-inverse-ink); background: var(--ht-inverse); }
    .cancel { color: var(--ht-text); background: var(--ht-surface-sunken); }
    .action:hover, .cancel:hover { filter: brightness(1.08); }
    .action:focus-visible, .cancel:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    .close {
      all: unset;
      position: absolute;
      top: 0;
      inset-inline-start: 0;
      display: grid;
      place-items: center;
      width: 20px;
      height: 20px;
      box-sizing: border-box;
      color: var(--_fg);
      background: var(--_bg);
      border: 1px solid var(--_bd);
      border-radius: 50%;
      transform: translate(-35%, -35%);
      cursor: pointer;
      z-index: 1;
      transition: background var(--ht-duration) var(--ht-ease), border-color var(--ht-duration) var(--ht-ease);
    }
    :host(:dir(rtl)) .close { transform: translate(35%, -35%); }
    .close:hover { background: var(--ht-surface-muted); border-color: var(--ht-border-strong); }
    .close:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
  `;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('blur', this.#onWindowBlur);
    window.addEventListener('focus', this.#onWindowFocus);
    this.#restart();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
    this.#timer = 0;
    this.#resize?.disconnect();
    window.removeEventListener('blur', this.#onWindowBlur);
    window.removeEventListener('focus', this.#onWindowFocus);
  }

  firstUpdated() {
    // Tells the toaster to measure again when the text wraps differently or changes.
    this.#resize = new ResizeObserver(() => this.parentElement && relayout.get(this.parentElement)?.());
    this.#resize.observe(this.renderRoot.querySelector('.content')!);
  }

  updated(changed: PropertyValues<this>) {
    // A loading toast that finished (toast.promise) or a new duration starts the clock again.
    const doneLoading = changed.has('loading') && changed.get('loading') === true && !this.loading;
    const newDuration = changed.has('duration') && changed.get('duration') !== undefined;
    if (doneLoading || newDuration) this.#restart();
  }

  // The timer runs only while nothing holds it: pointer, focus, a swipe, the window being in the
  // background, or the whole stack being held by the toaster.
  #holds = new Set<string>();
  #onWindowBlur = () => this.#hold('window');
  #onWindowFocus = () => this.#release('window');

  #hold(reason: string) {
    const was = this.#holds.size;
    this.#holds.add(reason);
    if (!was) {
      this.#pause();
      this.dispatchEvent(new Event('ht-pause'));
    }
  }

  #release(reason: string) {
    if (!this.#holds.delete(reason) || this.#holds.size) return;
    this.#resume();
    this.dispatchEvent(new Event('ht-resume'));
  }

  /** Holds the timer (the toaster calls this while its stack is hovered or focused). */
  pause() {
    this.#hold('stack');
  }

  /** Lets go of the hold taken by `pause()`. */
  resume() {
    this.#release('stack');
  }

  #restart() {
    clearTimeout(this.#timer);
    this.#timer = 0;
    this.#remaining = this.duration;
    this.#resume();
  }

  #pause() {
    if (!this.#timer) return;
    clearTimeout(this.#timer);
    this.#timer = 0;
    this.#remaining = Math.max(500, this.#remaining - (Date.now() - this.#started));
  }

  #resume() {
    if (!this.isConnected || this.duration <= 0 || this.loading || this.#removed || this.#timer || this.#holds.size) return;
    this.#started = Date.now();
    this.#timer = window.setTimeout(() => this.dismiss(), this.#remaining);
  }

  get #removed() {
    return this.hasAttribute('data-removed');
  }

  #dir(): 'left' | 'right' | 'up' | 'down' | 'none' {
    if (this.swipe) return this.swipe;
    const pos = (this.parentElement as HtToaster | null)?.position ?? '';
    if (pos.endsWith('left')) return 'left';
    if (pos.endsWith('center')) return pos.startsWith('top') ? 'up' : 'down';
    return 'right';
  }

  #drag: { x: number; y: number; t: number; id: number; moved: boolean } | null = null;

  #onDown = (e: PointerEvent) => {
    if (e.button !== 0 || this.loading || this.#removed || this.#dir() === 'none') return;
    // Leave the buttons and any link or field alone.
    if (e.composedPath().some((n) => n instanceof Element && n.matches('button, a, input, select, textarea'))) return;
    this.#drag = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId, moved: false };
    this.#hold('drag');
  };

  /** Distance dragged toward the dismiss direction (never negative), in px. */
  #pull(e: PointerEvent, from: { x: number; y: number }) {
    const d = this.#dir();
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    const along = d === 'right' ? dx : d === 'left' ? -dx : d === 'down' ? dy : -dy;
    return Math.max(0, along);
  }

  #offset(px: number) {
    const d = this.#dir();
    const sign = d === 'left' || d === 'up' ? -1 : 1;
    const horizontal = d === 'left' || d === 'right';
    this.style.setProperty('--_sx', horizontal ? `${sign * px}px` : '0px');
    this.style.setProperty('--_sy', horizontal ? '0px' : `${sign * px}px`);
  }

  #onMove = (e: PointerEvent) => {
    const drag = this.#drag;
    if (!drag || e.pointerId !== drag.id) return;
    const pull = this.#pull(e, drag);
    if (!drag.moved) {
      if (pull < 4) return;
      drag.moved = true;
      try {
        this.setPointerCapture(e.pointerId);
      } catch {
        /* the pointer is already gone */
      }
      this.toggleAttribute('swiping', true);
      this.dataset.swipe = 'start';
    } else {
      this.dataset.swipe = 'move';
    }
    this.#offset(pull);
  };

  #onUp = (e: PointerEvent) => {
    const drag = this.#drag;
    if (!drag || e.pointerId !== drag.id) return;
    this.#drag = null;
    this.toggleAttribute('swiping', false);
    if (!drag.moved) return this.#release('drag');
    if (this.hasPointerCapture(e.pointerId)) this.releasePointerCapture(e.pointerId);
    const pull = this.#pull(e, drag);
    // Far enough, or a quick flick (Sonner: 0.11 px/ms).
    if (e.type === 'pointerup' && (pull >= this.swipeThreshold || pull / Math.max(1, Date.now() - drag.t) > 0.11)) {
      const d = this.#dir();
      const size = d === 'left' || d === 'right' ? this.offsetWidth : this.offsetHeight;
      this.toggleAttribute('swiped', true);
      this.dataset.swipe = 'end';
      this.#offset(pull + size);
      this.dismiss();
    } else {
      this.dataset.swipe = 'cancel';
      this.#offset(0);
      this.#release('drag');
      setTimeout(() => delete this.dataset.swipe, 200);
    }
  };

  /** Animates out and removes the toast. */
  dismiss(ms = 200) {
    if (this.#removed) return;
    this.toggleAttribute('data-removed', true);
    clearTimeout(this.#timer);
    this.#timer = 0;
    setTimeout(() => {
      this.remove();
      this.dispatchEvent(new Event('ht-dismiss', { bubbles: true, composed: true }));
    }, ms);
  }

  #onIconSlot(e: Event) {
    this._hasIcon = (e.target as HTMLSlotElement).assignedNodes().length > 0;
  }

  #onButtonSlot = () => {
    this._hasButtons = !!this.querySelector(':scope > [slot="action"], :scope > [slot="cancel"]');
  };

  #onDescriptionSlot(e: Event) {
    this._hasDescription = (e.target as HTMLSlotElement).assignedNodes().length > 0;
  }

  #button(b: ToastButton | null, kind: 'action' | 'cancel') {
    if (!b) return nothing;
    return html`<button class=${kind} part=${kind} aria-label=${b.altText ?? nothing}
      @click=${(e: MouseEvent) => {
        b.onClick?.(e);
        if (!e.defaultPrevented) this.dismiss();
      }}>${b.label}</button>`;
  }

  render() {
    const assertive = this.type === 'foreground' || (this.type !== 'background' && this.tone === 'danger');
    const fallback = this.loading ? SPINNER : ICONS[this.tone];
    return html`<div part="base" class="toast" role=${assertive ? 'alert' : 'status'} aria-live=${assertive ? 'assertive' : 'polite'} aria-atomic="true" aria-busy=${this.loading ? 'true' : nothing}>
      ${this.closeButton && !this.loading
        ? html`<button class="close" part="close" aria-label="Close" @click=${() => this.dismiss()}>${CLOSE}</button>`
        : nothing}
      <span part="icon" class="icon" ?hidden=${!fallback && !this._hasIcon}><slot name="icon" @slotchange=${this.#onIconSlot}>${fallback ?? nothing}</slot></span>
      <div class="content">
        <div part="title" class="title"><slot></slot></div>
        <div part="description" class="description" ?hidden=${!this.description && !this._hasDescription}><slot name="description" @slotchange=${this.#onDescriptionSlot}>${this.description}</slot></div>
      </div>
      <div class="buttons" ?hidden=${!this.action && !this.cancel && !this._hasButtons}><slot name="cancel" @slotchange=${this.#onButtonSlot}>${this.#button(this.cancel, 'cancel')}</slot><slot name="action" @slotchange=${this.#onButtonSlot}>${this.#button(this.action, 'action')}</slot></div>
    </div>`;
  }
}

/**
 * Fixed stack that holds toasts, in the style of Sonner: new toasts land in front, older ones
 * tuck in behind (three show), and the stack fans out while the pointer is over it or focus is
 * inside it. Rendered in the top layer, so it sits above open dialogs. `toast()` creates one on
 * demand; place one by hand to set its options.
 *
 * Like the Radix Toast viewport: it is a labelled region, `F8` moves focus into it (so a keyboard
 * user can reach a toast before it times out), and the whole stack holds its timers while it is
 * expanded.
 *
 * @tag ht-toaster
 * @summary Toast container.
 *
 * @slot - `ht-toast` elements. The last one is the newest, shown in front.
 *
 * @cssprop [--ht-toaster-offset=24px] - Distance from the viewport edges (16px on screens 600px wide or less).
 */
export class HtToaster extends LitElement {
  static properties = {
    /** Where the stack sits. */
    position: { reflect: true },
    /** Keeps the stack fanned out all the time. */
    expand: { type: Boolean, reflect: true },
    /** Toasts shown at once. Older ones wait, hidden, behind them. */
    visibleToasts: { type: Number, attribute: 'visible-toasts' },
    /** Pixels between toasts when the stack is fanned out. */
    gap: { type: Number },
    /** Default `duration` for toasts made by `toast()`. */
    duration: { type: Number },
    /** Default `rich` for toasts made by `toast()`. */
    richColors: { type: Boolean, attribute: 'rich-colors' },
    /** Default `close-button` for toasts made by `toast()`. */
    closeButton: { type: Boolean, attribute: 'close-button' },
    /**
     * Key that moves focus into the stack: a `KeyboardEvent.code` such as `F8`, or codes joined with
     * `+` where a modifier is `altKey`, `ctrlKey`, `metaKey` or `shiftKey` (for example `altKey+KeyT`).
     */
    hotkey: {},
    /** Accessible name of the region. `{hotkey}` is replaced by the hotkey. */
    label: {},
  };

  declare position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  declare expand: boolean;
  declare visibleToasts: number;
  declare gap: number;
  declare duration: number;
  declare richColors: boolean;
  declare closeButton: boolean;
  declare hotkey: string;
  declare label: string;

  #held = false;
  #pending = false;
  #observer = new MutationObserver(() => this.#schedule(true));
  /** Natural heights. Measured only when content or the set of toasts changes, so hover can animate height. */
  #heights = new WeakMap<HtToast, number>();
  #dirty = true;

  constructor() {
    super();
    this.position = 'bottom-right';
    this.expand = false;
    this.visibleToasts = 3;
    this.gap = 14;
    this.duration = 4000;
    this.richColors = false;
    this.closeButton = false;
    this.hotkey = 'F8';
    this.label = 'Notifications ({hotkey})';
    // Hovering or focusing any toast fans the stack out and holds every timer.
    this.addEventListener('pointerenter', () => this.#hold(true));
    this.addEventListener('pointerleave', () => this.#hold(false));
    this.addEventListener('focusin', () => this.#hold(true));
    this.addEventListener('focusout', (e) => {
      if (!e.relatedTarget || !this.contains(e.relatedTarget as Node)) this.#hold(false);
    });
    relayout.set(this, () => this.#schedule(true));
  }

  #toasts() {
    return [...this.children].filter((c): c is HtToast => c.localName === 'ht-toast');
  }

  #hold(on: boolean) {
    if (this.#held === on) return;
    this.#held = on;
    for (const t of this.#toasts()) (on ? t.pause() : t.resume());
    this.#schedule();
  }

  #onHotkey = (e: KeyboardEvent) => {
    const keys = (this.hotkey || '').split('+').filter(Boolean);
    if (!keys.length || !keys.every((k) => (e as unknown as Record<string, unknown>)[k] === true || e.code === k)) return;
    e.preventDefault();
    this.focus();
  };

  #label() {
    const shown = (this.hotkey || '').split('+').map((k) => k.replace(/^Key|Key$|^Digit/g, ''));
    return this.label.replace('{hotkey}', shown.join('+'));
  }

  /** Lays the stack out once the toasts have rendered. */
  #schedule(remeasure = false) {
    if (remeasure) this.#dirty = true;
    if (this.#pending) return;
    this.#pending = true;
    Promise.all(this.#toasts().map((t) => t.updateComplete)).then(() => {
      this.#pending = false;
      this.#layout();
    });
  }

  #layout() {
    const all = this.#toasts();
    const live = all.filter((t) => !t.hasAttribute('data-removed')).reverse();
    const y = this.position.startsWith('top') ? 'top' : 'bottom';
    const expanded = this.expand || this.#held;
    for (const t of live) {
      t.toggleAttribute('data-stacked', true);
      t.dataset.y = y;
      t.dataset.x = this.position.endsWith('center') ? 'center' : '';
    }
    // Natural heights, measured in the stacked shape with the height override lifted. Measuring
    // cancels a running height transition, so it is skipped when only the hover state changed.
    if (this.#dirty || live.some((t) => !this.#heights.has(t))) {
      this.#dirty = false;
      for (const t of live) t.style.height = 'auto';
      for (const t of live) this.#heights.set(t, t.offsetHeight);
      for (const t of live) t.style.height = '';
    }
    const heights = live.map((t) => this.#heights.get(t) ?? 0);
    let before = 0;
    live.forEach((t, i) => {
      t.style.setProperty('--_index', String(i));
      t.style.setProperty('--_z', String(live.length - i));
      t.style.setProperty('--_offset', `${i * this.gap + before}px`);
      t.style.setProperty('--_height', `${heights[i]}px`);
      t.toggleAttribute('data-front', i === 0);
      t.toggleAttribute('data-hidden', i >= this.visibleToasts);
      // Out of sight is out of the tab order too. It was announced when it arrived.
      t.inert = i >= this.visibleToasts;
      t.toggleAttribute('data-expanded', expanded);
      before += heights[i];
      // Enter: paint once below the edge, then slide in.
      if (!t.hasAttribute('data-mounted')) requestAnimationFrame(() => requestAnimationFrame(() => t.toggleAttribute('data-mounted', true)));
    });
    // A leaving toast keeps its place, so it animates out from where it was.
    for (const t of all) if (t.hasAttribute('data-removed')) t.toggleAttribute('data-expanded', expanded);
    this.style.setProperty('--_front-height', `${heights[0] ?? 0}px`);
    this.style.setProperty('--_gap', `${this.gap}px`);
  }

  updated() {
    this.setAttribute('aria-label', this.#label());
    this.#schedule(true);
  }

  static styles = css`
    :host {
      --_off: var(--ht-toaster-offset, 24px);
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
      display: block;
      box-sizing: border-box;
      width: min(var(--ht-toast-width, 356px), calc(100vw - 2 * var(--_off)));
      height: 0;
      pointer-events: none;
      color: inherit;
      outline: none;
    }
    :host([hidden]) { display: none; }
    ::slotted(*) { pointer-events: auto; }
    :host([position^='top']) { top: var(--_off); }
    :host([position^='bottom']) { bottom: var(--_off); }
    :host([position$='left']) { left: var(--_off); }
    :host([position$='right']) { right: var(--_off); }
    :host([position$='center']) { left: 50%; transform: translateX(-50%); }
    @media (max-width: 600px) {
      :host { --_off: 16px; left: var(--_off); right: var(--_off); width: auto; transform: none; }
      :host([position$='center']) { left: var(--_off); transform: none; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', this.#label());
    this.setAttribute('tabindex', '-1');
    this.setAttribute('popover', 'manual');
    document.addEventListener('keydown', this.#onHotkey);
    this.#observer.observe(this, { childList: true, attributes: true, subtree: true, attributeFilter: ['data-removed'] });
    // Top layer: stays above modal dialogs.
    queueMicrotask(() => {
      try {
        if (!this.matches(':popover-open')) this.showPopover();
      } catch {
        /* not connected yet */
      }
    });
    this.#schedule();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.#onHotkey);
    this.#observer.disconnect();
  }

  /** Adds a toast and returns it. With an `id` that is already showing, updates that toast instead. */
  add(options: ToastOptions | string): HtToast {
    const o = typeof options === 'string' ? { title: options } : options;
    const found = o.id ? this.#toasts().find((t) => t.id === o.id && !t.hasAttribute('data-removed')) : undefined;
    if (found) return this.updateToast(found, o);
    const el = document.createElement('ht-toast') as HtToast;
    el.duration = this.duration;
    el.rich = this.richColors;
    el.closeButton = this.closeButton;
    this.updateToast(el, o);
    this.append(el);
    if (this.#held) el.pause();
    return el;
  }

  /** Changes a toast in place (`toast.promise` uses this). Only the options given change. */
  updateToast(el: HtToast, o: ToastOptions): HtToast {
    if (o.id) el.id = o.id;
    if (o.title !== undefined) el.textContent = o.title;
    if (o.description !== undefined) el.description = o.description;
    if (o.tone !== undefined) el.tone = o.tone;
    if (o.loading !== undefined) el.loading = o.loading;
    if (o.rich !== undefined) el.rich = o.rich;
    if (o.type !== undefined) el.type = o.type;
    if (o.duration !== undefined) el.duration = o.duration;
    if (o.closeButton !== undefined) el.closeButton = o.closeButton;
    if (o.action !== undefined) el.action = o.action;
    if (o.cancel !== undefined) el.cancel = o.cancel;
    return el;
  }

  render() {
    return html`<slot></slot>`;
  }
}

export interface ToastOptions {
  /** The main line. `toast('Saved')` sets it. */
  title?: string;
  /** Second, lighter line. */
  description?: string;
  /** Names the toast. A later call with the same `id` updates it instead of adding another. */
  id?: string;
  tone?: HtToast['tone'];
  /** Spinner, no timer. `toast.loading()` sets it. */
  loading?: boolean;
  /** Tint the whole card. Default: the toaster's `rich-colors`. */
  rich?: boolean;
  /** How a screen reader announces it. See `ht-toast` `type`. */
  type?: HtToast['type'];
  /** Milliseconds, `0` for sticky. Default: the toaster's `duration` (4000). */
  duration?: number;
  /** Default: the toaster's `close-button`. */
  closeButton?: boolean;
  action?: ToastButton | null;
  cancel?: ToastButton | null;
}

export interface ToastPromiseOptions<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((reason: unknown) => string);
  /** Shown under every state's title. */
  description?: string;
}

function toaster(): HtToaster {
  let el = document.querySelector('ht-toaster') as HtToaster | null;
  if (!el) {
    el = document.createElement('ht-toaster') as HtToaster;
    document.body.append(el);
  }
  return el;
}

type Input = string | ToastOptions;
const opts = (input: Input, rest: ToastOptions = {}): ToastOptions =>
  typeof input === 'string' ? { ...rest, title: input } : { ...input, ...rest };
const show = (input: Input, rest: ToastOptions, fixed: ToastOptions) => toaster().add({ ...opts(input, rest), ...fixed });

/**
 * Shows a toast, in the style of Sonner. Creates the `ht-toaster` container on first use and
 * returns the `ht-toast` element.
 *
 * ```ts
 * toast('Event created', { description: 'Sunday at 9:00' });
 * toast.success('Saved.');
 * toast('Deleted.', { action: { label: 'Undo', onClick: restore } });
 * toast.promise(save(), { loading: 'Saving…', success: 'Saved.', error: 'That did not work.' });
 * toast.dismiss(); // all of them
 * ```
 */
export const toast = Object.assign((input: Input, rest: ToastOptions = {}) => toaster().add(opts(input, rest)), {
  /** Same as `toast()`. */
  message: (input: Input, rest: ToastOptions = {}) => toaster().add(opts(input, rest)),
  success: (input: Input, rest: ToastOptions = {}) => show(input, rest, { tone: 'success', loading: false }),
  error: (input: Input, rest: ToastOptions = {}) => show(input, rest, { tone: 'danger', loading: false }),
  warning: (input: Input, rest: ToastOptions = {}) => show(input, rest, { tone: 'warning', loading: false }),
  info: (input: Input, rest: ToastOptions = {}) => show(input, rest, { tone: 'info', loading: false }),
  loading: (input: Input, rest: ToastOptions = {}) => show(input, rest, { loading: true }),
  /** One toast that follows a promise: a spinner while it runs, then success or error. Returns the toast. */
  promise<T>(promise: Promise<T> | (() => Promise<T>), o: ToastPromiseOptions<T>): HtToast {
    const box = toaster();
    const el = box.add({ title: o.loading, description: o.description, loading: true });
    const settle = (next: ToastOptions) => {
      if (el.isConnected && !el.hasAttribute('data-removed')) box.updateToast(el, { ...next, loading: false });
    };
    (typeof promise === 'function' ? promise() : promise).then(
      (v) => settle({ tone: 'success', title: typeof o.success === 'function' ? o.success(v) : o.success }),
      (e) => settle({ tone: 'danger', title: typeof o.error === 'function' ? o.error(e) : o.error }),
    );
    return el;
  },
  /** Dismisses one toast (the element or its `id`), or every toast when called with nothing. */
  dismiss(target?: HtToast | string) {
    const box = document.querySelector('ht-toaster');
    if (target instanceof HtToast) return target.dismiss();
    const all = [...(box?.querySelectorAll<HtToast>(':scope > ht-toast') ?? [])];
    for (const t of all) if (target === undefined || t.id === target) t.dismiss();
  },
});

for (const [tag, ctor] of [
  ['ht-toast', HtToast],
  ['ht-toaster', HtToaster],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-toast': HtToast;
    'ht-toaster': HtToaster;
  }
}
