import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../icon/icon.js';
import './toggle-group.js';

const meta: Meta = {
  title: 'Components/Toggle Group',
  component: 'ht-toggle-group',
  subcomponents: { HtToggleItem: 'ht-toggle-item' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['single', 'multiple'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    value: { control: 'text' },
  },
  args: { type: 'single', size: 'md', value: 'list', disabled: false },
  render: (a) => html`
    <ht-toggle-group aria-label="View" type=${a.type} size=${a.size} value=${a.value} ?disabled=${a.disabled}>
      <ht-toggle-item value="list">List</ht-toggle-item>
      <ht-toggle-item value="board">Board</ht-toggle-item>
      <ht-toggle-item value="calendar">Calendar</ht-toggle-item>
    </ht-toggle-group>`,
};
export default meta;

/** Radio semantics: arrows move and select, one tab stop, no way to clear. */
export const Single: StoryObj = {};

export const NoInitialValue: StoryObj = { args: { value: '' } };

/** Toggle-button semantics: arrows move focus, Space or Enter toggles. `value` is comma-separated. */
export const Multiple: StoryObj = {
  args: { type: 'multiple', value: 'bold,underline' },
  render: (a) => html`
    <ht-toggle-group aria-label="Text style" type=${a.type} size=${a.size} value=${a.value} ?disabled=${a.disabled}>
      <ht-toggle-item value="bold" aria-label="Bold"><b>B</b></ht-toggle-item>
      <ht-toggle-item value="italic" aria-label="Italic"><i>I</i></ht-toggle-item>
      <ht-toggle-item value="underline" aria-label="Underline"><u>U</u></ht-toggle-item>
    </ht-toggle-group>`,
};

export const Small: StoryObj = { args: { size: 'sm' } };
export const Large: StoryObj = { args: { size: 'lg' } };

export const WithPrefix: StoryObj = {
  render: () => html`
    <ht-toggle-group aria-label="Layout" value="list">
      <ht-toggle-item value="list"><ht-icon slot="prefix" name="list"></ht-icon>List</ht-toggle-item>
      <ht-toggle-item value="calendar"><ht-icon slot="prefix" name="calendar"></ht-icon>Calendar</ht-toggle-item>
    </ht-toggle-group>`,
};

/** `count` shows a number after the label, in mono. The pressed item's count turns accent. */
export const Counts: StoryObj = {
  render: (a) => html`
    <ht-toggle-group aria-label="Filter results" size=${a.size} value="all" ?disabled=${a.disabled}>
      <ht-toggle-item value="all" count="20">All</ht-toggle-item>
      <ht-toggle-item value="read" count="14">Read</ht-toggle-item>
      <ht-toggle-item value="link" count="4">Link Only</ht-toggle-item>
      <ht-toggle-item value="failed" count="2">Failed</ht-toggle-item>
    </ht-toggle-group>`,
};

export const DisabledGroup: StoryObj = { args: { disabled: true } };

export const DisabledItem: StoryObj = {
  render: () => html`
    <ht-toggle-group aria-label="Plan" value="free">
      <ht-toggle-item value="free">Free</ht-toggle-item>
      <ht-toggle-item value="team" disabled>Team</ht-toggle-item>
      <ht-toggle-item value="business">Business</ht-toggle-item>
    </ht-toggle-group>`,
};

/** Long labels keep their size; the group grows. Put it in a scroll area if it must fit. */
export const LongLabels: StoryObj = {
  render: () => html`
    <ht-toggle-group aria-label="Assignee filter" value="all">
      <ht-toggle-item value="all">Everyone on the team</ht-toggle-item>
      <ht-toggle-item value="me">Assigned to me</ht-toggle-item>
      <ht-toggle-item value="none">Unassigned issues only</ht-toggle-item>
    </ht-toggle-group>`,
};

/** `change` fires on user action only. */
export const ListeningForChange: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;justify-items:start">
      <ht-toggle-group
        aria-label="Notify by"
        type="multiple"
        value="email"
        @change=${(e: Event) => {
          const g = e.currentTarget as HTMLElement & { values: string[] };
          (g.nextElementSibling as HTMLElement).textContent = `values: ${JSON.stringify(g.values)}`;
        }}
      >
        <ht-toggle-item value="email">Email</ht-toggle-item>
        <ht-toggle-item value="slack">Slack</ht-toggle-item>
        <ht-toggle-item value="sms">SMS</ht-toggle-item>
      </ht-toggle-group>
      <code style="font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">values: ["email"]</code>
    </div>`,
};
