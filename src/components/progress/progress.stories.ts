import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './progress.js';

const tones = ['accent', 'neutral', 'success', 'warning', 'danger', 'info'];

const meta: Meta = {
  title: 'Components/Progress',
  component: 'ht-progress',
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: tones },
    size: { control: 'select', options: ['sm', 'md'] },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  args: { value: 40, max: 100, label: 'Uploading', tone: 'accent', size: 'md', indeterminate: false, showValue: true },
  render: (a) => html`
    <ht-progress
      style="width:320px"
      value=${a.value} max=${a.max} label=${a.label} tone=${a.tone} size=${a.size}
      ?indeterminate=${a.indeterminate} ?show-value=${a.showValue}
    ></ht-progress>`,
};
export default meta;

export const Default: StoryObj = {};
export const Small: StoryObj = { args: { size: 'sm' } };
export const Empty: StoryObj = { args: { value: 0 } };
export const Complete: StoryObj = { args: { value: 100, tone: 'success', label: 'Backup Complete' } };

/** Unknown length. Moves, or shows static stripes when the OS asks for reduced motion. */
export const Indeterminate: StoryObj = { args: { indeterminate: true, label: 'Waiting For The Queue' } };

/** No visible label: the host `aria-label` is forwarded to the progressbar. */
export const NoVisibleLabel: StoryObj = {
  render: () => html`<ht-progress style="width:320px" aria-label="Import progress" value="65" size="sm"></ht-progress>`,
};

/** `max` is not 100, so the percentage is worked out from it. */
export const CustomMax: StoryObj = {
  render: () => html`<ht-progress style="width:320px" label="Rows Imported" value="18204" max="60000" show-value></ht-progress>`,
};

export const AllTones: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:16px;width:320px">
      ${tones.map((t) => html`<ht-progress tone=${t} label=${t} value="62" show-value></ht-progress>`)}
      ${tones.map((t) => html`<ht-progress tone=${t} size="sm" aria-label=${`${t} small`} value="62"></ht-progress>`)}
    </div>`,
};
