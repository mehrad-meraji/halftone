import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../icon/icon.js';
import './input.js';

const meta: Meta = {
  title: 'Components/Input',
  component: 'ht-input',
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'] },
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
      <span slot="suffix" style="font:400 11px var(--ht-font-mono)">⌘K</span>
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
