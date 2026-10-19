import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../tag/tag.js';
import './table.js';

type Row = { name: string; platform: string; status: 'Healthy' | 'Degraded' | 'Down'; events: number };

const ROWS: Row[] = [
  { name: 'sentinel-web', platform: 'JavaScript', status: 'Healthy', events: 12408 },
  { name: 'sentinel-api', platform: 'Python', status: 'Degraded', events: 3321 },
  { name: 'ingest-worker', platform: 'Go', status: 'Healthy', events: 98210 },
  { name: 'billing-cron', platform: 'Ruby', status: 'Down', events: 17 },
  { name: 'mobile-ios', platform: 'Swift', status: 'Healthy', events: 5502 },
];

const TONE = { Healthy: 'success', Degraded: 'warning', Down: 'danger' } as const;

const body = (rows: Row[], selected = -1) =>
  rows.map(
    (r, i) => html`
      <ht-table-row ?selected=${i === selected}>
        <ht-table-cell role="rowheader">${r.name}</ht-table-cell>
        <ht-table-cell>${r.platform}</ht-table-cell>
        <ht-table-cell><ht-tag size="md" tone=${TONE[r.status]}>${r.status}</ht-tag></ht-table-cell>
        <ht-table-cell align="end">${r.events.toLocaleString('en')}</ht-table-cell>
      </ht-table-row>`,
  );

const head = html`
  <ht-table-head>
    <ht-table-row>
      <ht-table-header>Project</ht-table-header>
      <ht-table-header>Platform</ht-table-header>
      <ht-table-header>Status</ht-table-header>
      <ht-table-header align="end">Events</ht-table-header>
    </ht-table-row>
  </ht-table-head>`;

const meta: Meta = {
  title: 'Components/Table',
  component: 'ht-table',
  subcomponents: {
    HtTableHead: 'ht-table-head',
    HtTableBody: 'ht-table-body',
    HtTableRow: 'ht-table-row',
    HtTableHeader: 'ht-table-header',
    HtTableCell: 'ht-table-cell',
  },
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: { density: { control: 'select', options: ['comfortable', 'dense'] }, zebra: { control: 'boolean' } },
  args: { density: 'comfortable', zebra: false },
  render: (a) => html`
    <ht-table aria-label="Projects" density=${a.density} ?zebra=${a.zebra} style="width:560px">
      ${head}
      <ht-table-body>${body(ROWS)}</ht-table-body>
    </ht-table>`,
};
export default meta;

export const Comfortable: StoryObj = {};
export const Dense: StoryObj = { args: { density: 'dense' } };
export const Zebra: StoryObj = { args: { zebra: true } };

export const SelectedRow: StoryObj = {
  render: () => html`
    <ht-table aria-label="Projects" style="width:560px">
      ${head}
      <ht-table-body>${body(ROWS, 1)}</ht-table-body>
    </ht-table>`,
};

/** Click a header: it fires `sort` and the story reorders the rows. The table clears the other headers. */
export const Sortable: StoryObj = {
  render: () => {
    const onSort = (e: CustomEvent<{ key: string; direction: 'ascending' | 'descending' }>) => {
      const { key, direction } = e.detail;
      const dir = direction === 'ascending' ? 1 : -1;
      const tbody = (e.currentTarget as HTMLElement).querySelector('ht-table-body')!;
      const rows = [...tbody.children] as HTMLElement[];
      const val = (r: HTMLElement) => (key === 'events' ? Number(r.dataset.events) : (r.dataset[key] ?? ''));
      rows.sort((a, b) => (val(a) > val(b) ? dir : val(a) < val(b) ? -dir : 0));
      tbody.append(...rows);
    };
    return html`
      <ht-table aria-label="Projects, sortable" style="width:560px" @sort=${onSort}>
        <ht-table-head>
          <ht-table-row>
            <ht-table-header sortable key="name">Project</ht-table-header>
            <ht-table-header sortable key="platform">Platform</ht-table-header>
            <ht-table-header sortable key="events" align="end" sort="descending">Events</ht-table-header>
          </ht-table-row>
        </ht-table-head>
        <ht-table-body>
          ${[...ROWS]
            .sort((a, b) => b.events - a.events)
            .map(
              (r) => html`
                <ht-table-row data-name=${r.name} data-platform=${r.platform} data-events=${r.events}>
                  <ht-table-cell role="rowheader">${r.name}</ht-table-cell>
                  <ht-table-cell>${r.platform}</ht-table-cell>
                  <ht-table-cell align="end">${r.events.toLocaleString('en')}</ht-table-cell>
                </ht-table-row>`,
            )}
        </ht-table-body>
      </ht-table>`;
  },
};

/** Set `--ht-table-max-height` and `sticky-header`; the header stays put while the body scrolls. */
export const StickyHeader: StoryObj = {
  render: () => html`
    <ht-table aria-label="Projects" sticky-header zebra style="width:560px;--ht-table-max-height:220px">
      ${head}
      <ht-table-body>${body([...ROWS, ...ROWS, ...ROWS])}</ht-table-body>
    </ht-table>`,
};

/** Narrower than its content: the wrapper scrolls sideways and becomes a tab stop. */
export const HorizontalScroll: StoryObj = {
  render: () => html`
    <ht-table aria-label="Projects" style="width:320px">
      ${head}
      <ht-table-body>${body(ROWS)}</ht-table-body>
    </ht-table>`,
};

/** No rows: the `empty` slot shows under the header. */
export const Empty: StoryObj = {
  render: () => html`
    <ht-table aria-label="Projects" style="width:560px">
      ${head}
      <ht-table-body></ht-table-body>
      <span slot="empty">No projects yet. Create one to start collecting events.</span>
    </ht-table>`,
};

export const LongContent: StoryObj = {
  render: () => html`
    <ht-table aria-label="Alerts" style="width:560px">
      <ht-table-head>
        <ht-table-row>
          <ht-table-header>Alert</ht-table-header>
          <ht-table-header align="center">Owner</ht-table-header>
          <ht-table-header align="end">Last Fired</ht-table-header>
        </ht-table-row>
      </ht-table-head>
      <ht-table-body>
        <ht-table-row>
          <ht-table-cell style="max-width:260px">Error rate for checkout-service exceeded 2% over a rolling fifteen minute window in production</ht-table-cell>
          <ht-table-cell align="center">Platform</ht-table-cell>
          <ht-table-cell align="end">3 min ago</ht-table-cell>
        </ht-table-row>
        <ht-table-row>
          <ht-table-cell>p95 latency</ht-table-cell>
          <ht-table-cell align="center">Web</ht-table-cell>
          <ht-table-cell align="end">2 days ago</ht-table-cell>
        </ht-table-row>
      </ht-table-body>
    </ht-table>`,
};
