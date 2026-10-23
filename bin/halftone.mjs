#!/usr/bin/env node
// halftone: copy Halftone components and blocks into your project and own them.
// Zero dependencies. Reads the registry that ships inside this package.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const registryPath = join(here, '..', 'registry', 'registry.json');

const HELP = `halftone: copy Halftone components and blocks into your project

Usage
  halftone add <name...>        copy components or blocks (and tokens.css) into your project.
                                A block also copies every component it uses.
  halftone add --all            copy every component
  halftone list                 show the components and blocks
  halftone show <block>         print a block's notes and HTML
  halftone init                 write halftone.json and tokens.css only
  halftone diff [name...]       compare your copies with the packaged source

Options
  --dir <path>      where components go (default: src/components/halftone, or components/halftone)
  --ts | --js       language to copy (default: ts if tsconfig.json exists, else js)
  --overwrite, -f   replace files that differ from the packaged source
  --dry-run         show what would happen and write nothing
  --no-tokens       do not copy tokens.css
  --install         run your package manager to add lit if it is missing
  --cwd <path>      run as if started in <path>
  -h, --help        this text
`;

function parse(argv) {
  const flags = { _: [] };
  const withValue = new Set(['--dir', '--cwd']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (withValue.has(a)) flags[a.slice(2)] = argv[++i];
    else if (a === '-f') flags.overwrite = true;
    else if (a === '-h') flags.help = true;
    else if (a.startsWith('--')) flags[a.slice(2).replace(/^no-/, 'no_')] = true;
    else flags._.push(a);
  }
  return flags;
}

// `halftone list | head` closes the pipe early; that is not an error.
process.stdout.on('error', (e) => {
  if (e.code === 'EPIPE') process.exit(0);
  throw e;
});

const out = (s = '') => process.stdout.write(s + '\n');
const fail = (s) => {
  process.stderr.write(`halftone: ${s}\n`);
  process.exit(1);
};

function loadRegistry() {
  if (!existsSync(registryPath)) fail('registry missing. Run `npm run registry` in the Halftone repo, or reinstall the package.');
  return JSON.parse(readFileSync(registryPath, 'utf8'));
}

function readConfig(cwd) {
  const p = join(cwd, 'halftone.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}

function settings(flags, cwd, config) {
  const language = flags.ts ? 'ts' : flags.js ? 'js' : config?.language ?? (existsSync(join(cwd, 'tsconfig.json')) ? 'ts' : 'js');
  const dir = flags.dir ?? config?.componentsDir ?? (existsSync(join(cwd, 'src')) ? 'src/components/halftone' : 'components/halftone');
  return { language, dir };
}

const banner = (reg, lang) =>
  lang === 'ts' || lang === 'js'
    ? `// Copied from ${reg.name}@${reg.version} by \`halftone add\`. You own this file: edit freely.\n// Needs tokens.css (see halftone.json) and the \`lit\` package.\n\n`
    : '';

function fileFor(reg, name, lang) {
  return { path: `${name}.${lang}`, content: banner(reg, lang) + reg.components[name].files[lang] };
}

/** A block's two files: the HTML (with a copy header) and the notes, under `blocks/`. */
function blockFiles(reg, name) {
  const b = reg.blocks[name].files;
  const header = `<!-- Copied from ${reg.name}@${reg.version} by \`halftone add\`. You own this file: edit freely.\n     Notes for people and agents: ${name}.md. Needs tokens.css and these components: ${reg.blocks[name].components.join(', ')}. -->\n`;
  return [
    { path: join('blocks', `${name}.html`), content: header + b.html },
    { path: join('blocks', `${name}.md`), content: b.md },
  ];
}

const blocksOf = (reg) => reg.blocks ?? {};

function status(abs, content) {
  if (!existsSync(abs)) return 'create';
  return readFileSync(abs, 'utf8') === content ? 'same' : 'modified';
}

function detectManager(cwd) {
  for (const [file, cmd] of [['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'], ['bun.lockb', 'bun'], ['bun.lock', 'bun']]) {
    if (existsSync(join(cwd, file))) return cmd;
  }
  return 'npm';
}

function hasDependency(cwd, dep) {
  const p = join(cwd, 'package.json');
  if (!existsSync(p)) return false;
  const j = JSON.parse(readFileSync(p, 'utf8'));
  return Boolean(j.dependencies?.[dep] || j.devDependencies?.[dep] || j.peerDependencies?.[dep]);
}

function writeConfig(cwd, config, dry) {
  if (dry) return;
  writeFileSync(join(cwd, 'halftone.json'), JSON.stringify(config, null, 2) + '\n');
}

function add(flags, reg, cwd) {
  const config = readConfig(cwd);
  const { language, dir } = settings(flags, cwd, config);
  const requested = flags.all ? Object.keys(reg.components) : flags._.slice(1);
  if (!requested.length) fail('name at least one component or block, or pass --all. Try `halftone list`.');
  const unknown = requested.filter((n) => !reg.components[n] && !blocksOf(reg)[n]);
  if (unknown.length) fail(`unknown component or block: ${unknown.join(', ')}. Try \`halftone list\`.`);

  // A block brings the components it uses.
  const blockNames = requested.filter((n) => blocksOf(reg)[n]);
  const names = [...new Set([...requested.filter((n) => reg.components[n]), ...blockNames.flatMap((n) => reg.blocks[n].components)])];

  const plan = [];
  for (const n of names) plan.push({ name: n, ...fileFor(reg, n, language), dest: join(dir, `${n}.${language}`) });
  for (const n of blockNames) for (const f of blockFiles(reg, n)) plan.push({ name: n, ...f, dest: join(dir, f.path) });
  if (!flags.no_tokens) plan.push({ name: 'tokens', path: 'tokens.css', content: reg.tokens, dest: join(dir, 'tokens.css') });

  let skipped = 0;
  for (const item of plan) {
    const abs = resolve(cwd, item.dest);
    const st = status(abs, item.content);
    let label = st;
    if (st === 'modified' && !flags.overwrite) {
      label = 'skipped (you edited it; use --overwrite)';
      skipped++;
    } else if (st === 'modified') label = 'overwritten';
    else if (st === 'same') label = 'unchanged';
    else label = 'created';
    out(`  ${label.padEnd(8)}  ${item.dest}`);
    if (flags['dry-run'] || flags.dry_run) continue;
    if (st === 'create' || (st === 'modified' && flags.overwrite)) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, item.content);
    }
  }

  const dry = Boolean(flags['dry-run'] || flags.dry_run);
  const installed = { ...(config?.installed ?? {}) };
  for (const n of names) installed[n] = reg.version;
  const blocks = { ...(config?.blocks ?? {}) };
  for (const n of blockNames) blocks[n] = reg.version;
  writeConfig(cwd, { componentsDir: dir, language, installed, ...(Object.keys(blocks).length ? { blocks } : {}) }, dry);

  const elements = names.flatMap((n) => reg.components[n].elements);
  out();
  if (blockNames.length) out(`${dry ? 'Would add' : 'Added'} blocks: ${blockNames.join(' ')}`);
  out(`${dry ? 'Would add' : 'Added'}: ${elements.map((e) => `<${e}>`).join(' ')}`);
  if (skipped) out(`${skipped} file(s) left alone because they differ from the packaged source.`);

  const needLit = !hasDependency(cwd, 'lit');
  if (needLit && flags.install && !dry) {
    const mgr = detectManager(cwd);
    out(`Installing lit with ${mgr}...`);
    const args = mgr === 'npm' ? ['install', 'lit'] : ['add', 'lit'];
    const r = spawnSync(mgr, args, { cwd, stdio: 'inherit' });
    if (r.status !== 0) fail(`${mgr} ${args.join(' ')} failed`);
  } else if (needLit) {
    out(`These components need the "lit" package: ${detectManager(cwd)} ${detectManager(cwd) === 'npm' ? 'install' : 'add'} lit   (or pass --install)`);
  }

  const ext = language === 'ts' ? '' : '.js';
  out();
  out('Use it:');
  if (!flags.no_tokens) out(`  import './${dir}/tokens.css';`);
  for (const n of names) out(`  import './${dir}/${n}${ext}';`);
  out('Paths are relative to the project root; adjust them to where your entry file lives.');
  for (const n of blockNames) out(`Block ${n}: paste ${join(dir, 'blocks', `${n}.html`)} into a page or template. Read ${n}.md before you change it.`);
  out('Fonts are not included: load Chakra Petch, Geist and IBM Plex Mono yourself, or the system fonts are used.');
}

function list(reg) {
  const blocks = blocksOf(reg);
  out(`${reg.name}@${reg.version}: ${Object.keys(reg.components).length} components, ${Object.keys(blocks).length} blocks\n`);
  const width = Math.max(...[...Object.keys(reg.components), ...Object.keys(blocks)].map((n) => n.length));
  out('Components');
  for (const [name, c] of Object.entries(reg.components)) {
    out(`  ${name.padEnd(width)}  ${c.elements.join(', ')}`);
    if (c.summary) out(`  ${' '.repeat(width)}  ${c.summary}`);
  }
  if (!Object.keys(blocks).length) return;
  out('\nBlocks (`halftone show <block>` prints one)');
  for (const [name, b] of Object.entries(blocks)) {
    out(`  ${name.padEnd(width)}  ${b.title} · ${b.category}`);
    out(`  ${' '.repeat(width)}  ${b.summary}`);
  }
}

function show(flags, reg) {
  const name = flags._[1];
  if (!name) fail('name a block. Try `halftone list`.');
  const b = blocksOf(reg)[name];
  if (!b) fail(`unknown block: ${name}. Try \`halftone list\`.`);
  out(b.files.md.trimEnd());
  out(`\nComponents: ${b.components.join(', ')}  (\`halftone add ${name}\` copies them)\n`);
  out('```html');
  out(b.files.html.trimEnd());
  out('```');
}

function init(flags, reg, cwd) {
  const config = readConfig(cwd);
  const { language, dir } = settings(flags, cwd, config);
  const dry = Boolean(flags['dry-run'] || flags.dry_run);
  const abs = resolve(cwd, dir, 'tokens.css');
  const st = status(abs, reg.tokens);
  out(`  ${(st === 'create' ? 'created' : st).padEnd(8)}  ${join(dir, 'tokens.css')}`);
  if (!dry && (st === 'create' || (st === 'modified' && flags.overwrite))) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, reg.tokens);
  }
  writeConfig(cwd, { ...(config ?? {}), componentsDir: dir, language, installed: config?.installed ?? {} }, dry);
  out(`  ${config ? 'updated' : 'created'}   halftone.json`);
}

function diff(flags, reg, cwd) {
  const config = readConfig(cwd);
  if (!config) fail('no halftone.json here. Run `halftone add` or `halftone init` first.');
  const { language, dir } = settings(flags, cwd, config);
  const names = flags._.slice(1).length ? flags._.slice(1) : [...Object.keys(config.installed ?? {}), ...Object.keys(config.blocks ?? {})];
  if (!names.length) fail('nothing installed yet.');
  let drift = 0;
  for (const n of names) {
    if (blocksOf(reg)[n]) {
      for (const f of blockFiles(reg, n)) {
        const st = status(resolve(cwd, dir, f.path), f.content);
        if (st !== 'same') drift++;
        out(`  ${{ create: 'missing', same: 'same', modified: 'modified' }[st].padEnd(8)}  ${join(dir, f.path)}`);
      }
      continue;
    }
    if (!reg.components[n]) {
      out(`  unknown   ${n}`);
      continue;
    }
    const f = fileFor(reg, n, language);
    const st = status(resolve(cwd, dir, f.path), f.content);
    const label = { create: 'missing', same: 'same', modified: 'modified' }[st];
    if (st !== 'same') drift++;
    out(`  ${label.padEnd(8)}  ${join(dir, f.path)}`);
  }
  const installedVersion = Object.values(config.installed ?? {})[0];
  if (installedVersion && installedVersion !== reg.version) {
    out(`\nYou copied v${installedVersion}; the package is v${reg.version}. "modified" can mean an upstream change or your own edit.`);
  }
  out('\nTo take upstream changes for a file: `halftone add <name> --overwrite` (this discards your edits).');
  process.exitCode = drift ? 2 : 0;
}

const flags = parse(process.argv.slice(2));
const cmd = flags._[0];
const cwd = resolve(flags.cwd ?? process.cwd());

if (flags.help || !cmd || cmd === 'help') {
  out(HELP);
} else {
  const reg = loadRegistry();
  if (cmd === 'add') add(flags, reg, cwd);
  else if (cmd === 'list' || cmd === 'ls') list(reg);
  else if (cmd === 'show') show(flags, reg);
  else if (cmd === 'init') init(flags, reg, cwd);
  else if (cmd === 'diff') diff(flags, reg, cwd);
  else fail(`unknown command "${cmd}". Run \`halftone --help\`.`);
}
