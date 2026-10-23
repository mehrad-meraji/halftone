import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './alert.js';

const TONES = ['neutral', 'info', 'success', 'warning', 'danger'] as const;

const meta: Meta = {
  title: 'Components/Alert',
  component: 'ht-alert',
  tags: ['autodocs'],
  argTypes: { tone: { control: 'select', options: TONES } },
  args: { tone: 'neutral', heading: 'Heads up', noIcon: false },
  render: (a) => html`<div style="max-width:32rem">
    <ht-alert tone=${a.tone} heading=${a.heading} ?no-icon=${a.noIcon}>You can add components to your app with the CLI.</ht-alert>
  </div>`,
};
export default meta;

export const Neutral: StoryObj = {};
export const Info: StoryObj = { args: { tone: 'info', heading: 'New feature available' } };
export const Success: StoryObj = { args: { tone: 'success', heading: 'Account updated' } };
export const Warning: StoryObj = { args: { tone: 'warning', heading: 'Subscription ends in 3 days' } };
export const Danger: StoryObj = {
  args: { tone: 'danger' },
  render: () => html`<div style="max-width:32rem">
    <ht-alert tone="danger" heading="Payment failed">Your card was declined. Check the payment method and try again.</ht-alert>
  </div>`,
};
export const NoIcon: StoryObj = { args: { noIcon: true } };

export const AllTones: StoryObj = {
  render: () => html`<div style="display:grid;gap:12px;max-width:32rem">
    ${TONES.map((t) => html`<ht-alert tone=${t} heading="The ${t} tone">Something worth a look. It stays until the page changes.</ht-alert>`)}
  </div>`,
};

/** The `action` slot sits at the top right, beside the text, never over it. */
export const WithAction: StoryObj = {
  render: () => html`<div style="max-width:32rem">
    <ht-alert heading="Dark mode is available">
      Turn it on in your profile settings.
      <ht-button slot="action" size="sm" variant="default">Enable</ht-button>
    </ht-alert>
  </div>`,
};

/** A title alone, a description alone, and a description with paragraphs and a link. */
export const Content: StoryObj = {
  render: () => html`<div style="display:grid;gap:12px;max-width:32rem">
    <ht-alert heading="Saved. Nothing exploded."></ht-alert>
    <ht-alert>Only a description. The text lines up with the top of the icon.</ht-alert>
    <ht-alert tone="info">
      <span slot="title">Rate limits changed</span>
      <p>Each project now gets 1,000 events a minute.</p>
      <p>Read the <a href="#">release notes</a> for details.</p>
    </ht-alert>
  </div>`,
};
