import { LitElement, css, html, nothing, svg } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/*!
 * Icons are from Phosphor (https://phosphoricons.com), MIT licence,
 * Copyright (c) 2023 Phosphor Icons. The notice must stay with the icon data below.
 */
/** Phosphor `upload-simple`, regular. The tall zone. */
const UPLOAD = svg`<path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V144a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z"/>`;
/** Phosphor `paperclip`, regular. The compact row. */
const CLIP = svg`<path d="M209.66,122.34a8,8,0,0,1,0,11.32l-82.05,82a56,56,0,0,1-79.2-79.21L147.67,35.73a40,40,0,1,1,56.61,56.55L105,193A24,24,0,1,1,71,159L154.3,74.38A8,8,0,1,1,165.7,85.6L82.39,170.31a8,8,0,1,0,11.27,11.36L192.93,81A24,24,0,1,0,159,47L59.76,147.68a40,40,0,1,0,56.53,56.62l82.06-82A8,8,0,0,1,209.66,122.34Z"/>`;
/** Phosphor `file`, regular. A row in the file list. */
const FILE = svg`<path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"/>`;
/** Phosphor `x`, regular. The remove button. */
const X = svg`<path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>`;

const icon = (path: unknown, size: number) =>
  html`<svg width=${size} height=${size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${path}</svg>`;

/** Why a file was turned away. */
export type DropzoneRejectReason = 'type' | 'size' | 'count';

/** `detail` of the `ht-reject` event. */
export interface DropzoneRejectDetail {
  file: File;
  reason: DropzoneRejectReason;
  /** A sentence-case sentence, the same one shown under the zone. */
  message: string;
}

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes('Files');

/**
 * File picker with a drop zone. A real `<input type="file">` drives it, so Tab, Enter and Space
 * and screen readers get the native control; the zone around it is its label, and dropping files
 * on it works too. Chosen files show in a list under the zone, each with a remove button.
 *
 * Form-associated: submits one entry per file under `name`, so the form needs
 * `enctype="multipart/form-data"`. `required` blocks submit until a file is chosen, and form reset
 * clears the list. Files can only come from the person: the browser does not restore them.
 *
 * Checks run in the order type (`accept`), size (`max-size`), count (`max-files`, or one without
 * `multiple`). A turned-away file never enters `files`: it fires `ht-reject`, the reason shows under
 * the zone, and a polite live region reads it out, as it does for added and removed files.
 *
 * Upload progress is the consumer's: assign a new `Map` of `File` to a 0–100 number to `progress`
 * and each listed file draws a thin bar with a `progressbar` role. Delete the entry to drop the bar.
 * To draw a list of your own (with `ht-progress`, thumbnails, status), set `no-list` and render
 * from `files` on `change`.
 *
 * With `page`, a drop anywhere on the page is taken too, and a full-window overlay says
 * "Drop to upload" while files are dragged over it. Use one `page` dropzone per page.
 *
 * @tag ht-dropzone
 * @summary File drop zone and picker.
 *
 * @csspart label - The visible label.
 * @csspart zone - The dashed drop area (a `<label>` for the native input).
 * @csspart hint - The helper text inside the zone.
 * @csspart message - The error, rejection or validation text under the zone.
 * @csspart list - The list of chosen files.
 * @csspart file - One row in the list.
 * @csspart remove - The remove button in a row.
 * @csspart progress - The progress bar in a row, shown while `progress` has the file.
 * @csspart overlay - The full-window overlay drawn by `page`.
 *
 * @fires change - Files were added, removed or cleared by the person or by `addFiles`. `detail: { files: File[] }`. Not fired by setting `files` or by form reset.
 * @fires ht-reject - A file was turned away, once per file. `detail: { file, reason: 'type' | 'size' | 'count', message }`.
 */
export class HtDropzone extends LitElement {
  /** @internal */
  static formAssociated = true;
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** Visible label. With no visible label, set `aria-label` on the element; it is forwarded to the native input. */
    label: {},
    /** Helper text inside the zone, e.g. "CSV up to 10 MB". Say the accepted types and the size limit here. */
    helper: {},
    /** Error text under the zone. Setting it marks the field invalid and is announced as an alert. */
    error: {},
    /** Form field name. Each file is submitted under it. */
    name: {},
    /** Accepted types, as for a native file input: extensions (`.csv`), MIME types (`text/csv`) or wildcards (`image/*`). Empty takes anything. */
    accept: {},
    /** Takes several files; new picks and drops are added to the list. Without it, a new file replaces the old one. */
    multiple: { type: Boolean, reflect: true },
    /** Largest file size in bytes. 0 is no limit. */
    maxSize: { type: Number, attribute: 'max-size' },
    /** Most files in the list, with `multiple`. 0 is no limit. */
    maxFiles: { type: Number, attribute: 'max-files' },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    /** A one-line row instead of the tall zone, for composers and tight forms. */
    compact: { type: Boolean, reflect: true },
    /** Hides the built-in file list, for consumers who draw their own from `files`. */
    noList: { type: Boolean, attribute: 'no-list', reflect: true },
    /** Also takes drops anywhere on the page, with a full-window "Drop to upload" overlay. */
    page: { type: Boolean, reflect: true },
    /** The chosen files. Settable; setting it does not fire `change`. */
    files: { attribute: false },
    /** Upload progress per file, 0 to 100. Assign a new `Map` to redraw. */
    progress: { attribute: false },
    _drag: { state: true },
    _dragText: { state: true },
    _pageDrag: { state: true },
    _rejection: { state: true },
    _touched: { state: true },
    _formDisabled: { state: true },
  };

  declare label: string;
  declare helper: string;
  declare error: string;
  declare name: string;
  declare accept: string;
  declare multiple: boolean;
  declare maxSize: number;
  declare maxFiles: number;
  declare required: boolean;
  declare disabled: boolean;
  declare compact: boolean;
  declare noList: boolean;
  declare page: boolean;
  declare files: File[];
  declare progress: Map<File, number>;
  declare _drag: '' | 'accept' | 'reject';
  declare _dragText: string;
  declare _pageDrag: boolean;
  declare _rejection: string;
  declare _touched: boolean;
  declare _formDisabled: boolean;

  #internals = this.attachInternals();
  #ariaLabel: string | undefined;
  /** dragenter/dragleave fire for every child crossed, so count them instead of trusting one leave. */
  #depth = 0;
  #pageDepth = 0;
  #watchdog: ReturnType<typeof setTimeout> | undefined;
  #pageBound = false;

  constructor() {
    super();
    this.label = '';
    this.helper = '';
    this.error = '';
    this.name = '';
    this.accept = '';
    this.multiple = false;
    this.maxSize = 0;
    this.maxFiles = 0;
    this.required = false;
    this.disabled = false;
    this.compact = false;
    this.noList = false;
    this.page = false;
    this.files = [];
    this.progress = new Map();
    this._drag = '';
    this._dragText = '';
    this._pageDrag = false;
    this._rejection = '';
    this._touched = false;
    this._formDisabled = false;
    this.addEventListener('invalid', () => (this._touched = true));
    // A `<label for>` outside the shadow root clicks the host; open the picker like a native input would.
    this.addEventListener('click', (e) => {
      if (e.composedPath()[0] === this) this.showPicker();
    });
  }

  /** Formats a byte count the way the list does: `512 B`, `1.5 KB`, `10 MB`. */
  static formatSize(bytes: number) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${i ? n.toFixed(1).replace(/\.0$/, '') : n} ${units[i]}`;
  }

  connectedCallback() {
    super.connectedCallback();
    // `aria-label` is not allowed on a generic host; move it to the native input.
    const al = this.getAttribute('aria-label');
    if (al) {
      this.#ariaLabel = al;
      this.removeAttribute('aria-label');
      this.requestUpdate();
    }
    if (this.page) this.#bindPage(true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#bindPage(false);
  }

  get #input() {
    return this.renderRoot.querySelector<HTMLInputElement>('input.native');
  }

  get #isDisabled() {
    return this.disabled || this._formDisabled;
  }

  /** The owning form, if any. */
  get form() {
    return this.#internals.form;
  }
  get validity() {
    return this.#internals.validity;
  }
  get validationMessage() {
    return this.#internals.validationMessage;
  }
  get willValidate() {
    return this.#internals.willValidate;
  }
  checkValidity() {
    return this.#internals.checkValidity();
  }
  reportValidity() {
    return this.#internals.reportValidity();
  }

  formResetCallback() {
    this.files = [];
    this.progress = new Map();
    this._rejection = '';
    this._touched = false;
  }
  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
  }

  /** Opens the system file picker. Must run from a click or key press. */
  showPicker() {
    if (!this.#isDisabled) this.#input?.click();
  }

  /**
   * Checks files against `accept`, `max-size` and `max-files` and adds the ones that pass, as a
   * drop would: fires `ht-reject` per turned-away file, `change` if any were added, and announces
   * the result. Use it for paste handlers. Returns the files that were added.
   */
  addFiles(list: FileList | Iterable<File>): File[] {
    if (this.#isDisabled) return [];
    const added: File[] = [];
    const rejected: DropzoneRejectDetail[] = [];
    const dupes: File[] = [];
    const limit = this.multiple ? this.maxFiles > 0 ? this.maxFiles : Infinity : 1;
    const next = this.multiple ? [...this.files] : [];
    const reject = (file: File, reason: DropzoneRejectReason, message: string) => rejected.push({ file, reason, message });
    const fmt = HtDropzone.formatSize;

    for (const file of list) {
      if (!this.#accepts(file)) {
        reject(file, 'type', `${file.name} is not an accepted file type.`);
      } else if (this.maxSize > 0 && file.size > this.maxSize) {
        reject(file, 'size', `${file.name} is ${fmt(file.size)}. The limit is ${fmt(this.maxSize)}.`);
      } else if (this.multiple && next.some((f) => sameFile(f, file))) {
        dupes.push(file);
      } else if (next.length >= limit) {
        reject(file, 'count', this.multiple
          ? `${file.name} was not added. The limit is ${limit} files.`
          : `${file.name} was not added. Choose one file.`);
      } else {
        next.push(file);
        added.push(file);
      }
    }

    this._touched = true;
    this._rejection = rejected.map((r) => r.message).join(' ');
    if (added.length) this.files = next;
    for (const detail of rejected) {
      this.dispatchEvent(new CustomEvent<DropzoneRejectDetail>('ht-reject', { detail, bubbles: true, composed: true }));
    }

    const said: string[] = [];
    if (added.length === 1) said.push(`${added[0].name} added.`);
    else if (added.length > 1) said.push(`${added.length} files added.`);
    for (const f of dupes) said.push(`${f.name} is already in the list.`);
    if (this._rejection) said.push(this._rejection);
    this.#announce(said.join(' '));

    if (added.length) this.#fireChange();
    return added;
  }

  /** Removes one file. Fires `change`. */
  removeFile(file: File) {
    if (!this.files.includes(file)) return;
    this.files = this.files.filter((f) => f !== file);
    this._rejection = '';
    this._touched = true;
    this.#announce(`${file.name} removed.`);
    this.#fireChange();
  }

  /** Removes every file. Fires `change`. */
  clear() {
    if (!this.files.length) return;
    this.files = [];
    this._rejection = '';
    this._touched = true;
    this.#announce('All files removed.');
    this.#fireChange();
  }

  #fireChange() {
    this.dispatchEvent(new CustomEvent('change', { detail: { files: [...this.files] }, bubbles: true }));
  }

  #announce(text: string) {
    const region = this.renderRoot.querySelector('.live');
    if (!region || !text) return;
    // Empty first, so the same sentence twice in a row is read twice.
    region.textContent = '';
    setTimeout(() => (region.textContent = text), 60);
  }

  #tokens() {
    return this.accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  }

  #matchesType(type: string, tokens: string[]) {
    const t = type.toLowerCase();
    return !!t && tokens.some((k) => (k.endsWith('/*') ? t.startsWith(k.slice(0, -1)) : t === k));
  }

  #accepts(file: File) {
    const tokens = this.#tokens();
    if (!tokens.length) return true;
    // Extension first: Windows reports a CSV as `application/vnd.ms-excel`, or with no type at all.
    const name = file.name.toLowerCase();
    if (tokens.some((k) => k.startsWith('.') && name.endsWith(k))) return true;
    return this.#matchesType(file.type, tokens.filter((k) => !k.startsWith('.')));
  }

  /**
   * During a drag only MIME types are known, not names. Say "not accepted" only when that is certain:
   * the limit is reached, or `accept` is all MIME patterns and no dragged type matches.
   */
  #verdict(dt: DataTransfer | null): ['accept' | 'reject', string] {
    const ok: ['accept', string] = ['accept', 'Drop to upload'];
    if (this.multiple && this.maxFiles > 0 && this.files.length >= this.maxFiles) {
      return ['reject', `Limit of ${this.maxFiles} files reached`];
    }
    const tokens = this.#tokens();
    if (!dt || !tokens.length) return ok;
    const items = [...dt.items].filter((i) => i.kind === 'file');
    if (!items.length || items.some((i) => !i.type)) return ok;
    if (items.some((i) => this.#matchesType(i.type, tokens))) return ok;
    if (tokens.some((k) => k.startsWith('.'))) return ok;
    return ['reject', items.length > 1 ? 'These file types are not accepted' : 'This file type is not accepted'];
  }

  #onDragEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    this.#depth++;
    if (this.#isDisabled) return;
    [this._drag, this._dragText] = this.#verdict(e.dataTransfer);
  };

  #onDragOver = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    // Cancelling dragover is what allows a drop; `none` while disabled stops the browser opening the file.
    e.preventDefault();
    e.dataTransfer!.dropEffect = this.#isDisabled ? 'none' : 'copy';
    if (!this.#isDisabled && !this._drag) [this._drag, this._dragText] = this.#verdict(e.dataTransfer);
  };

  #onDragLeave = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    this.#depth = Math.max(0, this.#depth - 1);
    if (!this.#depth) this._drag = '';
  };

  #onDrop = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    this.#depth = 0;
    this._drag = '';
    if (!this.#isDisabled && e.dataTransfer) this.addFiles(e.dataTransfer.files);
  };

  #bindPage(on: boolean) {
    if (on === this.#pageBound) return;
    this.#pageBound = on;
    const handlers = [
      ['dragenter', this.#onPageEnter],
      ['dragover', this.#onPageOver],
      ['dragleave', this.#onPageLeave],
      ['drop', this.#onPageDrop],
    ] as const;
    for (const [type, fn] of handlers) {
      if (on) window.addEventListener(type, fn);
      else window.removeEventListener(type, fn);
    }
    if (!on) this.#hideOverlay();
  }

  #onPageEnter = (e: DragEvent) => {
    if (!hasFiles(e) || this.#isDisabled) return;
    this.#pageDepth++;
    this.#showOverlay();
  };

  #onPageOver = (e: DragEvent) => {
    if (!hasFiles(e) || this.#isDisabled) return;
    // An element under the pointer may have set its own drop effect already (a disabled zone sets `none`).
    const taken = e.defaultPrevented;
    e.preventDefault();
    if (e.dataTransfer && !taken) e.dataTransfer.dropEffect = 'copy';
    this.#showOverlay();
    // A drag that ends outside the window, or an element that stops propagation, can leave the count high.
    // dragover fires at least every 350ms while a drag is over the page, so a quiet second means it is over.
    clearTimeout(this.#watchdog);
    this.#watchdog = setTimeout(() => this.#hideOverlay(), 1000);
  };

  #onPageLeave = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    this.#pageDepth = Math.max(0, this.#pageDepth - 1);
    if (!this.#pageDepth) this.#hideOverlay();
  };

  #onPageDrop = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    this.#hideOverlay();
    // Something else took this drop (the zone itself, an editor): leave it.
    if (e.defaultPrevented || this.#isDisabled) return;
    e.preventDefault();
    if (e.dataTransfer) this.addFiles(e.dataTransfer.files);
  };

  #showOverlay() {
    if (this._pageDrag) return;
    this._pageDrag = true;
    const el = this.renderRoot.querySelector<HTMLElement>('.overlay');
    try {
      if (el && typeof el.showPopover === 'function' && !el.matches(':popover-open')) el.showPopover();
    } catch {
      /* Not connected yet, or no top layer: the fixed position below still covers the window. */
    }
  }

  #hideOverlay() {
    this.#pageDepth = 0;
    clearTimeout(this.#watchdog);
    if (!this._pageDrag) return;
    this._pageDrag = false;
    const el = this.renderRoot.querySelector<HTMLElement>('.overlay');
    try {
      if (el && typeof el.hidePopover === 'function' && el.matches(':popover-open')) el.hidePopover();
    } catch {
      /* already closed */
    }
  }

  /** Keeps the native input's own list equal to `files`, so a screen reader reads the right count. */
  #syncNative() {
    const input = this.#input;
    if (!input) return;
    try {
      const dt = new DataTransfer();
      for (const f of this.files) dt.items.add(f);
      input.files = dt.files;
    } catch {
      // No DataTransfer constructor: empty it, so picking the same file again still fires `change`.
      input.value = '';
    }
  }

  #onNativeChange = (e: Event) => {
    e.stopPropagation();
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.addFiles(input.files);
    this.#syncNative();
  };

  #removeAt = async (file: File, index: number) => {
    this.removeFile(file);
    await this.updateComplete;
    // The row is gone; keep focus in the list, or return it to the picker.
    const buttons = this.renderRoot.querySelectorAll<HTMLButtonElement>('button.remove');
    (buttons[Math.min(index, buttons.length - 1)] ?? this.#input)?.focus();
  };

  #clearAll = async () => {
    this.clear();
    await this.updateComplete;
    this.#input?.focus();
  };

  get #missingText() {
    return this.multiple ? 'Choose at least one file.' : 'Choose a file.';
  }

  updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has('page')) this.#bindPage(this.page && this.isConnected);
    if (changed.has('files')) this.#syncNative();
    const input = this.#input;
    if (!input) return;
    if (this.name && this.files.length) {
      const data = new FormData();
      for (const f of this.files) data.append(this.name, f);
      this.#internals.setFormValue(data);
    } else {
      this.#internals.setFormValue(null);
    }
    if (this.required && !this.files.length) this.#internals.setValidity({ valueMissing: true }, this.#missingText, input);
    else this.#internals.setValidity({});
  }

  static styles = css`
    :host { display: block; }
    .base { display: flex; flex-direction: column; gap: 6px; }
    [hidden] { display: none !important; }
    .label {
      font: 500 0.875rem/1.2 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .req { color: var(--ht-accent-text); margin-left: 2px; }
    .wrap { position: relative; }
    /* The real control: invisible, still focusable. Sits at the zone's bottom edge so a validation bubble points at it. */
    .native {
      position: absolute;
      left: 50%;
      bottom: 0;
      width: 1px;
      height: 1px;
      margin: 0;
      padding: 0;
      border: 0;
      opacity: 0;
      overflow: hidden;
      clip-path: inset(50%);
      pointer-events: none;
    }
    .zone {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 160px;
      padding: 28px 24px;
      text-align: center;
      color: var(--ht-text);
      font: 400 0.875rem/1.4 var(--ht-font-ui);
      background: color-mix(in oklch, var(--ht-text) 2%, transparent);
      border: 1px dashed var(--ht-border-input);
      border-radius: var(--ht-radius-lg);
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      transition: border-color var(--ht-duration) var(--ht-ease), background-color var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease);
    }
    .zone:hover { border-color: var(--ht-text-muted); background: color-mix(in oklch, var(--ht-text) 4%, transparent); }
    .native:focus-visible + .zone { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
    /* Drag-over: the accent border and a dot screen that fades out from the middle. */
    .dots {
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      background: var(--ht-halftone-stage);
      -webkit-mask-image: radial-gradient(closest-side, #000 25%, transparent);
      mask-image: radial-gradient(closest-side, #000 25%, transparent);
      opacity: 0;
      transition: opacity var(--ht-duration-in) var(--ht-ease);
    }
    .zone.invalid { border-color: var(--ht-danger); }
    .zone[data-drag='accept'] { border-color: var(--ht-accent); background: color-mix(in oklab, var(--ht-accent) 5%, transparent); }
    .zone[data-drag='accept'] .dots { opacity: 1; }
    .zone[data-drag='reject'] {
      border-color: var(--ht-danger);
      background: color-mix(in oklab, var(--ht-danger) 6%, transparent);
      color: var(--ht-danger-text);
    }
    .icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      color: var(--ht-accent-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border-strong);
      border-radius: var(--ht-radius-md);
      box-shadow: var(--ht-shadow-xs);
      transition: transform var(--ht-duration-in) var(--ht-ease-spring);
    }
    .zone[data-drag='accept'] .icon { transform: translateY(-3px); }
    .zone[data-drag='reject'] .icon { color: var(--ht-danger-text); }
    .text { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; }
    .prompt { font-weight: 500; }
    .browse {
      color: var(--ht-accent-text);
      text-decoration: underline;
      text-decoration-color: color-mix(in oklab, currentColor 45%, transparent);
      text-underline-offset: 3px;
    }
    .zone:hover .browse { text-decoration-color: currentColor; }
    .hint { font-size: 0.75rem; line-height: 1.3; color: var(--ht-text-muted); }
    .zone[data-drag] .hint { visibility: hidden; }

    /* Compact: one row, paperclip first, as in a comment composer. */
    :host([compact]) .zone {
      flex-direction: row;
      justify-content: flex-start;
      gap: 8px;
      min-height: 40px;
      padding: 8px 12px;
      text-align: start;
      border-radius: var(--ht-radius-md);
    }
    :host([compact]) .icon {
      width: auto;
      height: auto;
      color: var(--ht-text-muted);
      background: none;
      border: 0;
      box-shadow: none;
    }
    :host([compact]) .zone[data-drag='accept'] .icon { transform: none; color: var(--ht-accent-text); }
    :host([compact]) .text { flex: 1; flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: 2px 12px; }
    :host([compact]) .prompt { font-weight: 400; font-size: 0.8125rem; }
    :host([compact]) .hint { margin-inline-start: auto; }

    .zone.disabled {
      cursor: not-allowed;
      color: var(--ht-text-subtle);
      background: transparent;
      border-color: var(--ht-border);
    }
    .zone.disabled .icon { color: var(--ht-text-subtle); box-shadow: none; }
    .zone.disabled .browse { color: inherit; }
    .zone.disabled .hint { color: var(--ht-text-subtle); }

    .message {
      font: 400 0.75rem/1.3 var(--ht-font-ui);
      color: var(--ht-danger-text);
    }

    /* File list */
    .files { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font: 500 0.6875rem/1 var(--ht-font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ht-text-muted);
    }
    .clear {
      all: unset;
      box-sizing: border-box;
      padding: 4px 6px;
      margin-inline-end: -6px;
      font: 500 0.75rem/1 var(--ht-font-ui);
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-sm);
      cursor: pointer;
    }
    .clear:hover { color: var(--ht-text); background: color-mix(in oklch, var(--ht-text) 6%, transparent); }
    .clear:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 1px; }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    .file {
      position: relative;
      overflow: hidden;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
      padding: 6px 6px 6px 10px;
      background: var(--ht-surface);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-md);
    }
    .ficon { display: grid; color: var(--ht-text-muted); }
    .meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .name {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font: 500 0.8125rem/1.3 var(--ht-font-ui);
      color: var(--ht-text);
    }
    .size { font: 400 0.75rem/1.2 var(--ht-font-mono); color: var(--ht-text-muted); }
    .remove {
      all: unset;
      box-sizing: border-box;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-sm);
      cursor: pointer;
    }
    .remove:hover { color: var(--ht-text); background: color-mix(in oklch, var(--ht-text) 6%, transparent); }
    .remove:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 0; }
    .remove:disabled { cursor: not-allowed; color: var(--ht-text-subtle); background: none; }
    /* Upload progress: a 3px line along the row's bottom edge. Leans toward the text colour for 3:1 on the surface. */
    .bar {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 3px;
      background: color-mix(in oklch, var(--ht-text) 8%, transparent);
    }
    .fill {
      display: block;
      height: 100%;
      background: color-mix(in oklab, var(--ht-accent) 70%, var(--ht-text));
      transform-origin: left;
      transform: scaleX(var(--_p));
      transition: transform 200ms var(--ht-ease);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      border: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    /* Page overlay: in the top layer when popovers are supported, a fixed layer otherwise. Never catches the pointer. */
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      box-sizing: border-box;
      width: auto;
      height: auto;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 24px;
      border: 0;
      place-items: center;
      pointer-events: none;
      color: var(--ht-text);
      background: color-mix(in oklab, var(--ht-bg) 82%, transparent);
    }
    .overlay.on { display: grid; animation: overlay-in var(--ht-duration-in) var(--ht-ease) both; }
    .overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--ht-halftone-stage);
      -webkit-mask-image: radial-gradient(closest-side, #000 35%, transparent);
      mask-image: radial-gradient(closest-side, #000 35%, transparent);
    }
    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 32px 48px;
      background: var(--ht-surface);
      border: 1px dashed var(--ht-accent);
      border-radius: var(--ht-radius-lg);
      box-shadow: var(--ht-shadow-md);
    }
    .card .icon { margin-bottom: 4px; }
    .card strong { font: 600 1.25rem/1.2 var(--ht-font-display); letter-spacing: 0.01em; }
    .card .eyebrow {
      font: 500 0.6875rem/1 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-muted);
    }
    @keyframes overlay-in { from { opacity: 0; } }

    @media (prefers-reduced-motion: reduce) {
      .zone, .dots, .icon, .fill { transition: none; }
      .zone[data-drag='accept'] .icon { transform: none; }
      .overlay.on { animation: none; }
    }
  `;

  #renderPrompt() {
    if (this._drag) return this._dragText;
    const many = this.multiple;
    if (this.compact) {
      return html`<span class="browse">Attach ${many ? 'files' : 'a file'}</span> or drop ${many ? 'them' : 'it'} here`;
    }
    if (!many && this.files.length) return html`Drop a new file to replace it, or <span class="browse">browse</span>`;
    return html`Drop ${many ? 'files' : 'a file'} here or <span class="browse">browse</span>`;
  }

  #renderList() {
    if (this.noList || !this.files.length) return nothing;
    const disabled = this.#isDisabled;
    const fmt = HtDropzone.formatSize;
    const total = this.files.reduce((n, f) => n + f.size, 0);
    return html`<div class="files">
      ${this.multiple && this.files.length > 1
        ? html`<div class="head">
            <span>${this.files.length} files · ${fmt(total)}</span>
            <button type="button" class="clear" ?disabled=${disabled} @click=${this.#clearAll}>Clear All</button>
          </div>`
        : nothing}
      <ul part="list" aria-label=${this.label ? `${this.label}: chosen files` : 'Chosen files'}>
        ${this.files.map((file, i) => {
          const p = this.progress.get(file);
          const pct = p == null ? null : Math.max(0, Math.min(100, Math.round(p)));
          return html`<li part="file" class="file">
            <span class="ficon">${icon(FILE, 18)}</span>
            <span class="meta">
              <span class="name" title=${file.name}>${file.name}</span>
              <span class="size">${fmt(file.size)}${pct == null ? nothing : pct >= 100 ? ' · Done' : ` · ${pct}%`}</span>
            </span>
            <button type="button" part="remove" class="remove" aria-label="Remove ${file.name}" ?disabled=${disabled}
              @click=${() => this.#removeAt(file, i)}>${icon(X, 16)}</button>
            ${pct == null
              ? nothing
              : html`<span part="progress" class="bar" role="progressbar" aria-label="Uploading ${file.name}"
                  aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct}><span class="fill" style="--_p:${pct / 100}"></span></span>`}
          </li>`;
        })}
      </ul>
    </div>`;
  }

  render() {
    const disabled = this.#isDisabled;
    const missing = this._touched && this.required && !this.files.length ? this.#missingText : '';
    const message = this.error || this._rejection || missing;
    const describedBy = [this.helper ? 'hint' : '', message ? 'message' : ''].filter(Boolean).join(' ');
    return html`
      <div class="base">
        ${this.label
          ? html`<label id="label" part="label" class="label" for="input">${this.label}${this.required
              ? html`<span class="req" aria-hidden="true">*</span>`
              : nothing}</label>`
          : nothing}
        <div class="wrap">
          <input
            id="input"
            class="native"
            type="file"
            accept=${ifDefined(this.accept || undefined)}
            ?multiple=${this.multiple}
            ?disabled=${disabled}
            aria-labelledby=${ifDefined(this.label ? 'label' : undefined)}
            aria-label=${ifDefined(this.label ? undefined : this.#ariaLabel)}
            aria-describedby=${ifDefined(describedBy || undefined)}
            aria-invalid=${message ? 'true' : 'false'}
            @change=${this.#onNativeChange}
            @input=${(e: Event) => e.stopPropagation()}
          />
          <label
            part="zone"
            for="input"
            class="zone ${message ? 'invalid' : ''} ${disabled ? 'disabled' : ''}"
            data-drag=${ifDefined(this._drag || undefined)}
            @dragenter=${this.#onDragEnter}
            @dragover=${this.#onDragOver}
            @dragleave=${this.#onDragLeave}
            @drop=${this.#onDrop}
          >
            <span class="dots" aria-hidden="true"></span>
            <span class="icon">${icon(this.compact ? CLIP : UPLOAD, this.compact ? 18 : 20)}</span>
            <span class="text">
              <span class="prompt">${this.#renderPrompt()}</span>
              ${this.helper ? html`<span id="hint" part="hint" class="hint">${this.helper}</span>` : nothing}
            </span>
          </label>
        </div>
        ${message
          ? html`<div id="message" part="message" class="message" role=${ifDefined(this.error ? 'alert' : undefined)}>${message}</div>`
          : nothing}
        ${this.#renderList()}
      </div>
      <div class="live sr-only" role="status" aria-live="polite"></div>
      ${this.page
        ? html`<div part="overlay" class="overlay ${this._pageDrag ? 'on' : ''}" popover="manual" aria-hidden="true">
            <div class="card">
              <span class="icon">${icon(UPLOAD, 20)}</span>
              <strong>Drop to upload</strong>
              ${this.label ? html`<span class="eyebrow">${this.label}</span>` : nothing}
            </div>
          </div>`
        : nothing}
    `;
  }
}

if (!customElements.get('ht-dropzone')) customElements.define('ht-dropzone', HtDropzone);

declare global {
  interface HTMLElementTagNameMap {
    'ht-dropzone': HtDropzone;
  }
}
