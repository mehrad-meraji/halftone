import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../checkbox/checkbox.js';
import '../scroll-area/scroll-area.js';
import './day-schedule.js';

/* Calendar colours are data from the app. These lean toward the text colour, so they hold in both themes. */
const cal = {
  meet: 'color-mix(in oklab, var(--ht-info) 70%, var(--ht-text))',
  done: 'color-mix(in oklab, var(--ht-success) 70%, var(--ht-text))',
  open: 'color-mix(in oklab, var(--ht-accent) 70%, var(--ht-text))',
  warn: 'var(--ht-warning)',
};

/* The panel around the schedule is the app's, as in a tray: a header with the day and a border. */
const tray = 'display:block;box-sizing:border-box;width:360px;max-width:calc(100vw - 32px);border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);overflow:hidden;box-shadow:var(--ht-shadow-sm);background:var(--ht-surface)';
const head = 'display:flex;align-items:center;justify-content:space-between;gap:8px;height:40px;padding:0 12px;border-bottom:1px solid var(--ht-border);background:var(--ht-surface-muted)';
const day = 'font:600 0.875rem/1 var(--ht-font-display);color:var(--ht-text)';
const mono = 'font:400 0.6875rem/1 var(--ht-font-mono);color:var(--ht-text-subtle)';

const trayHead = (title: string, sub: string) => html`<div style=${head}><span style=${day}>${title}</span><span style=${mono}>${sub}</span></div>`;

/** The day from the design: four meetings, a task, and three tasks with no time. */
const monday = html`
  <ht-schedule-item start="09:00" end="09:30" color=${cal.meet}>Stand-up</ht-schedule-item>
  <ht-schedule-item start="09:30" end="10:00" kind="task"><ht-checkbox slot="meta" aria-label="Mark Review sc-482 done"></ht-checkbox>Review sc-482</ht-schedule-item>
  <ht-schedule-item start="10:00" end="11:00" color=${cal.done}>Design sync</ht-schedule-item>
  <ht-schedule-item start="10:30" end="11:30" color=${cal.warn}>Interview: backend</ht-schedule-item>
  <ht-schedule-item start="12:00" end="13:00" color=${cal.open}>Lunch</ht-schedule-item>
  <ht-schedule-item kind="task"><ht-checkbox slot="meta" aria-label="Mark Write release notes done"></ht-checkbox>Write release notes</ht-schedule-item>
  <ht-schedule-item kind="task"><ht-checkbox slot="meta" aria-label="Mark Reply to Harbor done"></ht-checkbox>Reply to Harbor</ht-schedule-item>
  <ht-schedule-item kind="task"><ht-checkbox slot="meta" aria-label="Mark Book design review done"></ht-checkbox>Book design review</ht-schedule-item>`;

const meta: Meta = {
  title: 'Components/Day Schedule',
  component: 'ht-day-schedule',
  subcomponents: { HtScheduleItem: 'ht-schedule-item' },
  tags: ['autodocs'],
  argTypes: {
    hourHeight: { control: { type: 'number', min: 24, step: 4 } },
    start: { control: 'text' },
    end: { control: 'text' },
    now: { control: 'text' },
  },
  args: { start: '09:00', end: '14:00', hourHeight: 56, now: '', label: 'Monday 26 October' },
  render: (a) => html`
    <div style=${tray}>
      ${trayHead('Mon 26', '4 meetings · 2 tasks')}
      <ht-day-schedule start=${a.start} end=${a.end} hour-height=${a.hourHeight} now=${a.now} label=${a.label}>
        ${monday}
      </ht-day-schedule>
    </div>`,
};
export default meta;

/**
 * The day from the design. Items are placed by `start` and `end`; Design sync and the interview
 * overlap, so they share the width. Items with no `start` fold under the axis in Anytime.
 */
export const Default: StoryObj = {};

/**
 * Items that overlap share the width in equal columns. A cluster is a run of items that overlap one
 * another, directly or through a chain, and every item in it gets the cluster's column count: the
 * 14:00 block is one column wide because nothing overlaps it.
 */
export const Overlaps: StoryObj = {
  render: () => html`
    <div style=${tray}>
      <ht-day-schedule start="09:00" end="15:00" label="Overlaps">
        <ht-schedule-item start="09:00" end="10:30" color=${cal.meet}>Planning</ht-schedule-item>
        <ht-schedule-item start="09:30" end="10:00" color=${cal.done}>Stand-up</ht-schedule-item>
        <ht-schedule-item start="09:45" end="11:00" color=${cal.warn}>Interview: backend</ht-schedule-item>
        <ht-schedule-item start="10:00" end="10:30" kind="task">Review sc-482</ht-schedule-item>
        <ht-schedule-item start="11:30" end="12:30" color=${cal.open}>Design sync</ht-schedule-item>
        <ht-schedule-item start="12:00" end="13:00" color=${cal.meet}>Lunch</ht-schedule-item>
        <ht-schedule-item start="14:00" end="15:00" color=${cal.done}>Retro</ht-schedule-item>
      </ht-day-schedule>
    </div>`,
};

/**
 * `now` fixes the line, here at 11:42: a 2px accent line with a dot, and its time in the gutter over
 * the hour labels. The second schedule has no `now` and today's `date`, so its line follows the clock,
 * moves once a minute and pauses while the page is hidden.
 */
export const NowLine: StoryObj = {
  render: () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return html`
      <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:start">
        <div style=${tray}>
          ${trayHead('Mon 26', 'Fixed at 11:42')}
          <ht-day-schedule date="2026-10-26" start="09:00" end="14:00" now="11:42" label="Monday 26 October">${monday}</ht-day-schedule>
        </div>
        <div style=${tray}>
          ${trayHead('Today', 'Live clock')}
          <ht-day-schedule date=${todayIso} start="00:00" end="24:00" hour-height="24" label="Today">
            <ht-schedule-item start="09:00" end="09:30" color=${cal.meet}>Stand-up</ht-schedule-item>
            <ht-schedule-item start="12:00" end="13:00" color=${cal.open}>Lunch</ht-schedule-item>
          </ht-day-schedule>
        </div>
      </div>`;
  },
};

/**
 * Items with no `start` go to the Anytime group under the axis, with the count. It is a native
 * `<details>`, so it folds; it starts open, and it is hidden when it is empty. `anytime-label`
 * renames it. The checkbox goes in the `meta` slot, with its own `aria-label`.
 */
export const Anytime: StoryObj = {
  render: () => html`
    <div style=${tray}>
      <ht-day-schedule start="09:00" end="12:00" anytime-label="No Time Set" label="Wednesday 28 October">
        <ht-schedule-item start="09:00" end="09:30" color=${cal.meet}>Stand-up</ht-schedule-item>
        <ht-schedule-item kind="task"><ht-checkbox slot="meta" aria-label="Mark Write release notes done"></ht-checkbox>Write release notes</ht-schedule-item>
        <ht-schedule-item kind="task"><ht-checkbox slot="meta" aria-label="Mark Reply to Harbor done"></ht-checkbox>Reply to Harbor</ht-schedule-item>
        <ht-schedule-item kind="task"><ht-checkbox slot="meta" aria-label="Mark Book design review done"></ht-checkbox>Book design review</ht-schedule-item>
        <ht-schedule-item kind="task"><ht-checkbox slot="meta" aria-label="Mark Triage sc-519 done"></ht-checkbox>Triage sc-519</ht-schedule-item>
      </ht-day-schedule>
    </div>`,
};

interface FakeDetail {
  itemId: string;
  item: HTMLElement;
  source: HTMLElement;
  group: string;
  clientX: number;
  clientY: number;
  target: HTMLElement | null;
  data: unknown;
  label: string;
}

/**
 * With `droppable`, the axis takes items dragged from an `ht-sortable-list` whose `group` is in
 * `accept`. On load it fakes one `ht-drag-over` at 13:15, so the dashed box shows. Move the pointer over the axis to fake a drag of "Review sc-482" from a list in the
 * `tasks` group, and click to drop it.
 *
 * The story plays the list's part with a few lines of script: it fires `ht-drag-over` (bubbling,
 * composed, cancelable) on the element under the pointer, `ht-drag-leave` when the pointer leaves, and
 * `ht-drag-drop` on the click. In an app, a real `ht-sortable-list` with `group="tasks"` does all of
 * that, and the drop reaches you as one `ht-reorder` event on that list, with `to` set to the schedule
 * and `data: { time, date }`. Save the time and re-render; the schedule does not move any DOM.
 */
export const DropTarget: StoryObj = {
  render: () => {
    const item = document.createElement('div');
    const source = document.createElement('div');
    let current: HTMLElement | null = null;
    let last: FakeDetail | null = null;

    const leave = () => {
      if (current) current.dispatchEvent(new CustomEvent('ht-drag-leave', { detail: last, composed: true }));
      current = null;
    };
    const over = (e: PointerEvent) => {
      const under = e.composedPath()[0] as Element;
      const detail: FakeDetail = { itemId: 'sc-482', item, source, group: 'tasks', clientX: e.clientX, clientY: e.clientY, target: null, data: null, label: '' };
      const ev = new CustomEvent('ht-drag-over', { detail, bubbles: true, composed: true, cancelable: true });
      under.dispatchEvent(ev);
      // Leave before over: the old target loses its highlight when the accepting target changes.
      if (current && current !== detail.target) leave();
      if (ev.defaultPrevented && detail.target) {
        current = detail.target;
        last = detail;
      } else {
        last = null;
      }
    };
    // Show the highlight on load: fake one ht-drag-over at 13:15 (4.25 hours under the 09:00 line).
    const prime = async (el?: Element) => {
      if (!el || !(el instanceof HTMLElement) || !('updateComplete' in el)) return;
      await (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
      const grid = el.shadowRoot?.querySelector('[part~="grid"]');
      if (!grid || current) return;
      const r = grid.getBoundingClientRect();
      const detail: FakeDetail = { itemId: 'sc-482', item, source, group: 'tasks', clientX: r.left + 20, clientY: r.top + 4.25 * 56, target: null, data: null, label: '' };
      const ev = new CustomEvent('ht-drag-over', { detail, bubbles: true, composed: true, cancelable: true });
      el.dispatchEvent(ev);
      if (ev.defaultPrevented && detail.target) {
        current = detail.target;
        last = detail;
      }
    };
    const drop = (e: Event) => {
      if (!current || !last) return;
      current.dispatchEvent(new CustomEvent('ht-drag-drop', { detail: last, composed: true }));
      const out = (e.currentTarget as HTMLElement).parentElement?.querySelector('output');
      if (out) out.textContent = `Dropped sc-482 at ${last.label}: ${JSON.stringify(last.data)}`;
      current = null;
      last = null;
    };

    return html`
      <div style="display:grid;gap:12px;box-sizing:border-box;width:360px;max-width:calc(100vw - 32px)">
        <div style=${tray} @pointermove=${over} @pointerleave=${leave} @click=${drop}>
          ${trayHead('Wed 28', 'Takes the tasks group')}
          <ht-day-schedule ${ref(prime)} date="2026-10-28" start="09:00" end="14:00" droppable accept="tasks" label="Wednesday 28 October">
            <ht-schedule-item start="09:00" end="09:30" color=${cal.meet}>Stand-up</ht-schedule-item>
            <ht-schedule-item start="10:00" end="11:00" color=${cal.done}>Design sync</ht-schedule-item>
            <ht-schedule-item start="12:00" end="13:00" color=${cal.open}>Lunch</ht-schedule-item>
          </ht-day-schedule>
        </div>
        <output style="font:400 0.75rem/1.4 var(--ht-font-mono);color:var(--ht-text-muted)">Move the pointer over the axis, then click.</output>
      </div>`;
  },
};

/** `hour-height="40"` for a tight tray. Blocks under 36px put the title and the time on one line. */
export const Dense: StoryObj = {
  render: () => html`
    <div style=${tray}>
      ${trayHead('Mon 26', '4 meetings · 2 tasks')}
      <ht-day-schedule start="09:00" end="14:00" hour-height="40" label="Monday 26 October">${monday}</ht-day-schedule>
    </div>`,
};

/**
 * A whole working day in an `ht-scroll-area`. The schedule is as tall as its hours; the scroll area
 * gives it a fixed height. Put the Anytime group outside the scroll area if it must stay in view: here
 * it scrolls with the day.
 */
export const LongDayInAScrollArea: StoryObj = {
  render: () => html`
    <div style=${tray}>
      ${trayHead('Mon 26', '06:00 to 22:00')}
      <ht-scroll-area label="Monday 26 October" style="--ht-scroll-area-height:360px">
        <ht-day-schedule start="06:00" end="22:00" now="11:42" label="Monday 26 October">
          <ht-schedule-item start="07:00" end="07:45" color=${cal.done}>Run</ht-schedule-item>
          <ht-schedule-item start="09:00" end="09:30" color=${cal.meet}>Stand-up</ht-schedule-item>
          <ht-schedule-item start="09:30" end="10:00" kind="task"><ht-checkbox slot="meta" aria-label="Mark Review sc-482 done"></ht-checkbox>Review sc-482</ht-schedule-item>
          <ht-schedule-item start="10:00" end="11:00" color=${cal.done}>Design sync</ht-schedule-item>
          <ht-schedule-item start="10:30" end="11:30" color=${cal.warn}>Interview: backend</ht-schedule-item>
          <ht-schedule-item start="12:00" end="13:00" color=${cal.open}>Lunch</ht-schedule-item>
          <ht-schedule-item start="14:00" end="16:00" kind="task">Write the sc-482 migration</ht-schedule-item>
          <ht-schedule-item start="16:30" end="17:00" color=${cal.meet}>Release check</ht-schedule-item>
          <ht-schedule-item start="19:00" end="21:00" color=${cal.open}>Dinner with Harbor</ht-schedule-item>
          <ht-schedule-item kind="task">Write release notes</ht-schedule-item>
        </ht-day-schedule>
      </ht-scroll-area>
    </div>`,
};
