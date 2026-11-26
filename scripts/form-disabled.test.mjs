// Every form control must go back to normal when it stops being disabled, in a real browser:
// jsdom has no form-associated custom elements. Uses the Chrome already on the machine or CI runner.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const root = new URL('..', import.meta.url).pathname;
const markup = { radio: '<ht-radio-group><ht-radio value="a">A</ht-radio></ht-radio-group>' };
const controls = readdirSync(`${root}src/components`).filter((name) => {
  const file = `${root}src/components/${name}/${name}.ts`;
  try {
    return readFileSync(file, 'utf8').includes('formDisabledCallback');
  } catch {
    return false;
  }
});

let server;
let browser;
let page;

before(async () => {
  server = await createServer({ root, logLevel: 'silent', server: { port: 0, host: '127.0.0.1' } });
  await server.listen();
  const { port } = server.httpServer.address();
  browser = await chromium.launch({ channel: 'chrome' });
  page = await browser.newPage();
  const origin = `http://127.0.0.1:${port}`;
  await page.route(`${origin}/form-disabled`, (r) =>
    r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>t</title><body></body>' }),
  );
  await page.goto(`${origin}/form-disabled`);
});

after(async () => {
  await browser?.close();
  await server?.close();
});

/** Runs in the page: drives one control through a list of steps and records what it renders. */
async function scenario({ name, html, steps }) {
  await import(`/src/components/${name}/${name}.ts`);
  const shadowHtml = (el) => {
    const parts = [el.shadowRoot?.innerHTML ?? ''];
    for (const child of el.querySelectorAll('*')) if (child.shadowRoot) parts.push(child.shadowRoot.innerHTML);
    return parts.join('|').replace(/<!--[\s\S]*?-->/g, '');
  };
  const settle = async (el) => {
    await new Promise((r) => setTimeout(r));
    await el.updateComplete;
    await new Promise((r) => setTimeout(r));
  };
  const fieldset = document.createElement('fieldset');
  fieldset.innerHTML = html;
  document.body.replaceChildren(fieldset);
  const el = fieldset.firstElementChild;
  await customElements.whenDefined(el.localName);
  await settle(el);
  const actions = {
    prop: (v) => (el.disabled = v),
    attr: (v) => el.toggleAttribute('disabled', v),
    fieldset: (v) => (fieldset.disabled = v),
  };
  const seen = { start: shadowHtml(el) };
  for (const [i, [action, value]] of steps.entries()) {
    actions[action](value);
    await settle(el);
    seen[i] = shadowHtml(el);
  }
  return seen;
}

const run = (name, steps, html = markup[name] ?? `<ht-${name}></ht-${name}>`) =>
  page.evaluate(`(${scenario})(${JSON.stringify({ name, html, steps })})`);

test('finds the form controls', () => assert.ok(controls.includes('input') && controls.length >= 11, String(controls)));

for (const name of controls) {
  test(`${name}: own disabled property on and off, twice`, async () => {
    const s = await run(name, [['prop', true], ['prop', false], ['prop', true], ['prop', false]]);
    assert.notEqual(s[0], s.start, 'disabling changes what it renders');
    assert.equal(s[1], s.start, 'first enable');
    assert.equal(s[2], s[0], 'second disable');
    assert.equal(s[3], s.start, 'second enable');
  });

  test(`${name}: disabled attribute on and off`, async () => {
    const s = await run(name, [['attr', true], ['attr', false]]);
    assert.notEqual(s[0], s.start);
    assert.equal(s[1], s.start);
  });

  test(`${name}: disabled fieldset on and off`, async () => {
    const s = await run(name, [['fieldset', true], ['fieldset', false]]);
    assert.notEqual(s[0], s.start);
    assert.equal(s[1], s.start);
  });

  test(`${name}: own disabled ends first, fieldset still holds it`, async () => {
    const s = await run(name, [['fieldset', true], ['prop', true], ['prop', false], ['fieldset', false]]);
    assert.equal(s[2], s[0], 'still disabled by the fieldset');
    assert.equal(s[3], s.start);
  });

  test(`${name}: fieldset ends first, own disabled still holds it`, async () => {
    const s = await run(name, [['prop', true], ['fieldset', true], ['fieldset', false], ['prop', false]]);
    assert.equal(s[2], s[0], 'still disabled by the property');
    assert.equal(s[3], s.start);
  });

  test(`${name}: starts disabled in the markup`, async () => {
    const html = (markup[name] ?? `<ht-${name}></ht-${name}>`).replace(/^<([\w-]+)/, '<$1 disabled');
    const s = await run(name, [['attr', false]], html);
    assert.notEqual(s[0], s.start);
    const plain = await run(name, []);
    assert.equal(s[0], plain.start);
  });
}
