import { LitElement, css, html, nothing, type TemplateResult } from 'lit';

const ICONS: Record<string, TemplateResult> = {
  neutral: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"/></svg>`,
  success: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>`,
  warning: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"/></svg>`,
  danger: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>`,
};
ICONS.info = ICONS.neutral;

/**
 * A single notification: solid tone fill, icon, message, optional action and close button
 * (after PostHog's toasts: 26rem wide, 6px radius, 8px padding, soft shadow). Normally
 * created through `toast()`, but usable on its own.
 *
 * @tag ht-toast
 * @summary Notification message.
 *
 * @slot - Message text.
 * @slot action - A button or link at the end, e.g. "Undo".
 * @slot icon - Replaces the default tone icon.
 *
 * @csspart base - The toast box.
 *
 * @cssprop [--ht-toast-width=26rem] - Maximum width.
 *
 * Drag it toward the edge it sits on (or set `swipe`) and release past 50px to dismiss it. A
 * shorter drag snaps back. The timer is paused while it is held.
 *
 * @fires ht-dismiss - The toast was removed, by timeout, the close button or a swipe.
 */
export class HtToast extends LitElement {
  static properties = {
    /** Fill colour. `neutral` is the inverse surface (dark on light themes). */
    tone: { reflect: true },
    /** Milliseconds before it dismisses itself. `0` keeps it until closed. Pauses while hovered or focused. */
    duration: { type: Number },
    /** Hides the close button. */
    noClose: { type: Boolean, attribute: 'no-close', reflect: true },
    /**
     * Direction a swipe dismisses it. Defaults to the side the toaster sits on (`left` for a left
     * position, otherwise `right`). `none` turns swiping off.
     */
    swipe: { reflect: true },
    _leaving: { state: true },
  };

  declare tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  declare duration: number;
  declare noClose: boolean;
  declare swipe: '' | 'left' | 'right' | 'up' | 'down' | 'none';
  declare _leaving: boolean;

  #timer = 0;
  #remaining = 0;
  #started = 0;

  constructor() {
    super();
    this.tone = 'neutral';
    this.duration = 5000;
    this.noClose = false;
    this.swipe = '';
    this._leaving = false;
    this.addEventListener('pointerdown', this.#onDown);
    this.addEventListener('pointermove', this.#onMove);
    this.addEventListener('pointerup', this.#onUp);
    this.addEventListener('pointercancel', this.#onUp);
    this.addEventListener('pointerenter', () => this.#pause());
    this.addEventListener('pointerleave', () => this.#resume());
    this.addEventListener('focusin', () => this.#pause());
    this.addEventListener('focusout', () => this.#resume());
  }

  static styles = css`
    :host {
      display: block;
      width: min(var(--ht-toast-width, 26rem), 100%);
      max-width: 100%;
      animation: in var(--ht-duration-in) var(--ht-ease-spring);
    }
    :host([leaving]) { animation: out 120ms ease-in forwards; }
    /* Swipe: the host follows the pointer through --_sx and --_sy, and snaps back (or flies out) with a transition. */
    :host { transform: translate(var(--_sx, 0px), var(--_sy, 0px)); transition: transform 160ms var(--ht-ease), opacity 160ms; touch-action: pan-y; }
    :host([swipe='up']), :host([swipe='down']) { touch-action: pan-x; }
    :host([swipe='none']) { touch-action: auto; }
    :host([swiping]) { transition: none; cursor: grabbing; user-select: none; }
    :host([swiped]) { opacity: 0; }
    :host([leaving][swiped]) { animation: none; }
    @keyframes in { from { opacity: 0; transform: translateY(12px) scale(0.96); } }
    @keyframes out { to { opacity: 0; transform: translateY(8px) scale(0.96); } }
    @media (prefers-reduced-motion: reduce) { :host, :host([leaving]) { animation-duration: 1ms; } }
    :host { --_bg: var(--ht-inverse); --_fg: var(--ht-inverse-ink); }
    :host([tone='info']) { --_bg: color-mix(in oklab, var(--ht-info) 88%, black); --_fg: oklch(0.99 0 0); }
    :host([tone='success']) { --_bg: color-mix(in oklab, var(--ht-success) 82%, black); --_fg: oklch(0.99 0 0); }
    :host([tone='danger']) { --_bg: var(--ht-danger); --_fg: var(--ht-danger-ink); }
    :host([tone='warning']) { --_bg: var(--ht-warning); --_fg: oklch(0.2 0.03 60); }
    .toast {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 3.5rem;
      padding: 8px;
      font: 500 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--_fg);
      background: var(--_bg);
      border-radius: var(--ht-radius-md);
      box-shadow: 0 4px 12px oklch(0 0 0 / 0.1);
    }
    .icon { display: grid; flex: none; padding-inline: 4px; }
    .content { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .close {
      all: unset;
      display: grid;
      place-items: center;
      flex: none;
      width: 28px;
      height: 28px;
      cursor: pointer;
      border-radius: var(--ht-radius-md);
      opacity: 0.8;
    }
    .close:hover { opacity: 1; background: color-mix(in oklab, currentColor 15%, transparent); }
    .close:focus-visible { outline: 2px solid currentColor; outline-offset: 1px; }
    ::slotted([slot='action']) { flex: none; }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (this.duration > 0) {
      this.#remaining = this.duration;
      this.#resume();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
  }

  #pause() {
    if (!this.#timer) return;
    clearTimeout(this.#timer);
    this.#timer = 0;
    this.#remaining = Math.max(500, this.#remaining - (Date.now() - this.#started));
  }

  #resume() {
    if (this.duration <= 0 || this._leaving || this.#timer) return;
    this.#started = Date.now();
    this.#timer = window.setTimeout(() => this.dismiss(), this.#remaining);
  }

  #dir(): 'left' | 'right' | 'up' | 'down' | 'none' {
    if (this.swipe) return this.swipe;
    const pos = (this.parentElement as HtToaster | null)?.position ?? '';
    return pos.endsWith('left') ? 'left' : 'right';
  }

  #drag: { x: number; y: number; id: number; moved: boolean } | null = null;

  #onDown = (e: PointerEvent) => {
    if (e.button !== 0 || this._leaving || this.#dir() === 'none') return;
    // Leave the close button, the action and any link alone.
    if (e.composedPath().some((n) => n instanceof Element && n.matches('button, a, input, select, textarea'))) return;
    this.#drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    this.#pause();
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
    }
    this.#offset(pull);
  };

  #onUp = (e: PointerEvent) => {
    const drag = this.#drag;
    if (!drag || e.pointerId !== drag.id) return;
    this.#drag = null;
    this.toggleAttribute('swiping', false);
    if (!drag.moved) return this.#resume();
    if (this.hasPointerCapture(e.pointerId)) this.releasePointerCapture(e.pointerId);
    if (e.type === 'pointerup' && this.#pull(e, drag) >= 50) {
      // Fly the rest of the way out, then remove it.
      const d = this.#dir();
      const size = d === 'left' || d === 'right' ? this.offsetWidth : this.offsetHeight;
      this.toggleAttribute('swiped', true);
      this.#offset(size + 24);
      this.dismiss(160);
    } else {
      this.#offset(0);
      this.#resume();
    }
  };

  /** Animates out and removes the toast. */
  dismiss(ms = 120) {
    if (this._leaving) return;
    this._leaving = true;
    this.toggleAttribute('leaving', true);
    clearTimeout(this.#timer);
    setTimeout(() => {
      this.remove();
      this.dispatchEvent(new Event('ht-dismiss', { bubbles: true, composed: true }));
    }, ms);
  }

  render() {
    return html`<div part="base" class="toast" role=${this.tone === 'danger' ? 'alert' : 'status'}>
      <span class="icon"><slot name="icon">${ICONS[this.tone] ?? ICONS.neutral}</slot></span>
      <div class="content"><slot></slot></div>
      <slot name="action"></slot>
      ${this.noClose
        ? nothing
        : html`<button class="close" aria-label="Dismiss" @click=${() => this.dismiss()}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"/></svg>
          </button>`}
    </div>`;
  }
}

/**
 * Fixed stack that holds toasts. Rendered in the top layer, so it sits above open dialogs.
 * `toast()` creates one on demand; you rarely need to place it by hand.
 *
 * @tag ht-toaster
 * @summary Toast container.
 *
 * @slot - `ht-toast` elements.
 */
export class HtToaster extends LitElement {
  static properties = {
    /** Where the stack sits. */
    position: { reflect: true },
  };

  declare position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

  constructor() {
    super();
    this.position = 'bottom-right';
  }

  static styles = css`
    :host {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 16px;
      border: 0;
      background: transparent;
      overflow: visible;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: min(calc(26rem + 32px), 100vw);
      max-height: 100vh;
      box-sizing: border-box;
      pointer-events: none;
      color: inherit;
    }
    :host([hidden]) { display: none; }
    ::slotted(*) { pointer-events: auto; }
    :host([position^='top']) { top: 0; }
    :host([position^='bottom']) { bottom: 0; flex-direction: column; justify-content: flex-end; }
    :host([position$='left']) { left: 0; }
    :host([position$='right']) { right: 0; }
    :host([position$='center']) { left: 50%; transform: translateX(-50%); align-items: center; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Notifications');
    this.setAttribute('popover', 'manual');
    // Top layer: stays above modal dialogs.
    queueMicrotask(() => {
      try {
        if (!this.matches(':popover-open')) this.showPopover();
      } catch {
        /* not connected yet */
      }
    });
  }

  /** Adds a toast and returns it. */
  add(options: ToastOptions | string): HtToast {
    const o = typeof options === 'string' ? { message: options } : options;
    const el = document.createElement('ht-toast') as HtToast;
    if (o.tone) el.tone = o.tone;
    if (o.duration !== undefined) el.duration = o.duration;
    if (o.noClose) el.noClose = true;
    el.append(o.message);
    if (o.action) {
      const a = document.createElement('button');
      a.slot = 'action';
      a.textContent = o.action.label;
      a.style.cssText =
        'all:unset;cursor:pointer;font:600 0.8125rem/1rem var(--ht-font-ui);text-decoration:underline;padding:4px 6px;border-radius:4px;';
      a.addEventListener('click', () => {
        o.action!.onClick();
        el.dismiss();
      });
      el.append(a);
    }
    this.append(el);
    return el;
  }

  render() {
    return html`<slot></slot>`;
  }
}

export interface ToastOptions {
  message: string;
  tone?: HtToast['tone'];
  /** Milliseconds, `0` for sticky. Default 5000. */
  duration?: number;
  noClose?: boolean;
  action?: { label: string; onClick: () => void };
}

function toaster(): HtToaster {
  let el = document.querySelector('ht-toaster') as HtToaster | null;
  if (!el) {
    el = document.createElement('ht-toaster') as HtToaster;
    document.body.append(el);
  }
  return el;
}

/**
 * Shows a toast. Creates the `ht-toaster` container on first use.
 *
 * ```ts
 * toast('Saved.');
 * toast({ message: 'Deleted.', tone: 'success', action: { label: 'Undo', onClick: restore } });
 * toast.error('That did not work.');
 * ```
 */
export const toast = Object.assign((options: ToastOptions | string) => toaster().add(options), {
  success: (message: string, rest: Partial<ToastOptions> = {}) => toaster().add({ ...rest, message, tone: 'success' }),
  error: (message: string, rest: Partial<ToastOptions> = {}) => toaster().add({ ...rest, message, tone: 'danger' }),
  warning: (message: string, rest: Partial<ToastOptions> = {}) => toaster().add({ ...rest, message, tone: 'warning' }),
  info: (message: string, rest: Partial<ToastOptions> = {}) => toaster().add({ ...rest, message, tone: 'info' }),
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
