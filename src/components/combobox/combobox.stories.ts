import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing, render } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../icon/icon.js';
import '../tag/tag.js';
import './combobox.js';
import type { HtCombobox } from './combobox.js';

interface Ticket {
  id: string;
  title: string;
  project: 'Atlas' | 'Harbor';
}

const TICKETS: Ticket[] = [
  { id: 'sc-482', title: 'Retry uploads after a dropped connection', project: 'Atlas' },
  { id: 'sc-471', title: 'Fix login redirect loop', project: 'Atlas' },
  { id: 'sc-418', title: 'Retry policy for webhooks', project: 'Atlas' },
  { id: 'sc-405', title: 'Draft onboarding emails', project: 'Harbor' },
  { id: 'sc-397', title: 'Archive stale feature flags', project: 'Harbor' },
  { id: 'sc-366', title: 'Upload size limit message', project: 'Atlas' },
];

const PROJECTS = ['Atlas', 'Harbor'];

/** The app's side of the contract: search, then replace the options. Stands in for a server call. */
const search = (q: string) => {
  const t = q.trim().toLowerCase();
  return TICKETS.filter((x) => `${x.id} ${x.title}`.toLowerCase().includes(t));
};

const ticketRows = (list: Ticket[], withTag = false) =>
  list.map(
    (t) => html`<ht-combobox-option value=${t.id}>
      <span slot="prefix">${t.id}</span>${t.title}${withTag && t.project !== 'Atlas'
        ? html`<ht-tag slot="suffix">${t.project}</ht-tag>`
        : nothing}
    </ht-combobox-option>`,
  );

/**
 * Renders the options into the combobox's light DOM. `render` appends, so slotted chips stay put.
 * The first set goes in the same way (`seed`), so one Lit part owns the options and never duplicates them.
 */
const show = (el: HtCombobox, rows: unknown) => render(rows, el);
const seed = (rows: unknown) => ref((el) => el && show(el as HtCombobox, rows));

const log = (e: CustomEvent) => console.log(e.type, e.detail);

const meta: Meta = {
  title: 'Components/Combobox',
  component: 'ht-combobox',
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    'create-label': { control: 'text' },
    'empty-text': { control: 'text' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'Find a ticket',
    'create-label': '',
    'empty-text': 'No matches.',
    loading: false,
    disabled: false,
  },
  parameters: { layout: 'centered' },
};
export default meta;

/**
 * Type to search the tickets: each keystroke fires `ht-input` and the story replaces the options.
 * Down highlights the first result, Enter picks it (`ht-select`). Enter with nothing highlighted
 * submits the text (`ht-submit`). Events are logged to the console.
 */
export const Default: StoryObj = {
  render: (a) => html`
    <div style="width:24rem">
      <ht-combobox
        label="Ticket"
        placeholder=${a.placeholder}
        create-label=${a['create-label']}
        empty-text=${a['empty-text']}
        ?loading=${a.loading}
        ?disabled=${a.disabled}
        @ht-input=${(e: CustomEvent) => show(e.currentTarget as HtCombobox, ticketRows(search(e.detail.value), true))}
        @ht-select=${log}
        @ht-submit=${log}
        ${seed(ticketRows(TICKETS, true))}
      ></ht-combobox>
    </div>`,
};

/**
 * `loading` adds a spinner row at the end of the list and marks it busy. Here every keystroke
 * sets it and the results arrive 700ms later, as from a server.
 */
export const Loading: StoryObj = {
  render: () => {
    let timer = 0;
    const onInput = (e: CustomEvent) => {
      const el = e.currentTarget as HtCombobox;
      el.loading = true;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        show(el, ticketRows(search(e.detail.value)));
        el.loading = false;
      }, 700);
    };
    return html`
      <div style="width:24rem">
        <ht-combobox
          aria-label="Find a ticket"
          placeholder="Find a ticket"
          value="Retry up"
          loading
          loading-text="Searching tickets…"
          @ht-input=${onInput}
          @ht-select=${log}
          ${seed(ticketRows(search('Retry up')))}
        ></ht-combobox>
      </div>`;
  },
};

/**
 * With no options the list shows `empty-text` as a plain row, not an error. `create-label` adds a
 * row that offers the typed text; picking it fires `ht-submit`. `create-heading` puts an eyebrow
 * above it. Focus the field and press Down.
 */
export const EmptyWithCreateRow: StoryObj = {
  render: () => html`
    <div style="width:24rem">
      <ht-combobox
        aria-label="Add a task"
        placeholder="Add a task"
        value="Pricing page copy"
        empty-text="No tickets match “{value}”."
        create-label="Add task “{value}”"
        create-heading="Create"
        @ht-input=${(e: CustomEvent) => show(e.currentTarget as HtCombobox, ticketRows(search(e.detail.value)))}
        @ht-select=${log}
        @ht-submit=${log}
      ></ht-combobox>
    </div>`,
};

/** `ht-combobox-group` puts options under a mono eyebrow. Groups after the first get a hairline. */
export const Grouped: StoryObj = {
  render: () => {
    const rows = (q: string) => {
      const t = q.trim().toLowerCase();
      const tickets = search(q);
      const projects = PROJECTS.filter((p) => p.toLowerCase().includes(t));
      return html`
        ${tickets.length ? html`<ht-combobox-group label="Tickets">${ticketRows(tickets)}</ht-combobox-group>` : nothing}
        ${projects.length
          ? html`<ht-combobox-group label="Projects">
              ${projects.map(
                (p) => html`<ht-combobox-option value=${p.toLowerCase()}>
                  <ht-icon slot="prefix" name="squares-four"></ht-icon>${p}
                </ht-combobox-option>`,
              )}
            </ht-combobox-group>`
          : nothing}`;
    };
    return html`
      <div style="width:24rem">
        <ht-combobox
          aria-label="Search"
          placeholder="Search tickets and projects"
          create-label="Add task “{value}”"
          @ht-input=${(e: CustomEvent) => show(e.currentTarget as HtCombobox, rows(e.detail.value))}
          @ht-select=${log}
          @ht-submit=${log}
          ${seed(rows(''))}
        ></ht-combobox>
      </div>`;
  },
};

/**
 * Anything in the `prefix` and `suffix` slots sits in the field as an inset chip, so it reads as
 * a setting of the field rather than text. The chips here are plain buttons; wire them to your
 * own menu or popover.
 */
export const WithPrefixAndSuffix: StoryObj = {
  render: () => html`
    <div style="width:24rem">
      <ht-combobox
        aria-label="Add a task"
        placeholder="Add a task"
        create-label="Add task “{value}”"
        @ht-input=${(e: CustomEvent) => show(e.currentTarget as HtCombobox, ticketRows(search(e.detail.value)))}
        @ht-select=${log}
        @ht-submit=${log}
        ${seed(ticketRows(TICKETS))}
      >
        <button slot="prefix" type="button"><ht-icon name="tag" size="14"></ht-icon>Tickets</button>
        <button slot="suffix" type="button">
          <span
            style="width:6px;height:6px;border-radius:50%;background:color-mix(in oklab, var(--ht-accent) 70%, var(--ht-text))"
          ></span>
          Atlas
        </button>
      </ht-combobox>
    </div>`,
};

/** Disabled: no typing, no list. Disable slotted chip buttons yourself. */
export const Disabled: StoryObj = {
  render: () => html`
    <div style="width:24rem">
      <ht-combobox aria-label="Add a task" value="Fix login redirect loop" disabled>
        <button slot="prefix" type="button" disabled><ht-icon name="tag" size="14"></ht-icon>Tickets</button>
        <button slot="suffix" type="button" disabled>Atlas</button>
      </ht-combobox>
    </div>`,
};
