import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../icon/icon.js';
import '../tag/tag.js';
import './tree.js';

const meta: Meta = {
  title: 'Components/Tree',
  component: 'ht-tree',
  subcomponents: { HtTreeItem: 'ht-tree-item' },
  tags: ['autodocs'],
  argTypes: { guides: { control: 'boolean' }, value: { control: 'text' } },
  args: { guides: false, value: '' },
  parameters: { layout: 'padded' },
  render: (a) => html`
    <ht-tree style="width:280px" label="Project files" value=${a.value} ?guides=${a.guides}>
      <ht-tree-item value="src" expanded>
        src
        <ht-tree-item value="components" expanded>
          components
          <ht-tree-item value="button.ts">button.ts</ht-tree-item>
          <ht-tree-item value="input.ts">input.ts</ht-tree-item>
          <ht-tree-item value="tabs.ts">tabs.ts</ht-tree-item>
        </ht-tree-item>
        <ht-tree-item value="tokens">
          tokens
          <ht-tree-item value="tokens.css">tokens.css</ht-tree-item>
        </ht-tree-item>
        <ht-tree-item value="index.ts">index.ts</ht-tree-item>
      </ht-tree-item>
      <ht-tree-item value="docs">
        docs
        <ht-tree-item value="decisions.md">decisions.md</ht-tree-item>
        <ht-tree-item value="a11y.md">a11y.md</ht-tree-item>
      </ht-tree-item>
      <ht-tree-item value="package.json">package.json</ht-tree-item>
      <ht-tree-item value="README.md">README.md</ht-tree-item>
    </ht-tree>`,
};
export default meta;

export const FileTree: StoryObj = {};
export const WithGuides: StoryObj = { args: { guides: true } };
export const Selected: StoryObj = { args: { value: 'input.ts', guides: true } };

/** Swap the default icons per file type through the `icon` slot, and add trailing content. */
export const FileTypeIconsAndSuffix: StoryObj = {
  render: () => html`
    <ht-tree style="width:300px" label="Changes" guides>
      <ht-tree-item value="src" expanded>
        src
        <ht-tree-item value="app.ts">
          <ht-icon slot="icon" name="code"></ht-icon>app.ts
          <ht-tag slot="suffix" tone="accent">M</ht-tag>
        </ht-tree-item>
        <ht-tree-item value="login.ts">
          <ht-icon slot="icon" name="lock"></ht-icon>login.ts
          <ht-tag slot="suffix" tone="success">A</ht-tag>
        </ht-tree-item>
        <ht-tree-item value="old.ts" disabled>
          <ht-icon slot="icon" name="trash"></ht-icon>old.ts
          <ht-tag slot="suffix" tone="danger">D</ht-tag>
        </ht-tree-item>
      </ht-tree-item>
      <ht-tree-item value="terminal">
        <ht-icon slot="icon" name="terminal"></ht-icon>deploy.sh
      </ht-tree-item>
    </ht-tree>`,
};

/** A navigation tree: rows are links, the current page is selected and gets aria-current. */
export const Navigation: StoryObj = {
  render: () => html`
    <ht-tree style="width:240px" label="Docs" value="tokens">
      <ht-tree-item value="start" href="#start" expanded>
        Getting started
        <ht-tree-item value="install" href="#install">Install</ht-tree-item>
        <ht-tree-item value="tokens" href="#tokens">Tokens</ht-tree-item>
      </ht-tree-item>
      <ht-tree-item value="components" href="#components">
        Components
        <ht-tree-item value="button" href="#button">Button</ht-tree-item>
        <ht-tree-item value="tabs" href="#tabs">Tabs</ht-tree-item>
      </ht-tree-item>
    </ht-tree>`,
};

/** `expandAll()` and `collapseAll()` are methods on the tree. */
export const ExpandAndCollapse: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;width:280px">
      <div style="display:flex;gap:8px">
        <ht-button size="sm" variant="default" @click=${(e: Event) => ((e.target as HTMLElement).closest('div')!.parentElement!.querySelector('ht-tree') as any).expandAll()}>Expand all</ht-button>
        <ht-button size="sm" variant="default" @click=${(e: Event) => ((e.target as HTMLElement).closest('div')!.parentElement!.querySelector('ht-tree') as any).collapseAll()}>Collapse all</ht-button>
      </div>
      <ht-tree label="Nested" guides>
        <ht-tree-item value="a">a<ht-tree-item value="a1">a1<ht-tree-item value="a1x">a1x</ht-tree-item></ht-tree-item><ht-tree-item value="a2">a2</ht-tree-item></ht-tree-item>
        <ht-tree-item value="b">b<ht-tree-item value="b1">b1</ht-tree-item></ht-tree-item>
      </ht-tree>
    </div>`,
};
