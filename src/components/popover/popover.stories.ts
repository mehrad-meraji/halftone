import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../input/input.js';
import './popover.js';

const meta: Meta = {
  title: 'Components/Popover',
  component: 'ht-popover',
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'right'],
    },
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    offset: { control: 'number' },
  },
  args: { placement: 'bottom', open: false, disabled: false, offset: 8 },
  parameters: { layout: 'centered' },
  render: (a) => html`
    <div style="padding:96px 128px">
      <ht-popover placement=${a.placement} offset=${a.offset} ?open=${a.open} ?disabled=${a.disabled} label="Project details">
        <ht-button variant="default">Project Details</ht-button>
        <div slot="content">
          <strong>sentinel</strong>
          <p style="margin:4px 0 0">4,212 open issues across 3 environments. Nobody has looked at them since Tuesday.</p>
        </div>
      </ht-popover>
    </div>`,
};
export default meta;

export const Bottom: StoryObj = {};
export const BottomStart: StoryObj = { args: { placement: 'bottom-start' } };
export const BottomEnd: StoryObj = { args: { placement: 'bottom-end' } };
export const Top: StoryObj = { args: { placement: 'top' } };
export const Left: StoryObj = { args: { placement: 'left' } };
export const Right: StoryObj = { args: { placement: 'right' } };
export const OpenByDefault: StoryObj = { args: { open: true } };
export const Disabled: StoryObj = { args: { disabled: true } };

/** The panel is not modal: focus moves in, Tab can leave (which closes it), Escape returns focus to the trigger. */
export const WithForm: StoryObj = {
  render: () => html`
    <div style="padding:96px 128px">
      <ht-popover placement="bottom-start" label="Rename project">
        <ht-button variant="default">Rename</ht-button>
        <div slot="content" style="display:grid;gap:12px">
          <ht-input label="Name" value="sentinel" helper="Shown in the sidebar."></ht-input>
          <ht-button variant="primary" size="sm" @click=${(e: Event) => (e.target as HTMLElement).closest('ht-popover')!.hide()}>Save</ht-button>
        </div>
      </ht-popover>
    </div>`,
};

export const LongContent: StoryObj = {
  render: () => html`
    <div style="padding:96px 128px">
      <ht-popover label="Release notes" style="--ht-popover-width:22rem">
        <ht-button variant="default">Release Notes</ht-button>
        <div slot="content">
          <p style="margin:0 0 8px">Version 0.4 changes how monitors report. The old behaviour was to report everything, loudly, forever.</p>
          <p style="margin:0 0 8px">The new behaviour is to report once, and then wait to be asked. This took four months, and one incident that we are not discussing.</p>
          <p style="margin:0">Upgrading is optional in the way that taxes are optional.</p>
        </div>
      </ht-popover>
    </div>`,
};

/** Near an edge the panel flips to the side with room. */
export const FlipsAtEdge: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => html`
    <div style="padding:8px">
      <ht-popover placement="top" label="Flip demo">
        <ht-button variant="default">Top edge</ht-button>
        <div slot="content">I would be clipped above, so I open below.</div>
      </ht-popover>
    </div>`,
};

/** `arrow` draws a pointer from the panel to the trigger. It follows the trigger's centre and swaps sides when the panel flips. */
export const Arrow: StoryObj = {
  args: { open: true },
  render: (a) => html`
    <div style="padding:96px 128px">
      <ht-popover arrow placement=${a.placement} ?open=${a.open} label="Project details">
        <ht-button variant="default">Project Details</ht-button>
        <div slot="content">
          <strong>sentinel</strong>
          <p style="margin:4px 0 0">4,212 open issues across 3 environments. Nobody has looked at them since Tuesday.</p>
        </div>
      </ht-popover>
    </div>`,
};

export const ArrowAllSides: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(2,380px);gap:24px">
      ${(['top', 'bottom-start', 'left', 'right'] as const).map(
        (p) => html`<div style="display:grid;place-items:center;height:220px">
          <ht-popover arrow open placement=${p} label=${p} style="--ht-popover-width:11rem">
            <ht-button variant="default">${p}</ht-button>
            <div slot="content">Points at the trigger.</div>
          </ht-popover>
        </div>`,
      )}
    </div>`,
};

export const ArrowGlass: StoryObj = {
  args: { open: true },
  render: () => html`
    <div style="padding:96px 128px;background:linear-gradient(135deg,#e838e8,#4f46e5)">
      <ht-popover arrow glass open label="Glass">
        <ht-button variant="default">Glass</ht-button>
        <div slot="content">Liquid glass with a pointer.</div>
      </ht-popover>
    </div>`,
};
