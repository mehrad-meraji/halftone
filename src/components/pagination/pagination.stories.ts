import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, render } from 'lit';
import '../table/table.js';
import '../tag/tag.js';
import './pagination.js';

const meta: Meta = {
  title: 'Components/Pagination',
  component: 'ht-pagination',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    page: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 0 } },
    siblings: { control: { type: 'number', min: 0, max: 3 } },
  },
  args: { page: 6, totalPages: 16, siblings: 1, size: 'md', compact: false, disabled: false },
  render: (a) => html`
    <ht-pagination
      page=${a.page} total-pages=${a.totalPages} siblings=${a.siblings} size=${a.size}
      ?compact=${a.compact} ?disabled=${a.disabled}
    ></ht-pagination>`,
};
export default meta;

export const Default: StoryObj = {};
export const Small: StoryObj = { args: { size: 'sm' } };

/** At the first page, Previous is disabled. At the last, Next is. */
export const FirstPage: StoryObj = { args: { page: 1 } };
export const LastPage: StoryObj = { args: { page: 16 } };

/** Seven pages or fewer (with one sibling) show every page, with no ellipsis. */
export const FewPages: StoryObj = { args: { page: 2, totalPages: 5 } };

/** Two pages each side of the current one. */
export const MoreSiblings: StoryObj = { args: { page: 20, totalPages: 48, siblings: 2 } };

/** `total` and `page-size` give the page count and the range summary. */
export const WithSummary: StoryObj = {
  render: () => html`<ht-pagination page="2" total="312" page-size="20"></ht-pagination>`,
};

/** The `summary` slot replaces the range text. */
export const CustomSummary: StoryObj = {
  render: () => html`
    <ht-pagination page="2" total="312" page-size="20">
      <span slot="summary">21–40 of 312 people</span>
    </ht-pagination>`,
};

/** Previous, "Page 3 of 16", Next, as icon buttons. */
export const Compact: StoryObj = { args: { compact: true, page: 3 } };
export const CompactSmall: StoryObj = { args: { compact: true, page: 3, size: 'sm' } };

/** With `href`, pages are links built from the template. Here the event is cancelled so the story does not navigate. */
export const Links: StoryObj = {
  render: () => html`
    <ht-pagination
      page="4" total-pages="12" href="?page={page}" label="Results pages"
      @ht-page-change=${(e: CustomEvent<{ page: number }>) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement & { page: number }).page = e.detail.page;
      }}
    ></ht-pagination>`,
};

export const Disabled: StoryObj = { args: { disabled: true } };
export const DisabledLinks: StoryObj = {
  render: () => html`<ht-pagination page="4" total-pages="12" href="?page={page}" disabled></ht-pagination>`,
};

/** Cancelling `ht-page-change` keeps the page. Only even pages are allowed here. */
export const Cancelled: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px">
      <ht-pagination
        page="2" total-pages="10"
        @ht-page-change=${(e: CustomEvent<{ page: number }>) => {
          const out = (e.currentTarget as HTMLElement).nextElementSibling!;
          if (e.detail.page % 2) {
            e.preventDefault();
            out.textContent = `Page ${e.detail.page} refused.`;
          } else {
            out.textContent = `Moved to page ${e.detail.page}.`;
          }
        }}
      ></ht-pagination>
      <p style="margin:0;font:400 0.875rem/1.4 var(--ht-font-ui);color:var(--ht-text-muted)">Pick a page.</p>
    </div>`,
};

/** No visible label: the host `aria-label` is forwarded to the nav. */
export const AriaLabel: StoryObj = {
  render: () => html`<ht-pagination aria-label="Invoice pages" page="1" total-pages="3"></ht-pagination>`,
};

type Row = { name: string; platform: string; status: 'Healthy' | 'Degraded' | 'Down'; events: number };
const PLATFORMS = ['JavaScript', 'Python', 'Go', 'Ruby', 'Swift', 'Kotlin'];
const STATUSES: Row['status'][] = ['Healthy', 'Healthy', 'Degraded', 'Healthy', 'Down'];
const TONE = { Healthy: 'success', Degraded: 'warning', Down: 'danger' } as const;
const ALL: Row[] = Array.from({ length: 47 }, (_, i) => ({
  name: `service-${String(i + 1).padStart(2, '0')}`,
  platform: PLATFORMS[i % PLATFORMS.length],
  status: STATUSES[i % STATUSES.length],
  events: ((i + 3) * 7919) % 20000,
}));
const PAGE_SIZE = 8;

const rows = (page: number) =>
  ALL.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(
    (r) => html`
      <ht-table-row>
        <ht-table-cell role="rowheader">${r.name}</ht-table-cell>
        <ht-table-cell>${r.platform}</ht-table-cell>
        <ht-table-cell><ht-tag size="md" tone=${TONE[r.status]}>${r.status}</ht-tag></ht-table-cell>
        <ht-table-cell align="end">${r.events.toLocaleString('en')}</ht-table-cell>
      </ht-table-row>`,
  );

/** A table footer: the range summary on the left, small buttons on the right. The table body follows the event. */
export const TableFooter: StoryObj = {
  render: () => {
    const root = document.createElement('div');
    const draw = (page: number) =>
      render(
        html`
          <div style="width:620px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);background:var(--ht-surface);overflow:hidden">
            <ht-table aria-label="Services" density="dense">
              <ht-table-head>
                <ht-table-row>
                  <ht-table-header>Service</ht-table-header>
                  <ht-table-header>Platform</ht-table-header>
                  <ht-table-header>Status</ht-table-header>
                  <ht-table-header align="end">Events</ht-table-header>
                </ht-table-row>
              </ht-table-head>
              <ht-table-body>${rows(page)}</ht-table-body>
            </ht-table>
            <ht-pagination
              style="padding:8px 12px;border-top:1px solid var(--ht-border)"
              label="Services pages" size="sm" .page=${page} total=${ALL.length} page-size=${PAGE_SIZE}
              @ht-page-change=${(e: CustomEvent<{ page: number }>) => draw(e.detail.page)}
            ></ht-pagination>
          </div>`,
        root,
      );
    draw(1);
    return root;
  },
};

/** A feed footer in compact mode. */
export const FeedFooter: StoryObj = {
  render: () => html`
    <div style="width:360px;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);background:var(--ht-surface)">
      <span style="font:400 0.75rem/1rem var(--ht-font-mono);color:var(--ht-text-muted)">Activity</span>
      <ht-pagination compact size="sm" page="3" total-pages="9" label="Activity pages"></ht-pagination>
    </div>`,
};
