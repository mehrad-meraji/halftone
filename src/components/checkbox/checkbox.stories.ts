import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './checkbox.js';

const meta: Meta = {
  title: 'Components/Checkbox',
  component: 'ht-checkbox',
  subcomponents: { HtCheckboxGroup: 'ht-checkbox-group' },
  tags: ['autodocs'],
  args: { checked: false, indeterminate: false, disabled: false },
  render: (a) => html`<ht-checkbox ?checked=${a.checked} ?indeterminate=${a.indeterminate} ?disabled=${a.disabled}>Send me the weekly digest</ht-checkbox>`,
};
export default meta;

export const Unchecked: StoryObj = {};
export const Checked: StoryObj = { args: { checked: true } };
export const Indeterminate: StoryObj = { args: { indeterminate: true } };
export const Disabled: StoryObj = { args: { disabled: true } };
export const DisabledChecked: StoryObj = { args: { disabled: true, checked: true } };
export const WithoutLabel: StoryObj = { render: () => html`<ht-checkbox aria-label="Select row"></ht-checkbox>` };

export const Group: StoryObj = {
  render: () => html`
    <ht-checkbox-group label="Notify me about" helper="Pick any that apply.">
      <ht-checkbox name="n" value="errors" checked>New errors</ht-checkbox>
      <ht-checkbox name="n" value="deploys">Deploys</ht-checkbox>
      <ht-checkbox name="n" value="uptime">Uptime changes</ht-checkbox>
    </ht-checkbox-group>`,
};

export const GroupWithError: StoryObj = {
  render: () => html`
    <ht-checkbox-group label="Notify me about" error="Choose at least one, or turn notifications off.">
      <ht-checkbox name="n" value="errors">New errors</ht-checkbox>
      <ht-checkbox name="n" value="deploys">Deploys</ht-checkbox>
    </ht-checkbox-group>`,
};

/** A parent box that shows the indeterminate state, driven from the children. */
export const SelectAll: StoryObj = {
  render: () => {
    const sync = (e: Event) => {
      const root = (e.currentTarget as HTMLElement);
      const all = root.querySelector('ht-checkbox[data-all]') as any;
      const kids = [...root.querySelectorAll('ht-checkbox:not([data-all])')] as any[];
      if (e.target === all) kids.forEach((k) => (k.checked = all.checked));
      const n = kids.filter((k) => k.checked).length;
      all.checked = n === kids.length;
      all.indeterminate = n > 0 && n < kids.length;
    };
    return html`
      <div @change=${sync} style="display:grid;gap:12px">
        <ht-checkbox data-all>Select all</ht-checkbox>
        <div style="padding-left:36px;display:grid;gap:12px">
          <ht-checkbox>Production</ht-checkbox>
          <ht-checkbox>Staging</ht-checkbox>
          <ht-checkbox>Preview</ht-checkbox>
        </div>
      </div>`;
  },
};

/** Submits the value only when checked; `required` blocks submit; reset restores. */
export const InForm: StoryObj = {
  render: () => html`
    <form
      style="display:grid;gap:16px"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const f = e.target as HTMLFormElement;
        f.querySelector('pre')!.textContent = JSON.stringify(Object.fromEntries(new FormData(f)));
      }}
    >
      <ht-checkbox name="terms" value="accepted" required>I accept the terms, which I did not read</ht-checkbox>
      <ht-checkbox name="digest" value="weekly" checked>Weekly digest</ht-checkbox>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};

/** A native `<label for>` outside the element toggles it, like a native control. */
export const WithExternalLabel: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:12px;align-items:center">
      <label for="ext-checkbox">Notify me about replies</label>
      <ht-checkbox id="ext-checkbox" label="Notify me about replies"></ht-checkbox>
    </div>`,
};
