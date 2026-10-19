import { LitElement, css, html, nothing } from 'lit';

/**
 * A 1px rule between groups of content, horizontal or vertical, with an optional centred label
 * ("Or", "Today"). It is a real `separator` by default, like `<hr>`. Set `decorative` when the
 * rule is only ornament and the content around it already has structure.
 *
 * A labelled separator keeps its text readable: the `separator` role sits on the leading line and
 * the label follows as ordinary text, because a separator's own children are not read out.
 *
 * @tag ht-separator
 * @summary Divider line with optional label.
 *
 * @slot - Optional label, centred on the line. Plain text reads best.
 *
 * @csspart base - The row or column holding the lines and the label.
 * @csspart line - Each of the two line segments.
 * @csspart label - The label wrapper.
 */
export class HtSeparator extends LitElement {
  static properties = {
    /** Direction of the rule. A vertical one stretches to the height of a flex or grid row. */
    orientation: { reflect: true },
    /** Removes separator semantics (`role="none"`). For ornament only. */
    decorative: { type: Boolean, reflect: true },
    _hasLabel: { state: true },
  };

  declare orientation: 'horizontal' | 'vertical';
  declare decorative: boolean;
  declare _hasLabel: boolean;

  constructor() {
    super();
    this.orientation = 'horizontal';
    this.decorative = false;
    this._hasLabel = false;
  }

  static styles = css`
    :host { display: block; }
    :host([orientation='vertical']) {
      display: inline-flex;
      align-self: stretch;
      min-height: 1rem;
    }
    .base { display: flex; align-items: center; gap: 12px; width: 100%; }
    :host([orientation='vertical']) .base { flex-direction: column; width: auto; gap: 8px; }
    .line { flex: 1; background: var(--ht-border); }
    :host(:not([orientation='vertical'])) .line { height: 1px; }
    :host([orientation='vertical']) .line { width: 1px; min-height: 0.5rem; }
    .label {
      flex: none;
      font: 400 0.75rem/1.3 var(--ht-font-ui);
      color: var(--ht-text-muted);
    }
    .label[hidden] { display: none; }
  `;

  #onSlot = (e: Event) => {
    this._hasLabel = (e.target as HTMLSlotElement)
      .assignedNodes({ flatten: true })
      .some((n) => n.nodeType === Node.ELEMENT_NODE || !!n.textContent?.trim());
  };

  render() {
    const vertical = this.orientation === 'vertical';
    // Without a label the one line carries the role. With a label it still does, and the text follows it.
    const role = this.decorative ? 'none' : 'separator';
    return html`
      <div part="base" class="base">
        <span
          part="line"
          class="line"
          role=${role}
          aria-orientation=${vertical && !this.decorative ? 'vertical' : nothing}
        ></span>
        <span part="label" class="label" ?hidden=${!this._hasLabel}><slot @slotchange=${this.#onSlot}></slot></span>
        ${this._hasLabel ? html`<span part="line" class="line" aria-hidden="true"></span>` : nothing}
      </div>
    `;
  }
}

if (!customElements.get('ht-separator')) customElements.define('ht-separator', HtSeparator);

declare global {
  interface HTMLElementTagNameMap {
    'ht-separator': HtSeparator;
  }
}
