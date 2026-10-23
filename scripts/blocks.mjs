// Reads and checks the blocks in src/blocks. Used by build-registry.mjs and build-llms.mjs.
// A block is a folder `src/blocks/<name>/` with `<name>.html` (markup that composes ht-* elements)
// and `<name>.md` (front matter plus notes for people and agents). Its components are derived from
// the tags in the HTML, never written by hand.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Maps every element tag to the component folder that defines it, read from the component source. */
export function elementFolders(root) {
  const map = new Map();
  for (const dir of readdirSync(join(root, 'src/components'), { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const ts = readFileSync(join(root, 'src/components', dir.name, `${dir.name}.ts`), 'utf8');
    const tags = [
      ...ts.matchAll(/customElements\.define\('(ht-[a-z-]+)'/g),
      ...ts.matchAll(/\[\s*'(ht-[a-z-]+)'\s*,\s*Ht[A-Za-z]+\s*\]/g),
    ].map((m) => m[1]);
    for (const tag of tags) map.set(tag, dir.name);
  }
  return map;
}

/** Splits `---` front matter (flat `key: value` lines) from the body. */
function frontMatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: md };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  return { data, body: md.slice(m[0].length).trim() };
}

/** Returns the `## Heading` sections of a Markdown body as { heading: text }. */
function sections(body) {
  const out = {};
  for (const part of body.split(/^## /m).slice(1)) {
    const nl = part.indexOf('\n');
    out[part.slice(0, nl).trim()] = part.slice(nl + 1).trim();
  }
  return out;
}

const REQUIRED_META = ['title', 'category', 'summary'];
const REQUIRED_SECTIONS = ['When to use', 'How to adapt'];
const NAME = /^[a-z][a-z0-9-]*-\d{2}$/;

/** Rules for the CSS in a block's <style>. Colours, radii and fonts come from --ht-* tokens only. */
function checkCss(name, css, problems) {
  const scope = new RegExp(`\\[data-block=(['"])${name}\\1\\]`);
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/#[0-9a-f]{3,8}\b/i.test(noComments)) problems.push(`${name}: hard-coded hex colour; use a --ht-* token`);
  if (/\b(rgba?|hsla?|oklch|oklab|lab|lch)\(/i.test(noComments.replace(/color-mix\(in (oklab|oklch)/g, ''))) {
    problems.push(`${name}: hard-coded colour function; use a --ht-* token (color-mix with tokens is fine)`);
  }
  for (const m of noComments.matchAll(/border-radius:\s*([^;]+);/g)) {
    if (!/^(var\(--ht-radius-[a-z]+\)\s*)+$|^0$|^50%$/.test(m[1].trim())) problems.push(`${name}: border-radius "${m[1].trim()}"; use var(--ht-radius-*)`);
  }
  for (const m of noComments.matchAll(/(?:^|[\s;{])(font(?:-family)?):\s*([^;]+);/g)) {
    if (m[2].trim() !== 'inherit' && !m[2].includes('var(--ht-font-')) problems.push(`${name}: ${m[1]} "${m[2].trim()}"; use var(--ht-font-*)`);
  }
  for (const m of noComments.matchAll(/([^{}]+)\{/g)) {
    const selector = m[1].trim();
    if (selector.startsWith('@') || /^(from|to|\d+%)$/.test(selector)) continue;
    for (const s of selector.split(',')) {
      if (!scope.test(s)) problems.push(`${name}: selector "${s.trim()}" is not scoped; start it with [data-block='${name}']`);
    }
  }
}

/**
 * Reads every block. Returns { blocks, problems }; the build fails when problems is not empty.
 * `folders` is the map from elementFolders().
 */
export function readBlocks(root, folders) {
  const dir = join(root, 'src/blocks');
  const blocks = {};
  const problems = [];
  if (!existsSync(dir)) return { blocks, problems };
  const componentNames = new Set(readdirSync(join(root, 'src/components')));
  const storiesPath = join(dir, 'blocks.stories.ts');
  const stories = existsSync(storiesPath) ? readFileSync(storiesPath, 'utf8') : '';

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const htmlPath = join(dir, name, `${name}.html`);
    const mdPath = join(dir, name, `${name}.md`);
    if (!NAME.test(name)) problems.push(`${name}: block names end in a two-digit number, e.g. login-01`);
    if (componentNames.has(name)) problems.push(`${name}: a component has the same name`);
    if (!existsSync(htmlPath) || !existsSync(mdPath)) {
      problems.push(`${name}: needs ${name}.html and ${name}.md`);
      continue;
    }
    const html = readFileSync(htmlPath, 'utf8');
    const md = readFileSync(mdPath, 'utf8');
    const { data, body } = frontMatter(md);
    const notes = sections(body);

    for (const key of REQUIRED_META) if (!data[key]) problems.push(`${name}.md: front matter needs "${key}"`);
    for (const h of REQUIRED_SECTIONS) if (!notes[h]) problems.push(`${name}.md: needs a "## ${h}" section`);
    if (!new RegExp(`^<[a-z]+ data-block="${name}"`).test(html.trimStart())) {
      problems.push(`${name}.html: the first element must carry data-block="${name}"`);
    }
    if (/<script\b/i.test(html)) problems.push(`${name}.html: no <script>; describe wiring in the notes instead`);
    for (const m of html.matchAll(/<style>([\s\S]*?)<\/style>/g)) checkCss(name, m[1], problems);
    if (!stories.includes(`block('${name}')`)) problems.push(`${name}: add a story to src/blocks/blocks.stories.ts`);

    const elements = [...new Set([...html.matchAll(/<(ht-[a-z-]+)/g)].map((m) => m[1]))].sort();
    const unknown = elements.filter((e) => !folders.has(e));
    if (unknown.length) problems.push(`${name}.html: unknown element(s) ${unknown.map((e) => `<${e}>`).join(', ')}`);
    const components = [...new Set(elements.filter((e) => folders.has(e)).map((e) => folders.get(e)))].sort();

    blocks[name] = { ...data, elements, components, notes, files: { html, md } };
  }
  return { blocks, problems };
}
