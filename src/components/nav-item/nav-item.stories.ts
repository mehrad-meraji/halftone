import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../icon/icon.js';
import '../kbd/kbd.js';
import '../tag/tag.js';
import './nav-item.js';

const meta: Meta = {
  title: 'Components/Nav Item',
  component: 'ht-nav-item',
  tags: ['autodocs'],
  argTypes: { active: { control: 'boolean' }, disabled: { control: 'boolean' } },
  args: { active: false, disabled: false },
  render: (a) => html`<div style="width:220px"><ht-nav-item ?active=${a.active} ?disabled=${a.disabled}><ht-icon slot="prefix" name="house"></ht-icon>Home</ht-nav-item></div>`,
};
export default meta;

export const Default: StoryObj = {};
export const Active: StoryObj = { args: { active: true } };
export const Disabled: StoryObj = { args: { disabled: true } };

export const Sidebar: StoryObj = {
  render: () => html`
    <nav style="width:220px;padding:8px;background:var(--ht-surface-muted);border-radius:var(--ht-radius-md);display:grid;gap:2px">
      <ht-nav-item active href="#"><ht-icon slot="prefix" name="house"></ht-icon>Home</ht-nav-item>
      <ht-nav-item href="#"><ht-icon slot="prefix" name="clock"></ht-icon>Activity</ht-nav-item>
      <ht-nav-item href="#"><ht-icon slot="prefix" name="list"></ht-icon>Dashboards</ht-nav-item>
      <ht-nav-item href="#"><ht-icon slot="prefix" name="flag"></ht-icon>Feature flags<ht-tag slot="suffix" tone="accent">New</ht-tag></ht-nav-item>
      <ht-nav-item href="#"><ht-icon slot="prefix" name="magnifying-glass"></ht-icon>Search<ht-kbd slot="suffix" keys="⌘ K"></ht-kbd></ht-nav-item>
    </nav>`,
};
