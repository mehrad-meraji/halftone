import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './button.js';

const meta: Meta = {
  title: 'Components/Button',
  component: 'ht-button',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    disabled: { control: 'boolean' },
  },
  args: { variant: 'primary', disabled: false, type: 'button' },
  render: ({ variant, disabled, type }) =>
    html`<ht-button variant=${variant} ?disabled=${disabled} type=${type}>Kapow!</ht-button>`,
};
export default meta;

export const Primary: StoryObj = {};
export const Secondary: StoryObj = { args: { variant: 'secondary' } };
export const Danger: StoryObj = { args: { variant: 'danger' } };
export const Disabled: StoryObj = { args: { disabled: true } };
