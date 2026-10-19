import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './shimmer.js';

const meta: Meta = {
  title: 'Components/Shimmer',
  component: 'ht-shimmer',
  tags: ['autodocs'],
  argTypes: { duration: { control: 'number' } },
  args: { duration: 2 },
  render: (a) => html`<ht-shimmer duration=${a.duration} style="font:500 16px/24px var(--ht-font-ui)">Thinking…</ht-shimmer>`,
};
export default meta;

export const Default: StoryObj = {};
export const Slow: StoryObj = { args: { duration: 4 } };

/**
 * The shimmer is only paint. Tell assistive technology about the state in text, here with a
 * `role="status"` line. The visible shimmer text is hidden from it so it is not read twice.
 */
export const Announced: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:8px;align-items:center;font:400 14px/20px var(--ht-font-ui);color:var(--ht-text)">
      <span role="status" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap">Generating the report</span>
      <ht-shimmer aria-hidden="true">Generating the report…</ht-shimmer>
    </div>`,
};

/** Inline, in a sentence. The shimmer follows the surrounding font. */
export const Inline: StoryObj = {
  render: () => html`<p style="margin:0;max-width:320px;font:400 14px/20px var(--ht-font-ui);color:var(--ht-text)">
    Your export is <ht-shimmer>being prepared</ht-shimmer> and will arrive by email.
  </p>`,
};
