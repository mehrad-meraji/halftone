import { LitElement, css, html, nothing, svg } from 'lit';
import type { SVGTemplateResult } from 'lit';

type CopyStatus = 'idle' | 'copied' | 'failed';

/**
 * Code block with a header and a copy button, for setup steps, API keys, JSON payloads and
 * log lines. The header shows a `label` (a file name, "Terminal") and a `language` tag. Text
 * comes from the light DOM or the `code` property.
 *
 * `language` also picks the syntax colours: `js` / `ts` (and `jsx`, `tsx`), `json`, `bash` (`sh`,
 * `shell`, `terminal`), `css`, `html` (`xml`, `svg`), `env`, `log` and `py`. Any other language
 * shows plain text. The highlighter is small and built in: it colours keywords, strings, numbers,
 * comments, functions, properties, tags and variables, and does not parse. `no-highlight` turns it off.
 *
 * Light DOM text is tidied so the markup can be indented: one blank line at the start and one
 * at the end are dropped, and the indent all lines share is removed. Escape `<` and `&` as
 * `&lt;` and `&amp;` in HTML. The `code` property is shown exactly as given.
 *
 * @tag ht-code
 * @summary Code block with a copy button.
 *
 * @slot - The code, as plain text. Not shown as is: it is read, tidied and drawn in the block.
 *
 * @csspart base - The outer box.
 * @csspart header - The header strip.
 * @csspart label - The label text.
 * @csspart language - The language tag.
 * @csspart copy-button - The copy button.
 * @csspart reveal-button - The Reveal / Hide button shown with `secret`.
 * @csspart scroll - The scroll container around the code.
 * @csspart code - The `<pre>` element.
 *
 * @cssprop [--ht-code-max-height=none] - Height at which the block stops growing and scrolls. `max-lines` sets it from a line count.
 * @cssprop --ht-code-keyword - Syntax colour for keywords, CSS at-rules and shell keywords. A token in tokens.css, like the seven below.
 * @cssprop --ht-code-string - Syntax colour for strings and `.env` values.
 * @cssprop --ht-code-number - Syntax colour for numbers, `true` / `false` / `null`, hex colours and log warnings.
 * @cssprop --ht-code-comment - Syntax colour for comments, timestamps and debug lines.
 * @cssprop --ht-code-function - Syntax colour for function calls, shell commands and log info.
 * @cssprop --ht-code-property - Syntax colour for JSON keys, CSS properties, object properties and shell flags.
 * @cssprop --ht-code-tag - Syntax colour for HTML tags, CSS selectors and log errors.
 * @cssprop --ht-code-variable - Syntax colour for shell variables, CSS custom properties and HTML attributes.
 *
 * @fires {CustomEvent<{ text: string }>} ht-copy - After the text was written to the clipboard. `detail.text` is what was copied.
 */
export class HtCode extends LitElement {
  static properties = {
    /** Header label, e.g. a file name or "Terminal". Also names the scroll region. */
    label: {},
    /** Language tag shown in the header, e.g. `json` or `bash`. Also picks the syntax colours; an unknown language shows plain text. */
    language: {},
    /** Turns the syntax colours off. */
    noHighlight: { type: Boolean, reflect: true, attribute: 'no-highlight' },
    /** The code. When set, it is used instead of the light DOM text, exactly as given. */
    code: {},
    /** Soft-wraps long lines. By default they scroll sideways. */
    wrap: { type: Boolean, reflect: true },
    /** Shows line numbers. They are decoration: not copied and not read out. */
    lineNumbers: { type: Boolean, reflect: true, attribute: 'line-numbers' },
    /** Lines shown before the block scrolls. `0` means no limit. */
    maxLines: { type: Number, attribute: 'max-lines' },
    /** Hides the copy button. */
    noCopy: { type: Boolean, reflect: true, attribute: 'no-copy' },
    /** Masks the text with a Reveal button, for a token shown once. Copy still copies the real value. The text is still in the page; this only hides it from view. If the copy fails, the text is revealed and selected. */
    secret: { type: Boolean, reflect: true },
    _text: { state: true },
    _status: { state: true },
    _revealed: { state: true },
    _overflows: { state: true },
  };

  declare label: string;
  declare language: string;
  declare noHighlight: boolean;
  declare code: string | null;
  declare wrap: boolean;
  declare lineNumbers: boolean;
  declare maxLines: number;
  declare noCopy: boolean;
  declare secret: boolean;
  declare _text: string;
  declare _status: CopyStatus;
  declare _revealed: boolean;
  declare _overflows: boolean;

  #timer: ReturnType<typeof setTimeout> | undefined;
  #mutations = new MutationObserver(() => this.#read());
  #resize = new ResizeObserver(() => this.#measure());

  constructor() {
    super();
    this.label = '';
    this.language = '';
    this.noHighlight = false;
    this.code = null;
    this.wrap = false;
    this.lineNumbers = false;
    this.maxLines = 0;
    this.noCopy = false;
    this.secret = false;
    this._text = '';
    this._status = 'idle';
    this._revealed = false;
    this._overflows = false;
  }

  static styles = css`
    :host {
      display: block;
      /* As a grid or flex item, shrink and scroll instead of stretching the layout to the longest line. */
      min-width: 0;
      /* One line of code: 0.8125rem text at 1.6 line height. */
      --_lh: 1.3rem;
      --_pad: 12px;
    }
    .box {
      overflow: hidden;
      color: var(--ht-text);
      background: var(--ht-surface-sunken);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-md);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 2rem;
      padding: 0 4px 0 12px;
      background: var(--ht-halftone), var(--ht-surface-muted);
      border-bottom: 1px solid var(--ht-border);
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font: 400 0.75rem/1.2 var(--ht-font-mono);
      color: var(--ht-text-muted);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .language {
      flex-shrink: 0;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }
    .actions { display: flex; flex-shrink: 0; gap: 2px; }

    /* Quiet xs button: 24px, flat, a tint on hover. */
    button {
      all: unset;
      box-sizing: border-box;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 1.5rem;
      padding-inline: 0.5rem;
      font: 400 0.75rem/1rem var(--ht-font-ui);
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      color: var(--ht-text-muted);
      border-radius: var(--ht-radius-md);
      transition: background-color var(--ht-duration) var(--ht-ease), color var(--ht-duration) var(--ht-ease);
    }
    button:hover { background: color-mix(in oklch, var(--ht-text) 6%, transparent); color: var(--ht-text); }
    button:active { background: color-mix(in oklch, var(--ht-text) 10%, transparent); }
    button:focus-visible { box-shadow: 0 0 0 2px var(--ht-focus); }
    /* Wide enough for "Copied", so the header does not shift. */
    .copy { min-width: 5rem; }
    .copy[data-status='copied'] { color: color-mix(in oklab, var(--ht-success) 50%, var(--ht-text)); }
    .copy[data-status='failed'] { color: var(--ht-danger-text); }
    svg { flex-shrink: 0; }

    .scroll {
      overflow: auto;
      max-height: var(--ht-code-max-height, none);
      overscroll-behavior-x: contain;
    }
    .scroll:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }
    pre {
      box-sizing: border-box;
      width: max-content;
      min-width: 100%;
      margin: 0;
      padding: var(--_pad);
      font: 400 0.8125rem / var(--_lh) var(--ht-font-mono);
      tab-size: 2;
      white-space: pre;
    }
    code { font: inherit; }
    :host([wrap]) pre { width: auto; white-space: pre-wrap; overflow-wrap: anywhere; }
    .masked { user-select: none; letter-spacing: 0.05em; }

    /* Syntax colours. Comments are italic as well, so they do not rely on colour alone. */
    .t-keyword { color: var(--ht-code-keyword); }
    .t-string { color: var(--ht-code-string); }
    .t-number { color: var(--ht-code-number); }
    .t-comment { color: var(--ht-code-comment); font-style: italic; }
    .t-function { color: var(--ht-code-function); }
    .t-property { color: var(--ht-code-property); }
    .t-tag { color: var(--ht-code-tag); }
    .t-variable { color: var(--ht-code-variable); }
    @media (forced-colors: active) {
      [class^='t-'] { color: CanvasText; }
    }

    /* Line numbers: one block per line, the number in a CSS counter so it is never copied or read. */
    .lines { counter-reset: line; }
    .line {
      display: grid;
      grid-template-columns: var(--_gutter) minmax(0, 1fr);
      min-height: var(--_lh);
    }
    .line::before {
      counter-increment: line;
      content: counter(line) / '';
      padding-right: 12px;
      text-align: right;
      color: var(--ht-text-subtle);
      user-select: none;
    }

    .vh {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
    [hidden] { display: none !important; }
    @media (prefers-reduced-motion: reduce) {
      button { transition: none; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.#read();
    this.#mutations.observe(this, { childList: true, characterData: true, subtree: true });
    if (this.hasUpdated) this.#observe();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#mutations.disconnect();
    this.#resize.disconnect();
    clearTimeout(this.#timer);
  }

  firstUpdated() {
    this.#observe();
  }

  updated() {
    // After the update, not during it, so setting `_overflows` does not start a nested update.
    void this.updateComplete.then(() => this.#measure());
  }

  /** Also measures when the scroll box or the code changes size without a render, e.g. the page narrows. */
  #observe() {
    const scroll = this.renderRoot.querySelector('.scroll');
    const pre = this.renderRoot.querySelector('pre');
    if (scroll) this.#resize.observe(scroll);
    if (pre) this.#resize.observe(pre);
  }

  /** The text the block shows and copies. */
  get text(): string {
    return this.code != null && this.code !== '' ? this.code : this._text;
  }

  /** Copies the text to the clipboard. Resolves to `true` when it worked. */
  async copy(): Promise<boolean> {
    const text = this.text;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
    } catch {
      this.#show('failed', 'Copy failed. The text is selected; copy it by hand.', 3000);
      if (this.secret) this._revealed = true;
      await this.updateComplete;
      this.#select();
      return false;
    }
    this.#show('copied', 'Copied to the clipboard.', 1500);
    this.dispatchEvent(new CustomEvent('ht-copy', { detail: { text }, bubbles: true, composed: true }));
    return true;
  }

  #read() {
    this._text = tidy(this.textContent ?? '');
  }

  #show(status: CopyStatus, message: string, ms: number) {
    clearTimeout(this.#timer);
    this._status = status;
    const live = this.renderRoot.querySelector('.live');
    if (live) {
      // Clear, then set a moment later, so the same message is announced again on a second click. A timeout, not a frame: frames do not run in a background tab.
      live.textContent = '';
      setTimeout(() => (live.textContent = message), 50);
    }
    this.#timer = setTimeout(() => {
      this._status = 'idle';
      if (live) live.textContent = '';
    }, ms);
  }

  #select() {
    const code = this.renderRoot.querySelector('code');
    const selection = document.getSelection();
    if (!code || !selection) return;
    try {
      selection.selectAllChildren(code);
    } catch {
      /* Some browsers refuse a selection inside a shadow root. The message still says what happened. */
    }
  }

  #measure() {
    const scroll = this.renderRoot.querySelector<HTMLElement>('.scroll');
    if (!scroll) return;
    const overflows = scroll.scrollWidth > scroll.clientWidth + 1 || scroll.scrollHeight > scroll.clientHeight + 1;
    if (overflows !== this._overflows) this._overflows = overflows;
  }

  #toggleReveal = () => {
    this._revealed = !this._revealed;
  };

  #onCopy = () => {
    void this.copy();
  };

  render() {
    const text = this.text;
    const masked = this.secret && !this._revealed;
    const shown = masked ? text.replace(/\S/g, '•') : text;
    const hasHeader = !!(this.label || this.language) || !this.noCopy || this.secret;
    const lines = shown.split('\n');
    const gutter = `calc(${String(lines.length).length}ch + 12px)`;
    // Masked text and unknown languages stay plain. Tokens are split at line breaks so line numbers still work.
    const rules = masked || this.noHighlight ? undefined : LANGS[this.language.trim().toLowerCase()];
    const colored = rules ? byLine(scan(text, rules)) : undefined;
    const maxHeight = this.maxLines > 0 ? `max-height: calc(${this.maxLines} * var(--_lh) + 2 * var(--_pad))` : nothing;
    const status = this._status;
    const copyText = status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy Failed' : 'Copy';
    // Says which block a button acts on, e.g. "Copy Terminal". Hidden, so the visible text stays the start of the name.
    const context = this.label ? html`<span class="vh"> ${this.label}</span>` : nothing;
    // No whitespace inside <pre>: it would show.
    const body = this.lineNumbers
      ? html`<code class="lines ${masked ? 'masked' : ''}" style="--_gutter: ${gutter}">${(colored ?? lines).map((l) => html`<span class="line">${typeof l === 'string' ? l : draw(l)}</span>`)}</code>`
      : html`<code class=${masked ? 'masked' : ''}>${colored ? colored.map((l, i) => html`${i ? '\n' : ''}${draw(l)}`) : shown}</code>`;

    return html`
      <div part="base" class="box">
        <div part="header" class="header" ?hidden=${!hasHeader}>
          <span part="label" class="label">${this.label}</span>
          ${this.language ? html`<span part="language" class="language">${this.language}</span>` : nothing}
          <span class="actions">
            ${this.secret
              ? html`<button part="reveal-button" type="button" @click=${this.#toggleReveal}>
                  ${this._revealed ? eyeOff : eye}<span>${this._revealed ? 'Hide' : 'Reveal'}</span>${context}
                </button>`
              : nothing}
            ${this.noCopy
              ? nothing
              : html`<button part="copy-button" class="copy" type="button" data-status=${status} @click=${this.#onCopy}>
                  ${status === 'copied' ? check : copyIcon}<span>${copyText}</span>${context}
                </button>`}
          </span>
        </div>
        <div
          part="scroll"
          class="scroll"
          style=${maxHeight}
          role=${this._overflows ? 'region' : nothing}
          aria-label=${this._overflows ? this.label || this.language || 'Code' : nothing}
          tabindex=${this._overflows ? 0 : nothing}
        ><pre part="code">${body}</pre></div>
        <span class="live vh" role="status" aria-live="polite" aria-atomic="true"></span>
        <slot hidden></slot>
      </div>
    `;
  }
}

/** Drops one blank line at each end and removes the indent every non-blank line shares. */
function tidy(raw: string): string {
  let lines = raw.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length > 1 && lines[0].trim() === '') lines = lines.slice(1);
  if (lines.length > 1 && lines[lines.length - 1].trim() === '') lines = lines.slice(0, -1);
  const indent = (l: string) => /^[ \t]*/.exec(l)![0].length;
  const indents = lines.filter((l) => l.trim() !== '').map(indent);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(Math.min(cut, indent(l)))).join('\n');
}

/* ───────── Syntax colours ─────────
 * A small scanner, not a parser. Each language is a list of rules tried in order at the current
 * position; the first sticky regex that matches wins. `when` checks the text just before the
 * match, so the rules need no lookbehind (older Safari cannot parse it). Text no rule takes stays plain. */

type Kind = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'property' | 'tag' | 'variable';
type Token = [text: string, kind: Kind | null];
interface Rule {
  kind: Kind | null;
  re: RegExp;
  when?: RegExp;
}

const r = (kind: Kind | null, re: RegExp, when?: RegExp): Rule => ({ kind, re, when });

const DQ = /"(?:\\.|[^\\"\n])*"?/y;
const SQ = /'(?:\\.|[^\\'\n])*'?/y;
const NUM = /(?:0[xob][\da-f_]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?)\b/iy;
/** Not right after a word character or a dot, so `x1` and `a.if` are not split. */
const START = /(?:^|[^\w$.])$/;

const JS: Rule[] = [
  r('comment', /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/y),
  r('string', /`(?:\\[\s\S]|[^\\`])*`?/y),
  r('string', DQ),
  r('string', SQ),
  r('number', NUM, START),
  r('number', /(?:true|false|null|undefined|NaN|Infinity)\b/y, START),
  r('keyword', /(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|this|super|yield|delete|void|static|get|set|interface|type|enum|implements|declare|readonly|public|private|protected|as|satisfies|keyof)\b/y, START),
  r('function', /[A-Za-z_$][\w$]*(?=\s*\()/y),
  r('property', /[A-Za-z_$][\w$]*/y, /\.\s*$/),
  r(null, /[A-Za-z_$][\w$]*/y),
];

const JSON_RULES: Rule[] = [
  r('comment', /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/y),
  r('property', /"(?:\\.|[^\\"\n])*"(?=\s*:)/y),
  r('string', DQ),
  r('number', /-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/iy),
  r('number', /(?:true|false|null)\b/y),
];

const BASH: Rule[] = [
  r('comment', /^[ \t]*\$(?=\s)/my),
  r('comment', /#.*/y, /(?:^|\s)$/),
  r('string', DQ),
  r('string', SQ),
  r('variable', /\$\{[^}\n]*\}?|\$[A-Za-z_]\w*|\$[0-9@#?*!$-]/y),
  r('keyword', /(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|function|in|export|local|return)\b/y, /(?:^|[\s;|&(])$/),
  r('function', /[A-Za-z0-9_./~-][\w./~:@-]*/y, /(?:^|\n)[ \t]*(?:\$[ \t]+)?$|[|;&(][ \t]*$|\b(?:sudo|then|do|else|xargs|exec)[ \t]+$/),
  r('property', /--?[A-Za-z][\w-]*/y, /\s$/),
  r('number', /\d+(?:\.\d+)*\b/y, /(?:^|[\s=:])$/),
  r(null, /[\w.-]+/y),
];

const CSS: Rule[] = [
  r('comment', /\/\*[\s\S]*?(?:\*\/|$)/y),
  r('string', DQ),
  r('string', SQ),
  r('keyword', /@[\w-]+|!important\b/y),
  r('variable', /--[\w-]+/y),
  r('property', /[\w-]+(?=\s*:(?!:))/y, /[{;][ \t\n]*$/),
  r('number', /#[\da-f]{3,8}\b/iy),
  r('number', /-?(?:\d+\.?\d*|\.\d+)(?:%|[a-z]+)?/iy),
  r('function', /[\w-]+(?=\()/y),
  r('tag', /[.#][A-Za-z_-][\w-]*|::?[\w-]+/y, /(?:^|[}\s,>+~(]|[\w\])])$/),
  r(null, /[\w-]+/y),
];

const HTML: Rule[] = [
  r('comment', /<!--[\s\S]*?(?:-->|$)/y),
  r('tag', /<\/?[A-Za-z][\w:.-]*|\/?>/y),
  r('string', /"[^"]*"?|'[^']*'?/y, /<[A-Za-z][^<>]*=\s*$/),
  r('variable', /[^\s"'<>\/=]+/y, /<[A-Za-z][^<>]*\s$/),
  r('number', /&#?\w+;/y),
  r(null, /[^<&\s="']+/y),
];

const ENV: Rule[] = [
  r('comment', /#.*/y, /(?:^|\n)[ \t]*$/),
  r('keyword', /export\b/y, /(?:^|\n)[ \t]*$/),
  r('property', /[A-Za-z_][\w.-]*(?=\s*=)/y),
  r('string', /[^\n]+/y, /=\s*$/),
];

const LOG: Rule[] = [
  r('comment', /\d{4}-\d{2}-\d{2}[T ][\d:.,]+(?:Z|[+-]\d{2}:?\d{2})?|\d{2}:\d{2}:\d{2}(?:[.,]\d+)?/y),
  r('tag', /(?:ERROR|ERR|FATAL|CRITICAL|PANIC)\b/y, /(?:^|\W)$/),
  r('number', /(?:WARN|WARNING)\b/y, /(?:^|\W)$/),
  r('function', /(?:INFO|NOTICE)\b/y, /(?:^|\W)$/),
  r('comment', /(?:DEBUG|TRACE)\b/y, /(?:^|\W)$/),
  r('string', DQ),
  r('property', /[A-Za-z_][\w.-]*(?==)/y),
  r('number', /-?\d+(?:\.\d+)?(?:ms|s|kb|mb|gb|%)?\b/iy, /(?:^|[^\w.])$/),
  r(null, /[A-Za-z_][\w.-]*/y),
];

const PY: Rule[] = [
  r('comment', /#.*/y),
  r('string', /[rbuf]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/iy, /(?:^|[^\w])$/),
  r('string', /[rbuf]{0,2}(?:"(?:\\.|[^\\"\n])*"?|'(?:\\.|[^\\'\n])*'?)/iy, /(?:^|[^\w])$/),
  r('number', NUM, START),
  r('number', /(?:True|False|None)\b/y, START),
  r('keyword', /(?:def|class|return|if|elif|else|for|while|in|not|and|or|is|import|from|as|with|try|except|finally|raise|lambda|pass|break|continue|yield|async|await|global|nonlocal|del|assert|match|case|self)\b/y, START),
  r('tag', /@[\w.]+/y),
  r('function', /[A-Za-z_]\w*(?=\s*\()/y),
  r('property', /[A-Za-z_]\w*/y, /\.\s*$/),
  r(null, /[A-Za-z_]\w*/y),
];

const LANGS: Record<string, Rule[]> = {
  js: JS, javascript: JS, mjs: JS, cjs: JS, jsx: JS, ts: JS, typescript: JS, tsx: JS,
  json: JSON_RULES, jsonc: JSON_RULES, json5: JSON_RULES,
  bash: BASH, sh: BASH, shell: BASH, zsh: BASH, terminal: BASH, console: BASH,
  css: CSS, scss: CSS, less: CSS,
  html: HTML, xml: HTML, svg: HTML,
  env: ENV, dotenv: ENV,
  log: LOG, logs: LOG,
  py: PY, python: PY,
};

/** Splits text into coloured and plain tokens. */
function scan(text: string, rules: Rule[]): Token[] {
  const out: Token[] = [];
  let plain = '';
  let i = 0;
  const flush = () => {
    if (plain) out.push([plain, null]);
    plain = '';
  };
  outer: while (i < text.length) {
    for (const { kind, re, when } of rules) {
      if (when && !when.test(text.slice(Math.max(0, i - 200), i))) continue;
      re.lastIndex = i;
      const m = re.exec(text);
      if (!m || !m[0]) continue;
      if (kind) {
        flush();
        out.push([m[0], kind]);
      } else plain += m[0];
      i += m[0].length;
      continue outer;
    }
    plain += text[i++];
  }
  flush();
  return out;
}

/** Splits tokens at line breaks, so each line can be its own block when line numbers are on. */
function byLine(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const [text, kind] of tokens) {
    text.split('\n').forEach((part, j) => {
      if (j) lines.push([]);
      if (part) lines[lines.length - 1].push([part, kind]);
    });
  }
  return lines;
}

const draw = (line: Token[]) => line.map(([text, kind]) => (kind ? html`<span class="t-${kind}">${text}</span>` : text));

const icon = (paths: SVGTemplateResult) =>
  html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">${paths}</svg>`;
const copyIcon = icon(svg`<rect x="8" y="8" width="13" height="13"></rect><path d="M16 8V3H3v13h5"></path>`);
const check = icon(svg`<path d="M4 12l5 5L20 6"></path>`);
const eye = icon(svg`<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle>`);
const eyeOff = icon(svg`<path d="M3 3l18 18"></path><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>`);

if (!customElements.get('ht-code')) customElements.define('ht-code', HtCode);

declare global {
  interface HTMLElementTagNameMap {
    'ht-code': HtCode;
  }
}
