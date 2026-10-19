import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './breadcrumb.js';

const trail = ['Projects', 'Sentinel', 'Issues', 'Import Failures', 'Row 18,204'];

const render = (items: string[], attrs: { separator?: string; maxItems?: number; label?: string } = {}) => html`
  <ht-breadcrumb
    separator=${attrs.separator ?? 'slash'}
    max-items=${attrs.maxItems ?? 0}
    label=${attrs.label ?? 'Breadcrumb'}
  >
    ${items.map((t, i) => html`<ht-breadcrumb-item href=${i === items.length - 1 ? '' : `#${t.toLowerCase().replace(/\W+/g, '-')}`}>${t}</ht-breadcrumb-item>`)}
  </ht-breadcrumb>`;

const meta: Meta = {
  title: 'Components/Breadcrumb',
  component: 'ht-breadcrumb',
  tags: ['autodocs'],
  argTypes: {
    separator: { control: 'select', options: ['slash', 'caret'] },
    maxItems: { control: 'number' },
  },
  args: { separator: 'slash', maxItems: 0, label: 'Breadcrumb' },
  render: (a) => render(trail, a),
};
export default meta;

export const Slash: StoryObj = {};
export const Caret: StoryObj = { args: { separator: 'caret' } };
export const SingleItem: StoryObj = { render: () => render(['Projects']) };

/** The last item links to its own page and still carries `aria-current="page"`. */
export const CurrentIsLink: StoryObj = {
  render: () => html`
    <ht-breadcrumb separator="caret">
      <ht-breadcrumb-item href="#projects">Projects</ht-breadcrumb-item>
      <ht-breadcrumb-item href="#sentinel">Sentinel</ht-breadcrumb-item>
    </ht-breadcrumb>`,
};

/** Five items, `max-items="3"`: the first stays, the middle collapses, the last two stay. The ellipsis button reveals the rest and moves focus to it. */
export const Collapsed: StoryObj = { args: { maxItems: 3 } };
export const CollapsedCaret: StoryObj = { args: { maxItems: 3, separator: 'caret' } };

export const LongTrail: StoryObj = {
  render: () =>
    render(['Home', 'Organisation', 'Teams', 'Platform', 'Services', 'Importer', 'Queues', 'Failures', 'Row 18,204'], {
      separator: 'caret',
      maxItems: 4,
    }),
};

/** Long labels wrap onto a second line instead of overflowing. */
export const LongLabels: StoryObj = {
  render: () => html`
    <div style="width:320px">
      ${render(['Customer Success Operations', 'Quarterly Escalation Review Board', 'The Importer Failed On Row 18,204'], { separator: 'caret' })}
    </div>`,
};

/** Items without `href` are plain text, e.g. a section that has no page of its own. */
export const WithoutLinks: StoryObj = {
  render: () => html`
    <ht-breadcrumb>
      <ht-breadcrumb-item>Projects</ht-breadcrumb-item>
      <ht-breadcrumb-item href="#sentinel">Sentinel</ht-breadcrumb-item>
      <ht-breadcrumb-item>Settings</ht-breadcrumb-item>
    </ht-breadcrumb>`,
};
