import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { HtIcon, registerIcons } from './icon.js';

const meta: Meta = {
  title: 'Components/Icon',
  component: 'ht-icon',
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: HtIcon.names },
    weight: { control: 'select', options: ['regular', 'bold', 'fill'] },
    size: { control: 'text' },
  },
  args: { name: 'rocket', weight: 'regular', size: '32', label: '' },
  render: (a) => html`<ht-icon name=${a.name} weight=${a.weight} size=${a.size} label=${a.label}></ht-icon>`,
};
export default meta;

export const Default: StoryObj = {};
export const Bold: StoryObj = { args: { weight: 'bold' } };
export const Fill: StoryObj = { args: { weight: 'fill' } };

/** Sized in `em` by default, so it follows the text it sits in. */
export const InlineWithText: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;font-family:var(--ht-font-ui)">
      <span style="font-size:12px"><ht-icon name="info"></ht-icon> Twelve pixel text</span>
      <span style="font-size:16px"><ht-icon name="info"></ht-icon> Sixteen pixel text</span>
      <span style="font-size:24px"><ht-icon name="info"></ht-icon> Twenty-four pixel text</span>
    </div>`,
};

/** Without a `label` the icon is hidden from assistive technology. Give one when it is the only content. */
export const WithLabel: StoryObj = {
  render: () => html`<ht-icon name="bell" weight="fill" size="24" label="Notifications"></ht-icon>`,
};

export const Gallery: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;font:400 12px var(--ht-font-ui);color:var(--ht-text)">
      ${HtIcon.names.map(
        (n) => html`<div style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-md);background:var(--ht-surface)">
          <span style="display:flex;gap:6px;font-size:20px;color:var(--ht-text)">
            <ht-icon name=${n}></ht-icon><ht-icon name=${n} weight="bold"></ht-icon><ht-icon name=${n} weight="fill"></ht-icon>
          </span>
          <code style="font:400 11px var(--ht-font-mono);color:var(--ht-text-muted)">${n}</code>
        </div>`,
      )}
    </div>`,
};

/** Add any Phosphor icon with `registerIcons`, passing the SVG file contents. */
export const RegisterYourOwn: StoryObj = {
  render: () => {
    registerIcons({
      sparkle: {
        regular:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169a8,8,0,0,0-4.78-4.78L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144Z"/></svg>',
      },
    });
    return html`<ht-icon name="sparkle" size="32"></ht-icon>`;
  },
};
