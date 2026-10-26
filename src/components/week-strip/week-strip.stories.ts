import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import { ref } from 'lit/directives/ref.js';
import './week-strip.js';

/** Tone fills for the stand-in meter, mixed toward the text colour as `ht-progress` does. */
const TONES = ['info', 'success', 'accent', 'danger'].map(
  (t) => `color-mix(in oklab, var(--ht-${t}) 70%, var(--ht-text))`,
);
const WORDS = ['meetings', 'done', 'open', 'late'];

/** The week of Mon 26 Oct 2026. Counts are meetings, done, open, late. */
const WEEK = [
  { value: '2026-10-26', day: 'Mon', date: '26', counts: [2, 3, 1, 1], today: true },
  { value: '2026-10-27', day: 'Tue', date: '27', counts: [1, 0, 4, 0] },
  { value: '2026-10-28', day: 'Wed', date: '28', counts: [3, 0, 3, 0] },
  { value: '2026-10-29', day: 'Thu', date: '29', counts: [0, 0, 2, 0] },
  { value: '2026-10-30', day: 'Fri', date: '30', counts: [2, 0, 1, 0] },
  { value: '2026-10-31', day: 'Sat', date: '31', counts: [0, 0, 0, 0] },
  { value: '2026-11-01', day: 'Sun', date: '1', counts: [0, 0, 1, 0] },
];

/** A full day is 8 items. */
const loadOf = (counts: number[]) => Math.min(1, counts.reduce((a, b) => a + b, 0) / 8);
const summaryOf = (counts: number[]) =>
  counts.map((n, i) => (n ? `${n} ${WORDS[i]}` : '')).filter(Boolean).join(', ') || 'nothing planned';

/**
 * Stand-in for `ht-meter size="sm"` (4px): a row of tone spans sized by share. Swap in the real
 * meter once it ships.
 */
const meter = (counts: number[]) =>
  counts.some(Boolean)
    ? html`<span slot="meter" aria-hidden="true" style="display:flex;gap:1px;height:4px;background:var(--ht-surface-sunken)">
        ${counts.map((n, i) => (n ? html`<span style="flex-grow:${n};background:${TONES[i]}"></span>` : nothing))}
      </span>`
    : nothing;

const frame = (body: unknown) => html`
  <div style="max-width:440px;background:var(--ht-surface);border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);overflow:hidden">
    ${body}
  </div>`;

const meta: Meta = {
  title: 'Components/Week Strip',
  component: 'ht-week-strip',
  subcomponents: { HtWeekTab: 'ht-week-tab' },
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

/** Today is Mon 26, Wed 28 is selected. Arrow keys, Home and End move and select. */
export const Default: StoryObj = {
  render: () =>
    frame(html`
      <ht-week-strip label="Week of 26 October" value="2026-10-28">
        ${WEEK.map((d) => html`<ht-week-tab value=${d.value} day=${d.day} date-label=${d.date} ?today=${d.today}></ht-week-tab>`)}
      </ht-week-strip>`),
};

/**
 * `load` raises the fill; the split sits in the `meter` slot. Here a plain row of spans stands in
 * for `ht-meter size="sm"`. `summary` adds the split to each tab's name.
 */
export const WithLoad: StoryObj = {
  render: () =>
    frame(html`
      <ht-week-strip label="Week of 26 October" value="2026-10-28">
        ${WEEK.map(
          (d) => html`<ht-week-tab
            value=${d.value}
            day=${d.day}
            date-label=${d.date}
            ?today=${d.today}
            load=${loadOf(d.counts)}
            summary=${summaryOf(d.counts)}
          >${meter(d.counts)}</ht-week-tab>`,
        )}
      </ht-week-strip>`),
};

/**
 * Each tab is `droppable` and takes items from lists in the `tasks` group. There is no
 * `ht-sortable-list` here: the buttons fire the protocol's events on a tab by hand, as the list
 * would. Thu 29 starts under a drag. Sun 1 accepts only `errands`, so it refuses a `tasks` item.
 */
export const DropTargets: StoryObj = {
  render: () => {
    let strip: HTMLElement | undefined;
    let out: HTMLElement | undefined;
    let current: HTMLElement | null = null;
    const tab = (value: string) => strip?.querySelector<HTMLElement>(`ht-week-tab[value="${value}"]`) ?? null;
    const detail = (group: string) => ({
      itemId: 'task-7',
      item: out!,
      source: out!,
      group,
      clientX: 0,
      clientY: 0,
      target: null as HTMLElement | null,
      data: null as unknown,
      label: '',
    });
    const show = (text: string) => {
      if (out) out.textContent = text;
    };
    const over = (value: string, group = 'tasks') => {
      const t = tab(value);
      if (!t) return;
      if (current && current !== t) leave();
      const d = detail(group);
      const ev = new CustomEvent('ht-drag-over', { detail: d, bubbles: true, composed: true, cancelable: true });
      t.dispatchEvent(ev);
      if (ev.defaultPrevented) {
        current = t;
        show(`Taken: data ${JSON.stringify(d.data)}, label "${d.label}"`);
      } else {
        show(`Refused by ${value} (group "${group}")`);
      }
    };
    const leave = () => {
      current?.dispatchEvent(new CustomEvent('ht-drag-leave', { detail: detail('tasks'), composed: true }));
      current = null;
      show('Left');
    };
    const drop = () => {
      if (!current) return show('Nothing to drop on');
      current.dispatchEvent(new CustomEvent('ht-drag-drop', { detail: detail('tasks'), composed: true }));
      current = null;
      show('Dropped');
    };
    const start = (el?: Element) => {
      if (!el || strip) return;
      strip = el as HTMLElement;
      requestAnimationFrame(() => over('2026-10-29'));
    };
    return html`
      <div style="display:grid;gap:12px;max-width:440px">
        ${frame(html`
          <ht-week-strip ${ref(start)} label="Week of 26 October" value="2026-10-28">
            ${WEEK.map(
              (d) => html`<ht-week-tab
                value=${d.value}
                day=${d.day}
                date-label=${d.date}
                ?today=${d.today}
                load=${loadOf(d.counts)}
                droppable
                accept=${d.day === 'Sun' ? 'errands' : 'tasks'}
              >${meter(d.counts)}</ht-week-tab>`,
            )}
          </ht-week-strip>`)}
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button @click=${() => over('2026-10-29')}>Over Thu 29</button>
          <button @click=${() => over('2026-10-28')}>Over Wed 28</button>
          <button @click=${() => over('2026-11-01')}>Over Sun 1</button>
          <button @click=${leave}>Leave</button>
          <button @click=${drop}>Drop</button>
        </div>
        <output ${ref((el) => (out = el as HTMLElement | undefined))} style="font:0.75rem var(--ht-font-mono);color:var(--ht-text-muted)"></output>
      </div>`;
  },
};

/** Sat 31 is disabled: it cannot be selected, the arrow keys skip it, and it takes no drops. */
export const DisabledDay: StoryObj = {
  render: () =>
    frame(html`
      <ht-week-strip label="Week of 26 October" value="2026-10-28">
        ${WEEK.map(
          (d) => html`<ht-week-tab
            value=${d.value}
            day=${d.day}
            date-label=${d.date}
            ?today=${d.today}
            ?disabled=${d.day === 'Sat'}
            load=${loadOf(d.counts)}
            summary=${summaryOf(d.counts)}
          >${meter(d.counts)}</ht-week-tab>`,
        )}
      </ht-week-strip>`),
};
