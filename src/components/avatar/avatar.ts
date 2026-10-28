import { LitElement, css, html, nothing, svg } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

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

/* Generated pictures. Every choice comes from one seeded stream that is read in a fixed order, so the
 * same seed always draws the same picture. The parts are drawn here, in code; none is copied. */

/** The picture styles `generateAvatar` can draw. */
export type AvatarArt = 'pixel' | 'dots' | 'tiles';
/** Every style, in the order the docs show them. */
export const AVATAR_ARTS: readonly AvatarArt[] = ['pixel', 'dots', 'tiles'];

export interface AvatarArtOptions {
  /** Picture style. Default `pixel`. */
  art?: AvatarArt;
  /** Width and height in px of the `<svg>`. Default 64. */
  size?: number;
  /** Accessible name. Without it the picture is hidden from assistive technology. */
  label?: string;
}

/**
 * Fixed colours, so a seed looks the same in the element, in an `<img>` and in a file. Eight hues in
 * three tiers. Measured as WCAG ratios: `deep` on `bg` 8.3:1 or more, `mid` on `bg` 3.3:1 or more
 * (the 3:1 rule for graphics), and `INK` on `mid` 5.0:1 or more, for any hue on any hue.
 */
const PALETTE = [
  { bg: '#feebea', mid: '#dd5559', deep: '#791920' },
  { bg: '#feece1', mid: '#cb6800', deep: '#673200' },
  { bg: '#faefd6', mid: '#a27e03', deep: '#533f03' },
  { bg: '#e2f7e2', mid: '#229633', deep: '#025112' },
  { bg: '#d7f8f5', mid: '#06928c', deep: '#044d4a' },
  { bg: '#e6f2fe', mid: '#0986e4', deep: '#024478' },
  { bg: '#f1edfe', mid: '#916ee2', deep: '#492e7f' },
  { bg: '#feeaf2', mid: '#d15697', deep: '#711a4c' },
] as const;
const INK = '#0b0c1a';

/** FNV-1a over the seed, a murmur3 finish so near seeds (`user1`, `user2`) split apart, then mulberry32. */
function stream(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, int: (n: number) => Math.floor(next() * n) };
}
type Stream = ReturnType<typeof stream>;
type Art = { viewBox: number; body: string; crisp: boolean };

const num = (n: number) => +n.toFixed(2);
const path = (d: string, fill: string, extra = '') => (d ? `<path fill="${fill}"${extra} d="${d}"/>` : '');

/** Rows of half a picture (6 cells, `#` is filled), mirrored left to right, as one run per row. */
function cells(rows: readonly string[], y0: number): string {
  let d = '';
  rows.forEach((half, i) => {
    const row = half + [...half].reverse().join('');
    for (const m of row.matchAll(/#+/g)) d += `M${m.index} ${y0 + i}h${m[0].length}v1h-${m[0].length}z`;
  });
  return d;
}

const BLANK = '......';
/** A pixel creature on a 12 x 12 grid, mirrored so it reads as a face: body, head, top, eyes, mouth. */
const BODIES = [['....##', '..####', '..####'], ['....##', '.#####', '######'], ['....##', '...###', '...###']];
const HEADS = [
  { e: 3, rows: ['...###', '..####', '..####', '..####', '..####', '...###'] },
  { e: 3, rows: ['..####', '..####', '..####', '..####', '..####', '..####'] },
  { e: 2, rows: ['..####', '.#####', '.#####', '.#####', '.#####', '..####'] },
  { e: 3, rows: ['...###', '..####', '.#####', '.#####', '..####', '...###'] },
];
const TOPS = [
  { rows: [BLANK, BLANK, BLANK, BLANK, BLANK], ball: false },
  { rows: [BLANK, BLANK, BLANK, '..####', BLANK], ball: false },
  { rows: [BLANK, BLANK, '..#..#', '..####', BLANK], ball: false },
  { rows: ['.....#', '.....#', '.....#', '.....#', BLANK], ball: false },
  { rows: [BLANK, BLANK, '...###', '..####', '..####'], ball: false },
  { rows: ['....##', '.....#', '.....#', BLANK, BLANK], ball: true },
];
const dotAt = (e: number, w = 1) => '.'.repeat(e) + '#'.repeat(w) + '.'.repeat(6 - e - w);
type Rows = [number, string][];
const EYES: ((e: number) => Rows)[] = [
  (e) => [[5, dotAt(e)]],
  (e) => [[5, dotAt(e)], [6, dotAt(e)]],
  (e) => [[5, '.'.repeat(e) + '#'.repeat(6 - e)]],
  (e) => [[5, dotAt(e, 2)]],
  () => [[5, '.....#'], [6, '.....#']],
];
const MOUTHS: Rows[] = [
  [[7, '.....#']],
  [[7, '....##']],
  [[7, '....#.'], [8, '.....#']],
  [[7, '.....#'], [8, '.....#']],
  [[7, '.....#'], [8, '....#.']],
];

function pixel(r: Stream): Art {
  const bg = PALETTE[r.int(8)];
  const face = PALETTE[r.int(8)].mid;
  const cloth = PALETTE[r.int(8)].deep;
  const top = PALETTE[r.int(8)];
  const head = HEADS[r.int(HEADS.length)];
  const tall = TOPS[r.int(TOPS.length)];
  const body = BODIES[r.int(BODIES.length)];
  const eyes = EYES[r.int(EYES.length)](head.e);
  const mouth = MOUTHS[r.int(MOUTHS.length)];
  const ink = [...eyes, ...mouth].map(([y, half]) => cells([half], y)).join('');
  return {
    viewBox: 12,
    crisp: true,
    body:
      `<rect width="12" height="12" fill="${bg.bg}"/>` +
      path(cells(body, 9), cloth) +
      path(cells(head.rows, 3), face) +
      path(cells(tall.rows, 0), tall.ball ? top.mid : top.deep) +
      path(ink, INK),
  };
}

/** A halftone screen: a grid of dots whose size follows a field (a glow, a gradient or a ripple). */
function dots(r: Stream): Art {
  const n = 5 + r.int(3);
  const kind = r.int(3);
  const [fx, fy, angle, phase] = [r.next(), r.next(), r.next() * Math.PI, r.next() * Math.PI * 2];
  const wave = 1 + r.int(2);
  const inverted = r.next() < 0.3;
  const a = PALETTE[r.int(8)];
  const b = PALETTE[r.int(8)];
  const [back, front] = inverted ? [a.deep, b.bg] : [a.bg, b.deep];
  const cell = 100 / n;
  let circles = '';
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      const y = (j + 0.5) / n;
      const jitter = (r.next() - 0.5) * 0.2;
      const field =
        kind === 0
          ? 1 - Math.hypot(x - fx, y - fy) / 1.1
          : kind === 1
            ? (x - 0.5) * Math.cos(angle) + (y - 0.5) * Math.sin(angle) + 0.5
            : (Math.sin(x * wave * 6.283 + phase) * Math.sin(y * wave * 6.283 + phase) + 1) / 2;
      const level = Math.min(1, Math.max(0.1, field + jitter));
      circles += `<circle cx="${num((i + 0.5) * cell)}" cy="${num((j + 0.5) * cell)}" r="${num(level * cell * 0.48)}"/>`;
    }
  }
  return { viewBox: 100, crisp: false, body: `<rect width="100" height="100" fill="${back}"/><g fill="${front}">${circles}</g>` };
}

/** Shapes drawn in a 2 x 2 tile, each one a corner, an edge or the whole tile. */
const TILE_SHAPES = [
  '<circle cx="1" cy="1" r="1"/>',
  '<path d="M0 0h2a2 2 0 0 1-2 2z"/>',
  '<path d="M0 0h2a2 2 0 0 1-2 2z"/>',
  '<path d="M0 2a1 1 0 0 1 2 0z"/>',
  '<path d="M0 2h2V0z"/>',
  '<path d="M0 2a2 2 0 0 1 2-2 2 2 0 0 1-2 2z"/>',
  '',
];

/** Nine tiles on a 3 x 3 grid, each a shape turned a quarter at a time, in one of two colours. */
function tiles(r: Stream): Art {
  const bg = PALETTE[r.int(8)].bg;
  const one = PALETTE[r.int(8)].deep;
  const two = PALETTE[r.int(8)].mid;
  let out = `<rect width="6" height="6" fill="${bg}"/>`;
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      const shape = TILE_SHAPES[r.int(TILE_SHAPES.length)];
      const turn = r.int(4) * 90;
      const color = r.next() < 0.5 ? one : two;
      if (shape) out += `<g fill="${color}" transform="translate(${i * 2} ${j * 2}) rotate(${turn} 1 1)">${shape}</g>`;
    }
  }
  return { viewBox: 6, crisp: false, body: out };
}

/** The same seed gives the same picture. Spaces around the seed are ignored; case counts. */
function drawArt(seed: string, art: AvatarArt): Art {
  const r = stream(String(seed).trim());
  return art === 'dots' ? dots(r) : art === 'tiles' ? tiles(r) : pixel(r);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Draws an avatar picture for a seed and returns it as SVG markup. Use it for a name, an email or an
 * id: the same seed always gives the same picture, so nothing needs to be stored. Colours are fixed
 * (not theme tokens), so the markup can go in a file, an `<img>` or an email.
 *
 * ```ts
 * el.innerHTML = generateAvatar('ada@example.com', { art: 'dots', size: 48, label: 'Ada' });
 * ```
 */
export function generateAvatar(seed: string, options: AvatarArtOptions = {}): string {
  const { art = 'pixel', size = 64, label = '' } = options;
  const { viewBox, body, crisp } = drawArt(seed, AVATAR_ARTS.includes(art) ? art : 'pixel');
  const a11y = label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" width="${size}" height="${size}"${crisp ? ' shape-rendering="crispEdges"' : ''}${a11y}>${body}</svg>`;
}

/** `generateAvatar` as a `data:` URI, ready for `<img src>` or a CSS `background-image`. */
export function avatarDataUri(seed: string, options: AvatarArtOptions = {}): string {
  const svg = generateAvatar(seed, options);
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/['()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Round or square picture of a person or team. Shows the image when it loads and falls back to
 * initials (first and last name) on a tint picked from the name, so the same person always gets
 * the same colour. With no name either it shows a generic person glyph.
 *
 * Set `art` to draw a generated picture from `seed` (or from `name`) instead of initials: the same
 * seed always gives the same picture. It sits under the image, so a photo still wins once it loads.
 * `generateAvatar` and `avatarDataUri` make the same pictures outside the element.
 *
 * The avatar is an image with the name as its text alternative. With no `name` it is hidden from
 * assistive technology, so give it one unless a visible name sits right beside it. A generated
 * picture follows the same rule: it is decoration until the avatar has a `name`.
 *
 * @tag ht-avatar
 * @summary User picture with initials fallback, or a picture drawn from a seed.
 *
 * @slot status - A small dot or icon pinned to the bottom-right corner, e.g. an online marker. Say what it means with `status-label`, since a dot alone is only colour.
 *
 * @csspart base - The avatar circle or square.
 * @csspart art - The generated picture (`<svg>`), when `art` is set.
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
    /** Text the generated picture is drawn from: a name, an email or an id. Same seed, same picture. Used only when `art` is set; defaults to `name`. Spaces around it are ignored, case counts. */
    seed: {},
    /** Draws a picture from `seed` in place of the initials: `pixel` (a creature), `dots` (a halftone screen) or `tiles` (nine turned shapes). Empty, the default, turns it off. */
    art: {},
    /** Text shown in place of the initials computed from `name`, e.g. `AB`. The accessible name still comes from `name`. */
    initials: {},
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
  declare seed: string;
  declare art: AvatarArt | '';
  declare initials: string;
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
    this.seed = '';
    this.art = '';
    this.initials = '';
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
    .art { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit; }
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
    /* Forced colours drop the shadow hairline, so draw the edge with a system colour. The picture keeps its own colours, like a photo. */
    @media (forced-colors: active) {
      .base::after { box-shadow: none; border: 1px solid CanvasText; }
      .art { forced-color-adjust: none; }
    }
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
    if (changed.has('seed') || changed.has('art') || changed.has('name')) {
      const from = this.seed || this.name;
      this.#art = this.art && AVATAR_ARTS.includes(this.art) && from.trim() ? drawArt(from, this.art) : undefined;
    }
    if (changed.has('name')) {
      if (this.name.trim()) this.setAttribute('data-tint', tintOf(this.name));
      else this.removeAttribute('data-tint');
    }
  }

  #art?: Art;

  #onStatusSlot = (e: Event) => {
    this._hasStatus = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  render() {
    const name = this.name.trim();
    const initials = this.initials.trim() || initialsOf(name);
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
        ${this.#art
          ? html`<svg
              part="art"
              class="art"
              viewBox="0 0 ${this.#art.viewBox} ${this.#art.viewBox}"
              shape-rendering=${ifDefined(this.#art.crisp ? 'crispEdges' : undefined)}
              aria-hidden="true"
            >${unsafeSVG(this.#art.body)}</svg>`
          : initials
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
