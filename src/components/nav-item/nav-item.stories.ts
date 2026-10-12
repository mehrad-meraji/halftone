import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../kbd/kbd.js';
import '../tag/tag.js';
import './nav-item.js';

const meta: Meta = {
  title: 'Components/Nav Item',
  component: 'ht-nav-item',
  tags: ['autodocs'],
  argTypes: { active: { control: 'boolean' }, disabled: { control: 'boolean' } },
  args: { active: false, disabled: false },
  render: (a) => html`<div style="width:220px"><ht-nav-item ?active=${a.active} ?disabled=${a.disabled}><span slot="prefix">⌂</span>Home</ht-nav-item></div>`,
};
export default meta;

export const Default: StoryObj = {};
export const Active: StoryObj = { args: { active: true } };
export const Disabled: StoryObj = { args: { disabled: true } };

export const Sidebar: StoryObj = {
  render: () => html`
    <nav style="width:220px;padding:8px;background:var(--ht-surface-muted);border-radius:var(--ht-radius-md);display:grid;gap:2px">
      <ht-nav-item active href="#"><span slot="prefix">⌂</span>Home</ht-nav-item>
      <ht-nav-item href="#"><span slot="prefix">◷</span>Activity</ht-nav-item>
      <ht-nav-item href="#"><span slot="prefix">▤</span>Dashboards</ht-nav-item>
      <ht-nav-item href="#"><span slot="prefix">⚑</span>Feature flags<ht-tag slot="suffix" tone="accent">New</ht-tag></ht-nav-item>
      <ht-nav-item href="#"><span slot="prefix">⌕</span>Search<ht-kbd slot="suffix" keys="⌘ K"></ht-kbd></ht-nav-item>
    </nav>`,
};
