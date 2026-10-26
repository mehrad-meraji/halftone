import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../sortable-list/sortable-list.js';
import type { HtReorderDetail } from '../sortable-list/sortable-list.js';
import './accordion.js';

const meta: Meta = {
  title: 'Components/Accordion',
  component: 'ht-accordion',
  subcomponents: { HtAccordionItem: 'ht-accordion-item' },
  tags: ['autodocs'],
  argTypes: { multiple: { control: 'boolean' } },
  args: { multiple: false },
  render: (a) => html`
    <ht-accordion ?multiple=${a.multiple} style="box-sizing:border-box;width:420px;max-width:calc(100vw - 32px)">
      <ht-accordion-item open>
        <span slot="header">What is Halftone?</span>
        Web components built with Lit. Use the package, or copy one component into your project.
      </ht-accordion-item>
      <ht-accordion-item>
        <span slot="header">Does it need a framework?</span>
        No. Every component is a custom element, so it works in plain HTML and in any framework.
      </ht-accordion-item>
      <ht-accordion-item>
        <span slot="header">How do I change the colours?</span>
        Override the <code>--ht-*</code> tokens. Components use no other colour source.
      </ht-accordion-item>
    </ht-accordion>`,
};
export default meta;

/** One item open at a time. Opening a second closes the first. */
export const Single: StoryObj = {};
/** Any number of items can stay open. */
export const Multiple: StoryObj = { args: { multiple: true } };

/** A disabled item cannot be toggled and is skipped by the arrow keys. */
export const Disabled: StoryObj = {
  render: () => html`
    <ht-accordion style="box-sizing:border-box;width:420px;max-width:calc(100vw - 32px)">
      <ht-accordion-item>
        <span slot="header">Profile</span>
        Name, avatar and email.
      </ht-accordion-item>
      <ht-accordion-item disabled>
        <span slot="header">Billing (owners only)</span>
        Hidden from you.
      </ht-accordion-item>
      <ht-accordion-item>
        <span slot="header">Notifications</span>
        Choose what reaches your inbox.
      </ht-accordion-item>
    </ht-accordion>`,
};

/** Panels hold any content. Use `level` so the headers fit the outline of the page. */
export const RichContent: StoryObj = {
  render: () => html`
    <h2 style="margin:0 0 12px;font:600 18px/24px var(--ht-font-display);color:var(--ht-text)">Frequently asked questions</h2>
    <ht-accordion style="box-sizing:border-box;width:420px;max-width:calc(100vw - 32px)">
      <ht-accordion-item level="3" open>
        <span slot="header">Can I try it first?</span>
        <p style="margin:0 0 8px">Yes. Install the package and open any story.</p>
        <a href="#docs" style="color:var(--ht-accent-text)">Read the guide</a>
      </ht-accordion-item>
      <ht-accordion-item level="3">
        <span slot="header">Is it free?</span>
        MIT licensed.
      </ht-accordion-item>
    </ht-accordion>`,
};

/** The `meta` slot holds text at the end of the header, such as a count or a duration. It is read with the header. */
export const HeaderMeta: StoryObj = {
  render: () => html`
    <ht-accordion multiple style="box-sizing:border-box;width:420px;max-width:calc(100vw - 32px)">
      <ht-accordion-item open>
        <span slot="header">Monday</span>
        <span slot="meta">4 tasks</span>
        Review the release notes, reply to the design thread, and two more.
      </ht-accordion-item>
      <ht-accordion-item>
        <span slot="header">Tuesday</span>
        <span slot="meta">2 meetings, 3h 30m</span>
        Stand-up and the planning session.
      </ht-accordion-item>
      <ht-accordion-item disabled>
        <span slot="header">Wednesday</span>
        <span slot="meta">Nothing planned</span>
        Empty.
      </ht-accordion-item>
    </ht-accordion>`,
};

/**
 * Day headings that take drops. Each item is `droppable` with `accept="tasks"`, so a task dragged
 * from the list onto a header (open or folded) is taken: the header shows an accent ring, and the
 * list fires `ht-reorder` with `data: { value }`. The panel itself is not a target, so the list
 * inside it keeps its own drops. Friday accepts only `errands`, so it refuses these tasks.
 */
export const DropTargets: StoryObj = {
  render: () => {
    const log = (e: Event) => {
      const { itemId, to, index, data } = (e as CustomEvent<HtReorderDetail>).detail;
      const out = (e.currentTarget as HTMLElement).querySelector('output');
      if (out) out.textContent = `ht-reorder: ${itemId} to ${to.localName}${index === null ? '' : ` at ${index}`}, data ${JSON.stringify(data)}`;
    };
    const task = (id: string, title: string) =>
      html`<ht-sortable-item item-id=${id} label=${title}><span>${title}</span></ht-sortable-item>`;
    return html`
      <div style="display:grid;gap:12px;width:420px;max-width:calc(100vw - 32px)" @ht-reorder=${log}>
        <ht-accordion multiple>
          <ht-accordion-item open droppable accept="tasks" value="2026-10-26">
            <span slot="header">Mon 26</span>
            <span slot="meta">3 tasks</span>
            <ht-sortable-list label="Mon 26" group="tasks">
              ${task('t1', 'Review the release notes')}
              ${task('t2', 'Reply to the design thread')}
              ${task('t3', 'Book the room for Friday')}
            </ht-sortable-list>
          </ht-accordion-item>
          <ht-accordion-item droppable accept="tasks" value="2026-10-27">
            <span slot="header">Tue 27</span>
            <span slot="meta">Folded</span>
            Drop a task on this header to move it to Tuesday.
          </ht-accordion-item>
          <ht-accordion-item droppable accept="errands" value="2026-10-30">
            <span slot="header">Fri 30</span>
            <span slot="meta">Errands only</span>
            Takes items from the errands group only.
          </ht-accordion-item>
        </ht-accordion>
        <output style="font:400 12px/1.4 var(--ht-font-mono);color:var(--ht-text-muted)">Drag a task by its grip onto a header.</output>
      </div>`;
  },
};
