import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './card.js';

const meta: Meta = {
  title: 'Components/Card',
  component: 'ht-card',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'muted'] },
    interactive: { control: 'boolean' },
    level: { control: { type: 'number', min: 1, max: 6 } },
  },
  args: { eyebrow: 'Monitor', heading: 'api.soopercooler.com', level: 3, variant: 'default', interactive: false },
  render: (a) => html`
    <ht-card style="width:360px" eyebrow=${a.eyebrow} heading=${a.heading} level=${a.level} variant=${a.variant} ?interactive=${a.interactive}>
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
      <ht-button slot="actions" variant="quiet" size="xs">Logs</ht-button>
      Rolled out in 38s. No errors. Suspicious.
      <div slot="footer" style="display:flex;justify-content:flex-end;gap:8px">
        <ht-button variant="default" size="sm">Roll Back</ht-button>
        <ht-button size="sm">Promote</ht-button>
      </div>
    </ht-card>`,
};

/** Cards under a page title: `level="2"` keeps the outline h1, h2, h2, h2. No card adds a landmark. */
export const Level: StoryObj = {
  render: () => html`
    <h1 style="margin:0 0 16px;font:600 1.5rem/1.2 var(--ht-font-display)">Status</h1>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;max-width:780px">
      <ht-card level="2" eyebrow="Monitor" heading="api.soopercooler.com">Up for 41 days.</ht-card>
      <ht-card level="2" eyebrow="Monitor" heading="cdn.soopercooler.com">Up for 12 days.</ht-card>
      <ht-card level="2" eyebrow="Monitor" heading="db.soopercooler.com">
        Up for 3 hours. Someone restarted it.
        <span slot="footer">Last check 30s ago</span>
      </ht-card>
    </div>`,
};
