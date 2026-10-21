import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../icon/icon.js';
import '../menu/menu.js';
import './split-button.js';

const resolve = (a: Record<string, unknown>) => html`
  <ht-split-button variant=${a.variant as string} size=${a.size as string} ?disabled=${a.disabled as boolean}>
    <ht-button>Resolve</ht-button>
    <ht-menu placement="bottom-end" label="Resolve options">
      <ht-button slot="trigger" icon label="More resolve options"><ht-icon name="caret-down" weight="bold"></ht-icon></ht-button>
      <ht-menu-label>Resolve as</ht-menu-label>
      <ht-menu-item value="next-release">In the next release</ht-menu-item>
      <ht-menu-item value="current-release">In the current release</ht-menu-item>
      <ht-menu-item value="commit">In a commit</ht-menu-item>
    </ht-menu>
  </ht-split-button>`;

const meta: Meta = {
  title: 'Components/Split Button',
  component: 'ht-split-button',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'default', 'danger'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: { variant: 'primary', size: 'md', disabled: false },
  parameters: { layout: 'centered' },
  render: (a) => html`<div style="padding:24px 96px 160px">${resolve(a)}</div>`,
};
export default meta;

export const Primary: StoryObj = {};
export const Default: StoryObj = { args: { variant: 'default' } };
export const Danger: StoryObj = { args: { variant: 'danger' } };
export const Disabled: StoryObj = { args: { disabled: true } };

export const Sizes: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;align-items:center;padding:24px 96px 160px">
      ${['xs', 'sm', 'md', 'lg'].map((s) => resolve({ variant: 'primary', size: s }))}
    </div>`,
};

/** A split button with a plain one beside it, and icon-only keys and an overflow menu after them. The gap is 8px. */
export const Toolbar: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:8px;align-items:flex-start;padding:24px 96px 220px">
      ${resolve({ variant: 'primary', size: 'md' })}
      <ht-split-button variant="default">
        <ht-button>Archive</ht-button>
        <ht-menu placement="bottom-end" label="Archive options">
          <ht-button slot="trigger" icon label="More archive options"><ht-icon name="caret-down" weight="bold"></ht-icon></ht-button>
          <ht-menu-item>For 1 hour</ht-menu-item>
          <ht-menu-item>Until this happens again</ht-menu-item>
          <ht-menu-item>Forever</ht-menu-item>
        </ht-menu>
      </ht-split-button>
      <ht-button variant="default" icon label="Subscribe"><ht-icon name="bell" weight="bold"></ht-icon></ht-button>
      <ht-button variant="default" icon label="Share"><ht-icon name="arrow-up" weight="bold"></ht-icon></ht-button>
      <ht-menu placement="bottom-end" label="More actions">
        <ht-button slot="trigger" variant="default" icon label="More actions"><ht-icon name="dots-three" weight="bold"></ht-icon></ht-button>
        <ht-menu-item>Mark reviewed</ht-menu-item>
        <ht-menu-item>Bookmark</ht-menu-item>
        <ht-menu-separator></ht-menu-separator>
        <ht-menu-item danger>Delete</ht-menu-item>
        <ht-menu-item danger>Delete and discard future events</ht-menu-item>
      </ht-menu>
    </div>`,
};
