import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

const isApple = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** Parses `mod+b`, `ctrl+shift+e`, `alt+/` and tests it against a key event. */
function matchesHotkey(spec: string, e: KeyboardEvent) {
  const parts = spec.toLowerCase().split('+').map((p) => p.trim()).filter(Boolean);
  const key = parts.pop();
  if (!key) return false;
  const want = { ctrl: false, meta: false, alt: false, shift: false };
  for (const p of parts) {
    if (p === 'mod') want[isApple() ? 'meta' : 'ctrl'] = true;
    else if (p === 'cmd') want.meta = true;
    else if (p === 'option') want.alt = true;
    else if (p in want) want[p as keyof typeof want] = true;
    else return false;
  }
  const keyOk = e.key.toLowerCase() === key || (key.length === 1 && e.code === `Key${key.toUpperCase()}`);
  return keyOk && e.ctrlKey === want.ctrl && e.metaKey === want.meta && e.altKey === want.alt && e.shiftKey === want.shift;
}

const CLOSE_ICON =
  'M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z';
const CARET_ICON =
  'M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z';

/**
 * App-shell sidebar: a header, a scrolling list of groups, and a footer. On a wide viewport it is a column that can
 * collapse to an icon rail. Below `mobile-breakpoint` it becomes an off-canvas drawer on a native `<dialog>` with a
 * scrim, focus trap, Escape to close and focus return.
 *
 * Put `ht-sidebar-header`, `ht-sidebar-group` and `ht-sidebar-footer` inside it. Rows are the consumer's own
 * (`ht-nav-item` or anything else); the sidebar styles them generically. In rail mode slotted rows are clipped to a
 * 2.25rem icon column, so lead each row with its icon. Mark anything that should vanish in the rail with
 * `data-expanded-only`. Tooltips for the rail are the consumer's job (wrap rows in `ht-tooltip`).
 *
 * The component keeps no storage: persist `collapsed` yourself and listen for `ht-sidebar-toggle`.
 * Clicking a link inside the mobile drawer closes it.
 *
 * @tag ht-sidebar
 * @summary App sidebar with icon rail and mobile drawer.
 *
 * @slot - Navigation content, normally `ht-sidebar-group` elements. Wrapped in a `<nav>` landmark.
 * @slot header - Set automatically on `ht-sidebar-header`.
 * @slot footer - Set automatically on `ht-sidebar-footer`.
 *
 * @csspart panel - The desktop column.
 * @csspart drawer - The native `<dialog>` used below the breakpoint.
 * @csspart content - The scrolling `<nav>`.
 * @csspart close - The drawer's close button.
 *
 * @cssprop [--ht-sidebar-width=16rem] - Width when expanded, and the drawer width (capped at 85vw).
 * @cssprop [--ht-sidebar-rail-width=3.75rem] - Width of the collapsed icon rail.
 *
 * @fires ht-sidebar-toggle - The user collapsed, expanded, opened or closed the sidebar (`toggle()`, the hotkey, scrim,
 *   Escape, close button or a link click in the drawer). `detail` is `{ collapsed, open, mobile }`. Setting the
 *   properties from code does not fire it.
 */
export class HtSidebar extends LitElement {
  static properties = {
    /** Accessible name of the `<nav>` landmark, and of the drawer. */
    label: {},
    /** Lets the sidebar collapse to an icon rail. */
    collapsible: { type: Boolean, reflect: true },
    /** Shows the icon rail instead of the full sidebar. Needs `collapsible`; ignored in the mobile drawer. */
    collapsed: { type: Boolean, reflect: true },
    /** Shows the mobile drawer. Closes by itself when the viewport grows past the breakpoint. */
    open: { type: Boolean, reflect: true },
    /** Viewport width in px below which the sidebar is an off-canvas drawer. */
    mobileBreakpoint: { type: Number, attribute: 'mobile-breakpoint' },
    /** Keyboard shortcut that calls `toggle()`, for example `mod+b`. `mod` is Cmd on Apple platforms, Ctrl elsewhere. Empty turns it off. */
    hotkey: {},
    /** Read only: true while the viewport is below `mobile-breakpoint`. Reflects, so you can style `ht-sidebar[mobile]`. */
    mobile: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare collapsible: boolean;
  declare collapsed: boolean;
  declare open: boolean;
  declare mobileBreakpoint: number;
  declare hotkey: string;
  declare mobile: boolean;

  #mq?: MediaQueryList;

  constructor() {
    super();
    this.label = 'Main';
    this.collapsible = false;
    this.collapsed = false;
    this.open = false;
    this.mobileBreakpoint = 768;
    this.hotkey = '';
    this.mobile = false;
  }

  static styles = css`
    :host {
      display: block;
      flex: none;
      box-sizing: border-box;
      height: 100%;
      width: var(--ht-sidebar-width, 16rem);
      transition: width var(--ht-duration) var(--ht-ease);
    }
    :host([collapsible][collapsed]:not([mobile])) { width: var(--ht-sidebar-rail-width, 3.75rem); }
    :host([mobile]) { display: contents; }
    [hidden] { display: none !important; }

    .panel {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      font: 400 0.875rem/1.5 var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface-muted);
      border-inline-end: 1px solid var(--ht-border);
    }
    .content {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 0;
      padding: 8px;
      overflow-x: hidden;
      overflow-y: auto;
      scrollbar-width: thin;
    }

    dialog {
      box-sizing: border-box;
      position: fixed;
      inset-block: 0;
      inset-inline: 0 auto;
      width: min(var(--ht-sidebar-width, 16rem), 85vw);
      max-width: none;
      height: 100dvh;
      max-height: none;
      margin: 0;
      padding: 0;
      overflow: hidden;
      color: var(--ht-text);
      background: var(--ht-surface-muted);
      border: 0;
      border-inline-end: 1px solid var(--ht-border-strong);
      box-shadow: var(--ht-shadow-md);
      transform: translateX(-100%);
      transition:
        transform var(--ht-duration) var(--ht-ease),
        overlay var(--ht-duration) allow-discrete,
        display var(--ht-duration) allow-discrete;
    }
    dialog[open] { display: flex; transform: none; }
    dialog::backdrop {
      background: oklch(0.12 0.02 295 / 0.55);
      opacity: 0;
      transition:
        opacity var(--ht-duration) var(--ht-ease),
        overlay var(--ht-duration) allow-discrete,
        display var(--ht-duration) allow-discrete;
    }
    dialog[open]::backdrop { opacity: 1; }
    @starting-style {
      dialog[open] { transform: translateX(-100%); }
      dialog[open]::backdrop { opacity: 0; }
    }
    dialog .panel { flex: 1; width: 100%; border: 0; padding-block-end: env(safe-area-inset-bottom); }
    dialog slot[name='header']::slotted(*) { --_close-gap: 2.25rem; }
    .close {
      all: unset;
      position: absolute;
      inset-block-start: 8px;
      inset-inline-end: 8px;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      cursor: pointer;
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-md);
    }
    .close:hover { color: var(--ht-text); background: var(--ht-surface-sunken); }
    .close:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }

    @media (prefers-reduced-motion: reduce) {
      :host, dialog, dialog::backdrop { transition: none; }
    }
  `;

  get #rail() {
    return this.collapsible && this.collapsed && !this.mobile;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#bind();
    document.addEventListener('keydown', this.#onKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.#onKey);
    this.#mq?.removeEventListener('change', this.#onMq);
    this.renderRoot.querySelector('dialog')?.close();
  }

  #bind() {
    this.#mq?.removeEventListener('change', this.#onMq);
    if (typeof matchMedia !== 'function') return;
    this.#mq = matchMedia(`(max-width: ${this.mobileBreakpoint - 0.02}px)`);
    this.#mq.addEventListener('change', this.#onMq);
    this.mobile = this.#mq.matches;
  }

  #onMq = () => {
    this.mobile = !!this.#mq?.matches;
    if (!this.mobile) this.open = false;
  };

  #onKey = (e: KeyboardEvent) => {
    if (!this.hotkey || e.defaultPrevented || e.repeat || !matchesHotkey(this.hotkey, e)) return;
    // Cmd/Ctrl+B means "bold" in rich-text editors.
    if ((e.composedPath()[0] as HTMLElement | undefined)?.isContentEditable) return;
    e.preventDefault();
    this.toggle();
  };

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('mobileBreakpoint') && changed.get('mobileBreakpoint') !== undefined) this.#bind();
  }

  updated() {
    // Hand the rail state to the header, groups and footer, which style their own slotted content.
    const rail = this.#rail;
    for (const el of this.querySelectorAll('ht-sidebar-group, ht-sidebar-header, ht-sidebar-footer')) {
      el.toggleAttribute('rail', rail);
    }
    const dialog = this.renderRoot.querySelector('dialog');
    if (!dialog) return;
    if (this.open && !dialog.open) dialog.showModal();
    else if (!this.open && dialog.open) dialog.close();
  }

  #emit() {
    this.dispatchEvent(
      new CustomEvent('ht-sidebar-toggle', {
        bubbles: true,
        composed: true,
        detail: { collapsed: this.collapsed, open: this.open, mobile: this.mobile },
      }),
    );
  }

  /** Opens or closes the drawer below the breakpoint; collapses or expands the rail above it (when `collapsible`). */
  toggle() {
    if (this.mobile) this.open = !this.open;
    else if (this.collapsible) this.collapsed = !this.collapsed;
    else return;
    this.#emit();
  }

  #closeDrawer() {
    if (!this.open) return;
    this.open = false;
    this.#emit();
  }

  // Escape closes the native dialog; keep `open` in step.
  #onDrawerClose = () => this.#closeDrawer();
  #onDrawerClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) this.#closeDrawer();
    else if (e.composedPath().some((n) => n instanceof HTMLAnchorElement)) this.#closeDrawer();
  };

  #syncRail = () => this.requestUpdate();

  render() {
    const parts = html`
      <slot name="header" @slotchange=${this.#syncRail}></slot>
      <nav part="content" class="content" aria-label=${ifDefined(this.label || undefined)}>
        <slot @slotchange=${this.#syncRail}></slot>
      </nav>
      <slot name="footer" @slotchange=${this.#syncRail}></slot>
    `;
    if (!this.mobile) return html`<div part="panel" class="panel">${parts}</div>`;
    return html`
      <dialog
        part="drawer"
        aria-label=${ifDefined(this.label || undefined)}
        @close=${this.#onDrawerClose}
        @click=${this.#onDrawerClick}
      >
        <div class="panel">${parts}</div>
        <button part="close" class="close" type="button" aria-label="Close Menu" @click=${() => this.#closeDrawer()}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d=${CLOSE_ICON}/></svg>
        </button>
      </dialog>
    `;
  }
}

/**
 * A titled group of rows inside `ht-sidebar`. With `collapsible` the heading becomes a disclosure button.
 * In the icon rail the heading is replaced by a short rule and the rows stay visible.
 *
 * @tag ht-sidebar-group
 * @summary Sidebar section.
 *
 * @slot - Rows, such as `ht-nav-item`.
 *
 * @csspart heading - The heading text, or the disclosure button when `collapsible`.
 * @csspart body - The row container.
 *
 * @fires ht-sidebar-group-toggle - The user collapsed or expanded the group. `detail` is `{ collapsed }`.
 */
export class HtSidebarGroup extends LitElement {
  static properties = {
    /** Group title, shown as a small uppercase mono label. It also names the group for assistive technology. */
    heading: {},
    /** Makes the heading a button that hides and shows the rows. */
    collapsible: { type: Boolean, reflect: true },
    /** Hides the rows. Needs `collapsible`. Ignored in the icon rail. */
    collapsed: { type: Boolean, reflect: true },
    /** @internal Set by `ht-sidebar` while it shows the icon rail. */
    rail: { type: Boolean, reflect: true },
  };

  declare heading: string;
  declare collapsible: boolean;
  declare collapsed: boolean;
  declare rail: boolean;

  constructor() {
    super();
    this.heading = '';
    this.collapsible = false;
    this.collapsed = false;
    this.rail = false;
  }

  static styles = css`
    :host { display: block; }
    [hidden] { display: none !important; }
    .heading {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      width: 100%;
      height: 24px;
      padding: 0 6px;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }
    button.heading {
      cursor: pointer;
      border-radius: var(--ht-radius-md);
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    button.heading:hover { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    button.heading:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    .caret { flex: none; transition: transform var(--ht-duration) var(--ht-ease); }
    :host([collapsed]) .caret { transform: rotate(-90deg); }
    .body { display: flex; flex-direction: column; gap: 2px; }
    .rule { display: none; }

    :host([rail]) .heading { display: none; }
    :host([rail]) .rule {
      display: block;
      width: 1.25rem;
      height: 1px;
      margin: 0 auto 8px;
      background: var(--ht-border-strong);
    }
    :host([rail]) ::slotted(*) { box-sizing: border-box; width: 2.25rem; margin-inline: auto; overflow: hidden; }
    :host([rail]) ::slotted([data-expanded-only]) { display: none !important; }

    @media (prefers-reduced-motion: reduce) {
      button.heading, .caret { transition: none; }
    }
  `;

  #toggle = () => {
    this.collapsed = !this.collapsed;
    this.dispatchEvent(
      new CustomEvent('ht-sidebar-group-toggle', { bubbles: true, composed: true, detail: { collapsed: this.collapsed } }),
    );
  };

  render() {
    const hideBody = this.collapsible && this.collapsed && !this.rail;
    let heading: unknown = nothing;
    if (this.heading) {
      heading = this.collapsible
        ? html`<button
            id="heading"
            part="heading"
            class="heading"
            type="button"
            aria-expanded=${hideBody ? 'false' : 'true'}
            aria-controls="body"
            @click=${this.#toggle}
          >
            <span>${this.heading}</span>
            <svg class="caret" width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d=${CARET_ICON}/></svg>
          </button>`
        : html`<div id="heading" part="heading" class="heading">${this.heading}</div>`;
    }
    return html`
      <div class="group" role=${ifDefined(this.heading ? 'group' : undefined)} aria-labelledby=${ifDefined(this.heading ? 'heading' : undefined)}>
        ${heading}
        ${this.heading ? html`<div class="rule" aria-hidden="true"></div>` : nothing}
        <div id="body" part="body" class="body" ?hidden=${hideBody}><slot></slot></div>
      </div>
    `;
  }
}

/**
 * Top strip of `ht-sidebar`, for a workspace switcher or logo. Gets `slot="header"` automatically.
 * In the mobile drawer it leaves room for the close button.
 *
 * @tag ht-sidebar-header
 * @summary Sidebar header.
 *
 * @slot - Header content. Elements with `data-expanded-only` are hidden in the icon rail.
 */
export class HtSidebarHeader extends LitElement {
  static properties = {
    /** @internal Set by `ht-sidebar` while it shows the icon rail. */
    rail: { type: Boolean, reflect: true },
  };

  declare rail: boolean;

  constructor() {
    super();
    this.rail = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('slot')) this.slot = 'header';
  }

  static styles = css`
    :host {
      display: flex;
      flex: none;
      flex-direction: column;
      gap: 8px;
      box-sizing: border-box;
      padding: 12px 8px 4px;
      padding-inline-end: calc(8px + var(--_close-gap, 0px));
    }
    :host([rail]) { align-items: center; overflow: hidden; padding-inline: 8px; }
    :host([rail]) ::slotted([data-expanded-only]) { display: none !important; }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

/**
 * Bottom strip of `ht-sidebar`, for quick actions and the user menu. Gets `slot="footer"` automatically.
 *
 * @tag ht-sidebar-footer
 * @summary Sidebar footer.
 *
 * @slot - Footer content. Elements with `data-expanded-only` are hidden in the icon rail.
 */
export class HtSidebarFooter extends LitElement {
  static properties = {
    /** @internal Set by `ht-sidebar` while it shows the icon rail. */
    rail: { type: Boolean, reflect: true },
  };

  declare rail: boolean;

  constructor() {
    super();
    this.rail = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('slot')) this.slot = 'footer';
  }

  static styles = css`
    :host {
      display: flex;
      flex: none;
      flex-direction: column;
      gap: 4px;
      box-sizing: border-box;
      padding: 8px;
      border-top: 1px solid var(--ht-border);
    }
    :host([rail]) { align-items: center; overflow: hidden; }
    :host([rail]) ::slotted([data-expanded-only]) { display: none !important; }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

for (const [tag, ctor] of [
  ['ht-sidebar', HtSidebar],
  ['ht-sidebar-group', HtSidebarGroup],
  ['ht-sidebar-header', HtSidebarHeader],
  ['ht-sidebar-footer', HtSidebarFooter],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

declare global {
  interface HTMLElementTagNameMap {
    'ht-sidebar': HtSidebar;
    'ht-sidebar-group': HtSidebarGroup;
    'ht-sidebar-header': HtSidebarHeader;
    'ht-sidebar-footer': HtSidebarFooter;
  }
}
