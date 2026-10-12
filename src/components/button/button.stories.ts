import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './button.js';

const variants = ['primary', 'default', 'secondary', 'quiet', 'danger', 'glow', 'glow-outline'];

const meta: Meta = {
  title: 'Components/Button',
  component: 'ht-button',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    disabled: { control: 'boolean' },
  },
  args: { variant: 'primary', size: 'md', disabled: false, type: 'button' },
  render: ({ variant, size, disabled, type }) =>
    html`<ht-button variant=${variant} size=${size} type=${type} ?disabled=${disabled}>Get Started</ht-button>`,
};
export default meta;

export const Primary: StoryObj = {};
export const Default: StoryObj = { args: { variant: 'default' } };
export const Secondary: StoryObj = { args: { variant: 'secondary' } };
export const Quiet: StoryObj = { args: { variant: 'quiet' } };
export const Danger: StoryObj = { args: { variant: 'danger' } };
export const Glow: StoryObj = { args: { variant: 'glow' } };
export const GlowOutline: StoryObj = { args: { variant: 'glow-outline' } };
export const Disabled: StoryObj = { args: { disabled: true } };

export const AllVariants: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      ${variants.map((v) => html`<ht-button variant=${v}>${v}</ht-button>`)}
    </div>
  `,
};

export const Sizes: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:12px;align-items:center">
      <ht-button size="xs">xs</ht-button>
      <ht-button size="sm">sm</ht-button>
      <ht-button size="md">md</ht-button>
      <ht-button size="lg">lg</ht-button>
    </div>
  `,
};

export const WithIcons: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:12px;align-items:center">
      <ht-button><span slot="prefix">＋</span>New Issue</ht-button>
      <ht-button variant="default">Menu<span slot="suffix">›</span></ht-button>
    </div>
  `,
};

/** With `href` the button renders a real link. */
export const AsLink: StoryObj = {
  render: () => html`<ht-button href="https://sentry.io" target="_blank" variant="secondary">Open Docs</ht-button>`,
};

/** Glow variants are built for dark surfaces (flip the toolbar theme to compare). */
export const OnDark: StoryObj = {
  render: () => html`
    <div data-theme="dark" style="display:flex;gap:12px;padding:32px;background:var(--ht-bg);">
      <ht-button variant="glow">Get Started</ht-button>
      <ht-button variant="glow-outline">Get Demo</ht-button>
      <ht-button variant="primary">Primary</ht-button>
    </div>
  `,
};
