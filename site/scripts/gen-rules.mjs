// Copies the rules in AGENTS.md into src/generated/agents-rules.md for the Contributing page, so the
// page can never disagree with the file agents read. The `# ...` title is dropped; `##` sections stay.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const repo = join(site, '..');
const out = join(site, 'src/generated/agents-rules.md');

const src = readFileSync(join(repo, 'AGENTS.md'), 'utf8');
const body = src.replace(/^# .*\n+/, '');
// The first rules have no heading in AGENTS.md; on the page they sit under "Components".
const text = body.startsWith('## ') ? body : `## Components\n\n${body}`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, text);
console.log(`Copied the AGENTS.md rules (${(text.match(/^- /gm) ?? []).length} rules).`);
