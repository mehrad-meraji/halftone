import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../input/input.js';
import './dialog.js';

// The dialog is modal, so docs render each story in its own iframe.
const docs = { story: { inline: false, height: '380px' } };

const meta: Meta = {
  title: 'Components/Dialog',
  component: 'ht-dialog',
  tags: ['autodocs'],
  parameters: { docs, layout: 'centered' },
};
export default meta;

const toggle = (e: Event) => ((e.target as HTMLElement).nextElementSibling as any).show();

export const Confirm: StoryObj = {
  render: () => html`
    <ht-button @click=${toggle}>Delete Project</ht-button>
    <ht-dialog eyebrow="Danger Zone" heading="Delete sentinel?">
      This removes 4,212 issues and every monitor. There is no undo, and no one is coming to help.
      <ht-button slot="footer" variant="danger" @click=${(e: Event) => (e.target as any).closest('ht-dialog').close()}>Delete It</ht-button>
      <ht-button slot="footer" variant="default" @click=${(e: Event) => (e.target as any).closest('ht-dialog').close()}>Cancel</ht-button>
    </ht-dialog>`,
};

export const Form: StoryObj = {
  render: () => html`
    <ht-button @click=${toggle}>New Project</ht-button>
    <ht-dialog eyebrow="Create" heading="New project">
      <ht-input label="Name" placeholder="halftone" helper="You can rename it later."></ht-input>
      <ht-button slot="footer" @click=${(e: Event) => (e.target as any).closest('ht-dialog').close()}>Create</ht-button>
      <ht-button slot="footer" variant="default" @click=${(e: Event) => (e.target as any).closest('ht-dialog').close()}>Cancel</ht-button>
    </ht-dialog>`,
};

export const Persistent: StoryObj = {
  render: () => html`
    <ht-button @click=${toggle}>Run Migration</ht-button>
    <ht-dialog persistent eyebrow="Working" heading="Migrating">
      Escape and the backdrop are disabled until this finishes.
      <ht-button slot="footer" @click=${(e: Event) => (e.target as any).closest('ht-dialog').close()}>Done</ht-button>
    </ht-dialog>`,
};

export const OpenByDefault: StoryObj = {
  render: () => html`<ht-dialog open heading="Heads up">No footer, just a message and an X.</ht-dialog>`,
};
