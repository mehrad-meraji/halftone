import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './command.js';

const meta: Meta = {
  title: 'Components/Command',
  component: 'ht-command',
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    value: { control: 'text' },
  },
  args: { placeholder: 'Type A Command Or Search', value: '' },
  parameters: { layout: 'centered' },
  render: (a) => html`
    <div style="width:28rem">
      <ht-command placeholder=${a.placeholder} .value=${a.value} label="Commands">
        <ht-command-item shortcut="⌘ N">New Issue</ht-command-item>
        <ht-command-item shortcut="⌘ ⇧ M" keywords="alert uptime">New Monitor</ht-command-item>
        <ht-command-item keywords="preferences config">Open Settings</ht-command-item>
        <ht-command-item keywords="theme dark light">Toggle Theme</ht-command-item>
        <ht-command-item disabled>Delete Everything</ht-command-item>
      </ht-command>
    </div>`,
};
export default meta;

export const Inline: StoryObj = {};

/** The query is matched against the text and the hidden `keywords`: "preferences" finds Open Settings. */
export const Filtered: StoryObj = { args: { value: 'prefer' } };

export const Empty: StoryObj = { args: { value: 'zzzz' } };

export const Groups: StoryObj = {
  render: () => html`
    <div style="width:28rem">
      <ht-command label="Commands">
        <ht-command-group heading="Issues">
          <ht-command-item shortcut="⌘ N">New Issue</ht-command-item>
          <ht-command-item>Assign To Me</ht-command-item>
          <ht-command-item>Resolve</ht-command-item>
        </ht-command-group>
        <ht-command-group heading="Navigate">
          <ht-command-item shortcut="G D">Go To Dashboard</ht-command-item>
          <ht-command-item shortcut="G S" keywords="preferences">Go To Settings</ht-command-item>
        </ht-command-group>
        <ht-command-group heading="Account">
          <ht-command-item>Sign Out</ht-command-item>
        </ht-command-group>
      </ht-command>
    </div>`,
};

export const WithIcons: StoryObj = {
  render: () => html`
    <div style="width:28rem">
      <ht-command label="Create">
        <ht-command-item>
          <svg slot="prefix" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/></svg>
          New Issue
        </ht-command-item>
        <ht-command-item>
          <svg slot="prefix" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/></svg>
          New Project
        </ht-command-item>
      </ht-command>
    </div>`,
};

/** Replace the default message through the `empty` slot. */
export const CustomEmpty: StoryObj = {
  render: () => html`
    <div style="width:28rem">
      <ht-command label="Commands" value="xyz">
        <ht-command-item>New Issue</ht-command-item>
        <span slot="empty">Nothing by that name. Try fewer words, or different ones.</span>
      </ht-command>
    </div>`,
};

/** More rows than fit: the list scrolls and the highlight follows the arrow keys. */
export const LongList: StoryObj = {
  render: () => html`
    <div style="width:28rem">
      <ht-command label="Projects">
        ${Array.from({ length: 40 }, (_, i) => html`<ht-command-item>${i === 3 ? 'a-project-with-a-name-so-long-it-has-to-be-truncated-by-the-row-at-some-point' : `project-${i + 1}`}</ht-command-item>`)}
      </ht-command>
    </div>`,
};

/** `palette` wraps the same content in a native dialog. Open it with the button or press Ctrl or Command + K. */
export const Palette: StoryObj = {
  parameters: { docs: { story: { inline: false, height: '420px' } } },
  render: () => html`
    <ht-button @click=${(e: Event) => ((e.target as HTMLElement).nextElementSibling as any).show()}>Open Palette (⌘ K)</ht-button>
    <ht-command palette hotkey="mod+k" label="Command palette">
      <ht-command-group heading="Issues">
        <ht-command-item shortcut="⌘ N">New Issue</ht-command-item>
        <ht-command-item>Assign To Me</ht-command-item>
      </ht-command-group>
      <ht-command-group heading="Navigate">
        <ht-command-item shortcut="G D">Go To Dashboard</ht-command-item>
        <ht-command-item keywords="preferences">Go To Settings</ht-command-item>
      </ht-command-group>
    </ht-command>`,
};

export const PaletteOpenByDefault: StoryObj = {
  parameters: { docs: { story: { inline: false, height: '420px' } } },
  render: () => html`
    <ht-command palette open label="Command palette">
      <ht-command-item>New Issue</ht-command-item>
      <ht-command-item>Open Settings</ht-command-item>
    </ht-command>`,
};
