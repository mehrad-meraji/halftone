import { LitElement, css, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

/**
 * A wrapper that reveals the halftone dot screen, with a faint accent glow, under the mouse
 * pointer. Wrap a card or a panel; it follows the pointer and fades out when the pointer leaves.
 *
 * It is decoration only: the overlay ignores pointer events and is hidden from assistive
 * technology, and it does nothing for touch or keyboard. With reduced motion it is not shown. Give
 * the wrapper the radius of what it wraps (`border-radius`) so the overlay matches the corners.
 *
 * @tag ht-spotlight
 * @summary Cursor-following halftone glow.
 *
 * @slot - The content to put the spotlight over.
 *
 * @csspart overlay - The overlay that holds the glow and the dots.
 */
export class HtSpotlight extends LitElement {
  static properties = {
    /** Radius of the spotlight in pixels (default 280). */
    size: { type: Number },
  };

  declare size: number;

  constructor() {
    super();
    this.size = 280;
    this.addEventListener('pointermove', this.#move);
    this.addEventListener('pointerleave', this.#leave);
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
      isolation: isolate;
    }
    :host([hidden]) { display: none; }
    .overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      border-radius: inherit;
      pointer-events: none;
      opacity: 0;
      transition: opacity 200ms var(--ht-ease);
    }
    .overlay.on { opacity: 1; }
    .glow, .dots {
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }
    .glow {
      background: radial-gradient(circle var(--_size) at var(--_x, 50%) var(--_y, 50%), color-mix(in oklab, var(--ht-accent) 20%, transparent), transparent 70%);
    }
    /* The mask only sets where the dots show, so its colour is irrelevant. */
    .dots {
      opacity: 0.6; /* a little softer than a header strip, so text under the glow keeps its contrast */
      background: var(--ht-halftone);
      -webkit-mask-image: radial-gradient(circle var(--_size) at var(--_x, 50%) var(--_y, 50%), black, transparent);
      mask-image: radial-gradient(circle var(--_size) at var(--_x, 50%) var(--_y, 50%), black, transparent);
    }
    @media (prefers-reduced-motion: reduce) {
      .overlay { display: none; }
    }
  `;

  get #overlay() {
    return this.renderRoot.querySelector<HTMLElement>('.overlay');
  }

  #move = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const overlay = this.#overlay;
    if (!overlay) return;
    const r = this.getBoundingClientRect();
    overlay.style.setProperty('--_x', `${e.clientX - r.left}px`);
    overlay.style.setProperty('--_y', `${e.clientY - r.top}px`);
    overlay.classList.add('on');
  };

  #leave = () => {
    this.#overlay?.classList.remove('on');
  };

  render() {
    return html`<slot></slot>
      <div part="overlay" class="overlay" aria-hidden="true" style=${styleMap({ '--_size': `${this.size}px` })}>
        <div class="glow"></div>
        <div class="dots"></div>
      </div>`;
  }
}

if (!customElements.get('ht-spotlight')) customElements.define('ht-spotlight', HtSpotlight);

declare global {
  interface HTMLElementTagNameMap {
    'ht-spotlight': HtSpotlight;
  }
}
