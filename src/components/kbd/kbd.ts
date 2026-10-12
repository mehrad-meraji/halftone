import { LitElement, css, html } from 'lit';

/**
 * Keyboard shortcut hint. Each key gets its own small keycap (after PostHog's
 * `KeyboardShortcut`).
 *
 * @tag ht-kbd
 * @summary Keyboard shortcut.
 *
 * @slot - Fallback content when `keys` is not set.
 *
 * @csspart key - One keycap.
 */
export class HtKbd extends LitElement {
  static properties = {
    /** Space-separated keys, e.g. `⌘ K` or `Ctrl Shift P`. Each becomes its own keycap. */
    keys: {},
  };

  declare keys: string;

  constructor() {
    super();
    this.keys = '';
  }

  static styles = css`
    :host { display: inline-flex; gap: 2px; vertical-align: middle; }
    .key {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 2px 4px;
      font: 400 0.75rem/1rem var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-bottom-width: 2px;
      border-radius: 4px;
    }
  `;

  render() {
    const keys = this.keys.split(/\s+/).filter(Boolean);
    if (!keys.length) return html`<kbd part="key" class="key"><slot></slot></kbd>`;
    return html`${keys.map((k) => html`<kbd part="key" class="key">${k}</kbd>`)}`;
  }
}

if (!customElements.get('ht-kbd')) customElements.define('ht-kbd', HtKbd);

declare global {
  interface HTMLElementTagNameMap {
    'ht-kbd': HtKbd;
  }
}
