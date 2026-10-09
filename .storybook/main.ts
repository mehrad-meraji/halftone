import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  stories: ['../src/**/*.stories.ts', '../docs/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: [{ from: '../custom-elements.json', to: '/custom-elements.json' }],
};
export default config;
