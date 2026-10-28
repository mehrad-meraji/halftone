import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './menu.js';

const meta: Meta = {
  title: 'Components/Menu',
  component: 'ht-menu',
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
  args: { placement: 'bottom-start', open: false, disabled: false, offset: 4 },
  parameters: { layout: 'centered' },
  render: (a) => html`
    <div style="padding:96px 128px">
      <ht-menu placement=${a.placement} offset=${a.offset} ?open=${a.open} ?disabled=${a.disabled} label="Project actions">
        <ht-button slot="trigger" variant="default">Actions</ht-button>
        <ht-menu-item shortcut="⌘ E">Edit</ht-menu-item>
        <ht-menu-item shortcut="⌘ D">Duplicate</ht-menu-item>
        <ht-menu-item>Archive</ht-menu-item>
        <ht-menu-separator></ht-menu-separator>
        <ht-menu-item danger shortcut="⌫">Delete</ht-menu-item>
      </ht-menu>
    </div>`,
};
export default meta;

export const Basic: StoryObj = {};
export const OpenByDefault: StoryObj = { args: { open: true } };
export const Disabled: StoryObj = { args: { disabled: true } };
export const AlignedEnd: StoryObj = { args: { placement: 'bottom-end' } };

export const WithLabelsAndDisabledItems: StoryObj = {
  render: () => html`
    <div style="padding:96px 128px">
      <ht-menu label="Account">
        <ht-button slot="trigger" variant="default">Account</ht-button>
        <ht-menu-label>Signed in</ht-menu-label>
        <ht-menu-item>Profile</ht-menu-item>
        <ht-menu-item>Billing</ht-menu-item>
        <ht-menu-item disabled>Team Settings</ht-menu-item>
        <ht-menu-separator></ht-menu-separator>
        <ht-menu-label>Session</ht-menu-label>
        <ht-menu-item>Sign Out</ht-menu-item>
      </ht-menu>
    </div>`,
};

/** Checkbox items toggle and report `checked`. Plain rows line up with them. */
export const Checkboxes: StoryObj = {
  render: () => html`
    <div style="padding:96px 128px">
      <ht-menu label="Columns">
        <ht-button slot="trigger" variant="default">Columns</ht-button>
        <ht-menu-label>Show</ht-menu-label>
        <ht-menu-item type="checkbox" checked value="status">Status</ht-menu-item>
        <ht-menu-item type="checkbox" checked value="owner">Owner</ht-menu-item>
        <ht-menu-item type="checkbox" value="updated">Last Updated</ht-menu-item>
        <ht-menu-separator></ht-menu-separator>
        <ht-menu-item>Reset To Default</ht-menu-item>
      </ht-menu>
    </div>`,
};

/** Radio items with the same `name` are one group. */
export const Radios: StoryObj = {
  render: () => html`
    <div style="padding:96px 128px">
      <ht-menu label="Sort">
        <ht-button slot="trigger" variant="default">Sort By</ht-button>
        <ht-menu-item type="radio" name="sort" value="newest" checked>Newest</ht-menu-item>
        <ht-menu-item type="radio" name="sort" value="oldest">Oldest</ht-menu-item>
        <ht-menu-item type="radio" name="sort" value="noisy">Noisiest</ht-menu-item>
      </ht-menu>
    </div>`,
};

/** `ht-select` is cancelable: this one keeps the menu open after a pick. */
export const StaysOpen: StoryObj = {
  render: () => html`
    <div style="padding:96px 128px">
      <ht-menu label="Filters" @ht-select=${(e: Event) => e.preventDefault()}>
        <ht-button slot="trigger" variant="default">Filters</ht-button>
        <ht-menu-item type="checkbox" value="errors">Errors</ht-menu-item>
        <ht-menu-item type="checkbox" value="warnings">Warnings</ht-menu-item>
        <ht-menu-item type="checkbox" value="info">Info</ht-menu-item>
      </ht-menu>
    </div>`,
};

export const WithIcons: StoryObj = {
  render: () => html`
    <div style="padding:96px 128px">
      <ht-menu label="Create">
        <ht-button slot="trigger" variant="primary">Create</ht-button>
        <ht-menu-item>
          <svg slot="prefix" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/></svg>
          New Issue
        </ht-menu-item>
        <ht-menu-item>
          <svg slot="prefix" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/></svg>
          New Monitor
        </ht-menu-item>
      </ht-menu>
    </div>`,
};

export const LongLabels: StoryObj = {
  render: () => html`
    <div style="padding:96px 128px">
      <ht-menu label="Environments" style="--ht-menu-min-width:12rem">
        <ht-button slot="trigger" variant="default">Environments</ht-button>
        <ht-menu-item shortcut="⌘ 1">production-eu-west-1-primary-replica-with-a-name-that-keeps-going</ht-menu-item>
        <ht-menu-item shortcut="⌘ 2">staging</ht-menu-item>
        <ht-menu-item shortcut="⌘ ⇧ 3">a-branch-preview-that-someone-forgot-to-delete</ht-menu-item>
      </ht-menu>
    </div>`,
};

/** Right-click the box (or focus it and press the ContextMenu key or Shift+F10). */
export const ContextMenu: StoryObj = {
  render: () => html`
    <ht-menu contextmenu label="Row actions">
      <div
        slot="trigger"
        tabindex="0"
        style="width:24rem;padding:48px 16px;text-align:center;border:1px dashed var(--ht-border-strong);border-radius:var(--ht-radius-lg);font:400 0.875rem/1.5 var(--ht-font-ui);color:var(--ht-text-muted)"
      >
        Right-click anywhere in here
      </div>
      <ht-menu-item shortcut="⌘ C">Copy Link</ht-menu-item>
      <ht-menu-item>Open In New Tab</ht-menu-item>
      <ht-menu-separator></ht-menu-separator>
      <ht-menu-item danger>Remove</ht-menu-item>
    </ht-menu>`,
};

/** Near an edge the menu flips to the side with room. */
export const FlipsAtEdge: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => html`
    <div style="padding:8px">
      <ht-menu placement="top-start" label="Edge">
        <ht-button slot="trigger" variant="default">Top edge</ht-button>
        <ht-menu-item>Opens below</ht-menu-item>
        <ht-menu-item>Because there is no room above</ht-menu-item>
      </ht-menu>
    </div>`,
};
