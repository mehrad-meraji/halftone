// Runs after `astro build`. Fails when a page links to a page or file of this site that is not in
// dist/, for example after a component or block is renamed or removed. External links are not checked.
// Storybook is copied into dist/storybook/ only by the deploy job, so links into it are skipped.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const base = (process.env.BASE_PATH ?? '/').replace(/\/?$/, '/');

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

const exists = (rel) => {
  const p = join(dist, decodeURIComponent(rel));
  if (existsSync(p) && statSync(p).isFile()) return true;
  return existsSync(join(p, 'index.html')) || existsSync(`${p}.html`);
};

const broken = [];
let checked = 0;
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const pagePath = '/' + posix.relative(dist.split('\\').join('/'), dirname(file).split('\\').join('/')).replace(/^\.$/, '');
  for (const m of html.matchAll(/\s(?:href|src)="([^"#?]+)[^"]*"/g)) {
    const url = m[1];
    if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url)) continue; // https:, mailto:, data:, protocol-relative
    let path;
    if (url.startsWith('/')) {
      if (!url.startsWith(base)) {
        broken.push(`${posix.relative(dist, file)}: ${url} is outside the base path ${base}`);
        continue;
      }
      path = '/' + url.slice(base.length);
    } else {
      path = posix.join(pagePath.endsWith('/') ? pagePath : pagePath + '/', url);
    }
    if (path.startsWith('/storybook/') || path === '/storybook') continue;
    checked++;
    if (!exists(path)) broken.push(`${posix.relative(dist, file)}: ${url}`);
  }
}

if (broken.length) {
  console.error(`Broken links (${broken.length}):\n${[...new Set(broken)].map((b) => `  - ${b}`).join('\n')}`);
  process.exit(1);
}
console.log(`Links: ${checked} internal links, none broken.`);
