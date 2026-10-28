import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../icon/icon.js';
import '../kbd/kbd.js';
import './input.js';

const meta: Meta = {
  title: 'Components/Input',
  component: 'ht-input',
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number', 'date', 'time', 'datetime-local', 'month', 'week'] },
  },
  args: { label: 'Project Name', placeholder: 'sentinel', helper: '', error: '', size: 'md', type: 'text', disabled: false, required: false },
  render: (a) => html`
    <ht-input
      style="width:320px"
      label=${a.label} placeholder=${a.placeholder} helper=${a.helper} error=${a.error}
      size=${a.size} type=${a.type} ?disabled=${a.disabled} ?required=${a.required}
    ></ht-input>`,
};
export default meta;

export const Default: StoryObj = {};
export const WithHelper: StoryObj = { args: { helper: 'Lowercase, no spaces. You can rename it later.' } };
export const WithError: StoryObj = { args: { error: 'That name is taken. Try harder.', placeholder: '', } };
export const Disabled: StoryObj = { args: { disabled: true } };

export const WithAffixes: StoryObj = {
  render: () => html`
    <ht-input style="width:320px" label="Search" placeholder="Find an issue">
      <ht-icon slot="prefix" name="magnifying-glass"></ht-icon>
      <ht-kbd slot="suffix" keys="⌘ K"></ht-kbd>
    </ht-input>`,
};

/** Proves form participation: submit shows FormData, reset restores the default value, required blocks submit. */
export const InForm: StoryObj = {
  render: () => html`
    <form
      style="display:grid;gap:16px;width:320px"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const out = (e.target as HTMLFormElement).querySelector('pre')!;
        out.textContent = JSON.stringify(Object.fromEntries(new FormData(e.target as HTMLFormElement)), null, 2);
      }}
    >
      <ht-input name="email" type="email" label="Email" required helper="We will never email you."></ht-input>
      <ht-input name="nickname" label="Nickname" value="Sentinel Prime"></ht-input>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};

export const Sizes: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;width:320px">
      ${(['xs', 'sm', 'md', 'lg'] as const).map(
        (s) => html`<ht-input size=${s} aria-label=${`Size ${s}`} placeholder=${`Size ${s}`}></ht-input>`,
      )}
    </div>`,
};

/** `bare` drops the box. Use it for text that is edited in place. The focus ring stays. */
export const Bare: StoryObj = {
  render: () => html`<ht-input bare aria-label="Title" value="Untitled document" style="width:320px;font-weight:600"></ht-input>`,
};

/** `min`, `max` and `step` set the limits. The browser blocks submit outside them. */
export const Constraints: StoryObj = {
  render: () => html`
    <form style="display:grid;gap:16px;width:320px" @submit=${(e: Event) => e.preventDefault()}>
      <ht-input type="number" label="Seats" min="1" max="20" step="1" inputmode="numeric" value="3"></ht-input>
      <ht-input type="date" label="Expires" min="2026-01-01" max="2026-12-31"></ht-input>
      <ht-input type="time" label="Starts at" step="900"></ht-input>
      <ht-input label="Slug" pattern="[a-z0-9-]+" minlength="3" maxlength="24" helper="3 to 24 characters: a to z, 0 to 9, dashes."></ht-input>
      <ht-button type="submit">Check</ht-button>
    </form>`,
};

/** `default-value` is the start value. Reset returns to it. */
export const DefaultValue: StoryObj = {
  render: () => html`
    <form style="display:grid;gap:12px;width:320px">
      <ht-input label="Region" default-value="eu-west"></ht-input>
      <ht-button type="reset" variant="default">Reset</ht-button>
    </form>`,
};
