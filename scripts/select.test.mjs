// DOM tests for `ht-select` empty values, run in headless Chrome. Run with `npm test`.
// Set CHROME_BIN to pick a browser; the test skips when none is found.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSync } from 'esbuild';

const findChrome = () => {
  const paths = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  for (const p of paths) if (p && existsSync(p)) return p;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const r = spawnSync('which', [name], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
};

// Each case builds a form, optionally clicks options, then reports the form value, the trigger
// text and which options are marked selected.
const cases = String.raw`
const tick = async (s) => { await s.updateComplete; await new Promise((r) => setTimeout(r, 0)); await s.updateComplete; };
const options = (s) => [...s.querySelectorAll('ht-option'), ...s.shadowRoot.querySelectorAll('.native ht-option')];
async function run(markup, clicks = []) {
  const form = document.createElement('form');
  form.innerHTML = markup;
  document.body.append(form);
  const s = form.querySelector('ht-select');
  await tick(s);
  for (const v of clicks) {
    const o = options(s).find((o) => o.getAttribute('value') === v || (v === null && !o.hasAttribute('value')));
    o.click();
    await tick(s);
  }
  const out = {
    form: new FormData(form).get('f'),
    value: s.value,
    text: s.shadowRoot.querySelector('.value').textContent,
    selected: options(s).filter((o) => o.selected).map((o) => o.textContent.trim()),
  };
  form.remove();
  return out;
}
const results = {};
const ht = (attrs = '', first = '') => '<ht-select name="f" ' + attrs + '>'
  + '<ht-option value=""' + first + '>Any status</ht-option>'
  + '<ht-option value="active">Active</ht-option>'
  + '<ht-option>Archived</ht-option></ht-select>';
const nat = (attrs = '', first = '') => '<ht-select name="f" ' + attrs + '>'
  + '<option value=""' + first + '>Any status</option>'
  + '<option value="active">Active</option>'
  + '<option>Archived</option></ht-select>';
for (const [kind, make] of [['ht', ht], ['native', nat]]) {
  results[kind + ':selected'] = await run(make('placeholder="Pick"', ' selected'));
  results[kind + ':default'] = await run(make());
  results[kind + ':repick'] = await run(make('placeholder="Pick"'), ['active', '']);
  results[kind + ':repick-nophold'] = await run(make(), ['active', '']);
  results[kind + ':novalue'] = await run(make(), [kind === 'ht' ? null : 'Archived']);
  const tag = kind === 'ht' ? 'ht-option' : 'option';
  results[kind + ':placeholder'] = await run('<ht-select name="f" placeholder="Pick"><' + tag + ' value="a">A</' + tag + '></ht-select>');
}
document.getElementById('out').textContent = JSON.stringify(results);
`;

test('ht-select submits "" for an empty-value option and shows its label', (t) => {
  const chrome = findChrome();
  if (!chrome) return t.skip('no Chrome found (set CHROME_BIN)');

  const bundle = buildSync({
    entryPoints: [new URL('../src/components/select/select.ts', import.meta.url).pathname],
    bundle: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
  }).outputFiles[0].text;
  const dir = mkdtempSync(join(tmpdir(), 'halftone-select-'));
  writeFileSync(join(dir, 'select.js'), bundle);
  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html><meta charset="utf-8"><pre id="out">pending</pre>
<script type="module">import './select.js';
try {${cases}} catch (e) { document.getElementById('out').textContent = 'ERROR ' + e.stack; }</script>`,
  );

  const r = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--allow-file-access-from-files',
      `--user-data-dir=${join(dir, 'profile')}`,
      '--virtual-time-budget=5000',
      '--dump-dom',
      `file://${join(dir, 'index.html')}`,
    ],
    { encoding: 'utf8', timeout: 60_000 },
  );
  const raw = r.stdout.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1];
  assert.ok(raw, `no output from Chrome: ${r.stderr}`);
  assert.doesNotMatch(raw, /^(pending|ERROR)/, raw);
  const res = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));

  const any = { form: '', value: '', text: 'Any status', selected: ['Any status'] };
  for (const kind of ['ht', 'native']) {
    // Marked `selected` on first render.
    assert.deepEqual(res[`${kind}:selected`], any, `${kind}: selected empty option`);
    // No placeholder: the first option is chosen, even with value="".
    assert.deepEqual(res[`${kind}:default`], any, `${kind}: default to first option`);
    // Picked another option, then picked the empty one again.
    assert.deepEqual(res[`${kind}:repick`], any, `${kind}: re-pick with placeholder`);
    assert.deepEqual(res[`${kind}:repick-nophold`], any, `${kind}: re-pick without placeholder`);
    // No value attribute: the text is the value.
    assert.deepEqual(
      res[`${kind}:novalue`],
      { form: 'Archived', value: 'Archived', text: 'Archived', selected: ['Archived'] },
      `${kind}: option without value`,
    );
    // Nothing chosen and no empty option: the placeholder still shows.
    assert.deepEqual(res[`${kind}:placeholder`], { form: '', value: '', text: 'Pick', selected: [] }, `${kind}: placeholder`);
  }
});
