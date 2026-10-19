import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './spotlight.js';

const card = 'padding:24px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);background:var(--ht-surface);font:400 14px/20px var(--ht-font-ui);color:var(--ht-text-muted)';

const meta: Meta = {
  title: 'Components/Spotlight',
  component: 'ht-spotlight',
  tags: ['autodocs'],
  argTypes: { size: { control: 'number' } },
  args: { size: 200 },
  render: (a) => html`
    <ht-spotlight size=${a.size} style="width:360px;border-radius:var(--ht-radius-lg)">
      <div style=${card}>
        <strong style="display:block;margin-bottom:4px;font:600 16px/24px var(--ht-font-display);color:var(--ht-text)">Move the pointer here</strong>
        The halftone dots appear under it and fade when it leaves.
      </div>
    </ht-spotlight>`,
};
export default meta;

export const Default: StoryObj = {};
export const Large: StoryObj = { args: { size: 320 } };

/** A grid of spotlights, each one following its own pointer. */
export const Grid: StoryObj = {
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(3,200px);gap:12px">
      ${['Errors', 'Releases', 'Alerts'].map((t) => html`
        <ht-spotlight size="140" style="border-radius:var(--ht-radius-lg)">
          <div style=${card}><strong style="color:var(--ht-text)">${t}</strong></div>
        </ht-spotlight>`)}
    </div>`,
};
