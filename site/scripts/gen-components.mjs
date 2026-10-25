// Builds one docs page per component folder from custom-elements.json (the generated API) and the
// stories files (the live examples). A hand-written page in site/overrides/<folder>.mdx replaces the
// generated body; put the line @@API@@ where the API tables should go.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const repo = join(site, '..');
const outDir = join(site, 'src/content/docs/components');
const statsFile = join(site, 'src/generated/stats.json');

/** Shown as a sidebar badge. Edit when a component is new or has changed. */
const STATUS = {
  code: { text: 'New', variant: 'tip' },
  'description-list': { text: 'New', variant: 'tip' },
  dropzone: { text: 'New', variant: 'tip' },
  pagination: { text: 'New', variant: 'tip' },
  steps: { text: 'New', variant: 'tip' },
  timeline: { text: 'New', variant: 'tip' },
  select: { text: 'New', variant: 'tip' },
  'empty-state': { text: 'New', variant: 'tip' },
  tabs: { text: 'Updated', variant: 'note' },
  toast: { text: 'Updated', variant: 'note' },
  alert: { text: 'New', variant: 'tip' },
  popover: { text: 'Updated', variant: 'note' },
  radio: { text: 'Updated', variant: 'note' },
  banner: { text: 'Updated', variant: 'note' },
  checkbox: { text: 'Updated', variant: 'note' },
  icon: { text: 'Updated', variant: 'note' },
  input: { text: 'Updated', variant: 'note' },
  tag: { text: 'Updated', variant: 'note' },
  toggle: { text: 'Updated', variant: 'note' },
};

const manifest = JSON.parse(readFileSync(join(repo, 'custom-elements.json'), 'utf8'));

/** Escape text for MDX, leaving `code spans` alone. */
const esc = (s = '') =>
  String(s)
    .split('`')
    .map((part, i) =>
      i % 2 === 1 ? part : part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;'),
    )
    .join('`');
const cell = (s = '') => esc(String(s).replace(/\s*\n\s*/g, ' ').trim()).replace(/\|/g, '\\|');
const code = (s) => (s ? '`' + String(s).replace(/\|/g, '\\|') + '`' : '');
const titleCase = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const sanitize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Group the declarations by component folder.
const folders = new Map();
for (const mod of manifest.modules) {
  const m = mod.path.match(/^src\/components\/([^/]+)\/[^/]+\.ts$/);
  if (!m) continue;
  const decls = (mod.declarations ?? []).filter((d) => d.tagName);
  if (!decls.length) continue;
  folders.set(m[1], [...(folders.get(m[1]) ?? []), ...decls]);
}

function storiesFor(folder) {
  const dir = join(repo, 'src/components', folder);
  const file = readdirSync(dir).find((f) => f.endsWith('.stories.ts') && f !== 'glass.stories.ts');
  if (!file) return { title: titleCase(folder), stories: [] };
  const src = readFileSync(join(dir, file), 'utf8');
  const title = src.match(/title:\s*'([^']+)'/)?.[1] ?? `Components/${titleCase(folder)}`;
  const stories = [...src.matchAll(/^export const (\w+):\s*StoryObj/gm)].map((m) => {
    const label = m[1].replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return { id: `${sanitize(title)}--${sanitize(label)}`, label };
  });
  return { title: title.split('/').pop(), stories };
}

function table(head, rows) {
  if (!rows.length) return '';
  return `| ${head.join(' | ')} |\n| ${head.map(() => '---').join(' | ')} |\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n\n`;
}

function apiFor(decl) {
  const tag = decl.tagName;
  let out = `## ${tag}\n\n`;
  if (decl.summary) out += `${esc(decl.summary)}\n\n`;
  const attrs = (decl.attributes ?? []).filter((a) => !a.name.startsWith('_'));
  out += table(
    ['Attribute', 'Type', 'Default', 'What it does'],
    attrs.map((a) => [code(a.name), code(a.type?.text ?? ''), code(a.default ?? ''), cell(a.description)]),
  );
  const methods = (decl.members ?? []).filter((m) => m.kind === 'method' && !m.static);
  out += table(
    ['Method', 'What it does'],
    methods.map((m) => [code(`${m.name}(${(m.parameters ?? []).map((p) => p.name).join(', ')})`), cell(m.description)]),
  );
  const events = decl.events ?? [];
  if (events.length) out += `**Events**\n\n` + table(['Event', 'What it means'], events.map((e) => [code(e.name), cell(e.description)]));
  const slots = decl.slots ?? [];
  if (slots.length) out += `**Slots**\n\n` + table(['Slot', 'What goes in it'], slots.map((s) => [code(s.name || '(default)'), cell(s.description)]));
  const parts = decl.cssParts ?? [];
  if (parts.length) out += `**CSS parts**\n\n` + table(['Part', 'What it is'], parts.map((p) => [code(p.name), cell(p.description)]));
  const props = decl.cssProperties ?? [];
  if (props.length) out += `**CSS properties**\n\n` + table(['Property', 'Default', 'What it sets'], props.map((p) => [code(p.name), code(p.default ?? ''), cell(p.description)]));
  return out;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(dirname(statsFile), { recursive: true });

const index = [];
for (const [folder, decls] of [...folders.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const main = decls.find((d) => d.tagName === `ht-${folder}`) ?? decls[0];
  const { title, stories } = storiesFor(folder);
  const summary = main.summary ?? '';
  const api = decls.map(apiFor).join('\n');
  const badge = STATUS[folder];
  const front = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(summary || `The ${main.tagName} element.`)}`,
    `chips: ${JSON.stringify([...decls.map((d) => d.tagName).slice(0, 3), ...(badge ? [badge.text] : [])])}`,
    badge ? `sidebar:\n  badge:\n    text: ${JSON.stringify(badge.text)}\n    variant: ${badge.variant}` : null,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  const override = join(site, 'overrides', `${folder}.mdx`);
  let body;
  if (existsSync(override)) {
    body = readFileSync(override, 'utf8').replace('@@API@@', api);
    writeFileSync(join(outDir, `${folder}.mdx`), body);
  } else {
    const intro = esc((main.description ?? '').trim());
    const frame = stories.length
      ? `## Examples\n\nThe real Storybook stories, running live.\n\n<StoryFrame stories={${JSON.stringify(stories.slice(0, 10))}} />\n\n`
      : '';
    body = `${front}\nimport StoryFrame from '../../../components/StoryFrame.astro';\n\n${intro}\n\n${frame}${api}`;
    writeFileSync(join(outDir, `${folder}.mdx`), body);
  }
  index.push({ folder, title, summary, tags: decls.map((d) => d.tagName), badge: badge?.text });
}

const rows = index.map((c) => `| [${c.title}](./${c.folder}/) | ${c.tags.map((t) => '`' + t + '`').join(' ')} | ${cell(c.summary)} |`);
writeFileSync(
  join(outDir, 'index.mdx'),
  `---\ntitle: Components\ndescription: Every Halftone element, with live examples and its API.\nsidebar:\n  order: 0\n  label: Overview\n---\n\n${index.length} components, ${index.reduce((n, c) => n + c.tags.length, 0)} elements. Each page has live examples from Storybook and the full API, generated from the source.\n\n| Component | Elements | What it is |\n| --- | --- | --- |\n${rows.join('\n')}\n`,
);
writeFileSync(
  statsFile,
  JSON.stringify({ components: index.length, elements: index.reduce((n, c) => n + c.tags.length, 0) }, null, 2) + '\n',
);
console.log(`Generated ${index.length} component pages.`);

// A Resources page listing the decisions log, so each dated choice is one click away.
const decisions = readFileSync(join(repo, 'docs/decisions.md'), 'utf8');
const slug = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\- ]/gu, '').replace(/ /g, '-');
const items = [...decisions.matchAll(/^## (\d{4}-\d{2}-\d{2})\s*[—:-]+\s*(.+)$/gm)]
  .map((m) => ({ date: m[1], title: m[2].trim(), heading: m[0].slice(3) }))
  .reverse();
const decisionsPage = [
  '---',
  'title: Decisions log',
  'description: Every dated design and engineering choice, newest first, with the reasons.',
  'sidebar:',
  '  order: 3',
  '---',
  '',
  `${items.length} decisions. The reasoning for each is in [\`docs/decisions.md\`](https://github.com/mehrad-meraji/halftone/blob/main/docs/decisions.md); the titles below link to it.`,
  '',
  ...items.map((d) => `- **${d.date}** [${esc(d.title)}](https://github.com/mehrad-meraji/halftone/blob/main/docs/decisions.md#${slug(d.heading)})`),
  '',
].join('\n');
mkdirSync(join(site, 'src/content/docs/resources'), { recursive: true });
writeFileSync(join(site, 'src/content/docs/resources/decisions.mdx'), decisionsPage);
console.log(`Generated the decisions page (${items.length} entries).`);
