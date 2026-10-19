import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './ping.js';

const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const row = 'display:flex;gap:8px;align-items:center;font:400 14px/20px var(--ht-font-ui);color:var(--ht-text)';

const meta: Meta = {
  title: 'Components/Ping',
  component: 'ht-ping',
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: tones },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    still: { control: 'boolean' },
  },
  args: { tone: 'success', size: 'md', still: false, label: '' },
  render: (a) => html`<div style=${row}>
    <ht-ping tone=${a.tone} size=${a.size} ?still=${a.still} label=${a.label}></ht-ping>
    Deploy live
  </div>`,
};
export default meta;

export const Success: StoryObj = {};
export const Danger: StoryObj = { args: { tone: 'danger' } };
/** Pulse off: a plain dot, for a state that is steady rather than live. */
export const Still: StoryObj = { args: { tone: 'neutral', still: true } };

export const AllTones: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px">
      ${['sm', 'md', 'lg'].map((s) => html`<div style="${row};gap:20px">
        ${tones.map((t) => html`<span style=${row}><ht-ping tone=${t} size=${s}></ht-ping>${t}</span>`)}
      </div>`)}
    </div>`,
};

/**
 * A dot is only colour. Beside visible text it is decorative and hidden. Alone, give it a `label`
 * and it is announced as an image.
 */
export const Labelled: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px">
      <span style=${row}><ht-ping tone="success"></ht-ping>Online</span>
      <span style=${row}><ht-ping tone="success" label="Online"></ht-ping>Dot with its own name, for icon-only places</span>
    </div>`,
};
