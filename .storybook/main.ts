import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  stories: ['../src/**/*.stories.ts', '../docs/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: [{ from: '../custom-elements.json', to: '/custom-elements.json' }],
  // Pre-bundle everything the components import. Otherwise Vite discovers these one by one
  // while you work, re-optimises mid-session, and open tabs fail with
  // "504 Outdated Optimize Dep" until the server is restarted.
  viteFinal: (config) => ({
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        'lit',
        'lit/directives/if-defined.js',
        'lit/directives/live.js',
        'lit/directives/unsafe-svg.js',
      ],
    },
  }),
};
export default config;
