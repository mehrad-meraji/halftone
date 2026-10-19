import { LitElement, css, html } from 'lit';

/**
 * A small status dot with a ring that pulses outward. A dot is only colour, so its meaning must
 * travel in text: put the dot next to a visible label, or give it a `label` so it is announced as an
 * image. Without a `label` it is hidden from assistive technology.
 *
 * @tag ht-ping
 * @summary Pulsing status dot.
 *
 * @csspart dot - The solid dot.
 * @csspart ring - The ring that pulses outward.
 */
export class HtPing extends LitElement {
  static properties = {
    /** Colour. `neutral` is the default. */
    tone: { reflect: true },
    /** Dot diameter: sm 8px, md 10px, lg 12px. */
    size: { reflect: true },
    /** Turns the pulse off and leaves a plain dot. */
    still: { type: Boolean, reflect: true },
    /** Accessible name, such as `Online`. Without it the dot is decorative and hidden from assistive technology. */
    label: {},
  };

  declare tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  declare size: 'sm' | 'md' | 'lg';
  declare still: boolean;
  declare label: string;

  constructor() {
    super();
    this.tone = 'neutral';
    this.size = 'md';
    this.still = false;
    this.label = '';
  }

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      flex: none;
      vertical-align: middle;
      width: var(--_s);
      height: var(--_s);
      --_s: 0.625rem;
      --_c: var(--ht-text-subtle);
    }
    :host([hidden]) { display: none; }
    :host([size='sm']) { --_s: 0.5rem; }
    :host([size='lg']) { --_s: 0.75rem; }
    :host([tone='accent']) { --_c: var(--ht-accent); }
    :host([tone='success']) { --_c: var(--ht-success); }
    :host([tone='danger']) { --_c: var(--ht-danger); }
    :host([tone='info']) { --_c: var(--ht-info); }
    /* Amber is the palest tone, so it is mixed toward the text colour (in oklab, so the hue holds in both themes). */
    :host([tone='warning']) { --_c: color-mix(in oklab, var(--ht-warning) 78%, var(--ht-text)); }
    .dot, .ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--_c);
    }
    .ring { opacity: 0; }
    @media (prefers-reduced-motion: no-preference) {
      :host(:not([still])) .ring { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
    }
    @keyframes ping {
      0% { transform: scale(1); opacity: 0.55; }
      75%, 100% { transform: scale(2.6); opacity: 0; }
    }
  `;

  willUpdate() {
    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
      this.removeAttribute('aria-hidden');
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
    }
  }

  render() {
    return html`<span part="ring" class="ring"></span><span part="dot" class="dot"></span>`;
  }
}

if (!customElements.get('ht-ping')) customElements.define('ht-ping', HtPing);

declare global {
  interface HTMLElementTagNameMap {
    'ht-ping': HtPing;
  }
}
