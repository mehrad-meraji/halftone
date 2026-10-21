import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../card/card.js';
import '../icon/icon.js';
import './empty-state.js';

const meta: Meta = {
  title: 'Components/Empty State',
  component: 'ht-empty-state',
  tags: ['autodocs'],
  argTypes: { tone: { control: 'select', options: ['default', 'error'] }, level: { control: 'number' } },
  args: {
    heading: 'No monitors yet',
    description: 'A monitor checks a URL on a schedule and tells you when it stops answering. Add one to get started.',
    tone: 'default',
    level: 2,
  },
  render: (a) => html`
    <ht-empty-state style="width:520px" heading=${a.heading} description=${a.description} tone=${a.tone} level=${a.level}>
      <ht-button slot="actions" variant="primary">Add Monitor</ht-button>
      <ht-button slot="actions" variant="default">Learn More</ht-button>
    </ht-empty-state>`,
};
export default meta;

/** The dot screen fades out around the graphic. The text and buttons stay on the plain surface. */
export const Default: StoryObj = {};

/** An error is not a place for decoration: no stage, an alert icon, and no playful copy. */
export const Error: StoryObj = {
  args: { tone: 'error', heading: 'Monitors could not be loaded', description: 'Something went wrong on our side. Try again in a minute.' },
  render: (a) => html`
    <ht-empty-state style="width:520px" heading=${a.heading} description=${a.description} tone="error">
      <ht-button slot="actions" variant="default">Try Again</ht-button>
    </ht-empty-state>`,
};

export const CustomGraphic: StoryObj = {
  render: () => html`
    <ht-empty-state style="width:520px" heading="Nothing matches that search" description="Try a shorter word, or clear the filters.">
      <ht-icon slot="graphic" name="list"></ht-icon>
      <ht-button slot="actions" variant="default">Clear Filters</ht-button>
    </ht-empty-state>`,
};

export const NoActions: StoryObj = {
  render: () => html`<ht-empty-state style="width:520px" heading="You are all caught up" description="New alerts will show up here."></ht-empty-state>`,
};

/** Inside a card: the stage reads as a quiet spot in the body, not as a second header strip. */
export const InsideCard: StoryObj = {
  render: () => html`
    <ht-card style="width:520px" eyebrow="Monitors" heading="api.soopercooler.com">
      <ht-empty-state heading="No checks have run" description="The first check runs within a minute of saving.">
        <ht-button slot="actions" variant="primary" size="sm">Run Now</ht-button>
      </ht-empty-state>
    </ht-card>`,
};

/** Move the pointer over the block: the dot screen and a faint glow appear under it. `no-spotlight` turns it off. */
export const Spotlight: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:24px;flex-wrap:wrap">
      <ht-empty-state style="width:420px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg)" heading="Move the pointer here" description="The dot screen appears under it and fades when it leaves.">
        <ht-button slot="actions" variant="primary">Add Monitor</ht-button>
      </ht-empty-state>
      <ht-empty-state no-spotlight style="width:420px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg)" heading="No spotlight" description="This one stays still."></ht-empty-state>
    </div>`,
};
