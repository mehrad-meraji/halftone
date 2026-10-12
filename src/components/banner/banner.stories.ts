import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './banner.js';

const tones = ['info', 'success', 'warning', 'danger'];

const meta: Meta = {
  title: 'Components/Banner',
  component: 'ht-banner',
  tags: ['autodocs'],
  argTypes: { tone: { control: 'select', options: tones }, dismissible: { control: 'boolean' } },
  args: { tone: 'info', dismissible: false },
  parameters: { layout: 'padded' },
  render: (a) => html`<ht-banner tone=${a.tone} ?dismissible=${a.dismissible}>Get more out of Halftone by inviting your team for free.</ht-banner>`,
};
export default meta;

export const Info: StoryObj = {};
export const Success: StoryObj = { args: { tone: 'success' } };
export const Warning: StoryObj = { args: { tone: 'warning' } };
export const Danger: StoryObj = { args: { tone: 'danger' } };
export const Dismissible: StoryObj = { args: { dismissible: true } };

export const WithAction: StoryObj = {
  render: () => html`
    <ht-banner tone="warning" dismissible>
      Your trial ends in 3 days. Nobody will be sad, but still.
      <ht-button slot="action" size="sm" variant="default">Upgrade</ht-button>
    </ht-banner>`,
};
