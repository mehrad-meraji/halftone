import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './switch.js';

const meta: Meta = {
  title: 'Components/Switch',
  component: 'ht-switch',
  tags: ['autodocs'],
  args: { checked: false, disabled: false },
  render: (a) => html`<ht-switch ?checked=${a.checked} ?disabled=${a.disabled}>Use a 24 hour clock</ht-switch>`,
};
export default meta;

export const Off: StoryObj = {};
export const On: StoryObj = { args: { checked: true } };
export const Disabled: StoryObj = { args: { disabled: true } };
export const WithoutLabel: StoryObj = { render: () => html`<ht-switch aria-label="Notifications"></ht-switch>` };

/** Submits `on` only when checked; reset restores the initial state. */
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
      <ht-switch name="clock24">Use a 24 hour clock</ht-switch>
      <ht-switch name="digest" checked>Weekly digest</ht-switch>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};
