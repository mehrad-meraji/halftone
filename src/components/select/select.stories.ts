import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './select.js';

const meta: Meta = {
  title: 'Components/Select',
  component: 'ht-select',
  tags: ['autodocs'],
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { label: 'Theme', helper: '', error: '', placeholder: '', size: 'md', disabled: false, required: false },
  render: (a) => html`
    <ht-select
      style="width:320px"
      label=${a.label} helper=${a.helper} error=${a.error} placeholder=${a.placeholder}
      size=${a.size} ?disabled=${a.disabled} ?required=${a.required}
    >
      <option value="system">Default to system</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </ht-select>`,
};
export default meta;

export const Default: StoryObj = {};
export const WithPlaceholder: StoryObj = { args: { placeholder: 'Choose a theme', label: 'Theme' } };
export const WithHelper: StoryObj = { args: { helper: 'Applies to every device you sign in on.' } };
export const WithError: StoryObj = { args: { error: 'Pick one. Any one.', placeholder: 'Choose a theme' } };
export const Disabled: StoryObj = { args: { disabled: true } };

/** Submit shows FormData; reset restores the initial option; required blocks an empty choice. */
export const InForm: StoryObj = {
  render: () => html`
    <form
      style="display:grid;gap:16px;width:320px"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const f = e.target as HTMLFormElement;
        f.querySelector('pre')!.textContent = JSON.stringify(Object.fromEntries(new FormData(f)), null, 2);
      }}
    >
      <ht-select name="region" label="Region" required placeholder="Choose a region">
        <option value="us">United States</option>
        <option value="eu">European Union</option>
      </ht-select>
      <ht-select name="order" label="Stack Trace Order" value="newest">
        <option value="newest">Most recent call first</option>
        <option value="oldest">Most recent call last</option>
      </ht-select>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};
