import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './carousel.js';

const slides = [
  ['Errors', 'Group by cause, not by message.'],
  ['Releases', 'See which deploy broke which page.'],
  ['Alerts', 'Page the right person, once.'],
  ['Dashboards', 'One screen for the whole team.'],
  ['Reports', 'A weekly summary in your inbox.'],
];
const slide = ([t, d]: string[], i: number) => html`
  <ht-carousel-item>
    <div style="box-sizing:border-box;height:160px;padding:20px;border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg);background:${i % 2 ? 'var(--ht-surface-muted)' : 'var(--ht-surface)'};font:400 14px/20px var(--ht-font-ui);color:var(--ht-text-muted)">
      <strong style="display:block;margin-bottom:4px;font:600 18px/24px var(--ht-font-display);color:var(--ht-text)">${t}</strong>${d}
    </div>
  </ht-carousel-item>`;

const meta: Meta = {
  title: 'Components/Carousel',
  component: 'ht-carousel',
  subcomponents: { HtCarouselItem: 'ht-carousel-item' },
  tags: ['autodocs'],
  argTypes: { dots: { control: 'boolean' } },
  args: { dots: false, label: 'Features' },
  render: (a) => html`<ht-carousel label=${a.label} ?dots=${a.dots} style="width:360px">${slides.map(slide)}</ht-carousel>`,
};
export default meta;

/** The previous button is disabled on the first slide, and the next button on the last. */
export const Default: StoryObj = {};
export const WithDots: StoryObj = { args: { dots: true } };

/** Several slides at once: set `--ht-carousel-item-size`. Slides still snap to the start. */
export const SeveralVisible: StoryObj = {
  render: () => html`<ht-carousel label="Features" dots style="width:520px;--ht-carousel-item-size:40%;--ht-carousel-gap:12px">${slides.map(slide)}</ht-carousel>`,
};

/** `change` fires when the visible slide changes. Read `index` from the host. */
export const Events: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;width:360px">
      <ht-carousel label="Features" dots @change=${(e: Event) => {
        const out = (e.currentTarget as HTMLElement).parentElement!.querySelector('output')!;
        out.textContent = `Slide ${(e.currentTarget as HTMLElement & { index: number }).index + 1}`;
      }}>${slides.map(slide)}</ht-carousel>
      <output style="font:400 14px/20px var(--ht-font-ui);color:var(--ht-text-muted)">Slide 1</output>
    </div>`,
};
