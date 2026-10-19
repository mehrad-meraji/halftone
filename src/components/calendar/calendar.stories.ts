import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../button/button.js';
import './calendar.js';

const box = 'border:1px solid var(--ht-border-strong);border-radius:var(--ht-radius-lg);background:var(--ht-surface);display:inline-block';

const meta: Meta = {
  title: 'Components/Calendar',
  component: 'ht-calendar',
  tags: ['autodocs'],
  argTypes: {
    weekStart: { control: { type: 'number', min: 0, max: 6 }, name: 'week-start' },
    lang: { control: 'text' },
  },
  args: { value: '2026-10-19', min: '', max: '', disabled: false, lang: 'en' },
  render: (a) => html`
    <div style=${box}>
      <ht-calendar
        lang=${a.lang}
        value=${a.value}
        min=${a.min}
        max=${a.max}
        week-start=${ifDefined(a.weekStart ?? undefined)}
        ?disabled=${a.disabled}
      ></ht-calendar>
    </div>`,
};
export default meta;

export const Default: StoryObj = {};

/** No value: the grid opens on the current month and today is marked. */
export const NoSelection: StoryObj = { args: { value: '' } };

export const MinAndMax: StoryObj = { args: { value: '2026-10-19', min: '2026-10-08', max: '2026-11-20' } };

/** Weekends are off via the `isDateDisabled` property. Disabled days stay focusable and are announced as unavailable. */
export const DisabledDates: StoryObj = {
  render: () => {
    const cal = document.createElement('ht-calendar');
    cal.value = '2026-10-19';
    cal.isDateDisabled = (d) => d.getDay() === 0 || d.getDay() === 6;
    return html`<div style=${box}>${cal}</div>`;
  },
};

export const WeekStartsMonday: StoryObj = { args: { weekStart: 1 } };

/** Names and the first day of the week come from `lang`. */
export const German: StoryObj = { args: { lang: 'de' } };
export const Japanese: StoryObj = { args: { lang: 'ja' } };

/** `dir="rtl"` flips the arrows and the horizontal keys. */
export const Arabic: StoryObj = {
  args: { lang: 'ar' },
  render: (a) => html`
    <div dir="rtl" style=${box}>
      <ht-calendar lang=${a.lang} value=${a.value}></ht-calendar>
    </div>`,
};

export const Disabled: StoryObj = { args: { disabled: true } };

/** Roomier cells through the CSS variable. */
export const LargeCells: StoryObj = {
  render: () => html`
    <div style=${box}>
      <ht-calendar value="2026-10-19" style="--ht-calendar-cell-size:2.75rem"></ht-calendar>
    </div>`,
};

/** Submit shows FormData, reset restores the initial date, and `change` fires on user picks only. */
export const InForm: StoryObj = {
  render: () => html`
    <form
      style="display:grid;gap:16px;justify-items:start"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const out = (e.target as HTMLFormElement).querySelector('pre')!;
        out.textContent = JSON.stringify(Object.fromEntries(new FormData(e.target as HTMLFormElement)), null, 2);
      }}
    >
      <div style=${box}><ht-calendar name="due" value="2026-10-19"></ht-calendar></div>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};
