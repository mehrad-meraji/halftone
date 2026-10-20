import { LitElement, css, html } from 'lit';

const INBOX = html`<svg width="28" height="28" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,16V152H180.28a16,16,0,0,0-14.31,8.85L158.06,176H97.94l-7.91-15.15A16,16,0,0,0,75.72,152H32V64ZM32,192V168H75.72L83.63,183.15A16,16,0,0,0,97.94,192Zm192,0H158.06a16,16,0,0,0,14.31-8.85L180.28,168H224v24Z"/></svg>`;
const ALERT = html`<svg width="28" height="28" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"/></svg>`;

/**
 * Tells someone why a list, table or page has nothing to show and what to do next. A graphic sits
 * on a halftone stage: the dot screen fades out around it, and the text stays on a plain surface.
 * Use one primary action. In the `error` tone there is no stage and the default graphic is the
 * alert icon, because an error should not be playful.
 *
 * @tag ht-empty-state
 * @summary Empty or error state.
 *
 * @slot - Description, when you do not set `description`.
 * @slot title - Replaces the `heading` text.
 * @slot graphic - An icon or small illustration. Decorative: it is hidden from screen readers.
 * @slot actions - One primary button and at most one secondary. Hidden when empty.
 *
 * @csspart base - The whole block.
 * @csspart stage - The area behind the graphic.
 * @csspart heading - The heading.
 * @csspart description - The description.
 * @csspart actions - The actions row.
 */
export class HtEmptyState extends LitElement {
  static properties = {
    /** Short title: say what is missing, or what to do. */
    heading: {},
    /** One or two sentences: why it is empty and the next step. */
    description: {},
    /** `error` drops the dot stage and uses the alert icon. */
    tone: { reflect: true },
    /** Heading level announced to screen readers, 1 to 6. */
    level: { type: Number },
    _hasActions: { state: true },
  };

  declare heading: string;
  declare description: string;
  declare tone: 'default' | 'error';
  declare level: number;
  declare _hasActions: boolean;

  constructor() {
    super();
    this.heading = '';
    this.description = '';
    this.tone = 'default';
    this.level = 2;
    this._hasActions = false;
  }

  static styles = css`
    :host { display: block; }
    .base {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 40px 24px;
      text-align: center;
      color: var(--ht-text);
      font: 400 0.875rem/1.5 var(--ht-font-ui);
    }
    /* The graphic sits on a dot screen that fades to nothing, like a halftone print. */
    .stage {
      position: relative;
      display: grid;
      place-items: center;
      width: 144px;
      height: 144px;
    }
    .dots {
      position: absolute;
      inset: -28px;
      background: var(--ht-halftone-stage);
      -webkit-mask-image: radial-gradient(closest-side, #000 30%, transparent);
      mask-image: radial-gradient(closest-side, #000 30%, transparent);
      animation: stage-in var(--ht-duration-in) var(--ht-ease-spring) backwards;
    }
    @keyframes stage-in { from { opacity: 0; transform: scale(0.85); } }
    :host([tone='error']) .dots { display: none; }
    .graphic {
      position: relative;
      display: grid;
      place-items: center;
      width: 64px;
      height: 64px;
      color: var(--ht-accent-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-sm);
    }
    :host([tone='error']) .graphic { color: var(--ht-danger-text); background: var(--ht-danger-soft); border-color: transparent; box-shadow: none; }
    ::slotted([slot='graphic']) { width: 28px; height: 28px; }
    .text { display: flex; flex-direction: column; gap: 6px; max-width: 28rem; }
    .heading { font: 600 1.125rem/1.3 var(--ht-font-display); letter-spacing: 0.01em; }
    .description { margin: 0; color: var(--ht-text-muted); }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    [hidden] { display: none !important; }
    @media (prefers-reduced-motion: reduce) { .dots { animation: none; } }
  `;

  render() {
    return html`
      <div part="base" class="base">
        <div part="stage" class="stage">
          <span class="dots"></span>
          <span class="graphic" aria-hidden="true"><slot name="graphic">${this.tone === 'error' ? ALERT : INBOX}</slot></span>
        </div>
        <div class="text">
          <div part="heading" class="heading" role="heading" aria-level=${this.level}><slot name="title">${this.heading}</slot></div>
          <p part="description" class="description">${this.description || html`<slot></slot>`}</p>
        </div>
        <div part="actions" class="actions" ?hidden=${!this._hasActions}>
          <slot name="actions" @slotchange=${(e: Event) => (this._hasActions = (e.target as HTMLSlotElement).assignedElements().length > 0)}></slot>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('ht-empty-state')) customElements.define('ht-empty-state', HtEmptyState);

declare global {
  interface HTMLElementTagNameMap {
    'ht-empty-state': HtEmptyState;
  }
}
