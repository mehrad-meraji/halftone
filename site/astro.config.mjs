import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { existsSync, readFileSync } from 'node:fs';

// Blocks are grouped by category in the sidebar. blocks.json is written by scripts/gen-blocks.mjs, which runs before dev and build.
const blocksFile = new URL('./src/generated/blocks.json', import.meta.url);
const blockList = existsSync(blocksFile) ? JSON.parse(readFileSync(blocksFile, 'utf8')) : [];
const blockGroups = [...new Set(blockList.map((b) => b.category))].sort().map((category) => ({
  label: category,
  collapsed: false,
  items: blockList.filter((b) => b.category === category).map((b) => ({ slug: `blocks/${b.name}` })),
}));

// BASE_PATH is the sub-folder the site is served from (for GitHub Pages: '/halftone/').
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://mehrad-meraji.github.io',
  base,
  // The first screen is the About page, as in the design.
  redirects: { '/': `${base.replace(/\/$/, '')}/getting-started/about/` },
  vite: {
    // The docs load Halftone straight from ../src, so examples always show the current source.
    server: { fs: { allow: ['..'] } },
    // Pre-bundle what the components import, so the dev server does not re-optimize mid-session
    // (that shows up as "504 Outdated Optimize Dep" until a reload).
    optimizeDeps: { include: ['lit', 'lit/directives/if-defined.js', 'lit/directives/live.js', 'lit/directives/unsafe-svg.js'] },
  },
  integrations: [
    starlight({
      title: 'Halftone',
      description: 'Lit web components with ht- tags, styled by CSS variables. Works in any framework or none.',
      logo: { src: './src/assets/logo.png', alt: '' },
      favicon: '/favicon.png',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mehrad-meraji/halftone' }],
      editLink: { baseUrl: 'https://github.com/mehrad-meraji/halftone/edit/main/site/src/content/docs/' },
      customCss: ['./src/styles/theme.css'],
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        PageTitle: './src/components/PageTitle.astro',
        PageSidebar: './src/components/PageSidebar.astro',
        Footer: './src/components/Footer.astro',
        PageFrame: './src/components/PageFrame.astro',
        Sidebar: './src/components/Sidebar.astro',
        Search: './src/components/Search.astro',
      },
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Geist:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
          },
        },
      ],
      sidebar: [
        { label: 'Getting started', items: [{ autogenerate: { directory: 'getting-started' } }] },
        { label: 'Foundations', items: [{ autogenerate: { directory: 'foundations' } }] },
        { label: 'Components', items: [{ autogenerate: { directory: 'components' } }] },
        { label: 'Blocks', items: [{ slug: 'blocks', label: 'Overview' }, ...blockGroups] },
        { label: 'Patterns', items: [{ autogenerate: { directory: 'patterns' } }] },
        { label: 'Resources', items: [{ autogenerate: { directory: 'resources' } }] },
      ],
      // Wrap long lines instead of scrolling: a scrolling block becomes an unnamed region landmark.
      expressiveCode: { defaultProps: { wrap: true } },
      lastUpdated: false,
    }),
  ],
});
