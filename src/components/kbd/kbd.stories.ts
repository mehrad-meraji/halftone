import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './kbd.js';

const meta: Meta = {
  title: 'Components/Kbd',
  component: 'ht-kbd',
  tags: ['autodocs'],
  args: { keys: '⌘ K' },
  render: (a) => html`<ht-kbd keys=${a.keys}></ht-kbd>`,
};
export default meta;

export const Default: StoryObj = {};
export const ThreeKeys: StoryObj = { args: { keys: 'Ctrl Shift P' } };
export const SingleSlot: StoryObj = { render: () => html`<ht-kbd>Esc</ht-kbd>` };
export const InSentence: StoryObj = {
  render: () => html`<p style="font:400 14px var(--ht-font-ui)">Press <ht-kbd keys="⌘ K"></ht-kbd> to search, <ht-kbd>Esc</ht-kbd> to close.</p>`,
};
