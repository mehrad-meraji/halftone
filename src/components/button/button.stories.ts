import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../icon/icon.js';
import './button.js';

const variants = ['primary', 'default', 'danger', 'quiet'];

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
    html`<ht-button variant=${variant} size=${size} type=${type} ?disabled=${disabled}>Log In</ht-button>`,
};
export default meta;

export const Primary: StoryObj = {};
export const Default: StoryObj = { args: { variant: 'default' } };
export const Danger: StoryObj = { args: { variant: 'danger' } };
export const Quiet: StoryObj = { args: { variant: 'quiet' } };
export const Disabled: StoryObj = { args: { disabled: true } };

export const AllVariants: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      ${variants.map((v) => html`<ht-button variant=${v}>${v}</ht-button>`)}
      <ht-button variant="primary" disabled>disabled</ht-button>
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
      <ht-button variant="default"><ht-icon slot="prefix" name="google-logo" weight="bold"></ht-icon>Google</ht-button>
      <ht-button><ht-icon slot="prefix" name="plus" weight="bold"></ht-icon>New Issue</ht-button>
      <ht-button variant="default">Menu<ht-icon slot="suffix" name="caret-right" weight="bold"></ht-icon></ht-button>
    </div>
  `,
};

/** Icon-only buttons: `icon` makes them square, and `label` is their accessible name. */
export const IconOnly: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:8px;align-items:center">
      <ht-button variant="default" icon label="Subscribe"><ht-icon name="bell" weight="bold"></ht-icon></ht-button>
      <ht-button variant="default" icon label="Share"><ht-icon name="arrow-up" weight="bold"></ht-icon></ht-button>
      <ht-button variant="default" icon label="More actions"><ht-icon name="dots-three" weight="bold"></ht-icon></ht-button>
      <ht-button variant="primary" icon size="sm" label="Add"><ht-icon name="plus" weight="bold"></ht-icon></ht-button>
      <ht-button variant="quiet" icon label="Close"><ht-icon name="x" weight="bold"></ht-icon></ht-button>
    </div>
  `,
};

/** With `href` the button renders a real link. */
export const AsLink: StoryObj = {
  render: () => html`<ht-button href="https://sentry.io" target="_blank" variant="default">Open Docs</ht-button>`,
};

/** The sign-in layout the style was taken from: provider buttons in a row, one wide button below. */
export const SignInStack: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:12px;width:360px">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <ht-button variant="default" block><ht-icon slot="prefix" name="google-logo" weight="bold"></ht-icon>Google</ht-button>
        <ht-button variant="default" block><ht-icon slot="prefix" name="github-logo" weight="bold"></ht-icon>GitHub</ht-button>
        <ht-button variant="default" block><ht-icon slot="prefix" name="cloud" weight="bold"></ht-icon>Azure</ht-button>
      </div>
      <ht-button variant="default" size="lg" block>Organization SSO</ht-button>
      <ht-button style="justify-self:start">Log In</ht-button>
    </div>
  `,
};
