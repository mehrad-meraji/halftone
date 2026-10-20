import { LitElement, css, html } from 'lit';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

/**
 * Non-modal panel anchored to a trigger. The panel is a manual popover in the top layer, so
 * it is never clipped, and it is positioned in JavaScript: it flips to the opposite side when
 * there is no room and is clamped to the viewport.
 *
 * The first element in the default slot is the trigger. It gets `aria-haspopup="dialog"`,
 * `aria-expanded`, and `aria-controls` pointing at the first element in the `content` slot
 * (the panel itself lives in the shadow root, which an id reference cannot cross). Focus moves
 * into the panel on open and returns to the trigger on Escape or when `hide()` runs while focus
 * is inside. Focus is not trapped. Escape, a press outside, or tabbing out closes it.
 *
 * The trigger must be focusable and activate on click (a button or `ht-button`).
 *
 * Set `arrow` to draw a small pointer from the panel to the trigger. It follows the trigger's
 * centre along the panel edge and swaps sides when the panel flips.
 *
 * @tag ht-popover
 * @summary Anchored, non-modal panel.
 *
 * @slot - The trigger element.
 * @slot content - Panel content.
 *
 * @csspart panel - The floating panel.
 *
 * @cssprop [--ht-popover-width=18rem] - Panel width (never wider than the viewport).
 * @cssprop [--ht-popover-padding=1rem] - Panel padding.
 *
 * @fires open - The panel opened, by any route. Does not bubble.
 * @fires close - The panel closed, by any route. Does not bubble.
 */
export class HtPopover extends LitElement {
  static properties = {
    /** Liquid glass look: a translucent panel that blurs what is behind it, with a bright rim and a sheen. */
    glass: { type: Boolean, reflect: true },
    /** Shows the panel. Reflects, so closing from inside updates it. */
    open: { type: Boolean, reflect: true },
    /**
     * Preferred side and alignment: `top`, `bottom`, `left` or `right`, optionally followed by
     * `-start` or `-end`. Flips to the opposite side if there is no room.
     */
    placement: { reflect: true },
    /** Accessible name for the panel. Defaults to the trigger's name. */
    label: {},
    /** Stops the trigger from opening the panel. */
    disabled: { type: Boolean, reflect: true },
    /** Draws a pointer from the panel to the trigger. */
    arrow: { type: Boolean, reflect: true },
  };

  declare open: boolean;
  declare placement: string;
  declare label: string;
  declare disabled: boolean;
  declare arrow: boolean;

  #wasOpen = false;
  #mounted = false;

  declare glass: boolean;

  constructor() {
    super();
    this.glass = false;
    this.open = false;
    this.placement = 'bottom';
    this.label = '';
    this.disabled = false;
    this.arrow = false;
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusout', this.#onFocusout);
  }

  static styles = css`
    :host { display: inline-block; }
    .panel {
      position: fixed;
      inset: auto;
      margin: 0;
      box-sizing: border-box;
      width: var(--ht-popover-width, 18rem);
      max-width: calc(100vw - 8px);
      max-height: calc(100vh - 8px);
      padding: var(--ht-popover-padding, 1rem);
      overflow: auto;
      font: 400 0.875rem/1.5 var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-md);
      /* Closed state. The panel grows out of the side that faces its trigger, springs in and leaves faster. */
      opacity: 0;
      transform: translate(var(--_dx, 0), var(--_dy, 0)) scale(0.96);
      transform-origin: var(--_origin, center);
      transition:
        opacity var(--ht-duration-out) ease-in,
        transform var(--ht-duration-out) ease-in,
        overlay var(--ht-duration-out) allow-discrete,
        display var(--ht-duration-out) allow-discrete;
    }
    .panel[data-side='bottom'] { --_dy: -6px; --_origin: top; }
    .panel[data-side='top'] { --_dy: 6px; --_origin: bottom; }
    .panel[data-side='left'] { --_dx: 6px; --_origin: right; }
    .panel[data-side='right'] { --_dx: -6px; --_origin: left; }
    .panel:popover-open {
      opacity: 1;
      transform: none;
      transition-duration: var(--ht-duration-in);
      transition-timing-function: var(--ht-ease-spring);
    }
    @starting-style {
      .panel:popover-open { opacity: 0; transform: translate(var(--_dx, 0), var(--_dy, 0)) scale(0.96); }
    }
    .scroll { display: contents; }
    /* The arrow hangs outside the panel, so with it the panel stops clipping and the inner box scrolls instead. */
    :host([arrow]) .panel { overflow: visible; padding: 0; }
    :host([arrow]) .scroll {
      display: block;
      box-sizing: border-box;
      max-height: calc(100vh - 10px);
      padding: var(--ht-popover-padding, 1rem);
      overflow: auto;
      border-radius: inherit;
    }
    :host([arrow]) .panel::before {
      content: '';
      position: absolute;
      box-sizing: border-box;
      width: 10px;
      height: 10px;
      background: inherit;
      border: 1px solid var(--ht-border-strong);
      pointer-events: none;
    }
    :host([arrow]) .panel[data-side='bottom']::before { top: -6px; left: var(--_ax, 50%); border-width: 1px 0 0 1px; transform: translateX(-50%) rotate(45deg); }
    :host([arrow]) .panel[data-side='top']::before { bottom: -6px; left: var(--_ax, 50%); border-width: 0 1px 1px 0; transform: translateX(-50%) rotate(45deg); }
    :host([arrow]) .panel[data-side='right']::before { left: -6px; top: var(--_ay, 50%); border-width: 0 0 1px 1px; transform: translateY(-50%) rotate(45deg); }
    :host([arrow]) .panel[data-side='left']::before { right: -6px; top: var(--_ay, 50%); border-width: 1px 1px 0 0; transform: translateY(-50%) rotate(45deg); }
    :host([glass][arrow]) .panel::before { border-color: transparent; }
    .panel:focus { outline: none; }
    .panel:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    @media (prefers-reduced-motion: reduce) {
      .panel { transition: none; }
    }
    :host([glass]) .panel {
      background: var(--ht-glass-panel-bg);
      border-color: transparent;
      box-shadow: var(--ht-glass-rim), var(--ht-glass-shadow);
      -webkit-backdrop-filter: var(--ht-glass-filter);
      backdrop-filter: var(--ht-glass-filter);
    }
  `;

  get #panel() {
    return this.renderRoot.querySelector<HTMLElement>('.panel');
  }

  get #trigger(): HTMLElement | null {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])');
    return (slot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined) ?? null;
  }

  /** Opens the panel. */
  show() {
    if (!this.disabled) this.open = true;
  }
  /** Closes the panel. Focus returns to the trigger if it was inside the panel. */
  hide() {
    this.open = false;
  }
  /** Toggles the panel. */
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
    this.#mounted = true;
  }

  #reveal(panel: HTMLElement) {
    panel.setAttribute('aria-label', this.label || this.#triggerName());
    panel.showPopover();
    this.#place(panel);
    document.addEventListener('pointerdown', this.#onOutside, true);
    window.addEventListener('resize', this.#reposition);
    window.addEventListener('scroll', this.#reposition, true);
    // Move focus into the panel (first tabbable control, else the panel itself), but never
    // on the first render: an initially open popover must not steal focus on page load.
    if (!this.#mounted) return;
    const focusable = this.querySelector<HTMLElement>(
      '[slot="content"] :is(a[href], button, input, select, textarea, [tabindex]):not([tabindex="-1"]):not([disabled]), [slot="content"]:is(a[href], button, input, select, textarea):not([disabled])',
    );
    (focusable ?? panel).focus({ preventScroll: true });
  }

  #conceal(panel: HTMLElement) {
    const hadFocus = this.#focusInside();
    panel.hidePopover();
    document.removeEventListener('pointerdown', this.#onOutside, true);
    window.removeEventListener('resize', this.#reposition);
    window.removeEventListener('scroll', this.#reposition, true);
    if (hadFocus) this.#trigger?.focus({ preventScroll: true });
  }

  #focusInside() {
    const active = this.#deepActive();
    return !!active && active !== this.#trigger && (this.contains(active) || this.renderRoot.contains(active));
  }

  #deepActive(): Element | null {
    let a: Element | null = document.activeElement;
    while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
    return a;
  }

  #triggerName() {
    const t = this.#trigger;
    return t?.getAttribute('aria-label') || t?.textContent?.trim() || 'Popover';
  }

  #syncTrigger() {
    const t = this.#trigger;
    if (!t) return;
    t.setAttribute('aria-haspopup', 'dialog');
    t.setAttribute('aria-expanded', String(this.open));
    const content = this.querySelector<HTMLElement>(':scope > [slot="content"]');
    if (content) {
      if (!content.id) content.id = `ht-popover-content-${Math.random().toString(36).slice(2, 8)}`;
      t.setAttribute('aria-controls', content.id);
    }
  }

  #onTriggerClick = (e: Event) => {
    if (e.defaultPrevented) return;
    this.toggle();
  };

  #onOutside = (e: Event) => {
    if (!e.composedPath().includes(this)) this.hide();
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !this.open) return;
    // Cancelling the keydown also stops an enclosing modal dialog from closing on this press.
    e.preventDefault();
    e.stopPropagation();
    this.#trigger?.focus({ preventScroll: true });
    this.hide();
  };

  #onFocusout = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (this.open && next && next !== this && !this.contains(next)) this.hide();
  };

  #reposition = () => {
    const panel = this.#panel;
    if (panel && this.open) this.#place(panel);
  };

  #place(panel: HTMLElement) {
    const gap = 8;
    const margin = 4;
    const [sideRaw, alignRaw] = this.placement.split('-');
    const preferred: Side = (['top', 'bottom', 'left', 'right'] as const).includes(sideRaw as Side)
      ? (sideRaw as Side)
      : 'bottom';
    const align: Align = alignRaw === 'start' || alignRaw === 'end' ? alignRaw : 'center';
    const t = (this.#trigger ?? this).getBoundingClientRect();
    const b = panel.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const across = (start: number, size: number, boxSize: number) =>
      align === 'start' ? start : align === 'end' ? start + size - boxSize : start + (size - boxSize) / 2;
    const pos = {
      top: { x: across(t.left, t.width, b.width), y: t.top - b.height - gap },
      bottom: { x: across(t.left, t.width, b.width), y: t.bottom + gap },
      left: { x: t.left - b.width - gap, y: across(t.top, t.height, b.height) },
      right: { x: t.right + gap, y: across(t.top, t.height, b.height) },
    };
    const flip = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
    // Only the main axis decides a flip; the cross axis is clamped below.
    const fits = (s: Side) =>
      s === 'top' || s === 'bottom'
        ? pos[s].y >= margin && pos[s].y + b.height <= vh - margin
        : pos[s].x >= margin && pos[s].x + b.width <= vw - margin;
    let side = preferred;
    if (!fits(side) && fits(flip[side])) side = flip[side];
    const p = pos[side];
    panel.dataset.side = side;
    const left = Math.min(Math.max(margin, p.x), Math.max(margin, vw - b.width - margin));
    const top = Math.min(Math.max(margin, p.y), Math.max(margin, vh - b.height - margin));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    // Point the arrow at the trigger's centre, but keep it clear of the rounded corners.
    const corner = 16;
    const clamp = (v: number, size: number) => Math.min(Math.max(v, corner), Math.max(corner, size - corner));
    panel.style.setProperty('--_ax', `${clamp(t.left + t.width / 2 - left, b.width)}px`);
    panel.style.setProperty('--_ay', `${clamp(t.top + t.height / 2 - top, b.height)}px`);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.#onOutside, true);
    window.removeEventListener('resize', this.#reposition);
    window.removeEventListener('scroll', this.#reposition, true);
  }

  render() {
    return html`<slot @click=${this.#onTriggerClick} @slotchange=${() => this.#syncTrigger()}></slot>
      <div part="panel" class="panel" role="dialog" popover="manual" tabindex="-1">
        <div class="scroll"><slot name="content" @slotchange=${() => this.#syncTrigger()}></slot></div>
      </div>`;
  }
}

if (!customElements.get('ht-popover')) customElements.define('ht-popover', HtPopover);

declare global {
  interface HTMLElementTagNameMap {
    'ht-popover': HtPopover;
  }
}
