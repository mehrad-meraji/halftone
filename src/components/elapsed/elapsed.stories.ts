import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../checkbox/checkbox.js';
import './elapsed.js';

/** A start time `seconds` before now, computed at render so the story always opens on a believable time. */
const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

const text = 'font:400 13px/1.4 var(--ht-font-ui);color:var(--ht-text)';
const row = `display:flex;align-items:center;gap:10px;${text}`;

const meta: Meta = {
  title: 'Components/Elapsed',
  component: 'ht-elapsed',
  tags: ['autodocs'],
  argTypes: {
    secondsAgo: { control: 'number', description: 'Story only: how long ago the clock started.' },
    size: { control: 'select', options: ['md', 'lg'] },
    compact: { control: 'boolean' },
    paused: { control: 'boolean' },
    bare: { control: 'boolean' },
  },
  args: { secondsAgo: 5047, size: 'md', compact: false, paused: false, bare: false },
  render: (a) => html`<ht-elapsed
    start=${ago(a.secondsAgo)}
    size=${a.size}
    ?compact=${a.compact}
    ?paused=${a.paused}
    ?bare=${a.bare}
  ></ht-elapsed>`,
};
export default meta;

/** Running: an accent chip with a pulsing dot, `h:mm:ss`. */
export const Default: StoryObj = {};

/** `mm:ss` under an hour, `h:mm` from an hour on. */
export const Compact: StoryObj = {
  render: () => html`<div style=${row}>
    <ht-elapsed compact start=${ago(462)}></ht-elapsed>
    <ht-elapsed compact start=${ago(5047)}></ht-elapsed>
  </div>`,
};

/** Paused: a neutral chip with a pause glyph, frozen at `paused-at`. */
export const Paused: StoryObj = {
  render: () => {
    const start = Date.now() - 3_600_000;
    return html`<div style=${row}>
      <ht-elapsed paused start=${start} paused-at=${start + 462_000}></ht-elapsed>
      <ht-elapsed paused compact start=${start} paused-at=${start + 462_000}></ht-elapsed>
    </div>`;
  },
};

/** `lg` for a detail view, beside its action. */
export const Large: StoryObj = {
  render: () => html`<div style="display:grid;gap:12px">
    <div style=${row}><ht-elapsed size="lg" start=${ago(5047)}></ht-elapsed></div>
    <div style=${row}><ht-elapsed size="lg" paused start=${ago(5047)}></ht-elapsed></div>
  </div>`,
};

/** Plain tabular digits. The host sets size and colour; the component only keeps time. */
export const Bare: StoryObj = {
  render: () => html`<div style="display:grid;gap:12px;${text}">
    <ht-elapsed bare start=${ago(5047)} style="font-size:13px;font-weight:500"></ht-elapsed>
    <ht-elapsed bare start=${ago(5047)} style="font-size:11px;color:var(--ht-text-muted)"></ht-elapsed>
    <ht-elapsed bare start=${ago(5047)} style="font-size:28px;font-weight:500;letter-spacing:-0.02em"></ht-elapsed>
  </div>`,
};

/** A start in the future shows zero until it arrives. Without a `start` nothing renders. */
export const NotStarted: StoryObj = {
  render: () => html`<div style=${row}>
    <ht-elapsed start=${ago(-30)}></ht-elapsed>
    <span>Scheduled in 30 seconds</span>
  </div>`,
};

/** A task list: the running task carries the live chip, a paused one the neutral chip, one not started has none. */
export const InATaskRow: StoryObj = {
  render: () => {
    const cell = `${row};height:40px;padding:0 12px;border-bottom:1px solid var(--ht-border);background:var(--ht-surface)`;
    const title = 'flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis';
    const paused = Date.now() - 7_200_000;
    return html`<div style="max-width:420px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);overflow:hidden">
      <div style=${cell}>
        <ht-checkbox aria-label="Mark Review upload retry PR done"></ht-checkbox>
        <span style=${title}>Review upload retry PR</span>
        <ht-elapsed start=${ago(5047)}></ht-elapsed>
      </div>
      <div style=${cell}>
        <ht-checkbox aria-label="Mark Fix login redirect done"></ht-checkbox>
        <span style=${title}>Fix login redirect</span>
        <ht-elapsed paused compact start=${paused} paused-at=${paused + 462_000}></ht-elapsed>
      </div>
      <div style="${cell};border-bottom:0">
        <ht-checkbox aria-label="Mark Write release notes done"></ht-checkbox>
        <span style=${title}>Write release notes</span>
        <ht-elapsed></ht-elapsed>
      </div>
    </div>`;
  },
};
