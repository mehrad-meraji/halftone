import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../avatar/avatar.js';
import '../button/button.js';
import './skeleton.js';

const meta: Meta = {
  title: 'Components/Skeleton',
  component: 'ht-skeleton',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['text', 'rect', 'circle'] },
    lines: { control: 'number' },
  },
  args: { variant: 'text', width: '', height: '', lines: 1 },
  render: (a) => html`
    <div style="width:320px">
      <ht-skeleton variant=${a.variant} width=${a.width} height=${a.height} lines=${a.lines}></ht-skeleton>
    </div>`,
};
export default meta;

export const Text: StoryObj = {};
export const MultiLine: StoryObj = { args: { lines: 3 } };
export const Rect: StoryObj = { args: { variant: 'rect' } };
export const Circle: StoryObj = { args: { variant: 'circle' } };
export const CustomSize: StoryObj = { args: { variant: 'rect', width: '200', height: '96px' } };

/** The default empty case: a text skeleton with no width given fills its container. */
export const FillsContainer: StoryObj = {
  render: () => html`<div style="width:120px;padding:8px;border:1px solid var(--ht-border)"><ht-skeleton lines="2"></ht-skeleton></div>`,
};

/**
 * The loading pattern. Skeletons are hidden from assistive technology, so the region says it is busy
 * (`aria-busy="true"`) and a status line says why, in text. When the data arrives, swap the content in,
 * drop `aria-busy` and remove the status text. Keep the skeleton the same size as the content so nothing jumps.
 */
export const Loading: StoryObj = {
  render: () => html`
    <div style="width:360px;display:grid;gap:12px">
      <section id="demo" aria-busy="true" aria-label="Recent issue" style="display:grid;gap:12px;padding:16px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);background:var(--ht-surface)">
        <div data-loading style="display:grid;gap:12px">
          <span role="status" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap">Loading issue</span>
          <div style="display:flex;gap:12px;align-items:center">
            <ht-skeleton variant="circle" width="32"></ht-skeleton>
            <div style="flex:1"><ht-skeleton width="50%"></ht-skeleton></div>
          </div>
          <ht-skeleton lines="3"></ht-skeleton>
          <ht-skeleton variant="rect" height="64"></ht-skeleton>
        </div>
        <div data-loaded hidden style="display:grid;gap:12px">
          <div style="display:flex;gap:12px;align-items:center">
            <ht-avatar name="Ada Lovelace"></ht-avatar>
            <strong style="font:500 14px/1.5 var(--ht-font-ui);color:var(--ht-text)">Ada Lovelace opened this issue</strong>
          </div>
          <p style="margin:0;font:400 14px/1.5 var(--ht-font-ui);color:var(--ht-text)">The importer fails on row 18,204. It leaves the table half full, and a retry doubles the rows already written.</p>
          <div style="height:64px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-md);background:var(--ht-surface-muted)"></div>
        </div>
      </section>
      <ht-button
        variant="default"
        @click=${(e: Event) => {
          const section = (e.target as HTMLElement).parentElement!.querySelector('#demo')!;
          const busy = section.getAttribute('aria-busy') === 'true';
          section.setAttribute('aria-busy', String(!busy));
          section.querySelector<HTMLElement>('[data-loading]')!.hidden = busy;
          section.querySelector<HTMLElement>('[data-loaded]')!.hidden = !busy;
        }}
      >Toggle Loading</ht-button>
    </div>`,
};

/** `fill` takes the size a class gives the host, so a skeleton can match the box it replaces. */
export const Fill: StoryObj = {
  render: () => html`<div style="width:240px;height:96px"><ht-skeleton fill variant="rect"></ht-skeleton></div>`,
};
