import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './tabs.js';

const meta: Meta = {
  title: 'Components/Tabs',
  component: 'ht-tabs',
  subcomponents: { HtTab: 'ht-tab', HtTabPanel: 'ht-tab-panel' },
  tags: ['autodocs'],
  argTypes: { fit: { control: 'boolean' }, value: { control: 'text' } },
  args: { fit: false, value: '' },
  render: (a) => html`
    <ht-tabs style="width:${a.fit ? 'auto' : '280px'}" label="Sidebar" value=${a.value} ?fit=${a.fit}>
      <ht-tab value="apps"><span slot="prefix">▦</span>Apps</ht-tab>
      <ht-tab value="files"><span slot="prefix">▤</span>Files</ht-tab>
      <ht-tab value="chat"><span slot="prefix">◌</span>Chat</ht-tab>
    </ht-tabs>`,
};
export default meta;

export const Default: StoryObj = {};
export const Fit: StoryObj = { args: { fit: true } };
export const InitialValue: StoryObj = { args: { value: 'files' } };

export const WithDisabledTab: StoryObj = {
  render: () => html`
    <ht-tabs style="width:280px" label="Sidebar">
      <ht-tab value="apps">Apps</ht-tab>
      <ht-tab value="files" disabled>Files</ht-tab>
      <ht-tab value="chat">Chat</ht-tab>
    </ht-tabs>`,
};

/** Panels follow the selected tab. Arrow keys, Home and End move between tabs. */
export const WithPanels: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => html`
    <ht-tabs style="max-width:420px" label="Project">
      <ht-tab value="overview">Overview</ht-tab>
      <ht-tab value="issues">Issues</ht-tab>
      <ht-tab value="settings">Settings</ht-tab>
      <ht-tab-panel value="overview">Four monitors up, one quietly sulking.</ht-tab-panel>
      <ht-tab-panel value="issues">3 unresolved. One is on fire.</ht-tab-panel>
      <ht-tab-panel value="settings">Nothing here you will enjoy changing.</ht-tab-panel>
    </ht-tabs>`,
};
