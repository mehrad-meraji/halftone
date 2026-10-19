import { LitElement, css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * A region that scrolls natively, with thin themed scrollbars and, optionally, a fade at each
 * edge that still has content beyond it. No scrolling is emulated: wheel, touch, keyboard and
 * find-in-page behave as in any scrolling element.
 *
 * The scrolling viewport joins the tab order only while the content overflows, so keyboard
 * users can scroll it with the arrow keys without gaining a pointless tab stop. Name it with
 * `label` or a host `aria-label` (moved to the viewport, which then becomes a `region`).
 *
 * Set the height with `--ht-scroll-area-height` (or give the host a height of its own).
 *
 * @tag ht-scroll-area
 * @summary Native scroll container with themed scrollbars and edge fades.
 *
 * @slot - Scrolling content.
 *
 * @csspart viewport - The scrolling element.
 *
 * @cssprop [--ht-scroll-area-height=none] - Maximum height of the area. The area scrolls vertically once the content is taller.
 * @cssprop [--ht-scroll-area-fade=1.5rem] - Length of the edge fade.
 */
export class HtScrollArea extends LitElement {
  static properties = {
    /** Scroll direction: `vertical` (default), `horizontal`, or `both`. */
    orientation: { reflect: true },
    /** Fades the edges that have more content beyond them. */
    fade: { type: Boolean, reflect: true },
    /** Accessible name. A host `aria-label` is moved here. Makes the viewport a labelled `region`. */
    label: {},
    _tabbable: { state: true },
    _start: { state: true },
    _end: { state: true },
    _left: { state: true },
    _right: { state: true },
  };

  declare orientation: 'vertical' | 'horizontal' | 'both';
  declare fade: boolean;
  declare label: string;
  declare _tabbable: boolean;
  declare _start: boolean;
  declare _end: boolean;
  declare _left: boolean;
  declare _right: boolean;

  #ro?: ResizeObserver;

  constructor() {
    super();
    this.orientation = 'vertical';
    this.fade = false;
    this.label = '';
    this._tabbable = false;
    this._start = false;
    this._end = false;
    this._left = false;
    this._right = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // `aria-label` is not allowed on a generic host; move it to the viewport.
    const al = this.getAttribute('aria-label');
    if (al) {
      if (!this.label) this.label = al;
      this.removeAttribute('aria-label');
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#ro?.disconnect();
    this.#ro = undefined;
  }

  firstUpdated() {
    this.#ro = new ResizeObserver(() => this.#measure());
    const vp = this.renderRoot.querySelector('.viewport');
    const content = this.renderRoot.querySelector('.content');
    if (vp) this.#ro.observe(vp);
    if (content) this.#ro.observe(content);
    this.#measure();
  }

  static styles = css`
    :host {
      display: block;
      min-height: 0;
      --_fade: var(--ht-scroll-area-fade, 1.5rem);
    }
    .frame {
      position: relative;
      height: 100%;
      border-radius: var(--ht-radius-md);
    }
    .frame:has(.viewport:focus-visible) { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    .viewport {
      box-sizing: border-box;
      height: 100%;
      max-height: var(--ht-scroll-area-height, none);
      overflow: hidden;
      border-radius: inherit;
      outline: none;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--ht-border-input) transparent;
    }
    :host([orientation='vertical']) .viewport,
    :host(:not([orientation])) .viewport { overflow-y: auto; }
    :host([orientation='horizontal']) .viewport { overflow-x: auto; }
    :host([orientation='both']) .viewport { overflow: auto; }
    .content { display: flow-root; }
    :host([orientation='horizontal']) .content,
    :host([orientation='both']) .content { width: max-content; min-width: 100%; }

    /* Edge fades: a mask on the viewport, so they work on any background. Only the alpha channel matters. */
    :host([fade]) .viewport {
      --_v1: 0px;
      --_v2: 0px;
      --_h1: 0px;
      --_h2: 0px;
      -webkit-mask-image:
        linear-gradient(to bottom, transparent 0, var(--ht-text) var(--_v1), var(--ht-text) calc(100% - var(--_v2)), transparent 100%),
        linear-gradient(to right, transparent 0, var(--ht-text) var(--_h1), var(--ht-text) calc(100% - var(--_h2)), transparent 100%);
      -webkit-mask-composite: source-in;
      mask-image:
        linear-gradient(to bottom, transparent 0, var(--ht-text) var(--_v1), var(--ht-text) calc(100% - var(--_v2)), transparent 100%),
        linear-gradient(to right, transparent 0, var(--ht-text) var(--_h1), var(--ht-text) calc(100% - var(--_h2)), transparent 100%);
      mask-composite: intersect;
    }
    :host([fade]) .viewport.start { --_v1: var(--_fade); }
    :host([fade]) .viewport.end { --_v2: var(--_fade); }
    :host([fade]) .viewport.left { --_h1: var(--_fade); }
    :host([fade]) .viewport.right { --_h2: var(--_fade); }

    /* Scrollbars: standard properties above; WebKit pseudo-elements for engines without them. */
    @supports not (scrollbar-color: auto) {
      .viewport::-webkit-scrollbar { width: 8px; height: 8px; }
      .viewport::-webkit-scrollbar-track { background: transparent; }
      .viewport::-webkit-scrollbar-thumb {
        background: var(--ht-border-input);
        background-clip: content-box;
        border: 2px solid transparent;
        border-radius: var(--ht-radius-lg);
      }
      .viewport::-webkit-scrollbar-thumb:hover { background: var(--ht-text-subtle); background-clip: content-box; }
      .viewport::-webkit-scrollbar-corner { background: transparent; }
    }
  `;

  #measure = () => {
    const vp = this.renderRoot.querySelector<HTMLElement>('.viewport');
    if (!vp) return;
    const vMax = vp.scrollHeight - vp.clientHeight;
    const hMax = vp.scrollWidth - vp.clientWidth;
    const canV = vMax > 1 && getComputedStyle(vp).overflowY !== 'hidden';
    const canH = hMax > 1 && getComputedStyle(vp).overflowX !== 'hidden';
    this._tabbable = canV || canH;
    this._start = canV && vp.scrollTop > 1;
    this._end = canV && vp.scrollTop < vMax - 1;
    // Horizontal offsets are negative in RTL; use magnitudes so "left" and "right" follow the screen.
    const x = Math.abs(vp.scrollLeft);
    const rtl = vp.scrollLeft < 0;
    this._left = canH && (rtl ? x < hMax - 1 : x > 1);
    this._right = canH && (rtl ? x > 1 : x < hMax - 1);
  };

  render() {
    const labelled = !!this.label;
    return html`
      <div class="frame">
        <div
          part="viewport"
          class="viewport ${this._start ? 'start' : ''} ${this._end ? 'end' : ''} ${this._left ? 'left' : ''} ${this._right ? 'right' : ''}"
          role=${ifDefined(labelled ? 'region' : undefined)}
          aria-label=${ifDefined(labelled ? this.label : undefined)}
          tabindex=${ifDefined(this._tabbable ? '0' : undefined)}
          @scroll=${this.#measure}
        >
          <div class="content"><slot @slotchange=${this.#measure}></slot></div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('ht-scroll-area')) customElements.define('ht-scroll-area', HtScrollArea);

declare global {
  interface HTMLElementTagNameMap {
    'ht-scroll-area': HtScrollArea;
  }
}
