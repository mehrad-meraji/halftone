import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// BASE_PATH is the sub-folder the site is served from (for GitHub Pages: '/halftone/').
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://mehrad-meraji.github.io',
  base,
  vite: {
    // The docs load Halftone straight from ../src, so examples always show the current source.
    server: { fs: { allow: ['..'] } },
  },
  integrations: [
    starlight({
      title: 'Halftone',
      description: 'Lit web components with ht- tags, styled by CSS variables. Works in any framework or none.',
      logo: { light: './src/assets/logo-light.svg', dark: './src/assets/logo-dark.svg', alt: '' },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mehrad-meraji/halftone' }],
      editLink: { baseUrl: 'https://github.com/mehrad-meraji/halftone/edit/main/site/src/content/docs/' },
      customCss: ['./src/styles/theme.css'],
      components: { Head: './src/components/Head.astro' },
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
      ],
      // Wrap long lines instead of scrolling: a scrolling block becomes an unnamed region landmark.
      expressiveCode: { defaultProps: { wrap: true } },
      lastUpdated: false,
    }),
  ],
});
