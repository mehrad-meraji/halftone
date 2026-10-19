import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../icon/icon.js';
import '../kbd/kbd.js';
import '../nav-item/nav-item.js';
import '../tabs/tabs.js';
import '../tag/tag.js';
import '../tooltip/tooltip.js';
import './sidebar.js';

// Not shipped: stories are not copied. This one wires the sidebar to real parts.

const rail = (el: HTMLElement) => el.closest('.shell')!.querySelector('ht-sidebar')!;

const meta: Meta = {
  title: 'Patterns/App Shell',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { collapsed: false },
  render: (a) => html`
    <style>
      .shell { display: flex; height: 560px; background: var(--ht-bg); }
      .shell main { flex: 1; min-width: 0; padding: 16px 24px; font: 400 0.875rem/1.5 var(--ht-font-ui); color: var(--ht-text); }
      .shell h1 { margin: 12px 0 4px; font: 600 1.5rem/1.2 var(--ht-font-display); }
      .bar { display: flex; align-items: center; gap: 8px; }
      .brand { display: flex; align-items: center; gap: 8px; padding: 0 6px; font: 600 1rem/1.5rem var(--ht-font-display); }
      .foot-user { display: flex; align-items: center; gap: 8px; padding: 4px 6px; font: 400 0.875rem/1.25rem var(--ht-font-ui); color: var(--ht-text); }
    </style>
    <div class="shell">
      <ht-sidebar label="Main" collapsible ?collapsed=${a.collapsed} hotkey="mod+b" mobile-breakpoint="640">
        <ht-sidebar-header>
          <div class="brand"><ht-icon name="rocket"></ht-icon><span data-expanded-only>Taskscape</span></div>
          <ht-tabs data-expanded-only label="Sidebar view" value="apps">
            <ht-tab value="apps">Apps</ht-tab>
            <ht-tab value="files">Files</ht-tab>
          </ht-tabs>
        </ht-sidebar-header>
        <ht-sidebar-group>
          <ht-tooltip text="Home" placement="right"><ht-nav-item active href="#"><ht-icon slot="prefix" name="house"></ht-icon>Home</ht-nav-item></ht-tooltip>
          <ht-tooltip text="Activity" placement="right"><ht-nav-item href="#"><ht-icon slot="prefix" name="clock"></ht-icon>Activity</ht-nav-item></ht-tooltip>
          <ht-tooltip text="Search" placement="right"><ht-nav-item href="#"><ht-icon slot="prefix" name="magnifying-glass"></ht-icon>Search<ht-kbd slot="suffix" keys="⌘ K"></ht-kbd></ht-nav-item></ht-tooltip>
        </ht-sidebar-group>
        <ht-sidebar-group heading="Projects" collapsible>
          <ht-tooltip text="Sentinel" placement="right"><ht-nav-item href="#"><ht-icon slot="prefix" name="bug"></ht-icon>Sentinel</ht-nav-item></ht-tooltip>
          <ht-tooltip text="Feature flags" placement="right"><ht-nav-item href="#"><ht-icon slot="prefix" name="flag"></ht-icon>Feature flags<ht-tag slot="suffix" tone="accent">New</ht-tag></ht-nav-item></ht-tooltip>
        </ht-sidebar-group>
        <ht-sidebar-footer>
          <ht-tooltip text="Settings" placement="right"><ht-nav-item href="#"><ht-icon slot="prefix" name="gear"></ht-icon>Settings</ht-nav-item></ht-tooltip>
        </ht-sidebar-footer>
      </ht-sidebar>
      <main>
        <div class="bar">
          <ht-button size="sm" @click=${(e: Event) => rail(e.currentTarget as HTMLElement).toggle()}>Toggle Sidebar</ht-button>
          <ht-kbd keys="⌘ B"></ht-kbd>
        </div>
        <h1>Home</h1>
        <p>Cmd or Ctrl B toggles the rail. Narrow the window below 640px for the drawer.</p>
      </main>
    </div>`,
};
export default meta;

export const Expanded: StoryObj = {};
export const Rail: StoryObj = { args: { collapsed: true } };
