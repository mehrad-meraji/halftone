// Builds registry/registry.json: every component's source (TypeScript and a readable
// JavaScript build with comments kept) plus tokens.css, for `halftone add` to copy.
// Also enforces the copy-mode rule: a component file may import only `lit`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const jsDir = join(root, '.registry-js');

rmSync(jsDir, { recursive: true, force: true });
execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.registry.json'], { cwd: root, stdio: 'inherit' });

const components = {};
const problems = [];

for (const dir of readdirSync(join(root, 'src/components'), { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const name = dir.name;
  const ts = readFileSync(join(root, 'src/components', name, `${name}.ts`), 'utf8');
  const js = readFileSync(join(jsDir, 'components', name, `${name}.js`), 'utf8');

  const imports = [...ts.matchAll(/^import\s[^;]*?from\s+'([^']+)'/gms)].map((m) => m[1]);
  const bad = imports.filter((i) => i !== 'lit' && !i.startsWith('lit/'));
  if (bad.length) problems.push(`${name}: imports ${bad.join(', ')}; a component may import only lit`);

  const elements = [
    ...ts.matchAll(/customElements\.define\('(ht-[a-z-]+)'/g),
    ...ts.matchAll(/\[\s*'(ht-[a-z-]+)'\s*,\s*Ht[A-Za-z]+\s*\]/g),
  ].map((m) => m[1]);
  const summary = (ts.match(/@summary\s+(.+)/) ?? [])[1]?.trim() ?? '';

  components[name] = {
    elements: [...new Set(elements)],
    summary,
    dependencies: [...new Set(imports.map((i) => i.split('/')[0]))],
    files: { ts, js },
  };
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const registry = {
  name: pkg.name,
  version: pkg.version,
  tokens: readFileSync(join(root, 'src/tokens/tokens.css'), 'utf8'),
  components,
};

mkdirSync(join(root, 'registry'), { recursive: true });
writeFileSync(join(root, 'registry/registry.json'), JSON.stringify(registry, null, 1));
rmSync(jsDir, { recursive: true, force: true });
console.log(`registry: ${Object.keys(components).length} components, v${pkg.version}`);
