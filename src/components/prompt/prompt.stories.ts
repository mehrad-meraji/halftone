import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../kbd/kbd.js';
import './prompt.js';

const meta: Meta = {
  title: 'Components/Prompt',
  component: 'ht-prompt',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { placeholder: 'What can I help you with?', hint: '/ for commands', disabled: false, value: '' },
  render: (a) => html`
    <div style="max-width:696px;margin:0 auto">
      <ht-prompt placeholder=${a.placeholder} hint=${a.hint} value=${a.value} ?disabled=${a.disabled}></ht-prompt>
    </div>`,
};
export default meta;

export const Default: StoryObj = {};
export const WithValue: StoryObj = { args: { value: 'Show me signups by week, grouped by plan' } };
export const Disabled: StoryObj = { args: { disabled: true } };

export const WithActions: StoryObj = {
  render: () => html`
    <div style="max-width:696px;margin:0 auto">
      <ht-prompt placeholder="What can I help you with?" hint="/ for commands">
        <ht-button slot="actions" variant="quiet" size="xs">Tab to search <ht-kbd keys="Tab"></ht-kbd></ht-button>
      </ht-prompt>
    </div>`,
};

/** Grows with the text up to 300px, then scrolls. Shift+Enter adds a line. */
export const MultiLine: StoryObj = {
  args: { value: 'First line\nSecond line\nThird line\nFourth line' },
};

/** Enter fires `ht-submit` with the text; the log shows what a listener receives. */
export const Submit: StoryObj = {
  render: () => html`
    <div style="max-width:696px;margin:0 auto;display:grid;gap:12px">
      <ht-prompt
        placeholder="Ask anything"
        hint="Enter to send"
        @ht-submit=${(e: CustomEvent) => {
          const log = (e.target as HTMLElement).parentElement!.querySelector('pre')!;
          log.textContent = `ht-submit: ${JSON.stringify(e.detail)}`;
          (e.target as any).clear();
        }}
      ></ht-prompt>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">press Enter to send</pre>
    </div>`,
};
