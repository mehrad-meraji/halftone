import { LitElement, css, html, nothing, type TemplateResult } from 'lit';

const ICONS: Record<string, TemplateResult> = {
  info: html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 7.25v3.5M8 5.25v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  success: html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.25 8.25l1.75 1.75 3.5-3.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warning: html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 2.5l6 10.5H2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6.5v3M8 11.25v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  danger: html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 6l4 4m0-4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
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
      --_ic: color-mix(in oklch, var(--ht-success) 80%, black);
    }
    :host([tone='warning']) {
      --_bg: color-mix(in oklab, var(--ht-warning) 14%, var(--ht-surface));
      --_bd: color-mix(in oklab, var(--ht-warning) 50%, var(--ht-surface));
      --_ic: color-mix(in oklch, var(--ht-warning) 55%, black);
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
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
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
