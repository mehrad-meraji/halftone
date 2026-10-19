import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../icon/icon.js';
import './toggle.js';

const meta: Meta = {
  title: 'Components/Toggle',
  component: 'ht-toggle',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { variant: 'default', size: 'md', pressed: false, disabled: false },
  render: (a) => html`
    <ht-toggle variant=${a.variant} size=${a.size} ?pressed=${a.pressed} ?disabled=${a.disabled}>Pinned</ht-toggle>`,
};
export default meta;

export const Default: StoryObj = {};
export const Pressed: StoryObj = { args: { pressed: true } };
export const Outline: StoryObj = { args: { variant: 'outline' } };
export const OutlinePressed: StoryObj = { args: { variant: 'outline', pressed: true } };
export const Disabled: StoryObj = { args: { disabled: true } };
export const DisabledPressed: StoryObj = { args: { disabled: true, pressed: true } };

export const WithPrefix: StoryObj = {
  render: () => html`
    <ht-toggle variant="outline"><ht-icon slot="prefix" name="star"></ht-icon>Starred</ht-toggle>`,
};

/** No text, so the accessible name comes from `aria-label` (moved to the native button). */
export const IconOnly: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:8px">
      <ht-toggle aria-label="Mute notifications"><ht-icon name="bell"></ht-icon></ht-toggle>
      <ht-toggle variant="outline" aria-label="Star" pressed><ht-icon name="star" weight="fill"></ht-icon></ht-toggle>
    </div>`,
};

/** Heights are 24, 28 and 32px, the same as `ht-button` xs, sm and md. */
export const SizesNextToButtons: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;justify-items:start">
      ${(['sm', 'md', 'lg'] as const).map(
        (s, i) => html`
          <div style="display:flex;gap:8px;align-items:center">
            <ht-toggle size=${s} variant="outline">Toggle ${s}</ht-toggle>
            <ht-button size=${['xs', 'sm', 'md'][i]} variant="default">Button</ht-button>
          </div>`,
      )}
    </div>`,
};

export const LongLabel: StoryObj = {
  render: () => html`
    <div style="width:180px">
      <ht-toggle variant="outline">Notify me about every comment on this issue</ht-toggle>
    </div>`,
};

/** Pressed submits `name=value`; unpressed submits nothing. Reset restores the initial state. */
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
      <div style="display:flex;gap:8px">
        <ht-toggle name="digest" value="daily" variant="outline">Daily Digest</ht-toggle>
        <ht-toggle name="mentions" value="yes" variant="outline" pressed>Mentions</ht-toggle>
      </div>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};
