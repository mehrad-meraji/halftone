import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../avatar/avatar.js';
import '../tag/tag.js';
import './description-list.js';

const facts = html`
  <ht-description-item label="Status"><ht-tag tone="warning">Unresolved</ht-tag></ht-description-item>
  <ht-description-item label="Events">1,204</ht-description-item>
  <ht-description-item label="First Seen" hint="Oct 20 09:14 UTC">3 days ago</ht-description-item>
  <ht-description-item label="Last Seen" hint="Oct 23 11:02 UTC">3h ago</ht-description-item>
`;

const meta: Meta = {
  title: 'Components/Description List',
  component: 'ht-description-list',
  subcomponents: { HtDescriptionItem: 'ht-description-item' },
  tags: ['autodocs'],
  argTypes: {
    layout: { control: 'select', options: ['stacked', 'inline', 'columns'] },
    density: { control: 'select', options: ['default', 'compact'] },
    dividers: { control: 'boolean' },
    columns: { control: 'number' },
  },
  args: { layout: 'stacked', density: 'default', dividers: false, columns: 0 },
  render: (a) => html`
    <ht-description-list
      style="max-width:${a.layout === 'columns' ? '720px' : '320px'}"
      layout=${a.layout}
      density=${a.density}
      columns=${a.columns}
      ?dividers=${a.dividers}
    >
      ${facts}
    </ht-description-list>`,
};
export default meta;

/** Label above value. For side rails. */
export const Stacked: StoryObj = {};

/** Label left, value right. For property panels. */
export const Inline: StoryObj = { args: { layout: 'inline' } };

/** A strip of facts that wraps on narrow screens. Without `columns`, as many fit as the column minimum allows. */
export const Columns: StoryObj = { args: { layout: 'columns' } };

/** `columns="4"`: four per row at most, fewer when there is no room. */
export const ColumnsWithCount: StoryObj = { args: { layout: 'columns', columns: 4, dividers: true } };

export const Dividers: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:32px">
      <ht-description-list dividers style="max-width:320px">${facts}</ht-description-list>
      <ht-description-list dividers layout="inline" style="max-width:320px">${facts}</ht-description-list>
      <ht-description-list dividers layout="columns" style="max-width:720px">${facts}</ht-description-list>
    </div>`,
};

export const Compact: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:32px">
      <ht-description-list density="compact" layout="inline" style="max-width:320px">${facts}</ht-description-list>
      <ht-description-list density="compact" layout="columns" dividers style="max-width:720px">${facts}</ht-description-list>
    </div>`,
};

/** `copy` adds a copy button; it announces "Copied". `copy-value` copies the full text when a short form is shown. */
export const Copyable: StoryObj = {
  render: () => html`
    <ht-description-list layout="inline" style="max-width:360px">
      <ht-description-item label="Fingerprint" copy copy-value="a91f03c7e2b54d18be06f4a7c9d2e115">
        <code>a91f03…e115</code>
      </ht-description-item>
      <ht-description-item label="Request ID" copy><code>req_7Hq2Lw9xT4</code></ht-description-item>
      <ht-description-item label="Email" copy>mara.lind@example.com</ht-description-item>
    </ht-description-list>`,
};

/** Hashes, URLs and long text wrap instead of pushing the layout wider. */
export const LongValues: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:32px">
      <ht-description-list layout="inline" dividers style="max-width:360px">
        <ht-description-item label="SHA-256" copy>
          <code>9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</code>
        </ht-description-item>
        <ht-description-item label="Source URL">
          https://images.example.com/collections/2026/autumn/very-long-file-name-for-the-cover-photo-final-v3.jpg
        </ht-description-item>
        <ht-description-item label="Note">
          Imported from the old archive. The original upload date is lost, so the origin date is a guess from the file name.
        </ht-description-item>
      </ht-description-list>
      <ht-description-list layout="columns" dividers columns="3" style="max-width:600px">
        <ht-description-item label="Release">api@2026.10.23-rc.4+build.88213</ht-description-item>
        <ht-description-item label="Culprit">App\\Http\\Controllers\\Billing\\InvoiceController@store</ht-description-item>
        <ht-description-item label="Environment">production</ht-description-item>
      </ht-description-list>
    </div>`,
};

/** Values can be tags, avatars, links or code. */
export const RichValues: StoryObj = {
  render: () => html`
    <ht-description-list layout="inline" dividers style="max-width:380px">
      <ht-description-item label="Status"><ht-tag tone="success">Paid</ht-tag></ht-description-item>
      <ht-description-item label="Labels">
        <ht-tag>Billing</ht-tag> <ht-tag tone="accent">Customer</ht-tag> <ht-tag tone="info">Q4</ht-tag>
      </ht-description-item>
      <ht-description-item label="Assignee">
        <span style="display:inline-flex;align-items:center;gap:6px">
          <ht-avatar size="xs" name="Mara Lind"></ht-avatar>Mara Lind
        </span>
      </ht-description-item>
      <ht-description-item label="Watchers">
        <span style="display:inline-flex;gap:4px">
          <ht-avatar size="xs" name="Ade Okafor"></ht-avatar>
          <ht-avatar size="xs" name="Jun Park"></ht-avatar>
          <ht-avatar size="xs" name="Sam Reyes"></ht-avatar>
        </span>
      </ht-description-item>
      <ht-description-item label="Website"><a href="https://example.com">example.com</a></ht-description-item>
      <ht-description-item label="Branch"><code>fix/invoice-rounding</code></ht-description-item>
    </ht-description-list>`,
};

/** No value shows a muted dash, read out as "Not set". A copy button is not shown for an empty value. */
export const EmptyValue: StoryObj = {
  render: () => html`
    <ht-description-list layout="inline" style="max-width:320px">
      <ht-description-item label="Email" copy>mara.lind@example.com</ht-description-item>
      <ht-description-item label="Phone" copy></ht-description-item>
      <ht-description-item label="Company"></ht-description-item>
      <ht-description-item label="Added">Oct 2, 2026</ht-description-item>
    </ht-description-list>`,
};

/** `hint` (or the `hint` slot) adds a second line, such as the exact time under a relative one. */
export const Hint: StoryObj = {
  render: () => html`
    <ht-description-list layout="columns" style="max-width:560px">
      <ht-description-item label="First Seen" hint="Oct 20 09:14 UTC">3 days ago</ht-description-item>
      <ht-description-item label="Last Seen">
        3h ago
        <time slot="hint" datetime="2026-10-23T11:02:00Z">Oct 23 11:02 UTC</time>
      </ht-description-item>
      <ht-description-item label="Resolved"></ht-description-item>
    </ht-description-list>`,
};

/** In context: the strip of key facts under a record's title (after Sentinel's issue header). */
export const DetailHeaderStrip: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => html`
    <header style="background:var(--ht-surface);border-bottom:1px solid var(--ht-border);font-family:var(--ht-font-ui);color:var(--ht-text)">
      <div style="padding:20px 24px 16px">
        <p style="margin:0 0 4px;font:400 0.6875rem/1rem var(--ht-font-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--ht-text-muted)">Issues // SNT-482</p>
        <h1 style="margin:0;font:600 1.375rem/1.3 var(--ht-font-display)">QueryException</h1>
        <p style="margin:4px 0 0;font-size:0.875rem;color:var(--ht-text-muted)">SQLSTATE[23000]: Integrity constraint violation on invoices.number</p>
      </div>
      <div style="border-top:1px solid var(--ht-border)">
        <ht-description-list layout="columns" columns="4" dividers label="Issue summary">
          <ht-description-item label="Events">1,204</ht-description-item>
          <ht-description-item label="First Seen" hint="Oct 20 09:14 UTC">3 days ago</ht-description-item>
          <ht-description-item label="Last Seen" hint="Oct 23 11:02 UTC">3h ago</ht-description-item>
          <ht-description-item label="Fingerprint" copy copy-value="a91f03c7e2b54d18be06f4a7c9d2e115">
            <code>a91f03…e115</code>
          </ht-description-item>
        </ht-description-list>
      </div>
    </header>`,
};

/** In context: a properties rail beside a ticket or contact. */
export const PropertiesRail: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => html`
    <aside
      aria-label="Ticket properties"
      style="box-sizing:border-box;width:300px;padding:16px;background:var(--ht-surface);border:1px solid var(--ht-border);border-radius:var(--ht-radius-md)"
    >
      <ht-description-list layout="inline" dividers density="compact">
        <ht-description-item label="ID" copy><code>TSK-1042</code></ht-description-item>
        <ht-description-item label="Status"><ht-tag tone="info">In Progress</ht-tag></ht-description-item>
        <ht-description-item label="Priority"><ht-tag tone="danger">Urgent</ht-tag></ht-description-item>
        <ht-description-item label="Assignee">
          <span style="display:inline-flex;align-items:center;gap:6px">
            <ht-avatar size="xs" name="Jun Park"></ht-avatar>Jun Park
          </span>
        </ht-description-item>
        <ht-description-item label="Due Date" hint="Fri, Oct 30">In 7 days</ht-description-item>
        <ht-description-item label="Estimate">5 points</ht-description-item>
        <ht-description-item label="Requester"></ht-description-item>
      </ht-description-list>
    </aside>`,
};

/** In context: an invoice header, a fixed four across. */
export const InvoiceSummary: StoryObj = {
  render: () => html`
    <ht-description-list layout="columns" columns="4" style="max-width:720px" label="Invoice details">
      <ht-description-item label="Issued">Oct 1, 2026</ht-description-item>
      <ht-description-item label="Due" hint="Net 30">Oct 31, 2026</ht-description-item>
      <ht-description-item label="Amount">$4,820.00</ht-description-item>
      <ht-description-item label="Billed To">
        Northwind Studio
        <span slot="hint">accounts@northwind.example</span>
      </ht-description-item>
    </ht-description-list>`,
};
