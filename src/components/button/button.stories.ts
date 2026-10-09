import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './button.js';

const meta: Meta = {
  title: 'Components/Button',
  component: 'ht-button',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    disabled: { control: 'boolean' },
  },
  args: { variant: 'primary', size: 'md', disabled: false, type: 'button' },
  render: ({ variant, size, disabled, type }) =>
    html`<ht-button variant=${variant} size=${size} type=${type} ?disabled=${disabled}>Deploy It</ht-button>`,
};
export default meta;

export const Primary: StoryObj = {};
export const Secondary: StoryObj = { args: { variant: 'secondary' } };
export const Ghost: StoryObj = { args: { variant: 'ghost' } };
export const Danger: StoryObj = { args: { variant: 'danger' } };
export const Disabled: StoryObj = { args: { disabled: true } };

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
