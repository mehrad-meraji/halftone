import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './separator.js';

const text = (s: string) => html`<p style="margin:0;font:400 14px/1.5 var(--ht-font-ui);color:var(--ht-text)">${s}</p>`;

const meta: Meta = {
  title: 'Components/Separator',
  component: 'ht-separator',
  tags: ['autodocs'],
  argTypes: { orientation: { control: 'select', options: ['horizontal', 'vertical'] } },
  args: { orientation: 'horizontal', decorative: false },
  render: (a) => html`
    <div style="width:360px;display:grid;gap:12px">
      ${text('Sign in with a password.')}
      <ht-separator orientation=${a.orientation} ?decorative=${a.decorative}></ht-separator>
      ${text('Or use a single-use link.')}
    </div>`,
};
export default meta;

export const Horizontal: StoryObj = {};
export const Decorative: StoryObj = { args: { decorative: true } };

export const WithLabel: StoryObj = {
  render: () => html`
    <div style="width:360px;display:grid;gap:12px">
      ${text('Sign in with a password.')}
      <ht-separator>Or</ht-separator>
      ${text('Use a single-use link.')}
    </div>`,
};

/** Stretches to the height of the row it sits in. */
export const Vertical: StoryObj = {
  render: () => html`
    <div style="display:flex;align-items:center;gap:12px;height:32px">
      ${text('Issues')}
      <ht-separator orientation="vertical"></ht-separator>
      ${text('Releases')}
      <ht-separator orientation="vertical" decorative></ht-separator>
      ${text('Settings')}
    </div>`,
};

export const VerticalWithLabel: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;height:120px;width:360px">
      <div style="flex:1">${text('Left column.')}</div>
      <ht-separator orientation="vertical">Or</ht-separator>
      <div style="flex:1">${text('Right column.')}</div>
    </div>`,
};

export const LongLabel: StoryObj = {
  render: () => html`
    <div style="width:240px">
      <ht-separator>Continue with a very long provider name here</ht-separator>
    </div>`,
};
