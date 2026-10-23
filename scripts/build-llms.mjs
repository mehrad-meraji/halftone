// Generates llms.txt from custom-elements.json so agents get the whole API in one file.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { elementFolders, readBlocks } from './blocks.mjs';

const root = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'custom-elements.json'), 'utf8'));

const decls = manifest.modules
  .flatMap((m) => m.declarations ?? [])
  .filter((d) => d.tagName)
  .sort((a, b) => a.tagName.localeCompare(b.tagName));

const one = (s = '') => s.replace(/\s+/g, ' ').trim();
const lines = [];
const p = (s = '') => lines.push(s);

p(`# Halftone (${pkg.name}@${pkg.version})`);
p();
p(`> ${one(pkg.description)}`);
p();
p('Web components built with Lit. Tag prefix `ht-`. Style them through CSS custom properties (`--ht-*`, defined in tokens.css) and `::part()`. Dark mode follows the OS, or set `data-theme="dark"` on any element.');
p();
p('## Use');
p();
p('- Package: `npm i @_mehrad/halftone lit`, then `import "@_mehrad/halftone"` (all) or `import "@_mehrad/halftone/components/button/button"` (one), and load `@_mehrad/halftone/tokens.css`.');
p('- Copy mode: `npx @_mehrad/halftone add <component>` copies the source and tokens.css into your project. `npx @_mehrad/halftone list` shows the names.');
p('- Form controls are form-associated: they submit with FormData, reset with the form and take part in `required` validation.');
p('- With no visible label, give a control `aria-label`; it is forwarded to the native element.');
p();
p('## Elements');

for (const d of decls) {
  p();
  p(`### <${d.tagName}>`);
  const summary = d.summary ?? d.description?.split('\n')[0];
  if (summary) p(one(summary));
  const attrs = (d.attributes ?? []).filter((a) => a.name);
  if (attrs.length) {
    p();
    p('Attributes:');
    for (const a of attrs) {
      const type = a.type?.text ? ` (${one(a.type.text)})` : '';
      const def = a.default !== undefined ? `, default ${one(String(a.default))}` : '';
      p(`- \`${a.name}\`${type}${def}${a.description ? `: ${one(a.description)}` : ''}`);
    }
  }
  const slots = d.slots ?? [];
  if (slots.length) {
    p();
    p('Slots:');
    for (const s of slots) p(`- \`${s.name || '(default)'}\`${s.description ? `: ${one(s.description)}` : ''}`);
  }
  const parts = d.cssParts ?? [];
  if (parts.length) p(`\nParts: ${parts.map((x) => `\`${x.name}\``).join(', ')}`);
  const props = d.cssProperties ?? [];
  if (props.length) p(`\nCSS properties: ${props.map((x) => `\`${x.name}\``).join(', ')}`);
  const events = d.events ?? [];
  if (events.length) {
    p();
    p('Events:');
    for (const e of events) p(`- \`${e.name}\`${e.description ? `: ${one(e.description)}` : ''}`);
  }
  const methods = (d.members ?? []).filter((m) => m.kind === 'method' && m.privacy !== 'private');
  if (methods.length) p(`\nMethods: ${methods.map((m) => `\`${m.name}()\``).join(', ')}`);
}

// Blocks: ready-made page sections. Their notes are written for agents, so they go in whole.
const { blocks, problems } = readBlocks(root, elementFolders(root));
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
p();
p('## Blocks');
p();
p('Blocks are ready-made page sections in plain HTML that compose the elements above, like shadcn/ui blocks. When you build a page, start from the closest block and adapt it by its notes instead of composing from scratch. `npx @_mehrad/halftone add <block>` copies the HTML, its notes and every component it uses; `npx @_mehrad/halftone show <block>` prints the HTML and notes.');
for (const [name, b] of Object.entries(blocks)) {
  p();
  p(`### ${name}: ${b.title}`);
  p();
  p(`${one(b.summary)} Category: ${b.category}. Components: ${b.components.map((c) => `\`${c}\``).join(', ')}.`);
  for (const [heading, text] of Object.entries(b.notes)) {
    p();
    p(`${heading}:`);
    p(text);
  }
}

p();
p('## More');
p();
p('- API data: custom-elements.json (Custom Elements Manifest).');
p('- Decisions and accessibility notes: docs/decisions.md, docs/a11y.md in the repository.');
writeFileSync(join(root, 'llms.txt'), lines.join('\n') + '\n');
console.log(`llms.txt: ${decls.length} elements, ${Object.keys(blocks).length} blocks, ${lines.length} lines`);
