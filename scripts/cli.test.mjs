// Tests for `halftone add`. Run with `npm test` (rebuilds the registry first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bin = new URL('../bin/halftone.mjs', import.meta.url).pathname;
const run = (cwd, ...args) => spawnSync('node', [bin, ...args, '--cwd', cwd], { encoding: 'utf8' });
const project = (files = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'halftone-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
};

test('add copies the component and tokens, defaulting to ts when tsconfig exists', () => {
  const dir = project({ 'tsconfig.json': '{}', 'package.json': '{"dependencies":{"lit":"^3"}}', 'src/main.ts': '' });
  const r = run(dir, 'add', 'button');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(dir, 'src/components/halftone/button.ts')));
  assert.ok(existsSync(join(dir, 'src/components/halftone/tokens.css')));
  const src = readFileSync(join(dir, 'src/components/halftone/button.ts'), 'utf8');
  assert.match(src, /^\/\/ Copied from @_mehrad\/halftone@/);
  assert.match(src, /class HtButton/);
  assert.match(src, /declare variant/);
  const cfg = JSON.parse(readFileSync(join(dir, 'halftone.json'), 'utf8'));
  assert.equal(cfg.language, 'ts');
  assert.ok(cfg.installed.button);
});

test('js output has no type syntax and keeps comments', () => {
  const dir = project({ 'package.json': '{}' });
  const r = run(dir, 'add', 'tabs', '--js');
  assert.equal(r.status, 0, r.stderr);
  const js = readFileSync(join(dir, 'components/halftone/tabs.js'), 'utf8');
  assert.doesNotMatch(js, /declare |: string|as HtTab|interface /);
  assert.match(js, /class HtTabs/);
  assert.match(js, /Segmented tab control/); // JSDoc survives
  assert.match(js, /customElements\.define|customElements\.get/);
  assert.equal(spawnSync('node', ['--check', join(dir, 'components/halftone/tabs.js')]).status, 0);
});

test('a family file defines every element it documents', () => {
  const dir = project({ 'package.json': '{}' });
  run(dir, 'add', 'radio', 'toast', '--js');
  const radio = readFileSync(join(dir, 'components/halftone/radio.js'), 'utf8');
  assert.match(radio, /ht-radio-group/);
  const list = run(dir, 'list').stdout;
  assert.match(list, /ht-radio, ht-radio-group/);
  assert.match(list, /ht-toast, ht-toaster/);
});

test('edited files are left alone unless --overwrite', () => {
  const dir = project({ 'package.json': '{}' });
  run(dir, 'add', 'kbd', '--js');
  const file = join(dir, 'components/halftone/kbd.js');
  writeFileSync(file, readFileSync(file, 'utf8') + '\n// my edit\n');
  const again = run(dir, 'add', 'kbd', '--js');
  assert.match(again.stdout, /skipped/);
  assert.match(readFileSync(file, 'utf8'), /my edit/);
  const forced = run(dir, 'add', 'kbd', '--js', '--overwrite');
  assert.match(forced.stdout, /overwritten/);
  assert.doesNotMatch(readFileSync(file, 'utf8'), /my edit/);
});

test('--dry-run writes nothing', () => {
  const dir = project({ 'package.json': '{}' });
  const r = run(dir, 'add', 'card', '--dry-run');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Would add/);
  assert.equal(existsSync(join(dir, 'components')), false);
  assert.equal(existsSync(join(dir, 'halftone.json')), false);
});

test('unknown component fails with a hint', () => {
  const dir = project({ 'package.json': '{}' });
  const r = run(dir, 'add', 'carousel');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown component: carousel/);
});

test('--dir and --no-tokens are honoured', () => {
  const dir = project({ 'package.json': '{}' });
  run(dir, 'add', 'tag', '--dir', 'ui', '--no-tokens', '--js');
  assert.ok(existsSync(join(dir, 'ui/tag.js')));
  assert.equal(existsSync(join(dir, 'ui/tokens.css')), false);
});

test('diff reports same, modified and missing', () => {
  const dir = project({ 'package.json': '{}' });
  run(dir, 'add', 'tag', 'kbd', '--js');
  writeFileSync(join(dir, 'components/halftone/kbd.js'), 'edited');
  const r = run(dir, 'diff');
  assert.equal(r.status, 2);
  assert.match(r.stdout, /same\s+components\/halftone\/tag\.js/);
  assert.match(r.stdout, /modified\s+components\/halftone\/kbd\.js/);
});

test('warns when lit is missing', () => {
  const dir = project({ 'package.json': '{"dependencies":{}}' });
  const r = run(dir, 'add', 'tag', '--js');
  assert.match(r.stdout, /need the "lit" package/);
});

test('every packaged component imports only lit', () => {
  const reg = JSON.parse(readFileSync(new URL('../registry/registry.json', import.meta.url), 'utf8'));
  for (const [name, c] of Object.entries(reg.components)) {
    assert.deepEqual(c.dependencies, ['lit'], `${name} dependencies`);
    assert.ok(c.elements.length > 0, `${name} defines no elements`);
  }
});
