import { LitElement, css, html, nothing } from 'lit';

/**
 * Comic-style message bubble with a tail. Good for chat, annotations and agent output.
 *
 * @tag ht-speech-bubble
 * @summary Message bubble.
 *
 * @slot - Bubble content.
 *
 * @csspart base - The bubble.
 * @csspart author - The author label.
 */
export class HtSpeechBubble extends LitElement {
  static properties = {
    /** Where the tail sits. */
    tail: { reflect: true },
    /** `speech` is a solid bubble, `thought` has a dotted tail, `whisper` is dashed. */
    variant: { reflect: true },
    /** Colour treatment. */
    tone: { reflect: true },
    /** Optional speaker label in small uppercase mono. */
    author: {},
  };

  declare tail: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left' | 'right' | 'none';
  declare variant: 'speech' | 'thought' | 'whisper';
  declare tone: 'neutral' | 'accent' | 'danger';
  declare author: string;

  constructor() {
    super();
    this.tail = 'bottom-left';
    this.variant = 'speech';
    this.tone = 'neutral';
    this.author = '';
  }

  static styles = css`
    :host {
      display: inline-block;
      max-width: 100%;
      --_bg: var(--ht-surface);
      --_bd: var(--ht-border-strong);
      --_fg: var(--ht-text);
      --_gap: 10px;
    }
    :host([tone='accent']) { --_bg: var(--ht-accent-soft); --_bd: var(--ht-accent); --_fg: var(--ht-text); }
    :host([tone='danger']) { --_bg: var(--ht-danger-soft); --_bd: var(--ht-danger); --_fg: var(--ht-text); }
    :host([tail^='bottom']) { margin-bottom: var(--_gap); }
    :host([tail^='top']) { margin-top: var(--_gap); }
    :host([tail='left']) { margin-left: var(--_gap); }
    :host([tail='right']) { margin-right: var(--_gap); }

    .bubble {
      position: relative;
      box-sizing: border-box;
      padding: 10px 14px;
      font: 400 0.875rem/1.45 var(--ht-font-ui);
      color: var(--_fg);
      background: var(--_bg);
      border: 1.5px solid var(--_bd);
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-xs);
    }
    :host([variant='whisper']) .bubble { border-style: dashed; color: var(--ht-text-muted); box-shadow: none; }
    :host([variant='thought']) .bubble { border-radius: 24px; padding-inline: 18px; }

    .author {
      display: block;
      margin-bottom: 3px;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }

    /* Speech and whisper: a rotated square carrying the border on its two outer sides. */
    .bubble::after {
      content: '';
      position: absolute;
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      background: var(--_bg);
      border: 1.5px solid var(--_bd);
      transform: rotate(45deg);
    }
    :host([variant='whisper']) .bubble::after { border-style: dashed; }
    :host([tail='none']) .bubble::after,
    :host([tail='none']) .bubble::before { display: none; }

    :host([tail='bottom-left']) .bubble::after { bottom: -7px; left: 20px; border-width: 0 1.5px 1.5px 0; }
    :host([tail='bottom-right']) .bubble::after { bottom: -7px; right: 20px; border-width: 0 1.5px 1.5px 0; }
    :host([tail='top-left']) .bubble::after { top: -7px; left: 20px; border-width: 1.5px 0 0 1.5px; }
    :host([tail='top-right']) .bubble::after { top: -7px; right: 20px; border-width: 1.5px 0 0 1.5px; }
    :host([tail='left']) .bubble::after { left: -7px; top: 14px; border-width: 0 0 1.5px 1.5px; }
    :host([tail='right']) .bubble::after { right: -7px; top: 14px; border-width: 1.5px 1.5px 0 0; }

    /* Thought: two shrinking circles instead of a spike. */
    :host([variant='thought']) .bubble::after,
    :host([variant='thought']) .bubble::before {
      content: '';
      position: absolute;
      box-sizing: border-box;
      background: var(--_bg);
      border: 1.5px solid var(--_bd);
      border-radius: 50%;
      transform: none;
    }
    :host([variant='thought']) .bubble::after { width: 10px; height: 10px; }
    :host([variant='thought']) .bubble::before { width: 6px; height: 6px; }
    :host([variant='thought'][tail$='-left']) .bubble::after { left: 22px; }
    :host([variant='thought'][tail$='-left']) .bubble::before { left: 14px; }
    :host([variant='thought'][tail$='-right']) .bubble::after { right: 22px; left: auto; }
    :host([variant='thought'][tail$='-right']) .bubble::before { right: 14px; left: auto; }
    :host([variant='thought'][tail^='bottom']) .bubble::after { bottom: -14px; border-width: 1.5px; }
    :host([variant='thought'][tail^='bottom']) .bubble::before { bottom: -22px; }
    :host([variant='thought'][tail^='top']) .bubble::after { top: -14px; border-width: 1.5px; }
    :host([variant='thought'][tail^='top']) .bubble::before { top: -22px; }
    :host([variant='thought'][tail^='bottom']),
    :host([variant='thought'][tail^='top']) { --_gap: 22px; }
    :host([variant='thought'][tail='left']) .bubble::after { left: -14px; top: 16px; border-width: 1.5px; }
    :host([variant='thought'][tail='left']) .bubble::before { left: -22px; top: 22px; }
    :host([variant='thought'][tail='right']) .bubble::after { right: -14px; top: 16px; border-width: 1.5px; }
    :host([variant='thought'][tail='right']) .bubble::before { right: -22px; top: 22px; }
    :host([variant='thought'][tail='left']),
    :host([variant='thought'][tail='right']) { --_gap: 22px; }
  `;

  render() {
    return html`<div part="base" class="bubble">
      ${this.author ? html`<span part="author" class="author">${this.author}</span>` : nothing}
      <slot></slot>
    </div>`;
  }
}

if (!customElements.get('ht-speech-bubble')) customElements.define('ht-speech-bubble', HtSpeechBubble);

declare global {
  interface HTMLElementTagNameMap {
    'ht-speech-bubble': HtSpeechBubble;
  }
}
