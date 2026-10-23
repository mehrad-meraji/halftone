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
export const List01 = block('list-01');
export const Detail01 = block('detail-01');
export const ActivityFeed01 = block('activity-feed-01');
export const Members01 = block('members-01');
export const Inbox01 = block('inbox-01');
export const Comments01 = block('comments-01');
export const Board01 = block('board-01');
export const Interstitial01 = block('interstitial-01');
export const SearchHome01 = block('search-home-01');
export const SearchResults01 = block('search-results-01');
export const MediaGrid01 = block('media-grid-01');
export const Wizard01 = block('wizard-01');
export const SetupSteps01 = block('setup-steps-01');
export const Status01 = block('status-01');
export const LogViewer01 = block('log-viewer-01');
export const Invoice01 = block('invoice-01');
