import { LitElement, css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

let uid = 0;

/**
 * Segmented tab control: a recessed track with a filled pill on the selected tab, after the
 * Apps / Files / Chat switcher in PostHog's sidebar. Put `ht-tab` children in it, and
 * optionally `ht-tab-panel` children whose `value` matches a tab.
 *
 * Arrow keys move between tabs (Home and End jump to the ends) and select as they go. With
 * `orientation="vertical"` the tabs stack on the left and Up and Down do the moving. With
 * `activation="manual"` the arrows only move focus, and Enter or Space selects.
 *
 * @tag ht-tabs
 * @summary Tab list with optional panels.
 *
 * @slot - `ht-tab` elements (moved into the tab list automatically) and `ht-tab-panel` elements.
 *
 * @csspart list - The tab track.
 *
 * @fires change - The selected tab changed by user action. Read `value` from the host.
 */
export class HtTabs extends LitElement {
  static properties = {
    /** `value` of the selected tab. Defaults to the first enabled tab. */
    value: { reflect: true },
    /** Accessible name for the tab list. */
    label: {},
    /** Shrinks the track to its content instead of filling the width. Horizontal only. */
    fit: { type: Boolean, reflect: true },
    /** `vertical` stacks the tabs in a column beside the panels, and Up and Down move between them. */
    orientation: { reflect: true },
    /** `manual` makes the arrow keys move focus without selecting. Enter or Space selects. */
    activation: { reflect: true },
  };

  declare value: string;
  declare label: string;
  declare fit: boolean;
  declare orientation: 'horizontal' | 'vertical';
  declare activation: 'auto' | 'manual';

  #id = `ht-tabs-${++uid}`;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.fit = false;
    this.orientation = 'horizontal';
    this.activation = 'auto';
    this.addEventListener('click', (e) => {
      const tab = (e.target as Element).closest('ht-tab') as HtTab | null;
      if (tab && !tab.disabled && tab.parentElement === this) this.#choose(tab);
    });
  }

  static styles = css`
    :host { display: block; }
    :host([fit]) { display: inline-block; }
    .list {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: color-mix(in oklab, var(--ht-text) 5%, transparent);
      border-radius: var(--ht-radius-lg);
    }
    :host([fit]) .list { display: inline-flex; }
    :host([fit]) ::slotted(ht-tab) { flex: 0 0 auto; }
    .panels { display: block; }
    :host([orientation='vertical']) { display: flex; align-items: flex-start; gap: 12px; --_tab-justify: flex-start; }
    :host([orientation='vertical'][fit]) { display: flex; }
    :host([orientation='vertical']) .list { flex: none; flex-direction: column; align-items: stretch; }
    :host([orientation='vertical']) ::slotted(ht-tab) { flex: 0 0 auto; }
    :host([orientation='vertical']) ::slotted(ht-tab-panel) { padding-top: 0; }
    :host([orientation='vertical']) .panels { flex: 1; min-width: 0; }
  `;

  #tabs() {
    return [...this.children].filter((c): c is HtTab => c.localName === 'ht-tab');
  }
  #panels() {
    return [...this.children].filter((c): c is HtTabPanel => c.localName === 'ht-tab-panel');
  }

  #sync = () => {
    const tabs = this.#tabs();
    tabs.forEach((t, i) => {
      if (t.slot !== 'tabs') t.slot = 'tabs';
      if (!t.value) t.value = String(i);
      t.id ||= `${this.#id}-tab-${i}`;
    });
    const current = tabs.find((t) => t.value === this.value && !t.disabled) ?? tabs.find((t) => !t.disabled);
    if (current && this.value !== current.value) this.value = current.value;
    for (const t of tabs) {
      t.selected = t === current;
      t.tabIndex = t === current ? 0 : -1;
    }
    for (const p of this.#panels()) {
      const tab = tabs.find((t) => t.value === p.value);
      p.hidden = !tab || tab !== current;
      if (tab) {
        p.setAttribute('aria-labelledby', tab.id);
        p.id ||= `${tab.id}-panel`;
        tab.setAttribute('aria-controls', p.id);
      }
    }
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('value')) this.#sync();
  }

  #choose(tab: HtTab) {
    if (tab.value === this.value) return;
    this.value = tab.value;
    this.#sync();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onKeydown = (e: KeyboardEvent) => {
    const tabs = this.#tabs().filter((t) => !t.disabled);
    const i = tabs.findIndex((t) => t === document.activeElement || t.matches(':focus'));
    if (i < 0) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.#choose(tabs[i]);
      return;
    }
    const vertical = this.orientation === 'vertical';
    let next = -1;
    if (e.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (i + 1) % tabs.length;
    else if (e.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    if (this.activation === 'manual') {
      // Roving tab stop: it follows focus until a tab is chosen.
      for (const t of this.#tabs()) t.tabIndex = t === tabs[next] ? 0 : -1;
    } else {
      this.#choose(tabs[next]);
    }
  };

  render() {
    return html`
      <div
        part="list"
        class="list"
        role="tablist"
        aria-orientation=${this.orientation === 'vertical' ? 'vertical' : 'horizontal'}
        aria-label=${ifDefined(this.label || undefined)}
        @keydown=${this.#onKeydown}
      >
        <slot name="tabs"></slot>
      </div>
      <div class="panels"><slot @slotchange=${this.#sync}></slot></div>
    `;
  }
}

/**
 * One tab inside `ht-tabs`.
 *
 * @tag ht-tab
 * @summary Tab.
 *
 * @slot - Label.
 * @slot prefix - Icon before the label.
 *
 * @csspart base - The tab pill.
 */
export class HtTab extends LitElement {
  static properties = {
    /** Identifier matched by `ht-tabs` `value` and `ht-tab-panel` `value`. Defaults to the tab's index. */
    value: {},
    /** Set by `ht-tabs`. */
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare selected: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.value = '';
    this.selected = false;
    this.disabled = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'tab');
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
  }

  static styles = css`
    :host { display: flex; flex: 1 1 0; min-width: 0; outline: none; }
    .tab {
      box-sizing: border-box;
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: var(--_tab-justify, center);
      gap: 4px;
      min-width: 0;
      height: 30px;
      padding: 4px 6px;
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
      white-space: nowrap;
      color: var(--ht-text);
      cursor: pointer;
      user-select: none;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--ht-radius-md);
      transition: background-color 120ms;
    }
    :host(:hover) .tab { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    :host([selected]) .tab { background: var(--ht-surface); box-shadow: var(--ht-shadow-xs); }
    :host(:focus-visible) .tab { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    :host([disabled]) .tab { opacity: 0.5; cursor: not-allowed; background: transparent; }
    ::slotted([slot='prefix']) { flex: none; width: 16px; height: 16px; }
  `;

  updated() {
    this.setAttribute('aria-selected', String(this.selected));
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  render() {
    return html`<span part="base" class="tab"><slot name="prefix"></slot><slot></slot></span>`;
  }
}

/**
 * Content for one tab. Shown while the tab with the same `value` is selected.
 *
 * @tag ht-tab-panel
 * @summary Tab panel.
 *
 * @slot - Panel content.
 */
export class HtTabPanel extends LitElement {
  static properties = {
    /** `value` of the tab this panel belongs to. */
    value: {},
  };

  declare value: string;

  constructor() {
    super();
    this.value = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'tabpanel');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }

  static styles = css`
    :host { display: block; padding-top: 12px; }
    :host([hidden]) { display: none; }
    :host(:focus-visible) { outline: 2px solid var(--ht-focus); outline-offset: 2px; border-radius: var(--ht-radius-md); }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

for (const [tag, ctor] of [
  ['ht-tabs', HtTabs],
  ['ht-tab', HtTab],
  ['ht-tab-panel', HtTabPanel],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-tabs': HtTabs;
    'ht-tab': HtTab;
    'ht-tab-panel': HtTabPanel;
  }
}

