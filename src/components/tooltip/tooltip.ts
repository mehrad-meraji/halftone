import { LitElement, css, html } from 'lit';

/**
 * Hover and focus hint for the element it wraps. The bubble is an inverse surface (dark on
 * light themes) rendered in the top layer, so it is never clipped.
 *
 * The wrapped element receives `aria-description` with the `text`, and the bubble has
 * `role="tooltip"`. Use it for supplementary hints, not for essential information.
 *
 * @tag ht-tooltip
 * @summary Tooltip.
 *
 * @slot - The element that triggers the tooltip.
 * @slot content - Rich content, instead of `text`.
 *
 * @csspart bubble - The tooltip bubble.
 *
 * @cssprop [--ht-tooltip-max-width=20rem] - Maximum bubble width.
 */
export class HtTooltip extends LitElement {
  static properties = {
    /** Plain-text content. */
    text: {},
    /** Preferred side. Flips if there is no room. */
    placement: { reflect: true },
    /** Milliseconds before showing on hover. Focus shows immediately. */
    delay: { type: Number },
    disabled: { type: Boolean, reflect: true },
  };

  declare text: string;
  declare placement: 'top' | 'bottom' | 'left' | 'right';
  declare delay: number;
  declare disabled: boolean;

  #timer = 0;

  constructor() {
    super();
    this.text = '';
    this.placement = 'top';
    this.delay = 300;
    this.disabled = false;
    this.addEventListener('pointerenter', () => this.#schedule());
    this.addEventListener('pointerleave', () => this.hide());
    this.addEventListener('pointerdown', () => this.hide());
    this.addEventListener('focusin', (e) => {
      if ((e.target as Element).matches(':focus-visible')) this.show();
    });
    this.addEventListener('focusout', () => this.hide());
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  static styles = css`
    :host { display: inline-block; }
    .bubble {
      position: fixed;
      inset: auto;
      margin: 0;
      box-sizing: border-box;
      max-width: var(--ht-tooltip-max-width, 20rem);
      padding: 4px 8px;
      font: 400 0.75rem/1rem var(--ht-font-ui);
      color: var(--ht-inverse-ink);
      background: var(--ht-inverse);
      border: 0;
      border-radius: var(--ht-radius-md);
      box-shadow: var(--ht-shadow-sm);
      overflow: visible;
      pointer-events: none;
      opacity: 0;
      transform: translateY(2px) scale(0.94);
      transition:
        opacity 80ms ease-in,
        transform 80ms ease-in,
        overlay 80ms allow-discrete,
        display 80ms allow-discrete;
    }
    .bubble:popover-open {
      opacity: 1;
      transform: none;
      transition-duration: 160ms;
      transition-timing-function: var(--ht-ease-spring);
    }
    @starting-style {
      .bubble:popover-open { opacity: 0; transform: translateY(2px) scale(0.94); }
    }
    @media (prefers-reduced-motion: reduce) {
      .bubble { transition: none; }
    }
  `;

  get #bubble() {
    return this.renderRoot.querySelector<HTMLElement>('.bubble');
  }

  #schedule() {
    clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => this.show(), this.delay);
  }

  /** Shows the tooltip now. */
  show() {
    clearTimeout(this.#timer);
    const bubble = this.#bubble;
    if (!bubble || this.disabled) return;
    const hasContent = this.text || this.querySelector('[slot="content"]');
    if (!hasContent || bubble.matches(':popover-open')) return;
    bubble.showPopover();
    this.#place(bubble);
  }

  /** Hides the tooltip. */
  hide() {
    clearTimeout(this.#timer);
    const bubble = this.#bubble;
    if (!bubble) return;
    if (bubble.matches(':popover-open')) bubble.hidePopover();
  }

  #place(bubble: HTMLElement) {
    const gap = 8;
    const t = this.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const pos = {
      top: { x: t.left + (t.width - b.width) / 2, y: t.top - b.height - gap },
      bottom: { x: t.left + (t.width - b.width) / 2, y: t.bottom + gap },
      left: { x: t.left - b.width - gap, y: t.top + (t.height - b.height) / 2 },
      right: { x: t.right + gap, y: t.top + (t.height - b.height) / 2 },
    };
    const flip = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
    // Only the main axis decides a flip; the cross axis is clamped below.
    const fits = (side: keyof typeof pos) =>
      side === 'top' || side === 'bottom'
        ? pos[side].y >= 4 && pos[side].y + b.height <= vh - 4
        : pos[side].x >= 4 && pos[side].x + b.width <= vw - 4;
    let side = this.placement;
    if (!fits(side) && fits(flip[side])) side = flip[side];
    const p = pos[side];
    bubble.style.left = `${Math.min(Math.max(4, p.x), vw - b.width - 4)}px`;
    bubble.style.top = `${Math.min(Math.max(4, p.y), vh - b.height - 4)}px`;
  }

  #syncAria = (e: Event) => {
    const el = (e.target as HTMLSlotElement).assignedElements()[0];
    if (el && this.text) el.setAttribute('aria-description', this.text);
  };

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
  }

  render() {
    return html`<slot @slotchange=${this.#syncAria}></slot>
      <div part="bubble" class="bubble" role="tooltip" popover="manual"><slot name="content">${this.text}</slot></div>`;
  }
}

if (!customElements.get('ht-tooltip')) customElements.define('ht-tooltip', HtTooltip);

declare global {
  interface HTMLElementTagNameMap {
    'ht-tooltip': HtTooltip;
  }
}
