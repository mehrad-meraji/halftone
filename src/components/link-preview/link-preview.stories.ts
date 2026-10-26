import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './link-preview.js';
import '../icon/icon.js';
import '../tag/tag.js';

const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];

/* Generic glyphs, drawn here: Halftone ships no brand marks and has no pull-request or ticket icon. */
const prIcon = html`<svg slot="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="4" cy="3.5" r="1.5"></circle><circle cx="4" cy="12.5" r="1.5"></circle><circle cx="12" cy="12.5" r="1.5"></circle>
  <path d="M4 5v6M12 11V6.5a2 2 0 0 0-2-2H7m1.5-1.5L7 4.5 8.5 6"></path>
</svg>`;
const ticketIcon = html`<svg slot="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M2.5 4.5h11v2a1.5 1.5 0 0 0 0 3v2h-11v-2a1.5 1.5 0 0 0 0-3z"></path>
</svg>`;

const ok = 'color: color-mix(in oklab, var(--ht-success) 60%, var(--ht-text))';

/** Meta for the default card: plain mono counts. */
const cardMeta = html`
  <span slot="meta" style=${ok}><ht-icon name="check" size="12"></ht-icon>12/12</span>
  <span slot="meta"><ht-icon name="chat-circle" size="12"></ht-icon>4</span>
`;
/** Meta for the strip: tags. */
const stripMeta = html`
  <ht-tag slot="meta" tone="success"><ht-icon slot="prefix" name="check"></ht-icon>12/12</ht-tag>
  <ht-tag slot="meta"><ht-icon slot="prefix" name="chat-circle"></ht-icon>4</ht-tag>
`;
const rows = html`
  <ht-link-preview-row key="sc-482" href="#sc-482">Fix flaky upload test<ht-tag slot="status" tone="accent">In Review</ht-tag></ht-link-preview-row>
  <ht-link-preview-row key="sc-479" href="#sc-479">Show retry count in the toast<ht-tag slot="status">To Do</ht-tag></ht-link-preview-row>
`;

const meta: Meta = {
  title: 'Components/Link Preview',
  component: 'ht-link-preview',
  subcomponents: { HtLinkPreviewRow: 'ht-link-preview-row' },
  tags: ['autodocs'],
  argTypes: {
    appearance: { control: 'select', options: ['card', 'strip'] },
    statusTone: { name: 'status-tone', control: 'select', options: tones },
    target: { control: 'select', options: ['', '_blank'] },
  },
  args: {
    appearance: 'card',
    href: '#pr-1284',
    target: '',
    host: 'atlas/web · #1284',
    heading: 'Retry uploads after a dropped connection',
    status: 'Open',
    statusTone: 'success',
  },
  render: (a) => html`<div style="width:420px;max-width:calc(100vw - 32px)">
    <ht-link-preview
      appearance=${a.appearance}
      href=${a.href}
      target=${a.target}
      host=${a.host}
      heading=${a.heading}
      status=${a.status}
      status-tone=${a.statusTone}
      >${prIcon}${a.appearance === 'strip' ? stripMeta : cardMeta}</ht-link-preview
    >
  </div>`,
};
export default meta;

/** Icon left, host line, title and meta stacked. Hover the card or tab into it to bring out Open. */
export const Default: StoryObj = {};

/** The host line in a dot-screen header strip, the title in display type, meta as tags. */
export const Strip: StoryObj = { args: { appearance: 'strip' } };

/** Child rows: a muted footer on the card, a tree line on the strip. */
export const WithRows: StoryObj = {
  render: (a) => html`<div style="display:grid;gap:24px;width:420px;max-width:calc(100vw - 32px)">
    <ht-link-preview href=${a.href} host=${a.host} heading=${a.heading} status=${a.status} status-tone=${a.statusTone}
      >${prIcon}${cardMeta}${rows}</ht-link-preview
    >
    <ht-link-preview appearance="strip" href=${a.href} host=${a.host} heading=${a.heading} status=${a.status} status-tone=${a.statusTone}
      >${prIcon}${stripMeta}${rows}</ht-link-preview
    >
  </div>`,
};

/** At 220px the status keeps only its dot (the text stays for screen readers) and the title keeps at least 56px. */
export const Narrow: StoryObj = {
  render: (a) => html`<div style="display:flex;flex-wrap:wrap;gap:24px;align-items:start">
    <div style="width:220px">
      <ht-link-preview href=${a.href} host=${a.host} heading=${a.heading} status=${a.status} status-tone=${a.statusTone}
        >${prIcon}${cardMeta}</ht-link-preview
      >
    </div>
    <div style="width:220px">
      <ht-link-preview appearance="strip" href=${a.href} host=${a.host} heading=${a.heading} status=${a.status} status-tone=${a.statusTone}
        >${prIcon}${stripMeta}</ht-link-preview
      >
    </div>
  </div>`,
};

/** Every status tone, on a ticket with no meta. */
export const Statuses: StoryObj = {
  render: () => html`<div style="display:grid;gap:12px;width:420px;max-width:calc(100vw - 32px)">
    ${[
      ['neutral', 'To Do'],
      ['accent', 'In Review'],
      ['success', 'Done'],
      ['warning', 'Blocked'],
      ['danger', 'Failed'],
      ['info', 'Started'],
    ].map(
      ([tone, label]) => html`<ht-link-preview
        href="#sc-490"
        host="atlas/web · sc-490"
        heading="Pricing page copy"
        status=${label}
        status-tone=${tone}
        >${ticketIcon}</ht-link-preview
      >`,
    )}
  </div>`,
};
