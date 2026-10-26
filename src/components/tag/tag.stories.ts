import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../menu/menu.js';
import './tag.js';

const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];

const meta: Meta = {
  title: 'Components/Tag',
  component: 'ht-tag',
  tags: ['autodocs'],
  argTypes: { tone: { control: 'select', options: tones }, size: { control: 'select', options: ['sm', 'md'] } },
  args: { tone: 'neutral', size: 'sm' },
  render: (a) => html`<ht-tag tone=${a.tone} size=${a.size}>Beta</ht-tag>`,
};
export default meta;

export const Neutral: StoryObj = {};
export const Accent: StoryObj = { args: { tone: 'accent' } };
export const Warning: StoryObj = { args: { tone: 'warning' } };
export const AllTones: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px">
      ${['sm', 'md'].map((s) => html`<div style="display:flex;gap:8px;align-items:center">
        ${tones.map((t) => html`<ht-tag tone=${t} size=${s}>${t}</ht-tag>`)}
      </div>`)}
    </div>`,
};

/** `dot` puts a status dot in the tone colour before the text. */
export const WithDot: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      ${tones.map((t) => html`<ht-tag tone=${t} dot>${t}</ht-tag>`)}
    </div>`,
};

/**
 * `shrink` in a row that runs out of room: the status text is cut with an ellipsis, then only the
 * dot is left. The rows are 220px, 96px and 64px wide. The text stays in the accessible name.
 */
export const Shrink: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px">
      ${[220, 96, 64].map(
        (w) => html`<div style="display:flex;align-items:center;gap:8px;width:${w}px;padding:4px;border:1px dashed var(--ht-border-strong);font:400 0.8125rem var(--ht-font-ui);color:var(--ht-text)">
          <span style="flex:none">SC-123</span>
          <ht-tag tone="warning" dot shrink>In Review</ht-tag>
        </div>`,
      )}
    </div>`,
};

/**
 * `interactive` makes the tag a button: a tab stop, a hover tint, a focus ring, and Enter or Space
 * clicks it. In an `ht-menu` trigger slot the menu sets `aria-haspopup` and `aria-expanded`.
 */
export const Interactive: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;align-items:center;padding-bottom:160px">
      <ht-menu label="Status">
        <ht-tag slot="trigger" tone="info" dot interactive>In Progress</ht-tag>
        <ht-menu-item>To Do</ht-menu-item>
        <ht-menu-item>In Progress</ht-menu-item>
        <ht-menu-item>In Review</ht-menu-item>
        <ht-menu-item>Done</ht-menu-item>
      </ht-menu>
      <ht-tag tone="success" size="md" dot interactive aria-haspopup="menu">Done</ht-tag>
    </div>`,
};
