// Builds one docs page per block from src/blocks/<name>/ (front matter, notes and HTML), using the
// same reader as the registry. Also writes src/generated/blocks.json, which the bare preview pages
// (src/pages/block-preview/[name].astro) render inside the frame on each page.
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { elementFolders, readBlocks } from '../../scripts/blocks.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const repo = join(site, '..');
const outDir = join(site, 'src/content/docs/blocks');
const dataFile = join(site, 'src/generated/blocks.json');

const folders = elementFolders(repo);
const { blocks, problems } = readBlocks(repo, folders);
if (problems.length) {
  console.error(`Blocks have problems:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}

/** Escape text for MDX, leaving `code spans` alone. */
const esc = (s = '') =>
  String(s)
    .split('`')
    .map((part, i) =>
      i % 2 === 1 ? part : part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;'),
    )
    .join('`');
/** A fence longer than any run of backticks in the code, so the code cannot close it. */
const fence = (lang, code) => {
  const ticks = '`'.repeat(Math.max(3, ...[...code.matchAll(/`+/g)].map((m) => m[0].length + 1)));
  return `${ticks}${lang}\n${code.trimEnd()}\n${ticks}`;
};

const list = Object.entries(blocks)
  .map(([name, b]) => ({ name, ...b }))
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(dirname(dataFile), { recursive: true });

writeFileSync(dataFile, JSON.stringify(list.map((b) => ({ name: b.name, title: b.title, html: b.files.html })), null, 2) + '\n');

list.forEach((b, i) => {
  const front = [
    '---',
    `title: ${JSON.stringify(b.title)}`,
    `description: ${JSON.stringify(b.summary)}`,
    `chips: ${JSON.stringify([b.category, b.name])}`,
    `sidebar:\n  order: ${i + 1}`,
    // Blocks need desktop width to show their desktop layout, so the page drops the right-hand contents column.
    'tableOfContents: false',
    '---',
  ].join('\n');
  const notes = Object.entries(b.notes)
    .map(([heading, text]) => `## ${esc(heading)}\n\n${esc(text)}`)
    .join('\n\n');
  const uses = b.components.map((c) => `[\`${c}\`](../../components/${c}/)`).join(', ');
  const body = [
    front,
    "import BlockFrame from '../../../components/BlockFrame.astro';",
    '',
    `<BlockFrame name=${JSON.stringify(b.name)} title=${JSON.stringify(b.title)} />`,
    '',
    '## Add it',
    '',
    `Copies the HTML into your project with the ${b.components.length} components it uses: ${uses}.`,
    '',
    fence('bash', `npx @_mehrad/halftone add ${b.name}`),
    '',
    notes,
    '',
    '## HTML',
    '',
    'The block as it ships. The styles are scoped to `[data-block]` and use only `--ht-*` tokens.',
    '',
    fence('html', b.files.html),
    '',
  ].join('\n');
  writeFileSync(join(outDir, `${b.name}.mdx`), body);
});

const rows = list.map((b) => `- **[${esc(b.title)}](./${b.name}/)** · ${esc(b.category)}. ${esc(b.summary)}`);
writeFileSync(
  join(outDir, 'index.mdx'),
  `---
title: Blocks
description: Whole page sections built from Halftone elements, in plain HTML you copy and change.
sidebar:
  order: 0
  label: Overview
tableOfContents: false
---

${list.length} blocks. A block is plain HTML that composes \`ht-*\` elements, with scoped styles that use only tokens. \`halftone add <block>\` copies the HTML and every component it needs. Each page has notes on when to use the block and how to change it, written for people and for coding agents.

${rows.join('\n')}
`,
);
console.log(`Generated ${list.length} block pages.`);
