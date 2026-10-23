import { LitElement, css, html } from 'lit';

/**
 * Surface for grouping related content. Optional header strip (with the halftone dot
 * screen) and footer.
 *
 * The heading is announced at `level` (default 3). Set it to fit the page outline, e.g.
 * `level="2"` for cards right under the page title. The header and footer strips are
 * plain boxes, not `<header>` / `<footer>`, so a page of cards adds no landmarks.
 *
 * @tag ht-card
 * @summary Content container.
 *
 * @slot - Card body.
 * @slot header - Replaces the `eyebrow` / `heading` header. Bring your own heading
 *   element; `level` does not apply to slotted content.
 * @slot actions - Right side of the header, e.g. a menu button.
 * @slot footer - Footer strip. Hidden when empty.
 *
 * @csspart base - The card box.
 * @csspart header - The header strip.
 * @csspart body - The body wrapper.
 * @csspart footer - The footer strip.
 */
export class HtCard extends LitElement {
  static properties = {
    /** Small uppercase mono label above the heading. */
    eyebrow: {},
    /** Heading text. Use the `header` slot for anything richer. */
    heading: {},
    /** Heading level announced to screen readers, 1 to 6. Values outside fall back to 3. */
    level: { type: Number },
    /** `muted` drops the shadow and tints the surface. */
    variant: { reflect: true },
    /** Adds hover feedback. Use when the whole card is a click target. */
    interactive: { type: Boolean, reflect: true },
    _slots: { state: true },
  };

  declare eyebrow: string;
  declare heading: string;
  declare level: number;
  declare variant: 'default' | 'muted';
  declare interactive: boolean;
  declare _slots: Set<string>;

  constructor() {
    super();
    this.eyebrow = '';
    this.heading = '';
    this.level = 3;
    this.variant = 'default';
    this.interactive = false;
    this._slots = new Set();
  }

  static styles = css`
    :host { display: block; }
    .card {
      overflow: hidden;
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-md);
      box-shadow: var(--ht-shadow-xs);
      transition: border-color var(--ht-duration) var(--ht-ease), box-shadow var(--ht-duration) var(--ht-ease);
    }
    :host([variant='muted']) .card { background: var(--ht-surface-muted); box-shadow: none; }
    :host([interactive]) .card { cursor: pointer; }
    :host([interactive]) .card:hover { border-color: var(--ht-border-strong); box-shadow: var(--ht-shadow-sm); }
    :host([interactive]) .card:focus-within { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: var(--ht-halftone), var(--ht-surface-muted);
      border-bottom: 1px solid var(--ht-border);
    }
    .titles { min-width: 0; }
    .eyebrow {
      display: block;
      margin-bottom: 2px;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }
    .heading {
      margin: 0;
      font: 600 1rem/1.25 var(--ht-font-display);
      letter-spacing: 0.01em;
    }
    .body { padding: 16px; font: 400 0.875rem/1.5 var(--ht-font-ui); }
    .footer {
      padding: 10px 16px;
      background: var(--ht-surface-muted);
      border-top: 1px solid var(--ht-border);
    }
    [hidden] { display: none !important; }
  `;

  #track = (name: string) => (e: Event) => {
    const has = (e.target as HTMLSlotElement).assignedNodes().length > 0;
    if (has === this._slots.has(name)) return;
    const next = new Set(this._slots);
    has ? next.add(name) : next.delete(name);
    this._slots = next;
  };

  render() {
    const hasHeader = !!(this.eyebrow || this.heading) || this._slots.has('header');
    const level = Number.isInteger(this.level) && this.level >= 1 && this.level <= 6 ? this.level : 3;
    return html`
      <div part="base" class="card">
        <div part="header" class="header" ?hidden=${!hasHeader}>
          <div class="titles">
            <slot name="header" @slotchange=${this.#track('header')}>
              ${this.eyebrow ? html`<span class="eyebrow">${this.eyebrow}</span>` : ''}
              ${this.heading ? html`<div class="heading" role="heading" aria-level=${level}>${this.heading}</div>` : ''}
            </slot>
          </div>
          <slot name="actions"></slot>
        </div>
        <div part="body" class="body"><slot></slot></div>
        <div part="footer" class="footer" ?hidden=${!this._slots.has('footer')}>
          <slot name="footer" @slotchange=${this.#track('footer')}></slot>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('ht-card')) customElements.define('ht-card', HtCard);

declare global {
  interface HTMLElementTagNameMap {
    'ht-card': HtCard;
  }
}
