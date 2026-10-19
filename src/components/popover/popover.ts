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
  };

  declare open: boolean;
  declare placement: string;
  declare label: string;
  declare disabled: boolean;

  #wasOpen = false;
  #mounted = false;

  constructor() {
    super();
    this.open = false;
    this.placement = 'bottom';
    this.label = '';
    this.disabled = false;
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
    .panel:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    @media (prefers-reduced-motion: reduce) {
      .panel { transition: none; transform: none; }
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
    requestAnimationFrame(() => panel.classList.add('on'));
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
    panel.classList.remove('on');
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
    panel.style.left = `${Math.min(Math.max(margin, p.x), Math.max(margin, vw - b.width - margin))}px`;
    panel.style.top = `${Math.min(Math.max(margin, p.y), Math.max(margin, vh - b.height - margin))}px`;
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
        <slot name="content" @slotchange=${() => this.#syncTrigger()}></slot>
      </div>`;
  }
}

if (!customElements.get('ht-popover')) customElements.define('ht-popover', HtPopover);

declare global {
  interface HTMLElementTagNameMap {
    'ht-popover': HtPopover;
  }
}
