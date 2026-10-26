import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import '../button/button.js';
import '../checkbox/checkbox.js';
import '../day-schedule/day-schedule.js';
import '../meter/meter.js';
import '../week-strip/week-strip.js';
import '../scroll-area/scroll-area.js';
import '../tag/tag.js';
import './sortable-list.js';
import type { HtDragDetail, HtReorderDetail } from './sortable-list.js';

interface Task {
  id: string;
  title: string;
  key?: string;
  disabled?: boolean;
}

const monday: Task[] = [
  { id: 't1', title: 'Draft Q4 roadmap', key: 'sc-480' },
  { id: 't2', title: 'Review upload retry PR', key: 'sc-482' },
  { id: 't3', title: 'Fix login redirect', key: 'sc-491' },
  { id: 't4', title: 'Write release notes' },
  { id: 't5', title: 'Book design review' },
];

const tuesday: Task[] = [
  { id: 't6', title: 'Pair on billing export', key: 'sc-503' },
  { id: 't7', title: 'Triage inbox' },
  { id: 't8', title: 'Update onboarding copy', key: 'sc-511' },
];

const tray = 'width:320px;background:var(--ht-surface);border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);box-shadow:var(--ht-shadow-sm);overflow:hidden';
const head = 'display:flex;align-items:center;justify-content:space-between;gap:8px;height:40px;padding:0 12px;border-bottom:1px solid var(--ht-border);background:var(--ht-surface-muted)';
const day = 'font:600 14px/1 var(--ht-font-display)';
const mono = 'font:400 11px/1 var(--ht-font-mono);color:var(--ht-text-subtle);font-variant-numeric:tabular-nums';
const title = 'flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis';

/**
 * Demo wiring, not part of the component: the list never moves DOM, so the story does what an app
 * would do on `ht-reorder` (save, then render the new order) by moving the node itself.
 */
function move(e: Event) {
  const { itemId, from, to, index } = (e as CustomEvent<HtReorderDetail>).detail;
  if (index === null || to.localName !== 'ht-sortable-list') return;
  const item = Array.from(from.children).find((c) => c.getAttribute('item-id') === itemId);
  if (!item) return;
  const rest = Array.from(to.children).filter((c) => c.localName === 'ht-sortable-item' && c !== item);
  const ref = rest[index];
  if (ref) to.insertBefore(item, ref);
  else if (rest.length) rest[rest.length - 1].after(item);
  else to.prepend(item);
}

const row = (t: Task) => html`
  <ht-sortable-item item-id=${t.id} label=${t.title} ?disabled=${!!t.disabled}>
    <ht-checkbox label=${`Mark ${t.title} done`}></ht-checkbox>
    <span style=${title}>${t.title}</span>
    ${t.key ? html`<span style=${mono}>${t.key}</span>` : nothing}
  </ht-sortable-item>`;

const list = (label: string, tasks: Task[], attrs: { group?: string; handle?: string; disabled?: boolean } = {}) => html`
  <section style=${tray}>
    <div style=${head}><span style=${day} aria-hidden="true">${label}</span><span style=${mono}>${tasks.length} tasks</span></div>
    <ht-sortable-list label=${label} group=${attrs.group ?? nothing} handle=${attrs.handle ?? nothing} ?disabled=${!!attrs.disabled}>
      ${tasks.map(row)}
    </ht-sortable-list>
  </section>`;

const meta: Meta = {
  title: 'Components/Sortable List',
  component: 'ht-sortable-list',
  subcomponents: { HtSortableItem: 'ht-sortable-item' },
  tags: ['autodocs'],
  argTypes: {
    handle: { control: 'select', options: ['grip', 'none'] },
    disabled: { control: 'boolean' },
  },
  args: { handle: 'grip', disabled: false },
  render: (a) => html`<div @ht-reorder=${move}>${list('Mon 26', monday, { handle: a.handle, disabled: a.disabled })}</div>`,
};
export default meta;

/**
 * Drag a row by its grip, or focus a grip and press Space, then Up or Down, then Space again. The
 * line with the ring dot marks where the row lands; the row itself waits at 35% until the app
 * re-renders.
 */
export const Default: StoryObj = {};

/**
 * Two lists with the same `group` trade rows. `ht-reorder` fires on the source list with `to` set to
 * the list it landed in and `index` counted in that list. By keyboard, rows stay in their own list.
 */
export const TwoLists: StoryObj = {
  render: () => html`
    <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:start" @ht-reorder=${move}>
      ${list('Mon 26', monday, { group: 'tasks' })} ${list('Tue 27', tuesday, { group: 'tasks' })}
    </div>`,
};

/**
 * Any element can take a drop by listening to `ht-drag-over`: call `preventDefault()`, set
 * `detail.target`, and fill `detail.data` and `detail.label`. Clear the highlight on `ht-drag-leave`
 * and `ht-drag-drop`. These three day chips are plain `div`s; Sun 1 takes nothing.
 */
export const WithDropTargets: StoryObj = {
  render: () => {
    const over = (e: Event) => {
      const ev = e as CustomEvent<HtDragDetail>;
      const el = ev.currentTarget as HTMLElement;
      if (ev.defaultPrevented || el.dataset.locked !== undefined) return;
      ev.preventDefault();
      ev.detail.target = el;
      ev.detail.data = { date: el.dataset.date };
      ev.detail.label = el.dataset.name ?? '';
      el.toggleAttribute('data-over', true);
    };
    const off = (e: Event) => (e.currentTarget as HTMLElement).toggleAttribute('data-over', false);
    const report = (e: Event) => {
      const { itemId, to, index, data } = (e as CustomEvent<HtReorderDetail>).detail;
      if (index !== null) return move(e);
      const out = (e.currentTarget as HTMLElement).querySelector('output');
      if (out) out.textContent = `ht-reorder: ${itemId} to ${to.dataset.name}, data ${JSON.stringify(data)}`;
    };
    const chip = (name: string, date: string, locked = false) => html`
      <div class="chip" data-name=${name} data-date=${date} ?data-locked=${locked} @ht-drag-over=${over} @ht-drag-leave=${off} @ht-drag-drop=${off}>
        <span style=${day}>${name}</span><span style=${mono}>${locked ? 'Locked' : 'Drop to move'}</span>
      </div>`;
    return html`
      <style>
        .chip { display: flex; flex-direction: column; gap: 4px; min-width: 96px; padding: 8px 10px; border: 1px solid var(--ht-border); border-radius: var(--ht-radius-md); background: var(--ht-surface); }
        .chip[data-locked] { border-style: dashed; background: transparent; }
        .chip[data-over] { border-color: var(--ht-accent); background: var(--ht-accent-soft); color: var(--ht-accent-text); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ht-accent) 18%, transparent); }
      </style>
      <div style="display:grid;gap:16px;justify-items:start" @ht-reorder=${report}>
        ${list('Mon 26', monday)}
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${chip('Tue 27', '2026-10-27')} ${chip('Wed 28', '2026-10-28')} ${chip('Sun 1', '2026-11-01', true)}
        </div>
        <output style=${mono}>Drop a row on a day.</output>
      </div>`;
  },
};

/**
 * `handle="none"`: no visible grip, the whole row drags. A press on the checkbox or a button in the
 * row still acts on that control. On touch, hold the row still for 250ms to pick it up; moving
 * sooner scrolls the page. Keyboard users Tab to a hidden grip, which rings the row.
 */
export const WholeRow: StoryObj = {
  render: () => html`<div @ht-reorder=${move}>${list('Mon 26', monday, { handle: 'none' })}</div>`,
};

/** The item is a `listitem`, not a button, so it holds controls of its own. Only the grip starts a drag. */
export const ItemsWithButtons: StoryObj = {
  render: () => html`
    <section style=${tray} @ht-reorder=${move}>
      <div style=${head}><span style=${day} aria-hidden="true">Mon 26</span><span style=${mono}>4 tasks</span></div>
      <ht-sortable-list label="Mon 26">
        ${monday.slice(0, 4).map(
          (t, i) => html`
            <ht-sortable-item item-id=${t.id} label=${t.title}>
              <ht-checkbox label=${`Mark ${t.title} done`} ?checked=${i === 0}></ht-checkbox>
              <span style=${title}>${t.title}</span>
              ${t.key ? html`<ht-tag size="sm" tone=${i === 1 ? 'accent' : 'neutral'}>${t.key}</ht-tag>` : nothing}
              <ht-button size="xs" variant="quiet">Open</ht-button>
            </ht-sortable-item>`,
        )}
      </ht-sortable-list>
    </section>`,
};

const many: Task[] = Array.from({ length: 24 }, (_, i) => ({
  id: `l${i + 1}`,
  title: ['Review PR', 'Fix flaky test', 'Reply to Ada', 'Update changelog', 'Check alerts', 'Plan sprint'][i % 6] + ` ${i + 1}`,
  key: `sc-${520 + i}`,
}));

/**
 * Drag a row near the top or bottom edge of the scroll area and it scrolls, faster closer to the
 * edge. The nearest scrolling ancestor is found through shadow roots and slots, so `ht-scroll-area`
 * works.
 */
export const LongListInAScrollArea: StoryObj = {
  render: () => html`
    <section style=${tray} @ht-reorder=${move}>
      <div style=${head}><span style=${day} aria-hidden="true">Backlog</span><span style=${mono}>${many.length} tasks</span></div>
      <ht-scroll-area style="--ht-scroll-area-height:280px" label="Backlog">
        <ht-sortable-list label="Backlog">${many.map(row)}</ht-sortable-list>
      </ht-scroll-area>
    </section>`,
};

/** `disabled` on the list stops every drag and every drop. `disabled` on an item pins that row only; others still land around it. */
export const Disabled: StoryObj = {
  render: () => html`
    <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:start" @ht-reorder=${move}>
      ${list('Mon 26', monday, { disabled: true })}
      ${list('Tue 27', [...tuesday.slice(0, 1), { id: 't9', title: 'Standup (pinned)', disabled: true }, ...tuesday.slice(1)])}
    </div>`,
};

/**
 * One drag engine, three kinds of target. Drag a task onto another day's tab to move it to that day,
 * or onto the schedule to give it a time (snapped to 15 minutes). The tabs and the schedule opt in
 * with `droppable` and take only the `days` group. Each drop fires one `ht-reorder` on the source
 * list; its `data` says what the target took: `{ index }`, `{ date }` or `{ time, date }`.
 */
export const IntoAWeekAndASchedule: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => {
    const show = (e: Event) => {
      const d = (e as CustomEvent<HtReorderDetail>).detail;
      const out = (e.currentTarget as HTMLElement).querySelector('output');
      if (out) out.textContent = `ht-reorder → ${d.to.localName}, index ${d.index}, data ${JSON.stringify(d.data)}`;
      move(e);
    };
    const week = [
      ['2026-10-26', 'Mon', '26', true],
      ['2026-10-27', 'Tue', '27', false],
      ['2026-10-28', 'Wed', '28', false],
      ['2026-10-29', 'Thu', '29', false],
      ['2026-10-30', 'Fri', '30', false],
      ['2026-10-31', 'Sat', '31', false],
      ['2026-11-01', 'Sun', '1', false],
    ] as const;
    return html`
      <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:start" @ht-reorder=${show}>
        <div style="display:grid;gap:16px;width:320px">
          <div style=${tray}>
            <ht-week-strip label="Week of 26 October" value="2026-10-26">
              ${week.map(([v, d, n, today]) => html`<ht-week-tab value=${v} day=${d} date-label=${n} ?today=${today} droppable accept="days"></ht-week-tab>`)}
            </ht-week-strip>
          </div>
          ${list('Mon 26', monday, { group: 'days' })}
          <output style="font:400 11px/1.5 var(--ht-font-mono);color:var(--ht-text-muted)">Drop a task to see the event.</output>
        </div>
        <div style=${tray}>
          <div style=${head}><span style=${day}>Schedule</span><span style=${mono}>Mon 26</span></div>
          <ht-day-schedule date="2026-10-26" start="09:00" end="14:00" hour-height="48" now="11:42" droppable accept="days" label="Mon 26 schedule">
            <ht-schedule-item start="09:00" end="09:30" color="var(--ht-info)">Stand-up</ht-schedule-item>
            <ht-schedule-item start="10:00" end="11:00" color="var(--ht-success)">Design sync</ht-schedule-item>
            <ht-schedule-item start="12:00" end="13:00" color="var(--ht-accent)">Lunch</ht-schedule-item>
          </ht-day-schedule>
        </div>
      </div>`;
  },
};
