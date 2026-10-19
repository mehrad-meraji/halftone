import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './emoji-picker.js';

const meta: Meta = {
  title: 'Components/Emoji Picker',
  component: 'ht-emoji-picker',
  tags: ['autodocs'],
  argTypes: { columns: { control: { type: 'number', min: 5, max: 12 } }, placeholder: { control: 'text' } },
  args: { columns: 8, placeholder: 'Search Emoji' },
  render: (a) => html`
    <ht-emoji-picker
      columns=${a.columns}
      placeholder=${a.placeholder}
      @ht-select=${(e: CustomEvent) => {
        const out = (e.target as HTMLElement).parentElement!.querySelector('output')!;
        out.textContent = `ht-select: ${e.detail.emoji} (${e.detail.name})`;
      }}
    ></ht-emoji-picker>
    <output style="display:block;margin-top:8px;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">pick an emoji</output>`,
};
export default meta;

export const Default: StoryObj = {};

/** The picker keeps no history. Pass `recent` and update it on `ht-select`. */
export const WithRecent: StoryObj = {
  render: () => html`<ht-emoji-picker .recent=${['👍', '🎉', '🔥', '👀', '✅', '🚀']}></ht-emoji-picker>`,
};

/** Type "heart" or "cat". Search matches names and keywords; Enter picks the first hit. */
export const Narrow: StoryObj = { args: { columns: 6 }, render: (a) => html`<ht-emoji-picker style="--ht-emoji-picker-width:15rem" columns=${a.columns}></ht-emoji-picker>` };

/** The `empty` slot replaces the default message. Type `zzzz` to see it. */
export const CustomEmptyState: StoryObj = {
  render: () => html`<ht-emoji-picker><span slot="empty">No such emoji. We checked.</span></ht-emoji-picker>`,
};

export const Compact: StoryObj = {
  render: () => html`<ht-emoji-picker style="--ht-emoji-picker-height:16rem"></ht-emoji-picker>`,
};
