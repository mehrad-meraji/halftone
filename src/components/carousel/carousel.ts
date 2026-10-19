import { LitElement, css, html, svg } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

const CARET = svg`<path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>`;

/**
 * A row of slides that scrolls sideways and snaps to each one, with previous and next buttons and
 * optional dots. Scrolling is native, so touch, trackpad and wheel work as usual. Follows the
 * WAI-ARIA carousel pattern: the host is a named region, and each `ht-carousel-item` announces
 * itself as "slide N of M".
 *
 * It never moves on its own. Name it with `label`. Arrow keys, Home and End on the slide area move
 * between slides. Make slides narrower than the area (to show several at once) with
 * `--ht-carousel-item-size`.
 *
 * @tag ht-carousel
 * @summary Snapping sideways slider with arrows and dots.
 *
 * @slot - `ht-carousel-item` elements.
 *
 * @fires change - The visible slide changed, by any cause. Read `index` from the host.
 *
 * @csspart viewport - The scrolling slide area.
 * @csspart controls - The row with the buttons and dots.
 * @csspart prev - The previous button.
 * @csspart next - The next button.
 * @csspart dots - The dots wrapper.
 * @csspart dot - One dot.
 *
 * @cssprop [--ht-carousel-gap=16px] - Space between slides.
 * @cssprop [--ht-carousel-item-size=100%] - Width of each slide, as a share of the slide area.
 */
export class HtCarousel extends LitElement {
  static properties = {
    /** Accessible name of the carousel, such as `Customer stories`. */
    label: {},
    /** Shows one dot per slide. */
    dots: { type: Boolean, reflect: true },
    _index: { state: true },
    _atStart: { state: true },
    _atEnd: { state: true },
    _count: { state: true },
  };

  declare label: string;
  declare dots: boolean;
  declare _index: number;
  declare _atStart: boolean;
  declare _atEnd: boolean;
  declare _count: number;

  #io?: IntersectionObserver;
  #visible = new Set<number>();
  #items: HtCarouselItem[] = [];

  constructor() {
    super();
    this.label = '';
    this.dots = false;
    this._index = 0;
    this._atStart = true;
    this._atEnd = false;
    this._count = 0;
  }

  /** Index of the current slide, from 0. */
  get index() {
    return this._index;
  }

  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }
    .viewport {
      display: flex;
      gap: var(--ht-carousel-gap, 16px);
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      scrollbar-width: none;
      border-radius: var(--ht-radius-lg);
    }
    .viewport::-webkit-scrollbar { display: none; }
    .viewport:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 12px;
    }
    .nav {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 1px solid var(--ht-border-strong);
      border-radius: var(--ht-radius-md);
      background: var(--ht-surface);
      color: var(--ht-text);
      box-shadow: var(--ht-shadow-xs);
      cursor: pointer;
      transition: background var(--ht-duration) var(--ht-ease);
    }
    .nav:hover:not(:disabled) { background: var(--ht-surface-muted); }
    .nav:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    .nav:disabled { color: var(--ht-text-subtle); box-shadow: none; cursor: not-allowed; }
    .prev svg { transform: scaleX(-1); }
    .dots { display: flex; align-items: center; gap: 2px; }
    /* The button is the 24px hit area; the visible dot is drawn inside it. */
    .dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
    }
    .dot::before {
      content: '';
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--ht-border-input);
      transition: background var(--ht-duration) var(--ht-ease), transform var(--ht-duration) var(--ht-ease);
    }
    .dot:hover::before { background: var(--ht-text-muted); }
    .dot[aria-current='true']::before { background: var(--ht-accent); transform: scale(1.25); }
    .dot:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 0; }
    @media (prefers-reduced-motion: reduce) {
      .viewport { scroll-behavior: auto; }
      .dot::before, .nav { transition: none; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', 'carousel');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#io?.disconnect();
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('label')) {
      if (this.label) this.setAttribute('aria-label', this.label);
      else this.removeAttribute('aria-label');
    }
  }

  get #viewport() {
    return this.renderRoot.querySelector<HTMLElement>('.viewport');
  }

  #collect = () => {
    this.#items = [...this.children].filter((c): c is HtCarouselItem => c.localName === 'ht-carousel-item');
    this.#items.forEach((it, i) => {
      it._pos = i + 1;
      it._total = this.#items.length;
    });
    this._count = this.#items.length;
    this.#visible.clear();
    this.#io?.disconnect();
    const root = this.#viewport;
    if (!root) return;
    // A slide counts as visible when at least half of it is in the slide area.
    this.#io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = this.#items.indexOf(e.target as HtCarouselItem);
          if (e.isIntersecting) this.#visible.add(i);
          else this.#visible.delete(i);
        }
        this.#sync();
      },
      { root, threshold: 0.5 },
    );
    this.#items.forEach((it) => this.#io!.observe(it));
    this.#sync();
  };

  /** Reads the scroll position: which slide is current, and whether either end is reached. */
  #sync = () => {
    const vp = this.#viewport;
    if (!vp || !this.#items.length) return;
    const atStart = vp.scrollLeft <= 1;
    const atEnd = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 1;
    const first = this.#visible.size ? Math.min(...this.#visible) : this._index;
    const index = atEnd ? this.#items.length - 1 : atStart ? 0 : first;
    this._atStart = atStart;
    this._atEnd = atEnd;
    if (index !== this._index) {
      this._index = index;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  /** Scrolls so that slide `i` (from 0) is at the start. Slides at the very end stop where the scroll ends. */
  goTo(i: number) {
    const vp = this.#viewport;
    const item = this.#items[Math.max(0, Math.min(this.#items.length - 1, i))];
    if (!vp || !item) return;
    const left = vp.scrollLeft + item.getBoundingClientRect().left - vp.getBoundingClientRect().left;
    vp.scrollTo({ left, behavior: 'auto' }); // `auto` defers to CSS scroll-behavior, which reduced motion turns off.
  }

  /** Goes to the next slide. */
  next() {
    this.goTo(this._index + 1);
  }

  /** Goes to the previous slide. */
  prev() {
    this.goTo(this._index - 1);
  }

  #onKeydown = (e: KeyboardEvent) => {
    if (e.target !== this.#viewport) return;
    const keys: Record<string, () => void> = {
      ArrowRight: () => this.next(),
      ArrowLeft: () => this.prev(),
      Home: () => this.goTo(0),
      End: () => this.goTo(this.#items.length - 1),
    };
    const act = keys[e.key];
    if (!act) return;
    e.preventDefault();
    act();
  };

  render() {
    return html`
      <div
        part="viewport"
        class="viewport"
        role="group"
        aria-label=${this.label ? `${this.label}, slides` : 'Slides'}
        tabindex="0"
        @scroll=${this.#sync}
        @keydown=${this.#onKeydown}
      ><slot @slotchange=${this.#collect}></slot></div>
      <div part="controls" class="controls">
        <button part="prev" class="nav prev" type="button" aria-label="Previous slide" ?disabled=${this._atStart} @click=${() => this.prev()}>
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${CARET}</svg>
        </button>
        ${this.dots
          ? html`<div part="dots" class="dots">${Array.from({ length: this._count }, (_, i) => html`<button
              part="dot"
              class="dot"
              type="button"
              aria-label=${`Slide ${i + 1}`}
              aria-current=${i === this._index ? 'true' : 'false'}
              @click=${() => this.goTo(i)}
            ></button>`)}</div>`
          : ''}
        <button part="next" class="nav" type="button" aria-label="Next slide" ?disabled=${this._atEnd} @click=${() => this.next()}>
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${CARET}</svg>
        </button>
      </div>`;
  }
}

/**
 * One slide of an `ht-carousel`. It snaps to the start of the slide area and announces itself as
 * "N of M". Put any content inside.
 *
 * @tag ht-carousel-item
 * @summary One slide in a carousel.
 *
 * @slot - Slide content.
 */
export class HtCarouselItem extends LitElement {
  static properties = {
    /** @internal Position from 1, set by the carousel. */
    _pos: { state: true },
    /** @internal Slide count, set by the carousel. */
    _total: { state: true },
  };

  declare _pos: number;
  declare _total: number;

  constructor() {
    super();
    this._pos = 0;
    this._total = 0;
  }

  static styles = css`
    :host {
      display: block;
      flex: 0 0 var(--ht-carousel-item-size, 100%);
      min-width: 0;
      scroll-snap-align: start;
    }
    :host([hidden]) { display: none; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'group');
    this.setAttribute('aria-roledescription', 'slide');
  }

  willUpdate() {
    if (this._pos) this.setAttribute('aria-label', `${this._pos} of ${this._total}`);
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('ht-carousel')) customElements.define('ht-carousel', HtCarousel);
if (!customElements.get('ht-carousel-item')) customElements.define('ht-carousel-item', HtCarouselItem);

declare global {
  interface HTMLElementTagNameMap {
    'ht-carousel': HtCarousel;
    'ht-carousel-item': HtCarouselItem;
  }
}
