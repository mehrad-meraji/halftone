import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './tag.js';

const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];

const meta: Meta = {
  title: 'Components/Tag',
  component: 'ht-tag',
  tags: ['autodocs'],
  argTypes: { tone: { control: 'select', options: tones }, size: { control: 'select', options: ['sm', 'md'] } },
  args: { tone: 'neutral', size: 'sm' },
  render: (a) => html`<ht-tag tone=${a.tone} size=${a.size}>Beta</ht-tag>`,
};
export default meta;

export const Neutral: StoryObj = {};
export const Accent: StoryObj = { args: { tone: 'accent' } };
export const Warning: StoryObj = { args: { tone: 'warning' } };
export const AllTones: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px">
      ${['sm', 'md'].map((s) => html`<div style="display:flex;gap:8px;align-items:center">
        ${tones.map((t) => html`<ht-tag tone=${t} size=${s}>${t}</ht-tag>`)}
      </div>`)}
    </div>`,
};
