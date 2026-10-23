import { LitElement, css, html, type TemplateResult } from 'lit';

const icon = (d: string) =>
  html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d=${d} /></svg>`;

const INFO = icon('M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z');
const ICONS: Record<string, TemplateResult> = {
  neutral: INFO,
  info: INFO,
  success: icon('M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z'),
  warning: icon('M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z'),
  danger: icon('M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z'),
};

/**
 * A callout in the style of shadcn/ui's Alert: a bordered card with an icon, a title, a
 * description and an optional action at the top right. It sits in the page and stays there; for a
 * message about something that just happened, use `toast()`. For a one-line bar with a dismiss
 * button, use `ht-banner`.
 *
 * @tag ht-alert
 * @summary Callout for user attention.
 *
 * @slot - The description. Paragraphs and links are fine.
 * @slot title - The title. Or set `heading`.
 * @slot icon - Replaces the tone icon.
 * @slot action - A button or link at the top right, e.g. "Enable".
 *
 * @csspart base - The card.
 * @csspart icon - The icon box.
 * @csspart title - The title line.
 * @csspart description - The description.
 * @csspart action - The box around the action slot.
 */
export class HtAlert extends LitElement {
  static properties = {
    /**
     * `neutral` is the plain card. `info`, `success` and `warning` colour the icon. `danger` (shadcn's
     * `destructive`) colours the text too and is announced assertively.
     */
    tone: { reflect: true },
    /** The title. Use the `title` slot for anything richer. */
    heading: {},
    /** Hides the icon. The text moves to the left edge. */
    noIcon: { type: Boolean, attribute: 'no-icon', reflect: true },
    _hasTitle: { state: true },
    _hasAction: { state: true },
  };

  declare tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  declare heading: string;
  declare noIcon: boolean;
  declare _hasTitle: boolean;
  declare _hasAction: boolean;

  constructor() {
    super();
    this.tone = 'neutral';
    this.heading = '';
    this.noIcon = false;
    this._hasTitle = false;
    this._hasAction = false;
  }

  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }
    :host { --_fg: var(--ht-text); --_muted: var(--ht-text-muted); --_ic: currentColor; }
    :host([tone='info']) { --_ic: color-mix(in oklab, var(--ht-info) 80%, var(--ht-text)); }
    :host([tone='success']) { --_ic: color-mix(in oklab, var(--ht-success) 80%, var(--ht-text)); }
    :host([tone='warning']) { --_ic: color-mix(in oklab, var(--ht-warning) 55%, var(--ht-text)); }
    :host([tone='danger']) {
      --_fg: var(--ht-danger-text);
      --_muted: color-mix(in oklab, var(--ht-danger-text) 90%, var(--ht-surface));
    }
    .alert {
      position: relative;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 16px minmax(0, 1fr);
      align-items: start;
      column-gap: 12px;
      row-gap: 2px;
      width: 100%;
      padding: 12px 16px;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      color: var(--_fg);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-lg);
    }
    :host([no-icon]) .alert { grid-template-columns: 0 minmax(0, 1fr); column-gap: 0; }
    .alert.has-action { grid-template-columns: 16px minmax(0, 1fr) auto; }
    :host([no-icon]) .alert.has-action { grid-template-columns: 0 minmax(0, 1fr) auto; }
    .icon {
      grid-column: 1;
      grid-row: 1 / span 2;
      display: flex;
      width: 16px;
      height: 16px;
      transform: translateY(2px);
      color: var(--_ic);
    }
    .icon[hidden] { display: none; }
    .title {
      grid-column: 2;
      min-height: 16px;
      font: 600 0.9375rem/1.25rem var(--ht-font-display);
    }
    .title[hidden] { display: none; }
    .description {
      grid-column: 2;
      display: grid;
      justify-items: start;
      gap: 4px;
      color: var(--_muted);
    }
    ::slotted(p) { margin: 0; line-height: 1.625; }
    ::slotted(a) { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
    ::slotted(a:hover) { color: var(--ht-text); }
    .action { grid-column: 3; grid-row: 1 / span 2; align-self: start; margin-inline-start: 4px; }
    .action[hidden] { display: none; }
  `;

  #onTitleSlot(e: Event) {
    this._hasTitle = (e.target as HTMLSlotElement).assignedNodes().length > 0;
  }

  #onActionSlot(e: Event) {
    this._hasAction = (e.target as HTMLSlotElement).assignedElements().length > 0;
  }

  render() {
    return html`<div part="base" class="alert ${this._hasAction ? 'has-action' : ''}" role=${this.tone === 'danger' ? 'alert' : 'status'}>
      <span part="icon" class="icon" ?hidden=${this.noIcon}><slot name="icon">${ICONS[this.tone] ?? INFO}</slot></span>
      <div part="title" class="title" ?hidden=${!this.heading && !this._hasTitle}><slot name="title" @slotchange=${this.#onTitleSlot}>${this.heading}</slot></div>
      <div part="description" class="description"><slot></slot></div>
      <div part="action" class="action" ?hidden=${!this._hasAction}><slot name="action" @slotchange=${this.#onActionSlot}></slot></div>
    </div>`;
  }
}

if (!customElements.get('ht-alert')) customElements.define('ht-alert', HtAlert);

declare global {
  interface HTMLElementTagNameMap {
    'ht-alert': HtAlert;
  }
}
