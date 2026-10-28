import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../kbd/kbd.js';
import './tooltip.js';

const meta: Meta = {
  title: 'Components/Tooltip',
  component: 'ht-tooltip',
  tags: ['autodocs'],
  argTypes: {
    placement: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
    delay: { control: 'number' },
    disabled: { control: 'boolean' },
    arrow: { control: 'boolean' },
    offset: { control: 'number' },
  },
  args: { text: 'Copy to clipboard', placement: 'top', delay: 300, disabled: false, arrow: false, offset: 8 },
  parameters: { layout: 'centered' },
  render: (a) => html`
    <div style="padding:64px 96px">
      <ht-tooltip text=${a.text} placement=${a.placement} delay=${a.delay} offset=${a.offset} ?arrow=${a.arrow} ?disabled=${a.disabled}>
        <ht-button variant="default">Hover or focus me</ht-button>
      </ht-tooltip>
    </div>`,
};
export default meta;

export const Top: StoryObj = {};
export const Bottom: StoryObj = { args: { placement: 'bottom' } };
export const Left: StoryObj = { args: { placement: 'left' } };
export const Right: StoryObj = { args: { placement: 'right' } };
export const Disabled: StoryObj = { args: { disabled: true } };

export const RichContent: StoryObj = {
  render: () => html`
    <div style="padding:64px 96px">
      <ht-tooltip>
        <ht-button variant="default">Search</ht-button>
        <span slot="content">Search everything <ht-kbd keys="⌘ K"></ht-kbd></span>
      </ht-tooltip>
    </div>`,
};

/** Near an edge the bubble flips to the side with room. */
export const FlipsAtEdge: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => html`
    <div style="padding:8px">
      <ht-tooltip text="I would be clipped above, so I flip below." placement="top">
        <ht-button variant="default">Top edge</ht-button>
      </ht-tooltip>
    </div>`,
};

export const WithArrow: StoryObj = { args: { arrow: true } };
