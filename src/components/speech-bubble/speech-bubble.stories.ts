import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './speech-bubble.js';

const meta: Meta = {
  title: 'Components/Speech Bubble',
  component: 'ht-speech-bubble',
  tags: ['autodocs'],
  argTypes: {
    tail: { control: 'select', options: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'left', 'right', 'none'] },
    variant: { control: 'select', options: ['speech', 'thought', 'whisper'] },
    tone: { control: 'select', options: ['neutral', 'accent', 'danger'] },
  },
  args: { tail: 'bottom-left', variant: 'speech', tone: 'neutral', author: 'Agent' },
  render: (a) => html`
    <div style="padding:32px">
      <ht-speech-bubble tail=${a.tail} variant=${a.variant} tone=${a.tone} author=${a.author}>
        Found 3 unresolved issues. One of them is on fire.
      </ht-speech-bubble>
    </div>`,
};
export default meta;

export const Speech: StoryObj = {};
export const Thought: StoryObj = { args: { variant: 'thought', author: '' } };
export const Whisper: StoryObj = { args: { variant: 'whisper' } };
export const Accent: StoryObj = { args: { tone: 'accent' } };
export const Danger: StoryObj = { args: { tone: 'danger', author: 'Sentinel' } };

export const Conversation: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:20px;width:420px;padding:24px">
      <div><ht-speech-bubble tail="bottom-left" author="You">Why is the deploy red?</ht-speech-bubble></div>
      <div style="text-align:right"><ht-speech-bubble tail="bottom-right" tone="accent" author="Agent">A migration timed out. Retrying with a longer leash.</ht-speech-bubble></div>
      <div><ht-speech-bubble tail="bottom-left" variant="thought">hmm, it was green yesterday…</ht-speech-bubble></div>
    </div>`,
};
