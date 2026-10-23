/// <reference types="vite/client" />
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../index.js';

// Each story renders a block's HTML file as is, so what you see is exactly what `halftone add` copies.
// Add one export per block; `npm run registry` fails if a block has no story here.
const files = import.meta.glob<string>('./*/*.html', { query: '?raw', import: 'default', eager: true });

const block = (name: string): StoryObj => ({
  render: () => html`${unsafeHTML(files[`./${name}/${name}.html`])}`,
});

const meta: Meta = {
  title: 'Blocks',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Login01 = block('login-01');
export const AppShell01 = block('app-shell-01');
export const Settings01 = block('settings-01');
export const Dashboard01 = block('dashboard-01');
