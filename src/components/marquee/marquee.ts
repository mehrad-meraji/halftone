import { LitElement, css, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

/**
 * A row of content that scrolls sideways without end: logo clouds, partner strips, tag tickers.
 * The slotted content is repeated once so the loop has no seam; the copy is hidden from assistive
 * technology and cannot take focus. Add enough items to fill the width, or the empty space scrolls
 * with them.
 *
 * Moving content must be stoppable (WCAG 2.2.2). It stops on hover and while anything inside has
 * focus, and the `paused` attribute stops it from your own control. With reduced motion it does not
 * move at all and the row scrolls by hand instead.
 *
 * The copy is a snapshot taken when the slotted nodes change. If you edit an item in place, replace
 * the node instead.
 *
 * @tag ht-marquee
 * @summary Endless sideways scroller.
 *
 * @slot - The items to scroll.
 *
 * @csspart base - The clipping viewport.
 *
 * @cssprop [--ht-marquee-gap=48px] - Space between items, and between the end of one loop and the start of the next.
 */
export class HtMarquee extends LitElement {
  static properties = {
    /** Scroll speed in pixels per second. */
    speed: { type: Number },
    /** `left` moves content to the left, `right` to the right. */
    direction: { reflect: true },
    /** Stops the movement. Hover and focus also stop it. */
    paused: { type: Boolean, reflect: true },
    /** Fades the left and right edges. */
    fade: { type: Boolean, reflect: true },
    /** @internal Seconds for one full loop, measured from the content width. */
    _duration: { state: true },
    /** @internal */
    _clones: { state: true },
  };

  declare speed: number;
  declare direction: 'left' | 'right';
  declare paused: boolean;
  declare fade: boolean;
  declare _duration: number;
  declare _clones: Node[];

  #observer?: ResizeObserver;

  constructor() {
    super();
    this.speed = 40;
    this.direction = 'left';
    this.paused = false;
    this.fade = false;
    this._duration = 0;
    this._clones = [];
  }

  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }
    .viewport { overflow: hidden; }
    /* The mask only sets which part shows, so its colour is irrelevant. */
    :host([fade]) .viewport {
      mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
    }
    .track { display: flex; width: max-content; }
    .group {
      display: flex;
      flex: none;
      align-items: center;
      gap: var(--ht-marquee-gap, 48px);
      padding-inline-end: var(--ht-marquee-gap, 48px);
      min-width: 100vw;
      box-sizing: border-box;
    }
    @media (prefers-reduced-motion: no-preference) {
      .track { animation: scroll var(--_dur, 30s) linear infinite; }
      :host([direction='right']) .track { animation-direction: reverse; }
      :host([paused]) .track,
      :host(:hover) .track,
      :host(:focus-within) .track { animation-play-state: paused; }
    }
    /* No motion: one copy, scrolled by hand. */
    @media (prefers-reduced-motion: reduce) {
      .viewport { overflow-x: auto; }
      .clone { display: none; }
      .group { min-width: 0; }
    }
    @keyframes scroll {
      to { transform: translateX(-50%); }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
  }

  firstUpdated() {
    const group = this.renderRoot.querySelector<HTMLElement>('.group');
    if (!group) return;
    this.#observer = new ResizeObserver(() => this.#measure());
    this.#observer.observe(group);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('speed') || changed.has('_clones')) this.#measure();
  }

  /** One loop moves exactly one group's width, so duration = width / speed. */
  #measure() {
    const group = this.renderRoot.querySelector<HTMLElement>('.group');
    const speed = this.speed > 0 ? this.speed : 40;
    if (group) this._duration = group.scrollWidth / speed;
  }

  #onSlotChange = (e: Event) => {
    const nodes = (e.target as HTMLSlotElement).assignedNodes({ flatten: true });
    this._clones = nodes.map((n) => {
      const copy = n.cloneNode(true);
      // Ids must stay unique in the document.
      if (copy instanceof Element) {
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      }
      return copy;
    });
  };

  render() {
    return html`<div part="base" class="viewport">
      <div class="track" style=${styleMap({ '--_dur': this._duration ? `${this._duration}s` : '' })}>
        <div class="group"><slot @slotchange=${this.#onSlotChange}></slot></div>
        <div class="group clone" aria-hidden="true" inert>${this._clones}</div>
      </div>
    </div>`;
  }
}

if (!customElements.get('ht-marquee')) customElements.define('ht-marquee', HtMarquee);

declare global {
  interface HTMLElementTagNameMap {
    'ht-marquee': HtMarquee;
  }
}
