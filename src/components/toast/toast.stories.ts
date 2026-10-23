import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './toast.js';
import { toast, type HtToaster } from './toast.js';

const TONES = ['neutral', 'info', 'success', 'warning', 'danger'] as const;

const meta: Meta = {
  title: 'Components/Toast',
  component: 'ht-toast',
  subcomponents: { HtToaster: 'ht-toaster' },
  tags: ['autodocs'],
  argTypes: { tone: { control: 'select', options: TONES } },
  args: { tone: 'neutral', rich: false, loading: false, closeButton: false, description: 'Sunday, December 3 at 9:00 AM' },
  render: (a) =>
    html`<ht-toast tone=${a.tone} ?rich=${a.rich} ?loading=${a.loading} ?close-button=${a.closeButton} description=${a.description} duration="0"
      >Event created</ht-toast
    >`,
};
export default meta;

export const Default: StoryObj = {};
export const TitleOnly: StoryObj = { args: { description: '' } };
export const Success: StoryObj = { args: { tone: 'success' } };
export const Info: StoryObj = { args: { tone: 'info' } };
export const Warning: StoryObj = { args: { tone: 'warning' } };
export const Danger: StoryObj = { args: { tone: 'danger' } };
export const Loading: StoryObj = { args: { loading: true, description: '' } };
export const CloseButton: StoryObj = { args: { closeButton: true } };

/** By default the tone colours only the icon. `rich` tints the whole card (Sonner's `richColors`). */
export const AllTones: StoryObj = {
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,356px));gap:16px">
      <div style="display:grid;gap:12px">
        ${TONES.map((t) => html`<ht-toast tone=${t} duration="0" description="The ${t} tone.">Something happened</ht-toast>`)}
      </div>
      <div style="display:grid;gap:12px">
        ${TONES.map((t) => html`<ht-toast rich tone=${t} duration="0" description="The ${t} tone, rich.">Something happened</ht-toast>`)}
      </div>
    </div>`,
};

/** `action` is solid, `cancel` is quiet. Both close the toast after their `onClick`, unless it calls `preventDefault()`. */
export const ActionAndCancel: StoryObj = {
  render: () => html`<ht-toast
    duration="0"
    description="4 issues moved to the archive."
    .action=${{ label: 'Undo', onClick: () => toast('Undone.') }}
    .cancel=${{ label: 'Keep' }}
    >Issues archived</ht-toast
  >`,
};

/** Any element can go in the `action` slot. */
export const SlottedAction: StoryObj = {
  render: () => html`<ht-toast duration="0" tone="info" description="sentinel 2.4 is ready.">
    Update available
    <ht-button slot="action" size="sm" variant="default">Restart</ht-button>
  </ht-toast>`,
};

/** Call `toast()` from anywhere. The stack is created on first use. */
export const Imperative: StoryObj = {
  parameters: { docs: { story: { inline: false, height: '360px' } } },
  render: () => html`
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <ht-button variant="default" @click=${() => toast('Event created', { description: 'Sunday, December 3 at 9:00 AM' })}>Default</ht-button>
      <ht-button variant="default" @click=${() => toast.success('Saved.')}>Success</ht-button>
      <ht-button variant="default" @click=${() => toast.info('Be at the area 10 minutes before the event.')}>Info</ht-button>
      <ht-button variant="default" @click=${() => toast.warning('Event start time cannot be earlier than 8am.')}>Warning</ht-button>
      <ht-button variant="default" @click=${() => toast.error('That did not work.', { duration: 0, closeButton: true })}>Error (sticky)</ht-button>
      <ht-button
        variant="default"
        @click=${() =>
          toast('Issue resolved', {
            action: { label: 'Undo', altText: 'Undo: reopen the issue from its page', onClick: () => toast('Undone.') },
          })}
        >With action</ht-button
      >
      <ht-button variant="default" @click=${() => toast.success('Deploy finished', { description: 'sentinel is live on 3 environments.', rich: true })}
        >Rich</ht-button
      >
      <ht-button variant="default" @click=${() => toast('Saved quietly.', { type: 'background' })}>Background (polite)</ht-button>
      <ht-button variant="quiet" @click=${() => toast.dismiss()}>Dismiss all</ht-button>
    </div>`,
};

/** `toast.promise()` shows one toast with a spinner, then turns it into success or error. */
export const WithPromise: StoryObj = {
  parameters: { docs: { story: { inline: false, height: '320px' } } },
  render: () => {
    const wait = (ok: boolean) => new Promise<string>((res, rej) => setTimeout(() => (ok ? res('sentinel') : rej(new Error('timeout'))), 2000));
    return html`<div style="display:flex;gap:8px">
      <ht-button variant="default" @click=${() => toast.promise(wait(true), { loading: 'Deploying…', success: (name) => `${name} is live.`, error: 'Deploy failed.' })}
        >Resolves</ht-button
      >
      <ht-button variant="default" @click=${() => toast.promise(wait(false), { loading: 'Deploying…', success: 'Deployed.', error: (e) => `Deploy failed: ${(e as Error).message}.` })}
        >Rejects</ht-button
      >
    </div>`;
  },
};

/**
 * New toasts land in front and older ones tuck in behind, three at a time. Hover the stack, or press `F8` to move
 * focus into it, and it fans out; the timers wait until you leave. Escape closes the focused toast.
 */
export const Stack: StoryObj = {
  parameters: { docs: { story: { inline: false, height: '420px' } } },
  render: () => {
    let n = 0;
    const lines = ['Issue assigned to you.', 'Build 4,212 passed.', 'Release notes published.', 'Comment from Ada.', 'Alert rule muted for an hour.'];
    return html`<div style="display:flex;gap:8px">
      <ht-button
        @click=${() => toast(lines[n++ % lines.length], { description: n % 2 ? 'Just now' : undefined, duration: 15000 })}
        >Add a toast</ht-button
      >
      <ht-button variant="default" @click=${() => toast.dismiss()}>Dismiss all</ht-button>
    </div>`;
  },
};

/** Set `position` on a placed `ht-toaster`. `expand` keeps the stack fanned out. */
export const Positions: StoryObj = {
  parameters: { docs: { story: { inline: false, height: '420px' } } },
  render: () => {
    const place = (p: HtToaster['position']) => {
      const box = document.querySelector('ht-toaster') ?? document.body.appendChild(document.createElement('ht-toaster'));
      box.position = p;
      toast(`Toast at ${p}`, { description: 'Swipe it toward its edge.' });
    };
    const positions: HtToaster['position'][] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    return html`<div style="display:flex;gap:8px;flex-wrap:wrap">
      ${positions.map((p) => html`<ht-button variant="default" @click=${() => place(p)}>${p}</ht-button>`)}
    </div>`;
  },
};

/** Drag a toast toward the edge it sits on and let go past 45px, or flick it, to dismiss it. A shorter drag snaps back. */
export const SwipeToDismiss: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;width:356px">
      <ht-toast duration="0">Swipe me right.</ht-toast>
      <ht-toast tone="success" duration="0" swipe="left">Swipe me left (swipe="left").</ht-toast>
      <ht-toast tone="info" duration="0" swipe="up">Swipe me up (swipe="up").</ht-toast>
      <ht-toast tone="warning" duration="0" swipe="none">No swiping here (swipe="none").</ht-toast>
    </div>`,
};
