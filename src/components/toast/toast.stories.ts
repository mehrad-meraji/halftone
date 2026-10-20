import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './toast.js';
import { toast } from './toast.js';

const meta: Meta = {
  title: 'Components/Toast',
  component: 'ht-toast',
  subcomponents: { HtToaster: 'ht-toaster' },
  tags: ['autodocs'],
  argTypes: { tone: { control: 'select', options: ['neutral', 'info', 'success', 'warning', 'danger'] } },
  args: { tone: 'neutral', duration: 0 },
  render: (a) => html`<ht-toast tone=${a.tone} duration=${a.duration}>Project saved. Nothing exploded.</ht-toast>`,
};
export default meta;

export const Neutral: StoryObj = {};
export const Success: StoryObj = { args: { tone: 'success' } };
export const Warning: StoryObj = { args: { tone: 'warning' } };
export const Danger: StoryObj = { args: { tone: 'danger' } };
export const Info: StoryObj = { args: { tone: 'info' } };

export const AllTones: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;width:26rem">
      ${['neutral', 'info', 'success', 'warning', 'danger'].map(
        (t) => html`<ht-toast tone=${t} duration="0">${t}: something happened.</ht-toast>`,
      )}
    </div>`,
};

/** Call `toast()` from anywhere. The stack is created on first use and hovering pauses the timer. */
export const Imperative: StoryObj = {
  parameters: { docs: { story: { inline: false, height: '320px' } } },
  render: () => html`
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <ht-button @click=${() => toast('Copied to clipboard.')}>Neutral</ht-button>
      <ht-button variant="default" @click=${() => toast.success('Saved.')}>Success</ht-button>
      <ht-button variant="default" @click=${() => toast.error('That did not work.', { duration: 0 })}>Error (sticky)</ht-button>
      <ht-button
        variant="default"
        @click=${() =>
          toast({ message: 'Issue resolved.', tone: 'info', action: { label: 'Undo', onClick: () => toast('Undone.') } })}
        >With action</ht-button
      >
    </div>`,
};

/** Drag a toast toward the edge it sits on and let go past 50px to dismiss it. A shorter drag snaps back, and the timer waits while you hold it. */
export const SwipeToDismiss: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;width:26rem">
      <ht-toast duration="0">Swipe me right.</ht-toast>
      <ht-toast tone="success" duration="0" swipe="left">Swipe me left (swipe="left").</ht-toast>
      <ht-toast tone="info" duration="0" swipe="up">Swipe me up (swipe="up").</ht-toast>
      <ht-toast tone="warning" duration="0" swipe="none">No swiping here (swipe="none").</ht-toast>
    </div>`,
};
