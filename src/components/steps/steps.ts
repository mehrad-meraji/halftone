import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

type StepState = 'upcoming' | 'current' | 'done' | 'error';

const TICK = html`<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/></svg>`;
const BANG = html`<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M116,148V48a12,12,0,0,1,24,0V148a12,12,0,0,1-24,0Zm12,28a18,18,0,1,0,18,18A18,18,0,0,0,128,176Z"/></svg>`;

/**
 * Numbered steps for a wizard header or a setup guide: an ordered list of `ht-step` children,
 * each with a marker (01, 02…) joined to the next by a connector. Markers turn into a tick
 * when the step is done, and connectors after done steps take the accent.
 *
 * Set `current` to the index or `value` of the current step. Steps before it are done and
 * steps after it upcoming, unless a step sets its own `state`. Without `current` the steps
 * are a plain numbered list, which suits a setup guide.
 *
 * `orientation="vertical"` stacks the steps and shows each step's slotted content under its
 * heading, indented past the marker, with the connector running down the side.
 *
 * Horizontal steps that do not fit their width collapse: only the current step keeps its
 * visible label (the others stay readable to screen readers), and if the markers still do
 * not fit the row scrolls sideways. It never widens the page.
 *
 * Steps are not interactive by default: a wizard's own Back and Next buttons drive
 * `current`. With `clickable`, done steps become buttons; add `nonlinear` to make upcoming
 * steps buttons too. The buttons sit in the normal tab order (no roving focus): a step list
 * is a list of links back, not a composite widget, and it rarely has more than a handful.
 *
 * @tag ht-steps
 * @summary Numbered steps for wizards and setup guides.
 *
 * @slot - `ht-step` elements. Steps with `hidden` are skipped and do not take a number.
 *
 * @csspart list - The `<ol>` holding the steps.
 *
 * @fires ht-step-select - A clickable step was chosen. `detail: { index, value }`. Cancelable; unless cancelled, `current` moves to that step.
 */
export class HtSteps extends LitElement {
  static properties = {
    /** Index (0-based) or `value` of the current step. Empty means no step is current. */
    current: { reflect: true },
    /** `horizontal` lays the steps out in a row (a wizard header). `vertical` stacks them and shows their content (a setup guide). */
    orientation: { reflect: true },
    /** Accessible name for the list, such as "Setup steps". `aria-label` on the element is forwarded here. */
    label: {},
    /** Makes done steps buttons that fire `ht-step-select`. */
    clickable: { type: Boolean, reflect: true },
    /** With `clickable`, upcoming steps are buttons too, so steps can be taken in any order. */
    nonlinear: { type: Boolean, reflect: true },
  };

  declare current: string | number | undefined;
  declare orientation: 'horizontal' | 'vertical';
  declare label: string;
  declare clickable: boolean;
  declare nonlinear: boolean;

  #ariaLabel: string | undefined;
  #width = -1;
  #ro?: ResizeObserver;
  #mo = new MutationObserver(() => this.#refresh());

  constructor() {
    super();
    this.orientation = 'horizontal';
    this.label = '';
    this.clickable = false;
    this.nonlinear = false;
    this.addEventListener('click', this.#onClick);
  }

  connectedCallback() {
    super.connectedCallback();
    // `aria-label` is not allowed on a generic host; move it to the list.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
      this.requestUpdate();
    }
    this.#mo.observe(this, { subtree: true, attributes: true, attributeFilter: ['hidden', 'state', 'value', 'disabled'] });
    if (typeof ResizeObserver !== 'undefined') {
      this.#ro = new ResizeObserver(([entry]) => {
        const w = Math.round(entry.contentRect.width);
        if (w === this.#width) return;
        this.#width = w;
        this.#fit();
      });
      this.#ro.observe(this);
    }
    document.fonts?.ready.then(() => this.#fit());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#mo.disconnect();
    this.#ro?.disconnect();
    this.#width = -1;
  }

  static styles = css`
    :host { display: block; min-width: 0; }
    .list {
      box-sizing: border-box;
      display: flex;
      align-items: flex-start;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    :host([orientation='vertical']) .list { flex-direction: column; align-items: stretch; }
    :host(:not([orientation='vertical'])) ::slotted(ht-step) { flex: 1 1 auto; }
    :host(:not([orientation='vertical'])) ::slotted(ht-step[data-last]) { flex: 0 0 auto; }
    /* Narrow: the row overflowed, so labels other than the current one are hidden visually. */
    .list.compact { overflow-x: auto; padding: 4px; }
    .list.compact ::slotted(ht-step) {
      flex-shrink: 0;
      --_ht-step-line-min: 8px;
      --_ht-step-line-gap: 4px;
      --_ht-step-text-position: absolute;
      --_ht-step-text-size: 1px;
      --_ht-step-text-clip: inset(50%);
    }
    .list.compact ::slotted(ht-step[aria-current='step']) {
      flex-shrink: 1;
      min-width: 0;
      --_ht-step-text-position: static;
      --_ht-step-text-size: auto;
      --_ht-step-text-clip: none;
      --_ht-step-extra: none;
      --_ht-step-head-flex: 0 1 auto;
    }
  `;

  #steps() {
    return [...this.children].filter((c): c is HtStep => c.localName === 'ht-step' && !(c as HTMLElement).hidden);
  }

  #currentIndex(steps: HtStep[]) {
    const cur = String(this.current ?? '');
    if (!cur) return -1;
    const byValue = steps.findIndex((s) => s.value === cur);
    if (byValue >= 0) return byValue;
    return /^\d+$/.test(cur) ? Number(cur) : -1;
  }

  #sync() {
    const steps = this.#steps();
    const cur = this.#currentIndex(steps);
    const vertical = this.orientation === 'vertical';
    steps.forEach((s, i) => {
      const status: StepState | '' = s.state || (cur < 0 ? '' : i < cur ? 'done' : i === cur ? 'current' : 'upcoming');
      s._index = i;
      s._status = status;
      s._last = i === steps.length - 1;
      s._vertical = vertical;
      s._interactive = this.clickable && status !== 'current' && (this.nonlinear || status === 'done' || status === 'error' || (cur >= 0 && i < cur));
    });
    for (const c of this.children) {
      if (c.localName === 'ht-step' && (c as HTMLElement).hidden) (c as HtStep)._status = '';
    }
  }

  #refresh = () => {
    this.#sync();
    this.#fit();
  };

  /** Collapse labels when a horizontal row would overflow. Runs before paint (from a resize observer or microtasks). */
  async #fit() {
    const list = this.renderRoot?.querySelector('.list');
    if (!list) return;
    if (this.orientation === 'vertical') {
      list.classList.remove('compact');
      return;
    }
    await Promise.all(this.#steps().map((s) => s.updateComplete));
    list.classList.remove('compact');
    if (list.scrollWidth > list.clientWidth + 1) list.classList.add('compact');
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('current') || changed.has('orientation') || changed.has('clickable') || changed.has('nonlinear')) this.#refresh();
  }

  #onClick = (e: MouseEvent) => {
    const step = (e.target as Element).closest('ht-step') as HtStep | null;
    if (!step || step.parentElement !== this || !step._interactive || step.disabled) return;
    // Only the step's own button counts, not buttons in its slotted content.
    if (!e.composedPath().some((n) => n instanceof HTMLElement && n.dataset.stepHead !== undefined)) return;
    const index = step._index;
    const value = step.value;
    const ok = this.dispatchEvent(
      new CustomEvent('ht-step-select', { bubbles: true, composed: true, cancelable: true, detail: { index, value } }),
    );
    if (!ok) return;
    this.current = value || String(index);
    // The chosen step is now current and no longer a button. Keep keyboard focus on it
    // instead of letting it fall back to the page.
    this.updateComplete
      .then(() => step.updateComplete)
      .then(() => (step.shadowRoot?.querySelector('.head') as HTMLElement | null)?.focus());
  };

  render() {
    return html`<ol
      part="list"
      class="list"
      role="list"
      aria-label=${ifDefined(this.label || this.#ariaLabel || undefined)}
    ><slot @slotchange=${this.#refresh}></slot></ol>`;
  }
}

/**
 * One step inside `ht-steps`. Its number, state and layout are set by the parent.
 *
 * @tag ht-step
 * @summary Step.
 *
 * @slot - Content under the heading: paragraphs, code, buttons. Shown in vertical orientation only.
 * @slot label - Rich heading. Replaces `label`.
 * @slot description - Rich description. Replaces `description`.
 *
 * @csspart head - The marker and text row. A `<button>` when the step is clickable.
 * @csspart marker - The numbered square.
 * @csspart label - The heading text.
 * @csspart description - The short line under the heading.
 * @csspart connector - The line to the next step.
 * @csspart content - The wrapper around slotted content (vertical only).
 */
export class HtStep extends LitElement {
  static properties = {
    /** Identifier matched by `current` on `ht-steps` and sent in `ht-step-select`. */
    value: {},
    /** Overrides the state worked out from `current`: `upcoming`, `current`, `done` or `error`. */
    state: { reflect: true },
    /** Heading. */
    label: {},
    /** Short line under the heading. */
    description: {},
    /** Adds an "Optional" note under the heading. */
    optional: { type: Boolean, reflect: true },
    /** Dims the step. A clickable step stays focusable but does nothing, and says so to assistive tech. */
    disabled: { type: Boolean, reflect: true },
    /** @internal */
    _index: { state: true },
    /** @internal */
    _status: { state: true },
    /** @internal */
    _interactive: { state: true },
    /** @internal */
    _vertical: { state: true },
    /** @internal Reflected so `ht-steps` can stop the last step growing. */
    _last: { type: Boolean, attribute: 'data-last', reflect: true },
  };

  declare value: string;
  declare state: StepState | undefined;
  declare label: string;
  declare description: string;
  declare optional: boolean;
  declare disabled: boolean;
  declare _index: number;
  declare _status: StepState | '';
  declare _interactive: boolean;
  declare _vertical: boolean;
  declare _last: boolean;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.description = '';
    this.optional = false;
    this.disabled = false;
    this._index = 0;
    this._status = '';
    this._interactive = false;
    this._vertical = false;
    this._last = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'listitem');
  }

  static styles = css`
    :host {
      display: block;
      --_m: 24px;
      --_gap: 12px;
      color: var(--ht-text);
      font: 400 0.875rem/1.25rem var(--ht-font-ui);
    }
    :host([hidden]) { display: none; }

    .step { position: relative; display: flex; align-items: flex-start; min-width: 0; }
    .step.v { display: block; padding-bottom: 24px; }
    .step.v.last { padding-bottom: 0; }
    /* Not opacity: half-faded text fails contrast. Subtle text clears 4.5:1, the dashed marker says "off". */
    .step.disabled .label,
    .step.disabled .description,
    .step.disabled .marker { color: var(--ht-text-subtle); }
    .step.disabled .marker { border-style: dashed; }

    .head {
      box-sizing: border-box;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      min-width: 0;
      margin: 0;
      padding: 0;
      font: inherit;
      color: inherit;
      text-align: start;
      background: none;
      border: 0;
      border-radius: var(--ht-radius-sm);
    }
    .h .head { flex: var(--_ht-step-head-flex, none); }
    .v .head { gap: var(--_gap); }
    button.head { cursor: pointer; }
    button.head:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    button.head[aria-disabled='true'] { cursor: not-allowed; }
    button.head:not([aria-disabled='true']):hover .label { text-decoration: underline; text-underline-offset: 3px; }

    .marker {
      box-sizing: border-box;
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: var(--_m);
      height: var(--_m);
      font: 600 0.6875rem/1 var(--ht-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-input);
      border-radius: var(--ht-radius-sm);
      transition: background-color var(--ht-duration) var(--ht-ease), border-color var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease);
    }
    .marker svg { width: 14px; height: 14px; }
    .upcoming .marker { color: var(--ht-text-muted); }
    .current .marker { color: var(--ht-text); border: 2px solid var(--ht-accent); }
    .done .marker { color: var(--ht-accent-ink); background: var(--ht-accent); border-color: var(--ht-accent); }
    .error .marker { color: var(--ht-danger-ink); background: var(--ht-danger); border-color: var(--ht-danger); }

    .text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      padding-top: calc((var(--_m) - 1.25rem) / 2);
      position: var(--_ht-step-text-position, static);
      width: var(--_ht-step-text-size, auto);
      height: var(--_ht-step-text-size, auto);
      overflow: hidden;
      clip-path: var(--_ht-step-text-clip, none);
    }
    .h .text { white-space: nowrap; }
    .label { font-weight: 500; color: var(--ht-text); overflow: hidden; text-overflow: ellipsis; }
    .upcoming .label { color: var(--ht-text-muted); }
    .current .label { font-weight: 600; }
    .error .label { color: var(--ht-danger-text); }
    .description { font-size: 0.75rem; line-height: 1rem; color: var(--ht-text-muted); }
    .optional {
      font: 500 0.625rem/1rem var(--ht-font-mono);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ht-text-muted);
    }
    .description.empty { display: none; }
    .h .description:not(.empty), .h .optional { display: var(--_ht-step-extra, block); overflow: hidden; text-overflow: ellipsis; }
    .vh {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .connector {
      flex: 1 1 auto;
      min-width: var(--_ht-step-line-min, 16px);
      height: 2px;
      margin: calc(var(--_m) / 2 - 1px) var(--_ht-step-line-gap, 8px) 0;
      background: var(--ht-border-strong);
      border-radius: 1px;
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    .done > .connector { background: var(--ht-accent); }
    .v > .connector {
      position: absolute;
      inset-inline-start: calc(var(--_m) / 2 - 1px);
      top: calc(var(--_m) + 4px);
      bottom: 4px;
      width: 2px;
      height: auto;
      min-width: 0;
      margin: 0;
    }

    .content {
      margin-inline-start: calc(var(--_m) + var(--_gap));
      padding-top: 8px;
      min-width: 0;
      color: var(--ht-text-muted);
    }
    .content.empty { display: none; }
    ::slotted(:first-child) { margin-top: 0; }
    ::slotted(:last-child) { margin-bottom: 0; }

    @media (forced-colors: active) {
      .current .marker { border-color: Highlight; }
      .done > .connector { background: Highlight; }
    }
  `;

  #hasDesc = false;
  #onDescSlot = (e: Event) => {
    const has = (e.target as HTMLSlotElement).assignedNodes().length > 0;
    if (has !== this.#hasDesc) {
      this.#hasDesc = has;
      this.requestUpdate();
    }
  };

  #hasContent = false;
  #onSlot = (e: Event) => {
    const has = (e.target as HTMLSlotElement).assignedNodes().some((n) => n.nodeType === 1 || !!n.textContent?.trim());
    if (has !== this.#hasContent) {
      this.#hasContent = has;
      this.requestUpdate();
    }
  };

  updated() {
    if (this._status === 'current') this.setAttribute('aria-current', 'step');
    else this.removeAttribute('aria-current');
  }

  render() {
    const status = this._status;
    const vertical = this._vertical;
    const n = String(this._index + 1).padStart(2, '0');
    const marker = status === 'done' ? TICK : status === 'error' ? BANG : n;
    const note = status === 'done' ? 'Completed' : status === 'error' ? 'Error' : '';
    const inner = html`
      <span part="marker" class="marker" aria-hidden="true">${marker}</span>
      <span class="text">
        <span part="label" class="label"><slot name="label">${this.label}</slot></span>
        ${note ? html`<span class="vh">(${note})</span>` : nothing}
        <span part="description" class="description ${this.description || this.#hasDesc ? '' : 'empty'}"
          ><slot name="description" @slotchange=${this.#onDescSlot}>${this.description}</slot></span
        >
        ${this.optional ? html`<span class="optional">Optional</span>` : nothing}
      </span>
    `;
    const head = this._interactive
      ? html`<button
          part="head"
          class="head"
          type="button"
          data-step-head
          aria-disabled=${ifDefined(this.disabled ? 'true' : undefined)}
        >${inner}</button>`
      : html`<div part="head" class="head" tabindex="-1">${inner}</div>`;
    const classes = ['step', vertical ? 'v' : 'h', status || 'neutral', this._last ? 'last' : '', this.disabled ? 'disabled' : ''].join(' ');
    return html`<div class=${classes}>
      ${head}
      ${this._last ? nothing : html`<span part="connector" class="connector" aria-hidden="true"></span>`}
      ${vertical
        ? html`<div part="content" class="content ${this.#hasContent ? '' : 'empty'}"><slot @slotchange=${this.#onSlot}></slot></div>`
        : nothing}
    </div>`;
  }
}

for (const [tag, ctor] of [
  ['ht-steps', HtSteps],
  ['ht-step', HtStep],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-steps': HtSteps;
    'ht-step': HtStep;
  }
  interface HTMLElementEventMap {
    'ht-step-select': CustomEvent<{ index: number; value: string }>;
  }
}
