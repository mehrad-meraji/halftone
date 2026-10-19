import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './accordion.js';

const meta: Meta = {
  title: 'Components/Accordion',
  component: 'ht-accordion',
  subcomponents: { HtAccordionItem: 'ht-accordion-item' },
  tags: ['autodocs'],
  argTypes: { multiple: { control: 'boolean' } },
  args: { multiple: false },
  render: (a) => html`
    <ht-accordion ?multiple=${a.multiple} style="width:420px">
      <ht-accordion-item open>
        <span slot="header">What is Halftone?</span>
        Web components built with Lit. Use the package, or copy one component into your project.
      </ht-accordion-item>
      <ht-accordion-item>
        <span slot="header">Does it need a framework?</span>
        No. Every component is a custom element, so it works in plain HTML and in any framework.
      </ht-accordion-item>
      <ht-accordion-item>
        <span slot="header">How do I change the colours?</span>
        Override the <code>--ht-*</code> tokens. Components use no other colour source.
      </ht-accordion-item>
    </ht-accordion>`,
};
export default meta;

/** One item open at a time. Opening a second closes the first. */
export const Single: StoryObj = {};
/** Any number of items can stay open. */
export const Multiple: StoryObj = { args: { multiple: true } };

/** A disabled item cannot be toggled and is skipped by the arrow keys. */
export const Disabled: StoryObj = {
  render: () => html`
    <ht-accordion style="width:420px">
      <ht-accordion-item>
        <span slot="header">Profile</span>
        Name, avatar and email.
      </ht-accordion-item>
      <ht-accordion-item disabled>
        <span slot="header">Billing (owners only)</span>
        Hidden from you.
      </ht-accordion-item>
      <ht-accordion-item>
        <span slot="header">Notifications</span>
        Choose what reaches your inbox.
      </ht-accordion-item>
    </ht-accordion>`,
};

/** Panels hold any content. Use `level` so the headers fit the outline of the page. */
export const RichContent: StoryObj = {
  render: () => html`
    <h2 style="margin:0 0 12px;font:600 18px/24px var(--ht-font-display);color:var(--ht-text)">Frequently asked questions</h2>
    <ht-accordion style="width:420px">
      <ht-accordion-item level="3" open>
        <span slot="header">Can I try it first?</span>
        <p style="margin:0 0 8px">Yes. Install the package and open any story.</p>
        <a href="#docs" style="color:var(--ht-accent-text)">Read the guide</a>
      </ht-accordion-item>
      <ht-accordion-item level="3">
        <span slot="header">Is it free?</span>
        MIT licensed.
      </ht-accordion-item>
    </ht-accordion>`,
};
