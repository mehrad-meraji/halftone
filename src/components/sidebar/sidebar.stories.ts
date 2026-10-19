import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './sidebar.js';

// Plain links stand in for the consumer's rows. See `app-shell.stories.ts` for the real thing with `ht-nav-item`.
const rows = html`
  <style>
    .row { display: flex; align-items: center; gap: 8px; box-sizing: border-box; height: 30px; padding: 0 6px; font: 400 0.875rem/1 var(--ht-font-ui); color: var(--ht-text); text-decoration: none; border-radius: var(--ht-radius-md); }
    .row:hover { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    .row[aria-current] { background: color-mix(in oklab, var(--ht-text) 5%, transparent); font-weight: 500; }
    .row:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -1px; }
    .row b { flex: none; width: 16px; text-align: center; font-weight: 500; }
    .stage { display: flex; height: 440px; overflow: hidden; border: 1px solid var(--ht-border); border-radius: var(--ht-radius-lg); background: var(--ht-bg); }
    .stage main { flex: 1; padding: 16px; font: 400 0.875rem/1.5 var(--ht-font-ui); color: var(--ht-text-muted); }
    .brand { font: 600 1rem/1 var(--ht-font-display); letter-spacing: 0.01em; color: var(--ht-text); }
  </style>
`;

const nav = (more = html``) => html`
  <ht-sidebar-header><span class="brand">Halftone</span></ht-sidebar-header>
  <ht-sidebar-group>
    <a class="row" href="#" aria-current="page"><b>H</b>Home</a>
    <a class="row" href="#"><b>A</b>Activity</a>
    <a class="row" href="#"><b>D</b>Dashboards</a>
  </ht-sidebar-group>
  <ht-sidebar-group heading="Projects">
    <a class="row" href="#"><b>S</b>Sentinel</a>
    <a class="row" href="#"><b>T</b>Taskscape</a>
    <a class="row" href="#"><b>P</b>Platform</a>
  </ht-sidebar-group>
  ${more}
  <ht-sidebar-footer><a class="row" href="#"><b>?</b>Help</a></ht-sidebar-footer>
`;

const meta: Meta = {
  title: 'Components/Sidebar',
  component: 'ht-sidebar',
  subcomponents: { HtSidebarGroup: 'ht-sidebar-group', HtSidebarHeader: 'ht-sidebar-header', HtSidebarFooter: 'ht-sidebar-footer' },
  tags: ['autodocs'],
  argTypes: {
    collapsible: { control: 'boolean' },
    collapsed: { control: 'boolean' },
    hotkey: { control: 'text' },
  },
  args: { collapsible: true, collapsed: false, hotkey: '' },
  render: (a) => html`${rows}
    <div class="stage">
      <ht-sidebar label="Main" ?collapsible=${a.collapsible} ?collapsed=${a.collapsed} hotkey=${a.hotkey}>${nav()}</ht-sidebar>
      <main>Page content. Toggle the arguments to see the rail.</main>
    </div>`,
};
export default meta;

export const Default: StoryObj = {};
export const Collapsed: StoryObj = { args: { collapsed: true } };

/** `mod+b` toggles the rail (Cmd on Apple platforms, Ctrl elsewhere). Click the page first so the shortcut reaches it. */
export const WithHotkey: StoryObj = { args: { hotkey: 'mod+b' } };

/** Groups with `collapsible` get a disclosure heading. In the rail the heading becomes a short rule and the rows stay visible. */
export const CollapsibleGroups: StoryObj = {
  render: (a) => html`${rows}
    <div class="stage">
      <ht-sidebar label="Main" ?collapsible=${a.collapsible} ?collapsed=${a.collapsed}>
        <ht-sidebar-header><span class="brand">Halftone</span></ht-sidebar-header>
        <ht-sidebar-group heading="Pinned" collapsible>
          <a class="row" href="#"><b>H</b>Home</a>
          <a class="row" href="#"><b>A</b>Activity</a>
        </ht-sidebar-group>
        <ht-sidebar-group heading="Archive" collapsible collapsed>
          <a class="row" href="#"><b>O</b>Old project</a>
        </ht-sidebar-group>
      </ht-sidebar>
      <main>The Archive group starts closed.</main>
    </div>`,
};

/** Many rows: the content area scrolls, header and footer stay put. */
export const LongContent: StoryObj = {
  render: () => html`${rows}
    <div class="stage">
      <ht-sidebar label="Main">
        <ht-sidebar-header><span class="brand">Halftone</span></ht-sidebar-header>
        <ht-sidebar-group heading="Projects">
          ${Array.from({ length: 24 }, (_, i) => html`<a class="row" href="#"><b>${i + 1}</b>Project number ${i + 1} with a very long name</a>`)}
        </ht-sidebar-group>
        <ht-sidebar-footer><a class="row" href="#"><b>?</b>Help</a></ht-sidebar-footer>
      </ht-sidebar>
      <main>Scroll the sidebar.</main>
    </div>`,
};

/** Header only, no groups. */
export const Empty: StoryObj = {
  render: () => html`${rows}
    <div class="stage">
      <ht-sidebar label="Main">
        <ht-sidebar-header><span class="brand">Halftone</span></ht-sidebar-header>
      </ht-sidebar>
      <main>Nothing to navigate yet.</main>
    </div>`,
};

/**
 * Below `mobile-breakpoint` the sidebar is a drawer on a native dialog. A huge breakpoint forces it in this canvas.
 * Escape, the scrim, the close button and a link click all close it, and focus returns to the button.
 */
export const MobileDrawer: StoryObj = {
  render: () => html`${rows}
    <div class="stage">
      <ht-sidebar label="Main" mobile-breakpoint="100000">${nav()}</ht-sidebar>
      <main>
        <button type="button" @click=${(e: Event) => ((e.target as HTMLElement).closest('.stage')!.querySelector('ht-sidebar')!.open = true)}>Open Menu</button>
      </main>
    </div>`,
};
