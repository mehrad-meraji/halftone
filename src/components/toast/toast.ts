import { LitElement, css, html, nothing, type TemplateResult } from 'lit';

const ICONS: Record<string, TemplateResult> = {
  neutral: html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 7.25v3.5M8 5.25v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  success: html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.25 8.25l1.75 1.75 3.5-3.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warning: html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 2.5l6 10.5H2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6.5v3M8 11.25v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  danger: html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 6l4 4m0-4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
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
 * @fires ht-dismiss - The toast was removed, by timeout or the close button.
 */
export class HtToast extends LitElement {
  static properties = {
    /** Fill colour. `neutral` is the inverse surface (dark on light themes). */
    tone: { reflect: true },
    /** Milliseconds before it dismisses itself. `0` keeps it until closed. Pauses while hovered or focused. */
    duration: { type: Number },
    /** Hides the close button. */
    noClose: { type: Boolean, attribute: 'no-close', reflect: true },
    _leaving: { state: true },
  };

  declare tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  declare duration: number;
  declare noClose: boolean;
  declare _leaving: boolean;

  #timer = 0;
  #remaining = 0;
  #started = 0;

  constructor() {
    super();
    this.tone = 'neutral';
    this.duration = 5000;
    this.noClose = false;
    this._leaving = false;
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
      animation: in 160ms cubic-bezier(0.2, 0, 0, 1);
    }
    :host([leaving]) { animation: out 120ms ease-in forwards; }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } }
    @keyframes out { to { opacity: 0; transform: translateY(8px); } }
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

  /** Animates out and removes the toast. */
  dismiss() {
    if (this._leaving) return;
    this._leaving = true;
    this.toggleAttribute('leaving', true);
    clearTimeout(this.#timer);
    setTimeout(() => {
      this.remove();
      this.dispatchEvent(new Event('ht-dismiss', { bubbles: true, composed: true }));
    }, 120);
  }

  render() {
    return html`<div part="base" class="toast" role=${this.tone === 'danger' ? 'alert' : 'status'}>
      <span class="icon"><slot name="icon">${ICONS[this.tone] ?? ICONS.neutral}</slot></span>
      <div class="content"><slot></slot></div>
      <slot name="action"></slot>
      ${this.noClose
        ? nothing
        : html`<button class="close" aria-label="Dismiss" @click=${() => this.dismiss()}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
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
