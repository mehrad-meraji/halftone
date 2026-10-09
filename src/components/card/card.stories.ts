import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './card.js';

const meta: Meta = {
  title: 'Components/Card',
  component: 'ht-card',
  tags: ['autodocs'],
  argTypes: { variant: { control: 'select', options: ['default', 'muted'] }, interactive: { control: 'boolean' } },
  args: { eyebrow: 'Monitor', heading: 'api.soopercooler.com', variant: 'default', interactive: false },
  render: (a) => html`
    <ht-card style="width:360px" eyebrow=${a.eyebrow} heading=${a.heading} variant=${a.variant} ?interactive=${a.interactive}>
      Up for 41 days. Last incident: a DNS typo, entirely your fault.
    </ht-card>`,
};
export default meta;

export const Default: StoryObj = {};
export const Muted: StoryObj = { args: { variant: 'muted' } };
export const Interactive: StoryObj = { args: { interactive: true } };
export const BodyOnly: StoryObj = { args: { eyebrow: '', heading: '' } };

export const WithActionsAndFooter: StoryObj = {
  render: () => html`
    <ht-card style="width:360px" eyebrow="Deploy" heading="v0.4.2 to production">
      <ht-button slot="actions" variant="ghost" size="xs">Logs</ht-button>
      Rolled out in 38s. No errors. Suspicious.
      <div slot="footer" style="display:flex;justify-content:flex-end;gap:8px">
        <ht-button variant="secondary" size="sm">Roll Back</ht-button>
        <ht-button size="sm">Promote</ht-button>
      </div>
    </ht-card>`,
};
