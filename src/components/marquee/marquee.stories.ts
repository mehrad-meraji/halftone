import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../tag/tag.js';
import './marquee.js';

const names = ['Northwind', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Soylent', 'Stark', 'Wayne', 'Wonka', 'Tyrell'];
const chips = names.map((n) => html`<ht-tag size="md" tone="accent">${n}</ht-tag>`);
const logo = (n: string) =>
  html`<span style="font:600 18px/1 var(--ht-font-display);letter-spacing:0.02em;color:var(--ht-text-muted);white-space:nowrap">${n}</span>`;

const meta: Meta = {
  title: 'Components/Marquee',
  component: 'ht-marquee',
  tags: ['autodocs'],
  argTypes: {
    speed: { control: 'number' },
    direction: { control: 'select', options: ['left', 'right'] },
    paused: { control: 'boolean' },
    fade: { control: 'boolean' },
  },
  args: { speed: 40, direction: 'left', paused: false, fade: false },
  render: (a) => html`
    <ht-marquee
      aria-label="Customers"
      speed=${a.speed}
      direction=${a.direction}
      ?paused=${a.paused}
      ?fade=${a.fade}
    >${chips}</ht-marquee>`,
};
export default meta;

export const Default: StoryObj = {};
export const Right: StoryObj = { args: { direction: 'right' } };
export const Faded: StoryObj = { args: { fade: true } };
/** `paused` stops the loop. Hover and keyboard focus also stop it. */
export const Paused: StoryObj = { args: { paused: true } };

/** The usual use: a logo cloud with faded edges and a wider gap. */
export const LogoCloud: StoryObj = {
  render: () => html`
    <ht-marquee aria-label="Customers" fade speed="30" style="--ht-marquee-gap:64px">
      ${names.map(logo)}
    </ht-marquee>`,
};

/** Focus inside stops the scroll, so a link can be reached and read. */
export const WithLinks: StoryObj = {
  render: () => html`
    <ht-marquee aria-label="Customer stories" fade>
      ${names.map((n) => html`<a href="#${n.toLowerCase()}" style="color:var(--ht-text);font:500 14px/20px var(--ht-font-ui);white-space:nowrap">${n} story</a>`)}
    </ht-marquee>`,
};
