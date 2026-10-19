import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './scroll-area.js';

const frame = 'border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);background:var(--ht-surface);';
const row = 'padding:8px 12px;border-bottom:1px solid var(--ht-border);font:400 0.875rem/1.5 var(--ht-font-ui);color:var(--ht-text)';

const lines = (n: number) =>
  Array.from({ length: n }, (_, i) => html`<div style=${row}>Issue ${i + 1}: deploy hook returned 502</div>`);

const meta: Meta = {
  title: 'Components/Scroll Area',
  component: 'ht-scroll-area',
  tags: ['autodocs'],
  argTypes: { orientation: { control: 'select', options: ['vertical', 'horizontal', 'both'] }, fade: { control: 'boolean' } },
  args: { orientation: 'vertical', fade: false },
  render: (a) => html`
    <div style="width:320px;${frame}">
      <ht-scroll-area
        label="Recent issues"
        orientation=${a.orientation}
        ?fade=${a.fade}
        style="--ht-scroll-area-height:200px"
      >${lines(24)}</ht-scroll-area>
    </div>`,
};
export default meta;

export const Vertical: StoryObj = {};

/** The fade shows only on edges that still have content beyond them. Scroll to see the top one appear. */
export const WithEdgeFade: StoryObj = { args: { fade: true } };

export const Horizontal: StoryObj = {
  args: { orientation: 'horizontal', fade: true },
  render: (a) => html`
    <div style="width:320px;${frame}">
      <ht-scroll-area label="Environments" orientation=${a.orientation} ?fade=${a.fade}>
        <div style="display:flex;gap:8px;padding:12px">
          ${['Production', 'Staging', 'Preview', 'Development', 'Canary', 'Load Test', 'Sandbox'].map(
            (n) => html`<span style="flex:none;padding:6px 12px;border:1px solid var(--ht-border-strong);border-radius:var(--ht-radius-md);font:400 0.875rem/1.25rem var(--ht-font-ui);color:var(--ht-text)">${n}</span>`,
          )}
        </div>
      </ht-scroll-area>
    </div>`,
};

export const Both: StoryObj = {
  args: { orientation: 'both', fade: true },
  render: (a) => html`
    <div style="width:320px;${frame}">
      <ht-scroll-area label="Wide log" orientation=${a.orientation} ?fade=${a.fade} style="--ht-scroll-area-height:160px">
        ${Array.from({ length: 20 }, (_, i) => html`<pre style="margin:0;padding:2px 12px;font:400 12px/1.5 var(--ht-font-mono);color:var(--ht-text)">${String(i + 1).padStart(2, '0')}  GET /api/0/projects/sentinel/issues/?query=is%3Aunresolved&statsPeriod=14d&limit=100 200 OK</pre>`)}
      </ht-scroll-area>
    </div>`,
};

/** Content shorter than the area: no scrollbar, no fade, and the area is not a tab stop. */
export const NotOverflowing: StoryObj = {
  render: (a) => html`
    <div style="width:320px;${frame}">
      <ht-scroll-area label="Short list" ?fade=${a.fade} style="--ht-scroll-area-height:200px">${lines(3)}</ht-scroll-area>
    </div>`,
};

export const Empty: StoryObj = {
  render: () => html`
    <div style="width:320px;${frame}">
      <ht-scroll-area label="Recent issues" fade style="--ht-scroll-area-height:200px">
        <p style="margin:0;padding:32px 12px;text-align:center;font:400 0.875rem/1.5 var(--ht-font-ui);color:var(--ht-text-muted)">No issues yet. Enjoy it.</p>
      </ht-scroll-area>
    </div>`,
};

export const LongContent: StoryObj = {
  render: () => html`
    <div style="width:320px;${frame}">
      <ht-scroll-area label="Release notes" fade style="--ht-scroll-area-height:240px">
        <div style="padding:12px;font:400 0.875rem/1.5 var(--ht-font-ui);color:var(--ht-text)">
          ${Array.from({ length: 8 }, () => html`<p style="margin:0 0 12px">Sessions now carry release health data by default. Crash-free rates are computed per release and environment, and a regression opens an issue on its own after two consecutive drops.</p>`)}
        </div>
      </ht-scroll-area>
    </div>`,
};
