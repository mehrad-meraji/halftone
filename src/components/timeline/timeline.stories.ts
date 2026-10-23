import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../avatar/avatar.js';
import '../button/button.js';
import '../card/card.js';
import '../empty-state/empty-state.js';
import '../icon/icon.js';
import '../tag/tag.js';
import './timeline.js';

const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const frame = 'max-width:560px';
const quote = 'margin:0;padding:8px 12px;border-left:2px solid var(--ht-border-strong);color:var(--ht-text-muted)';
const panel = 'padding:8px 12px;background:var(--ht-surface-muted);border:1px solid var(--ht-border);border-radius:var(--ht-radius-md)';

const meta: Meta = {
  title: 'Components/Timeline',
  component: 'ht-timeline',
  subcomponents: { HtTimelineGroup: 'ht-timeline-group', HtTimelineItem: 'ht-timeline-item' },
  tags: ['autodocs'],
  argTypes: {
    density: { control: 'select', options: ['comfortable', 'dense'] },
    tone: { control: 'select', options: tones },
  },
  args: { density: 'comfortable', label: 'Activity', tone: 'accent' },
  render: (a) => html`
    <ht-timeline style=${frame} density=${a.density} label=${a.label}>
      <ht-timeline-item tone=${a.tone} datetime="2026-10-23T14:02" time="14:02"><b>Ada</b> moved <b>SNT-12</b> to Done</ht-timeline-item>
      <ht-timeline-item datetime="2026-10-23T11:40" time="11:40"><b>Grace</b> commented on <b>SNT-12</b></ht-timeline-item>
      <ht-timeline-item datetime="2026-10-23T09:15" time="09:15"><b>Ada</b> created <b>SNT-12</b></ht-timeline-item>
    </ht-timeline>`,
};
export default meta;

export const Default: StoryObj = {};

/**
 * One `ht-timeline-group` per day. The heading is a real heading (level 3 by default, set `level`
 * to fit the page), and each day is its own list, so a screen reader announces the day and how many
 * events it holds. The rail restarts under each heading.
 */
export const WithDayGroups: StoryObj = {
  render: () => html`
    <ht-timeline style=${frame} label="Activity">
      <ht-timeline-group heading="Today" datetime="2026-10-23">
        <ht-timeline-item tone="success" datetime="2026-10-23T14:02" time="14:02"><b>Ada</b> moved <b>SNT-12</b> to Done</ht-timeline-item>
        <ht-timeline-item datetime="2026-10-23T11:40" time="11:40"><b>Grace</b> commented on <b>SNT-12</b></ht-timeline-item>
      </ht-timeline-group>
      <ht-timeline-group heading="Yesterday" datetime="2026-10-22">
        <ht-timeline-item tone="accent" datetime="2026-10-22T17:55" time="17:55"><b>Linus</b> assigned <b>SNT-12</b> to <b>Ada</b></ht-timeline-item>
        <ht-timeline-item tone="danger" datetime="2026-10-22T16:20" time="16:20"><b>Sentinel</b> opened <b>SNT-12</b> from a failing check</ht-timeline-item>
        <ht-timeline-item datetime="2026-10-22T09:03" time="09:03"><b>Grace</b> archived <b>SNT-9</b></ht-timeline-item>
      </ht-timeline-group>
      <ht-timeline-group heading="Monday 20 October" datetime="2026-10-20">
        <ht-timeline-item datetime="2026-10-20T10:12" time="10:12"><b>Ada</b> created the project <b>Sentinel</b></ht-timeline-item>
      </ht-timeline-group>
    </ht-timeline>`,
};

/** `tone` colours the marker and nothing else. Colour alone carries no meaning, so the outcome is in the text too. */
export const Tones: StoryObj = {
  render: () => html`
    <ht-timeline style=${frame} label="Tones">
      ${tones.map((t) => html`<ht-timeline-item tone=${t} time=${t}>A <b>${t}</b> event</ht-timeline-item>`)}
    </ht-timeline>
    <ht-timeline style="${frame};margin-top:24px" label="Tones with icons">
      ${tones.map((t) => html`<ht-timeline-item tone=${t} time=${t}><ht-icon slot="marker" name="check"></ht-icon>A <b>${t}</b> event</ht-timeline-item>`)}
    </ht-timeline>`,
};

/**
 * Three kinds of marker. A dot by default; an `ht-icon` in the `marker` slot sits in a tinted
 * circle; an `ht-avatar size="sm"` fills the same 24px cell. Markers are hidden from screen readers,
 * so the title still names the person.
 */
export const Markers: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:32px;${frame}">
      <ht-timeline label="Dots">
        <ht-timeline-item tone="success" time="14:02"><b>Ada</b> merged <b>#412</b></ht-timeline-item>
        <ht-timeline-item time="11:40"><b>Grace</b> reviewed <b>#412</b></ht-timeline-item>
        <ht-timeline-item time="09:15"><b>Ada</b> opened <b>#412</b></ht-timeline-item>
      </ht-timeline>
      <ht-timeline label="Icons">
        <ht-timeline-item tone="success" time="14:02"><ht-icon slot="marker" name="check"></ht-icon><b>Ada</b> merged <b>#412</b></ht-timeline-item>
        <ht-timeline-item time="11:40"><ht-icon slot="marker" name="chat-circle"></ht-icon><b>Grace</b> reviewed <b>#412</b></ht-timeline-item>
        <ht-timeline-item tone="accent" time="09:15"><ht-icon slot="marker" name="plus"></ht-icon><b>Ada</b> opened <b>#412</b></ht-timeline-item>
      </ht-timeline>
      <ht-timeline label="Avatars">
        <ht-timeline-item time="14:02"><ht-avatar slot="marker" size="sm" name="Ada Lovelace"></ht-avatar><b>Ada</b> merged <b>#412</b></ht-timeline-item>
        <ht-timeline-item time="11:40"><ht-avatar slot="marker" size="sm" name="Grace Hopper"></ht-avatar><b>Grace</b> reviewed <b>#412</b></ht-timeline-item>
        <ht-timeline-item time="09:15"><ht-avatar slot="marker" size="sm" name="Ada Lovelace"></ht-avatar><b>Ada</b> opened <b>#412</b></ht-timeline-item>
      </ht-timeline>
    </div>`,
};

/** `density="dense"` for long logs: smaller text, a smaller dot and tighter spacing. Icon and avatar markers keep their 24px. */
export const Dense: StoryObj = {
  render: () => html`
    <ht-timeline style=${frame} density="dense" label="Incident log">
      <ht-timeline-group heading="23 October" datetime="2026-10-23">
        <ht-timeline-item tone="danger" datetime="2026-10-23T03:12:04" time="03:12:04"><b>api</b> returned 502 on <b>/health</b></ht-timeline-item>
        <ht-timeline-item tone="danger" datetime="2026-10-23T03:12:34" time="03:12:34"><b>api</b> returned 502 on <b>/health</b> again</ht-timeline-item>
        <ht-timeline-item tone="warning" datetime="2026-10-23T03:13:00" time="03:13:00"><ht-icon slot="marker" name="warning"></ht-icon>Incident opened, <b>Ada</b> paged</ht-timeline-item>
        <ht-timeline-item datetime="2026-10-23T03:15:41" time="03:15:41"><b>Ada</b> acknowledged</ht-timeline-item>
        <ht-timeline-item tone="info" datetime="2026-10-23T03:19:10" time="03:19:10">Deploy <b>v0.4.2</b> rolled back</ht-timeline-item>
        <ht-timeline-item tone="success" datetime="2026-10-23T03:20:02" time="03:20:02"><b>api</b> healthy, incident resolved</ht-timeline-item>
      </ht-timeline-group>
    </ht-timeline>`,
};

/** Tags or an entity chip go in `meta`; a quote, a diff or a card goes in `body`. Both are hidden when empty. */
export const RichBody: StoryObj = {
  render: () => html`
    <ht-timeline style=${frame} label="Ticket history">
      <ht-timeline-item datetime="2026-10-23T14:02" time="2h ago">
        <ht-avatar slot="marker" size="sm" name="Grace Hopper"></ht-avatar>
        <b>Grace</b> commented on <b>SNT-12</b>
        <blockquote slot="body" style=${quote}>Reproduced on staging. It is the DNS record again, not the code.</blockquote>
      </ht-timeline-item>
      <ht-timeline-item tone="accent" datetime="2026-10-23T12:30" time="4h ago">
        <ht-icon slot="marker" name="pencil-simple"></ht-icon>
        <b>Ada</b> changed <b>SNT-12</b>
        <ht-tag slot="meta" tone="warning">High</ht-tag>
        <ht-tag slot="meta">Backend</ht-tag>
        <div slot="body" style="${panel};font:400 0.75rem/1.125rem var(--ht-font-mono)">
          <div>priority: <s>Medium</s> → High</div>
          <div>status: <s>Todo</s> → In Progress</div>
        </div>
      </ht-timeline-item>
      <ht-timeline-item tone="success" datetime="2026-10-23T09:00" time="9h ago">
        <ht-icon slot="marker" name="rocket"></ht-icon>
        <b>Deploy</b> <a href="#">v0.4.3</a> shipped to production
        <ht-tag slot="meta" tone="success">Live</ht-tag>
        <ht-card slot="body" eyebrow="Deploy" heading="v0.4.3 to production">Rolled out in 38s. No new errors. Yet.</ht-card>
      </ht-timeline-item>
    </ht-timeline>`,
};

/**
 * The timeline has no empty state of its own. When there are no events, render an
 * `ht-empty-state` in its place.
 */
export const Empty: StoryObj = {
  render: () => html`
    <div style=${frame}>
      <ht-empty-state heading="No Activity Yet" description="Changes to this record show up here as they happen."></ht-empty-state>
    </div>`,
};

/**
 * A client's Activity tab: day groups, people and system events, tags in `meta`, and a Load More
 * button under the timeline. Paging is the page's job, not the timeline's.
 */
export const InContext: StoryObj = {
  render: () => html`
    <section style="${frame};padding:20px;background:var(--ht-surface);border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg)">
      <h2 style="margin:0 0 16px;font:600 1.125rem/1.5rem var(--ht-font-display);color:var(--ht-text)">Activity</h2>
      <ht-timeline label="Activity for Northwind">
        <ht-timeline-group heading="Today" datetime="2026-10-23" level="3">
          <ht-timeline-item tone="success" datetime="2026-10-23T15:10" time="15:10">
            <ht-icon slot="marker" name="check"></ht-icon>
            Invoice <b>INV-0042</b> paid
            <ht-tag slot="meta" tone="success">Paid</ht-tag>
            <ht-tag slot="meta">$4,200.00</ht-tag>
          </ht-timeline-item>
          <ht-timeline-item datetime="2026-10-23T10:31" time="10:31">
            <ht-avatar slot="marker" size="sm" name="Ada Lovelace"></ht-avatar>
            <b>Ada</b> emailed <b>Jo at Northwind</b>
            <blockquote slot="body" style=${quote}>Invoice attached. The second milestone starts Monday.</blockquote>
          </ht-timeline-item>
        </ht-timeline-group>
        <ht-timeline-group heading="Yesterday" datetime="2026-10-22" level="3">
          <ht-timeline-item tone="warning" datetime="2026-10-22T18:44" time="18:44">
            <ht-icon slot="marker" name="warning"></ht-icon>
            Deploy <b>northwind-web</b> rolled back
            <ht-tag slot="meta" tone="warning">Rolled Back</ht-tag>
          </ht-timeline-item>
          <ht-timeline-item tone="info" datetime="2026-10-22T18:30" time="18:30">
            <ht-icon slot="marker" name="rocket"></ht-icon>
            Deploy <b>northwind-web</b> started from <b>main</b>
          </ht-timeline-item>
          <ht-timeline-item datetime="2026-10-22T09:12" time="09:12">
            <ht-avatar slot="marker" size="sm" name="Grace Hopper"></ht-avatar>
            <b>Grace</b> added a note
            <p slot="body" style="margin:0">Wants weekly reports, not daily. Noted, reluctantly.</p>
          </ht-timeline-item>
        </ht-timeline-group>
      </ht-timeline>
      <div style="display:flex;justify-content:center;margin-top:20px">
        <ht-button variant="default" size="sm">Load More</ht-button>
      </div>
    </section>`,
};
