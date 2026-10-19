import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../input/input.js';
import './sheet.js';

// The sheet is modal, so docs render each story in its own iframe.
const docs = { story: { inline: false, height: '420px' } };

const meta: Meta = {
  title: 'Components/Sheet',
  component: 'ht-sheet',
  tags: ['autodocs'],
  argTypes: {
    side: { control: 'select', options: ['left', 'right', 'top', 'bottom'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    persistent: { control: 'boolean' },
  },
  args: { side: 'right', size: 'md', persistent: false },
  parameters: { docs, layout: 'centered' },
  render: (a) => html`
    <ht-button @click=${show}>Open Sheet</ht-button>
    <ht-sheet side=${a.side} size=${a.size} ?persistent=${a.persistent} eyebrow="Issue" heading="SENT-4212">
      <p style="margin:0">Unhandled rejection in the checkout worker. First seen Tuesday, last seen a moment ago, owner unknown.</p>
      <ht-button slot="footer" variant="default" @click=${close}>Close</ht-button>
      <ht-button slot="footer" variant="primary" @click=${close}>Assign To Me</ht-button>
    </ht-sheet>`,
};
export default meta;

function show(e: Event) {
  ((e.target as HTMLElement).nextElementSibling as any).show();
}
function close(e: Event) {
  (e.target as HTMLElement).closest('ht-sheet')!.close();
}

export const Right: StoryObj = {};
export const Left: StoryObj = { args: { side: 'left' } };
export const Top: StoryObj = { args: { side: 'top' } };
export const Bottom: StoryObj = { args: { side: 'bottom' } };
export const Small: StoryObj = { args: { size: 'sm' } };
export const Large: StoryObj = { args: { size: 'lg' } };

/** Escape, the backdrop and the close button are all disabled. */
export const Persistent: StoryObj = { args: { persistent: true } };

export const Form: StoryObj = {
  render: () => html`
    <ht-button @click=${show}>New Monitor</ht-button>
    <ht-sheet eyebrow="Create" heading="New monitor">
      <div style="display:grid;gap:16px">
        <ht-input label="Name" placeholder="checkout-worker"></ht-input>
        <ht-input label="Check URL" type="url" placeholder="https://example.com/health" helper="We will poll it every minute."></ht-input>
      </div>
      <ht-button slot="footer" variant="default" @click=${close}>Cancel</ht-button>
      <ht-button slot="footer" variant="primary" @click=${close}>Create</ht-button>
    </ht-sheet>`,
};

/** The body scrolls; the header and footer stay put. */
export const LongContent: StoryObj = {
  render: () => html`
    <ht-button @click=${show}>Stack Trace</ht-button>
    <ht-sheet eyebrow="Trace" heading="Stack trace">
      ${Array.from({ length: 40 }, (_, i) => html`<p style="margin:0 0 8px;font-family:var(--ht-font-mono);font-size:0.75rem">at frame_${i} (worker.js:${100 + i * 7}:13)</p>`)}
      <ht-button slot="footer" variant="default" @click=${close}>Close</ht-button>
    </ht-sheet>`,
};

export const NoFooter: StoryObj = {
  render: () => html`
    <ht-button @click=${show}>Notes</ht-button>
    <ht-sheet heading="Notes">Just a message and an X.</ht-sheet>`,
};

export const OpenByDefault: StoryObj = {
  render: () => html`<ht-sheet open heading="Already open">It slid in on load.</ht-sheet>`,
};
