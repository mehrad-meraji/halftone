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
          toast({
            message: 'Issue resolved.',
            tone: 'info',
            action: { label: 'Undo', altText: 'Undo: reopen the issue from its page', onClick: () => toast('Undone.') },
          })}
        >With action</ht-button
      >
      <ht-button
        variant="default"
        @click=${() => toast({ title: 'Deploy finished', message: 'sentinel is live on 3 environments.', tone: 'success' })}
        >With title</ht-button
      >
      <ht-button variant="default" @click=${() => toast({ message: 'Saved quietly.', type: 'background' })}>Background (polite)</ht-button>
    </div>`,
};

/**
 * Behaves like Radix Toast. Press `F8` to move focus into the stack (the region is named "Notifications (F8)"), then Tab
 * to a toast. The timer stops while the pointer is over the stack, while focus is inside it and while this window is in the
 * background. Escape closes the focused toast.
 */
export const KeyboardAndPause: StoryObj = {
  parameters: { docs: { story: { inline: false, height: '320px' } } },
  render: () => html`
    <ht-button
      variant="default"
      @click=${() => {
        toast({ title: 'First', message: 'Press F8, then Tab to reach me.', duration: 15000 });
        toast({ message: 'Hover me and the timer waits.', tone: 'info', duration: 15000 });
      }}
      >Show two toasts</ht-button
    >`,
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
