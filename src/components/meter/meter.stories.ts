import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './meter.js';

const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const title = (t: string) => t[0].toUpperCase() + t.slice(1);

/** The day used in most stories: meetings, done, open and late tasks. */
const day = (meetings = 3, done = 2, open = 4, late = 1) => html`
  <ht-meter-part tone="info" label="Meetings" value=${meetings}></ht-meter-part>
  <ht-meter-part tone="success" label="Done" value=${done}></ht-meter-part>
  <ht-meter-part tone="accent" label="Open" value=${open}></ht-meter-part>
  <ht-meter-part tone="danger" label="Late" value=${late}></ht-meter-part>
`;

const meta: Meta = {
  title: 'Components/Meter',
  component: 'ht-meter',
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    max: { control: { type: 'number', min: 0 } },
  },
  args: { label: 'Wed 28', size: 'md', legend: false, max: undefined, summary: '' },
  render: (a) => html`
    <ht-meter
      style="width:320px"
      label=${a.label} size=${a.size} max=${ifDefined(a.max || undefined)}
      summary=${ifDefined(a.summary || undefined)} ?legend=${a.legend}
    >${day()}</ht-meter>`,
};
export default meta;

/** No `max`: the parts share the full width. */
export const Default: StoryObj = {};

/** sm 4px and md 8px. No visible label: the host `aria-label` is put in front of the summary. */
export const Sizes: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:16px;width:320px">
      <ht-meter size="sm" aria-label="Thu 29, small">${day(2, 1, 4, 0)}</ht-meter>
      <ht-meter size="md" aria-label="Thu 29, medium">${day(2, 1, 4, 0)}</ht-meter>
    </div>`,
};

/** 10 of 12: the two left show as a hatched track. */
export const WithMax: StoryObj = { args: { max: 12 } };

/** 14 of 12: the bar scales to the sum and a mark sits where 12 falls. */
export const OverMax: StoryObj = {
  render: () => html`
    <ht-meter style="width:320px" label="Tue 27" max="12">
      <ht-meter-part tone="info" label="Meetings" value="4"></ht-meter-part>
      <ht-meter-part tone="accent" label="Open" value="10"></ht-meter-part>
    </ht-meter>`,
};

/**
 * The legend table lists every part with its count, including parts at 0. With the generated
 * summary it is hidden from screen readers; with a custom `summary` it is read as a list.
 */
export const Legend: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:32px;width:320px">
      <ht-meter label="Wed 28" max="12" legend>${day()}</ht-meter>
      <ht-meter label="Fri 30" max="12" legend summary="Quiet day">${day(1, 3, 0, 0)}</ht-meter>
    </div>`,
};

/** One part per tone, each against the track. */
export const Tones: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:16px;width:320px">
      <ht-meter label="All Tones" legend>
        ${tones.map((t) => html`<ht-meter-part tone=${t} label=${title(t)} value="1"></ht-meter-part>`)}
      </ht-meter>
      ${tones.map(
        (t) => html`<ht-meter aria-label=${title(t)} max="4"><ht-meter-part tone=${t} label=${title(t)} value="3"></ht-meter-part></ht-meter>`,
      )}
    </div>`,
};
