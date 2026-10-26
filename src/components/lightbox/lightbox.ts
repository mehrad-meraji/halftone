import { LitElement, css, html, nothing, svg } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

const CLOSE = svg`<path d="M4 4l8 8M12 4l-8 8"></path>`;
const PREV = svg`<path d="M10 3L5 8l5 5"></path>`;
const NEXT = svg`<path d="M6 3l5 5-5 5"></path>`;

interface LightboxItem {
  src: string;
  srcset: string;
  sizes: string;
  alt: string;
  name: string;
}

/** The element that has focus, looking inside shadow roots. */
function deepActiveElement(): HTMLElement | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el instanceof HTMLElement && el !== document.body ? el : null;
}

/**
 * Full-viewport image viewer over a dark scrim, with a filmstrip of thumbnails at the foot.
 *
 * The set is the host's light-DOM `img` children: their `src` (and `srcset`, `sizes`), `alt`, and
 * `data-name` for the caption. The children stay hidden; the viewer shows copies, and follows when
 * images are added, removed or changed.
 *
 * Built on the native `<dialog>` with `showModal()`, so focus stays inside, Escape closes and it sits
 * in the top layer. A click on the scrim closes it (a click on the image or a control does not).
 * Focus goes back to the element that had it before opening. Left and Right move to the previous and
 * next image (wrapping at the ends), Home and End jump to the first and last. The filmstrip and the
 * previous and next buttons are hidden when there is one image.
 *
 * The scrim is dark in both themes, like the `ht-dialog` backdrop, so the controls on it use a fixed
 * light ink rather than theme tokens.
 *
 * @tag ht-lightbox
 * @summary Full-screen image viewer with a filmstrip.
 *
 * @slot - `img` elements: the set. Not rendered in place.
 *
 * @csspart dialog - The native `<dialog>`, which is also the scrim.
 * @csspart close - The close button.
 * @csspart prev - The previous button.
 * @csspart next - The next button.
 * @csspart stage - The area that holds the current image.
 * @csspart image - The current image.
 * @csspart caption - The caption: the image's name and "2 of 4".
 * @csspart filmstrip - The row of thumbnail buttons.
 * @csspart thumb - One thumbnail button.
 *
 * @fires change - The current image changed by the user (arrow keys, buttons, thumbnails). `detail: { index }`. Not fired when `index` is set from code or by `show()`.
 * @fires ht-close - The lightbox closed, by any route (Escape, scrim, close button, `close()`, `open = false`).
 */
export class HtLightbox extends LitElement {
  static properties = {
    /** Shows the lightbox. Reflects: closing from inside updates it. */
    open: { type: Boolean, reflect: true },
    /** Index of the current image, from 0. Out-of-range values show the nearest image. */
    index: { type: Number, reflect: true },
    /** Accessible name of the viewer, such as `Task images`. */
    label: {},
    _items: { state: true },
  };

  declare open: boolean;
  declare index: number;
  declare label: string;
  declare _items: LightboxItem[];

  #mo?: MutationObserver;
  #opener: HTMLElement | null = null;
  #downOnScrim = false;

  constructor() {
    super();
    this.open = false;
    this.index = 0;
    this.label = 'Images';
    this._items = [];
  }

  static styles = css`
    :host { display: contents; }
    dialog {
      /* The scrim and the ink on it are fixed in both themes, as in ht-dialog. */
      --_scrim: oklch(0.12 0.02 295 / 0.88);
      --_ink: oklch(0.97 0.003 278);
      --_ink-soft: oklch(0.97 0.003 278 / 0.72);
      --_line: oklch(1 0 0 / 0.16);
      --_fill: oklch(1 0 0 / 0.1);
      --_fill-hover: oklch(1 0 0 / 0.18);
      /* The dark-theme focus colour: the light-theme one is too dark on the scrim. */
      --_ring: oklch(0.75 0.113 273);
      box-sizing: border-box;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      overflow: hidden;
      color: var(--_ink);
      background: var(--_scrim);
      border: 0;
      font-family: var(--ht-font-ui);
      -webkit-backdrop-filter: blur(3px);
      backdrop-filter: blur(3px);
    }
    dialog::backdrop { background: transparent; }
    dialog[open] {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: 56px minmax(0, 1fr) auto auto;
    }
    /*
     * Motion, as ht-dialog: the scrim fades in and the image scales in with a small overshoot.
     * \`overlay\` and \`display\` are transitioned so the exit plays before the dialog leaves the top layer.
     */
    dialog {
      opacity: 0;
      transition:
        opacity var(--ht-duration-out) ease-in,
        overlay var(--ht-duration-out) allow-discrete,
        display var(--ht-duration-out) allow-discrete;
    }
    dialog[open] { opacity: 1; transition-duration: var(--ht-duration-in); transition-timing-function: var(--ht-ease); }
    .stage img { transform: scale(0.96); transition: transform var(--ht-duration-out) ease-in; }
    dialog[open] .stage img { transform: none; transition: transform var(--ht-duration-in) var(--ht-ease-spring); }
    @starting-style {
      dialog[open] { opacity: 0; }
      dialog[open] .stage img { transform: scale(0.96); }
    }
    @media (prefers-reduced-motion: reduce) {
      dialog, dialog[open], .stage img, dialog[open] .stage img, .thumb { transition: none; }
      .stage img, dialog[open] .stage img { transform: none; }
    }

    .btn {
      appearance: none;
      position: relative;
      z-index: 1;
      display: inline-grid;
      place-items: center;
      box-sizing: border-box;
      width: 32px;
      height: 32px;
      margin: 0;
      padding: 0;
      color: inherit;
      background: var(--_fill);
      border: 1px solid var(--_line);
      border-radius: var(--ht-radius-md);
      cursor: pointer;
      transition: background var(--ht-duration) var(--ht-ease);
    }
    .btn:hover { background: var(--_fill-hover); }
    .btn:focus-visible { outline: 2px solid var(--_ring); outline-offset: 2px; }
    .btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .close { grid-area: 1 / 1; justify-self: end; align-self: start; margin: 12px 12px 0 0; }
    .nav { grid-area: 2 / 1; align-self: center; }
    .prev { justify-self: start; margin-left: 8px; }
    .next { justify-self: end; margin-right: 8px; }

    .stage {
      grid-area: 2 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      min-height: 0;
      padding: 0 16px;
    }
    .stage.has-nav { padding: 0 48px; }
    .stage img {
      display: block;
      min-width: 0;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: var(--ht-radius-sm);
      box-shadow: var(--ht-shadow-md);
    }

    .cap {
      grid-area: 3 / 1;
      margin: 12px 16px 0;
      text-align: center;
      font: 400 0.6875rem/1.4 var(--ht-font-mono);
      color: var(--_ink-soft);
      overflow-wrap: anywhere;
    }
    .cap.last { margin-bottom: 24px; }

    .thumbs {
      grid-area: 4 / 1;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      padding: 16px 16px 28px;
    }
    .thumbs::-webkit-scrollbar { display: none; }
    /* Centred while it fits, scrolls from the start when it does not (safe centring). */
    .thumb:first-child { margin-inline-start: auto; }
    .thumb:last-child { margin-inline-end: auto; }
    .thumb {
      appearance: none;
      flex: none;
      box-sizing: border-box;
      width: 52px;
      height: 34px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: var(--_fill);
      border: 1px solid var(--_line);
      border-radius: var(--ht-radius-sm);
      opacity: 0.5;
      cursor: pointer;
      transition: opacity var(--ht-duration) var(--ht-ease);
    }
    .thumb:hover { opacity: 0.8; }
    .thumb[aria-current='true'] { opacity: 1; outline: 2px solid var(--_ink); outline-offset: 2px; }
    .thumb:focus-visible { opacity: 1; outline: 2px solid var(--_ring); outline-offset: 2px; }
    .thumb img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }

    [hidden] { display: none !important; }
  `;

  /** Opens the lightbox, at `index` when given. */
  show(index?: number) {
    if (index !== undefined) this.index = index;
    this.open = true;
  }

  /** Closes the lightbox. Focus goes back to the element that opened it. */
  close() {
    this.open = false;
  }

  /** Index actually shown: `index` clamped to the set. */
  get #current() {
    const n = this._items.length;
    if (!n) return 0;
    const i = Math.trunc(Number(this.index) || 0);
    return Math.min(Math.max(i, 0), n - 1);
  }

  get #dialog() {
    return this.renderRoot.querySelector('dialog');
  }

  connectedCallback() {
    super.connectedCallback();
    this.#collect();
    this.#mo = new MutationObserver(() => this.#collect());
    this.#mo.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'sizes', 'alt', 'data-name'],
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#mo?.disconnect();
    this.#dialog?.close();
  }

  #collect() {
    this._items = Array.from(this.children)
      .filter((el): el is HTMLImageElement => el.localName === 'img')
      .map((img) => ({
        src: img.src,
        srcset: img.getAttribute('srcset') ?? '',
        sizes: img.getAttribute('sizes') ?? '',
        alt: img.alt,
        name: img.dataset.name ?? '',
      }));
  }

  updated(changed: Map<string, unknown>) {
    const dialog = this.#dialog;
    if (!dialog) return;
    if (changed.has('open')) {
      if (this.open && !dialog.open) {
        this.#opener = deepActiveElement();
        dialog.showModal();
        this.renderRoot.querySelector<HTMLElement>('.close')?.focus();
      } else if (!this.open && dialog.open) {
        dialog.close();
      }
    }
    if (this.open && (changed.has('index') || changed.has('open') || changed.has('_items'))) this.#revealThumb();
  }

  /** Scrolls the filmstrip so the current thumbnail is in view. */
  #revealThumb() {
    const strip = this.renderRoot.querySelector<HTMLElement>('.thumbs');
    const thumb = this.renderRoot.querySelector<HTMLElement>('.thumb[aria-current="true"]');
    if (!strip || !thumb || strip.hidden) return;
    const pad = 16;
    const s = strip.getBoundingClientRect();
    const t = thumb.getBoundingClientRect();
    const behavior: ScrollBehavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (t.left < s.left + pad) strip.scrollBy({ left: t.left - s.left - pad, behavior });
    else if (t.right > s.right - pad) strip.scrollBy({ left: t.right - s.right + pad, behavior });
  }

  /** Moves to image `i` (wrapping), fires `change`, and keeps focus on the filmstrip when it was there. */
  async #go(i: number, focusThumb = false) {
    const n = this._items.length;
    if (n < 2) return;
    const next = ((i % n) + n) % n;
    if (next !== this.#current) {
      this.index = next;
      this.dispatchEvent(new CustomEvent('change', { detail: { index: next }, bubbles: true, composed: true }));
    }
    if (focusThumb) {
      await this.updateComplete;
      this.renderRoot.querySelector<HTMLElement>('.thumb[aria-current="true"]')?.focus();
    }
  }

  #onKeydown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const n = this._items.length;
    if (n < 2) return;
    const cur = this.#current;
    let i: number;
    switch (e.key) {
      case 'ArrowLeft': i = cur - 1; break;
      case 'ArrowRight': i = cur + 1; break;
      case 'Home': i = 0; break;
      case 'End': i = n - 1; break;
      default: return;
    }
    e.preventDefault();
    const from = e.composedPath()[0] as Element | undefined;
    void this.#go(i, !!from?.classList?.contains('thumb'));
  };

  /** Scrim: the dialog itself and any area marked `data-scrim`, not the image or a control. */
  #isScrim(e: Event) {
    const t = e.composedPath()[0];
    return t instanceof Element && (t.localName === 'dialog' || t.hasAttribute('data-scrim'));
  }

  #onPointerDown = (e: PointerEvent) => {
    this.#downOnScrim = this.#isScrim(e);
  };

  #onClick = (e: MouseEvent) => {
    // A press that started on the image and ended on the scrim is not a scrim click.
    const down = this.#downOnScrim;
    this.#downOnScrim = false;
    if (down && this.#isScrim(e)) this.close();
  };

  #onClose = () => {
    this.open = false;
    this.dispatchEvent(new Event('ht-close', { bubbles: true, composed: true }));
    const opener = this.#opener;
    this.#opener = null;
    if (opener?.isConnected) opener.focus();
  };

  render() {
    const items = this._items;
    const n = items.length;
    const cur = this.#current;
    const item = items[cur];
    const many = n > 1;
    const name = item ? item.name || item.alt : '';
    const count = many ? `${cur + 1} of ${n}` : '';
    const caption = [name, count].filter(Boolean).join(' · ');

    return html`
      <dialog
        part="dialog"
        aria-label=${this.label || 'Images'}
        aria-describedby="cap"
        @keydown=${this.#onKeydown}
        @pointerdown=${this.#onPointerDown}
        @click=${this.#onClick}
        @close=${this.#onClose}
      >
        <button class="btn close" part="close" type="button" aria-label="Close" @click=${() => this.close()}>
          <svg viewBox="0 0 16 16" aria-hidden="true">${CLOSE}</svg>
        </button>
        <button class="btn nav prev" part="prev" type="button" aria-label="Previous image" ?hidden=${!many} @click=${() => this.#go(cur - 1)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">${PREV}</svg>
        </button>
        <button class="btn nav next" part="next" type="button" aria-label="Next image" ?hidden=${!many} @click=${() => this.#go(cur + 1)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">${NEXT}</svg>
        </button>
        <div class="stage ${many ? 'has-nav' : ''}" part="stage" data-scrim>
          ${item
            ? html`<img
                part="image"
                src=${item.src}
                srcset=${ifDefined(item.srcset || undefined)}
                sizes=${ifDefined(item.srcset ? item.sizes || '100vw' : undefined)}
                alt=${item.alt || item.name}
              />`
            : nothing}
        </div>
        <p id="cap" class="cap ${many ? '' : 'last'}" part="caption" data-scrim aria-live="polite" aria-atomic="true" ?hidden=${!caption}>
          <span>${caption}</span>
        </p>
        <div class="thumbs" part="filmstrip" role="group" aria-label="Thumbnails" data-scrim ?hidden=${!many}>
          ${many
            ? items.map(
                (it, i) => html`<button
                  class="thumb"
                  part="thumb"
                  type="button"
                  aria-label=${it.name || it.alt || `Image ${i + 1}`}
                  aria-current=${i === cur ? 'true' : 'false'}
                  tabindex=${i === cur ? '0' : '-1'}
                  @click=${() => this.#go(i, true)}
                >
                  <img src=${it.src} alt="" loading="lazy" draggable="false" />
                </button>`,
              )
            : nothing}
        </div>
      </dialog>
    `;
  }
}

if (!customElements.get('ht-lightbox')) customElements.define('ht-lightbox', HtLightbox);

declare global {
  interface HTMLElementTagNameMap {
    'ht-lightbox': HtLightbox;
  }
}
