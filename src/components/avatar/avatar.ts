import { LitElement, css, html, nothing, svg } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/** Phosphor `user`, regular. Shown when there is no image and no name. */
const USER = svg`<path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>`;

const TINTS = ['accent', 'info', 'success', 'warning', 'danger'] as const;

/** First and last initial of a name, upper-cased. One word gives one letter. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : '';
  return (first + last).toLocaleUpperCase();
}

/** Stable pick from `TINTS`: the same name always gets the same colour. */
function tintOf(name: string): (typeof TINTS)[number] {
  let h = 5381;
  for (const ch of name.trim().toLocaleLowerCase()) h = ((h << 5) + h + ch.codePointAt(0)!) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

/**
 * Round or square picture of a person or team. Shows the image when it loads and falls back to
 * initials (first and last name) on a tint picked from the name, so the same person always gets
 * the same colour. With no name either it shows a generic person glyph.
 *
 * The avatar is an image with the name as its text alternative. With no `name` it is hidden from
 * assistive technology, so give it one unless a visible name sits right beside it.
 *
 * @tag ht-avatar
 * @summary User picture with initials fallback.
 *
 * @slot status - A small dot or icon pinned to the bottom-right corner, e.g. an online marker. Say what it means with `status-label`, since a dot alone is only colour.
 *
 * @csspart base - The avatar circle or square.
 * @csspart image - The `<img>`, once it has loaded.
 * @csspart initials - The initials fallback.
 * @csspart status - The status slot wrapper.
 *
 * @cssprop [--ht-avatar-ring-width=0px] - Outline in the surface colour around the avatar. `ht-avatar-group` sets it so stacked avatars read as separate.
 */
export class HtAvatar extends LitElement {
  static properties = {
    /** Image URL. If it fails to load, the initials show instead. */
    src: {},
    /** Full name. Gives the accessible name and the initials (first and last word). */
    name: {},
    /** Diameter: xs 20px, sm 24px, md 32px, lg 40px. */
    size: { reflect: true },
    /** `square` uses the md radius. */
    shape: { reflect: true },
    /** What the `status` slot means, e.g. `Online`. Appended to the accessible name. */
    statusLabel: { attribute: 'status-label' },
    _failed: { state: true },
    _loaded: { state: true },
    _hasStatus: { state: true },
  };

  declare src: string;
  declare name: string;
  declare size: 'xs' | 'sm' | 'md' | 'lg';
  declare shape: 'circle' | 'square';
  declare statusLabel: string;
  declare _failed: boolean;
  declare _loaded: boolean;
  declare _hasStatus: boolean;

  constructor() {
    super();
    this.src = '';
    this.name = '';
    this.size = 'md';
    this.shape = 'circle';
    this.statusLabel = '';
    this._failed = false;
    this._loaded = false;
    this._hasStatus = false;
  }

  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      flex: none;
      --_s: 2rem;
      --_fs: 0.8125rem;
      --_r: 50%;
      --_bg: var(--ht-surface-sunken);
      --_fg: var(--ht-text-muted);
    }
    :host([hidden]) { display: none; }
    :host([size='xs']) { --_s: 1.25rem; --_fs: 0.625rem; }
    :host([size='sm']) { --_s: 1.5rem; --_fs: 0.6875rem; }
    :host([size='lg']) { --_s: 2.5rem; --_fs: 0.9375rem; }
    :host([shape='square']) { --_r: var(--ht-radius-md); }
    /* Tints are picked by name. Text mixes toward --ht-text so it holds 4.5:1 in both themes. */
    :host([data-tint='accent']) { --_bg: var(--ht-accent-soft); --_fg: var(--ht-accent-text); }
    :host([data-tint='danger']) { --_bg: var(--ht-danger-soft); --_fg: var(--ht-danger-text); }
    :host([data-tint='info']) {
      --_bg: color-mix(in oklab, var(--ht-info) 14%, var(--ht-surface));
      --_fg: color-mix(in oklab, var(--ht-info) 70%, var(--ht-text));
    }
    :host([data-tint='success']) {
      --_bg: color-mix(in oklab, var(--ht-success) 14%, var(--ht-surface));
      --_fg: color-mix(in oklab, var(--ht-success) 70%, var(--ht-text));
    }
    :host([data-tint='warning']) {
      --_bg: color-mix(in oklab, var(--ht-warning) 14%, var(--ht-surface));
      --_fg: color-mix(in oklab, var(--ht-warning) 55%, var(--ht-text));
    }
    .base {
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--_s);
      height: var(--_s);
      color: var(--_fg);
      background: var(--_bg);
      border-radius: var(--_r);
      box-shadow: 0 0 0 var(--ht-avatar-ring-width, 0px) var(--ht-surface);
      user-select: none;
    }
    /* A hairline over the image, so a pale photo still has an edge. */
    .base::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ht-text) 14%, transparent);
      pointer-events: none;
    }
    .initials {
      font: 600 var(--_fs) / 1 var(--ht-font-ui);
      letter-spacing: 0.02em;
    }
    .glyph { width: 60%; height: 60%; }
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
      opacity: 0;
    }
    img.loaded { opacity: 1; }
    .status {
      position: absolute;
      right: -2px;
      bottom: -2px;
      display: none;
      line-height: 0;
    }
    .status.has { display: block; }
    :host([size='xs']) .status { right: -3px; bottom: -3px; }
    @media (prefers-reduced-motion: no-preference) {
      img { transition: opacity var(--ht-duration) var(--ht-ease); }
    }
  `;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('src')) {
      this._failed = false;
      this._loaded = false;
    }
    // The tint is chosen by name; it lives on the host so the CSS above can read it.
    if (changed.has('name')) {
      if (this.name.trim()) this.setAttribute('data-tint', tintOf(this.name));
      else this.removeAttribute('data-tint');
    }
  }

  #onStatusSlot = (e: Event) => {
    this._hasStatus = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  render() {
    const name = this.name.trim();
    const initials = initialsOf(name);
    const label = name ? (this.statusLabel ? `${name}, ${this.statusLabel}` : name) : '';
    const showImage = !!this.src && !this._failed;
    return html`
      <span
        part="base"
        class="base"
        role=${ifDefined(label ? 'img' : undefined)}
        aria-label=${ifDefined(label || undefined)}
        aria-hidden=${label ? nothing : 'true'}
      >
        ${initials
          ? html`<span part="initials" class="initials" aria-hidden="true">${initials}</span>`
          : html`<svg class="glyph" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${USER}</svg>`}
        ${showImage
          ? html`<img
              part="image"
              class=${this._loaded ? 'loaded' : ''}
              src=${this.src}
              alt=""
              @load=${() => (this._loaded = true)}
              @error=${() => (this._failed = true)}
            />`
          : nothing}
        <span part="status" class="status ${this._hasStatus ? 'has' : ''}"
          ><slot name="status" @slotchange=${this.#onStatusSlot}></slot
        ></span>
      </span>
    `;
  }
}

/**
 * A row of overlapping avatars with a "+N" counter for the rest. Put `ht-avatar` children in it.
 * Avatars past `max` are hidden and counted, and the group's `size` applies to every avatar in it.
 *
 * @tag ht-avatar-group
 * @summary Overlapping stack of avatars.
 *
 * @slot - `ht-avatar` elements.
 *
 * @csspart base - The row.
 * @csspart more - The "+N" counter.
 */
export class HtAvatarGroup extends LitElement {
  static properties = {
    /** How many avatars to show before collapsing the rest into "+N". 0 shows all. */
    max: { type: Number },
    /** Size of every avatar in the group. Same scale as `ht-avatar`. */
    size: { reflect: true },
    /** Accessible name for the group, e.g. `Reviewers`. */
    label: {},
    _hidden: { state: true },
  };

  declare max: number;
  declare size: 'xs' | 'sm' | 'md' | 'lg';
  declare label: string;
  declare _hidden: number;

  #hiding = new Set<HTMLElement>();

  constructor() {
    super();
    this.max = 0;
    this.size = 'md';
    this.label = '';
    this._hidden = 0;
  }

  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      --_s: 2rem;
      --_fs: 0.75rem;
      --_ov: 0.5rem;
    }
    :host([size='xs']) { --_s: 1.25rem; --_fs: 0.625rem; --_ov: 0.3125rem; }
    :host([size='sm']) { --_s: 1.5rem; --_fs: 0.6875rem; --_ov: 0.375rem; }
    :host([size='lg']) { --_s: 2.5rem; --_fs: 0.875rem; --_ov: 0.625rem; }
    .base { display: flex; align-items: center; padding-inline-start: 2px; }
    ::slotted(ht-avatar) { --ht-avatar-ring-width: 2px; }
    ::slotted(*:not(:first-child)), .more { margin-inline-start: calc(var(--_ov) * -1); }
    .more {
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: none;
      min-width: var(--_s);
      height: var(--_s);
      padding-inline: 0.25rem;
      font: 600 var(--_fs) / 1 var(--ht-font-ui);
      font-variant-numeric: tabular-nums;
      color: var(--ht-text-muted);
      background: var(--ht-surface-sunken);
      border-radius: calc(var(--_s) / 2);
      box-shadow: 0 0 0 2px var(--ht-surface), inset 0 0 0 1px color-mix(in oklab, var(--ht-text) 14%, transparent);
    }
    :host([hidden]) { display: none; }
  `;

  #avatars() {
    return [...this.children].filter((c): c is HtAvatar => c.localName === 'ht-avatar');
  }

  #sync = () => {
    const all = this.#avatars();
    // Only touch `hidden` on avatars this group hid, so a consumer's own `hidden` survives.
    const limit = this.max > 0 ? this.max : all.length;
    let hidden = 0;
    all.forEach((a, i) => {
      a.size = this.size;
      if (i >= limit) {
        if (!a.hidden) {
          a.hidden = true;
          this.#hiding.add(a);
        }
        hidden++;
      } else if (this.#hiding.has(a)) {
        a.hidden = false;
        this.#hiding.delete(a);
      }
    });
    this._hidden = hidden;
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('max') || changed.has('size')) this.#sync();
  }

  render() {
    return html`
      <div part="base" class="base" role=${ifDefined(this.label ? 'group' : undefined)} aria-label=${ifDefined(this.label || undefined)}>
        <slot @slotchange=${this.#sync}></slot>
        ${this._hidden > 0
          ? html`<span part="more" class="more" role="img" aria-label="${this._hidden} more">+${this._hidden}</span>`
          : nothing}
      </div>
    `;
  }
}

if (!customElements.get('ht-avatar')) customElements.define('ht-avatar', HtAvatar);
if (!customElements.get('ht-avatar-group')) customElements.define('ht-avatar-group', HtAvatarGroup);

declare global {
  interface HTMLElementTagNameMap {
    'ht-avatar': HtAvatar;
    'ht-avatar-group': HtAvatarGroup;
  }
}
