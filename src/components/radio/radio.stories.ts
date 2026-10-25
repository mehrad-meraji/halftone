import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './radio.js';

const meta: Meta = {
  title: 'Components/Radio Group',
  component: 'ht-radio-group',
  subcomponents: { HtRadio: 'ht-radio' },
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { label: 'Avatar', helper: '', error: '', value: 'initials', orientation: 'vertical', size: 'md', disabled: false, required: false },
  render: (a) => html`
    <ht-radio-group
      label=${a.label} helper=${a.helper} error=${a.error} value=${a.value}
      orientation=${a.orientation} size=${a.size} ?disabled=${a.disabled} ?required=${a.required}
    >
      <ht-radio value="initials">Use initials</ht-radio>
      <ht-radio value="upload">Upload an image</ht-radio>
      <ht-radio value="gravatar">Use Gravatar</ht-radio>
    </ht-radio-group>`,
};
export default meta;

export const Default: StoryObj = {};
export const Horizontal: StoryObj = { args: { orientation: 'horizontal' } };
export const WithHelper: StoryObj = { args: { helper: 'You can change this later.' } };
export const WithError: StoryObj = { args: { value: '', error: 'Pick one. Any one.', required: true } };
export const Disabled: StoryObj = { args: { disabled: true } };

/** `sm` 16px for dense lists, `md` 24px (default), `lg` 32px. Set `size` on the group. */
export const Sizes: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:24px">
      ${(['sm', 'md', 'lg'] as const).map(
        (size) => html`<ht-radio-group label="Size ${size}" size=${size} value="free" orientation="horizontal">
          <ht-radio value="free">Free</ht-radio>
          <ht-radio value="team">Team</ht-radio>
          <ht-radio value="pro" disabled>Pro (disabled)</ht-radio>
        </ht-radio-group>`,
      )}
    </div>`,
};

export const DisabledOption: StoryObj = {
  render: () => html`
    <ht-radio-group label="Plan" value="free">
      <ht-radio value="free">Free</ht-radio>
      <ht-radio value="team" disabled>Team (coming never)</ht-radio>
      <ht-radio value="pro">Pro</ht-radio>
    </ht-radio-group>`,
};

/** Arrow keys move and select, Tab leaves the group, required blocks an empty submit, reset restores. */
export const InForm: StoryObj = {
  render: () => html`
    <form
      style="display:grid;gap:16px;width:320px"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const f = e.target as HTMLFormElement;
        f.querySelector('pre')!.textContent = JSON.stringify(Object.fromEntries(new FormData(f)));
      }}
    >
      <ht-radio-group name="size" label="T-shirt size" required>
        <ht-radio value="s">Small</ht-radio>
        <ht-radio value="m">Medium</ht-radio>
        <ht-radio value="l">Large</ht-radio>
      </ht-radio-group>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};
