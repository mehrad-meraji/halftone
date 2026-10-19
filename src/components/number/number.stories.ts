import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../button/button.js';
import './number.js';

const big = 'font:600 40px/48px var(--ht-font-display);color:var(--ht-text)';

/** A number, with buttons that give it a new random value. */
const demo = (attrs: Record<string, string | number | boolean>, start: number, next: () => number) => {
  const el = (e: Event) => (e.currentTarget as HTMLElement).parentElement!.querySelector('ht-number') as HTMLElement & { value: number };
  return html`
    <div style="display:grid;gap:16px;justify-items:start">
      <ht-number
        style=${big}
        value=${start}
        effect=${String(attrs.effect ?? 'slide')}
        currency=${String(attrs.currency ?? '')}
        decimals=${ifDefined(attrs.decimals === undefined ? undefined : String(attrs.decimals))}
        ?compact=${Boolean(attrs.compact)}
        locale=${String(attrs.locale ?? 'en-US')}
      ></ht-number>
      <ht-button @click=${(e: Event) => (el(e).value = next())}>Change Value</ht-button>
    </div>`;
};
const rand = (max: number) => () => Math.floor(Math.random() * max);

const meta: Meta = {
  title: 'Components/Number',
  component: 'ht-number',
  tags: ['autodocs'],
  argTypes: {
    effect: { control: 'select', options: ['slide', 'count'] },
    value: { control: 'number' },
    duration: { control: 'number' },
  },
  args: { value: 1284, effect: 'slide', duration: 600, currency: '', decimals: undefined, compact: false, locale: 'en-US' },
  render: (a) => html`<ht-number
    style=${big}
    value=${a.value}
    effect=${a.effect}
    duration=${a.duration}
    currency=${a.currency}
    decimals=${ifDefined(a.decimals)}
    ?compact=${a.compact}
    locale=${a.locale}
  ></ht-number>`,
};
export default meta;

export const Slide: StoryObj = { render: () => demo({}, 1284, rand(100000)) };
export const Count: StoryObj = { render: () => demo({ effect: 'count' }, 1284, rand(100000)) };
export const Currency: StoryObj = { render: () => demo({ currency: 'USD', decimals: 2 }, 1234.5, () => Math.round(Math.random() * 1000000) / 100) };
export const Compact: StoryObj = { render: () => demo({ compact: true }, 12400, rand(5000000)) };
/** The same number in another locale: separators and currency follow `locale`. */
export const German: StoryObj = { render: () => demo({ locale: 'de-DE', currency: 'EUR', decimals: 2 }, 1234.5, () => Math.round(Math.random() * 1000000) / 100) };

/** Every digit has its own reel, and the length can change: 999 to 1,000 grows a place. */
export const GrowingNumber: StoryObj = { render: () => demo({}, 999, () => (Math.random() < 0.5 ? 1000 : 999)) };
