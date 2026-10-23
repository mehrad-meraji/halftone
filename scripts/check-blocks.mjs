// Checks blocks without building anything: `node scripts/check-blocks.mjs [name...]`.
// Prints the problems `npm run registry` would fail on, for the named blocks or all of them.
// Read-only, so it is safe to run while something else builds.
import { elementFolders, readBlocks } from './blocks.mjs';

const root = new URL('..', import.meta.url).pathname;
const names = process.argv.slice(2);
const { blocks, problems } = readBlocks(root, elementFolders(root));
const mine = names.length ? problems.filter((p) => names.some((n) => p.startsWith(`${n}:`) || p.startsWith(`${n}.`))) : problems;

for (const n of names) if (!blocks[n] && !mine.some((p) => p.startsWith(n))) mine.push(`${n}: not found in src/blocks`);
if (mine.length) {
  console.error(mine.join('\n'));
  process.exit(1);
}
const shown = names.length ? names : Object.keys(blocks);
for (const n of shown) console.log(`ok  ${n}  (${blocks[n].components.join(', ')})`);
