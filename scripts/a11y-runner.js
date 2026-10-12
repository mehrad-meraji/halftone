/*
 * Runs axe-core over every Storybook story, in light and dark, from the browser.
 *
 * 1. `npm run dev`, open http://localhost:6006/iframe.html?id=components-button--primary
 * 2. Paste this file into the DevTools console.
 * 3. Run, in chunks of about 28 stories so a single call stays short:
 *      await __a11y.run(0, 28, 'light'); await __a11y.run(28, 57, 'light'); await __a11y.run(57, 85, 'light');
 *      (same again with 'dark')
 *    then read `__a11y.results` (empty means no violations).
 *
 * Covers WCAG 2.0/2.1/2.2 A and AA plus axe best practices, text contrast included.
 * Axe cannot see contrast on pseudo-element fills (button faces) or non-text contrast
 * (borders, focus rings): check those with scripts/contrast.mjs.
 */
(async () => {
  const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
  const src = await fetch(AXE).then((r) => r.text());
  const idx = await fetch('/index.json').then((r) => r.json());
  const ids = Object.values(idx.entries).filter((e) => e.type === 'story').map((e) => e.id);
  const results = [];
  async function run(from, to, theme = 'light') {
    for (const id of ids.slice(from, to)) {
      const f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;left:0;top:0;width:1100px;height:800px;opacity:0;pointer-events:none';
      f.src = `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`;
      document.body.append(f);
      await new Promise((r) => (f.onload = r));
      await new Promise((r) => setTimeout(r, 900));
      try {
        f.contentWindow.eval(src);
        const res = await f.contentWindow.axe.run(
          f.contentDocument.querySelector('#storybook-root') || f.contentDocument.body,
          {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
            rules: { region: { enabled: false } },
          },
        );
        for (const v of res.violations) {
          results.push({ id, theme, rule: v.id, impact: v.impact, nodes: v.nodes.length, target: v.nodes[0].target.join(' >> ') });
        }
      } catch (e) {
        results.push({ id, theme, rule: 'RUNNER_ERROR', error: String(e) });
      }
      f.remove();
    }
    return results.length;
  }
  window.__a11y = { ids, results, run };
  console.log(`a11y runner ready: ${ids.length} stories. Use __a11y.run(from, to, theme).`);
})();
