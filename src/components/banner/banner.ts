import { LitElement, css, html, nothing, type TemplateResult } from 'lit';

const ICONS: Record<string, TemplateResult> = {
  info: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"/></svg>`,
  success: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>`,
  warning: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"/></svg>`,
  danger: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>`,
};

/**
 * Inline message bar: an icon, text and an optional action or dismiss button (after
 * PostHog's `LemonBanner`).
 *
 * @tag ht-banner
 * @summary Inline alert.
 *
 * @slot - Message text.
 * @slot action - Action button at the end of the bar.
 * @slot icon - Replaces the default tone icon.
 *
 * @csspart base - The bar.
 *
 * @fires ht-dismiss - The dismiss button was pressed. The banner hides itself unless this is cancelled.
 */
export class HtBanner extends LitElement {
  static properties = {
    /** `info` is neutral. The others tint the bar. `danger` is announced assertively. */
    tone: { reflect: true },
    /** Shows a close button. */
    dismissible: { type: Boolean, reflect: true },
    hidden: { type: Boolean, reflect: true },
  };

  declare tone: 'info' | 'success' | 'warning' | 'danger';
  declare dismissible: boolean;
  declare hidden: boolean;

  constructor() {
    super();
    this.tone = 'info';
    this.dismissible = false;
    this.hidden = false;
  }

  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }
    .bar {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
      padding: 8px;
      font: 500 0.875rem/1.375rem var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--_bg);
      border: 1px solid var(--_bd);
      border-radius: var(--ht-radius-md);
    }
    :host { --_bg: var(--ht-surface); --_bd: var(--ht-border); --_ic: var(--ht-text-muted); }
    :host([tone='success']) {
      --_bg: color-mix(in oklab, var(--ht-success) 10%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-success) 40%, var(--ht-surface));
      --_ic: color-mix(in oklab, var(--ht-success) 80%, var(--ht-text));
    }
    :host([tone='warning']) {
      --_bg: color-mix(in oklab, var(--ht-warning) 14%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-warning) 50%, var(--ht-surface));
      --_ic: color-mix(in oklab, var(--ht-warning) 55%, var(--ht-text));
    }
    :host([tone='danger']) {
      --_bg: var(--ht-danger-soft);
      --_bd: color-mix(in oklab, var(--ht-danger) 45%, var(--ht-surface));
      --_ic: var(--ht-danger-text);
    }
    .icon { display: grid; flex: none; padding-inline: 4px; color: var(--_ic); }
    .content { flex: 1; min-width: 0; }
    .close {
      all: unset;
      display: grid;
      place-items: center;
      flex: none;
      width: 26px;
      height: 26px;
      cursor: pointer;
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-md);
    }
    .close:hover { color: var(--ht-text); background: color-mix(in oklch, var(--ht-text) 7.5%, transparent); }
    .close:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
  `;

  #dismiss = () => {
    const ev = new Event('ht-dismiss', { bubbles: true, composed: true, cancelable: true });
    if (this.dispatchEvent(ev)) this.hidden = true;
  };

  render() {
    return html`<div part="base" class="bar" role=${this.tone === 'danger' ? 'alert' : 'status'}>
      <span class="icon"><slot name="icon">${ICONS[this.tone] ?? ICONS.info}</slot></span>
      <div class="content"><slot></slot></div>
      <slot name="action"></slot>
      ${this.dismissible
        ? html`<button class="close" aria-label="Dismiss" @click=${this.#dismiss}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"/></svg>
          </button>`
        : nothing}
    </div>`;
  }
}

if (!customElements.get('ht-banner')) customElements.define('ht-banner', HtBanner);

declare global {
  interface HTMLElementTagNameMap {
    'ht-banner': HtBanner;
  }
}
