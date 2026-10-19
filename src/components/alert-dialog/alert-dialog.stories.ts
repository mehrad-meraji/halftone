import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './alert-dialog.js';

// The dialog is modal, so docs render each story in its own iframe.
const docs = { story: { inline: false, height: '380px' } };

const meta: Meta = {
  title: 'Components/Alert Dialog',
  component: 'ht-alert-dialog',
  tags: ['autodocs'],
  parameters: { docs, layout: 'centered' },
};
export default meta;

const show = (e: Event) => ((e.target as HTMLElement).nextElementSibling as any).show();

export const Default: StoryObj = {
  render: () => html`
    <ht-button @click=${show}>Publish Draft</ht-button>
    <ht-alert-dialog
      heading="Publish this draft?"
      description="It goes live to everyone straight away. You can unpublish it, but the emails will already have gone out."
      confirm-label="Publish"
    ></ht-alert-dialog>`,
};

export const Danger: StoryObj = {
  render: () => html`
    <ht-button variant="danger" @click=${show}>Delete Project</ht-button>
    <ht-alert-dialog
      tone="danger"
      eyebrow="Danger Zone"
      heading="Delete sentinel?"
      description="This removes 4,212 issues and every monitor. There is no undo, and no one is coming to help."
      confirm-label="Delete It"
      cancel-label="Keep It"
    ></ht-alert-dialog>`,
};

/** Default `confirm` and `cancel` close the dialog. Cancelling `confirm` keeps it open while something async runs. */
export const KeepsOpenWhileWorking: StoryObj = {
  render: () => html`
    <ht-button @click=${show}>Run Migration</ht-button>
    <ht-alert-dialog
      heading="Run the migration?"
      description="Choose Confirm and watch the button do nothing for two seconds, then close."
      confirm-label="Run It"
      @confirm=${(e: Event) => {
        e.preventDefault();
        const el = e.currentTarget as any;
        setTimeout(() => el.close(), 2000);
      }}
    ></ht-alert-dialog>`,
};

export const WithRichBody: StoryObj = {
  render: () => html`
    <ht-button @click=${show}>Remove Members</ht-button>
    <ht-alert-dialog tone="danger" confirm-label="Remove">
      <span slot="title">Remove 3 members?</span>
      <ul style="margin:0;padding-left:1.25rem">
        <li>ada@example.com</li>
        <li>grace@example.com</li>
        <li>a-very-long-address-that-someone-typed-once-and-never-fixed@example.com</li>
      </ul>
    </ht-alert-dialog>`,
};

export const OpenByDefault: StoryObj = {
  render: () => html`<ht-alert-dialog open heading="Heads up" description="Initial focus is on Cancel." confirm-label="Got It"></ht-alert-dialog>`,
};

/** Slot rich content into the actions and disable them while work runs. The consumer keeps the dialog open with `preventDefault()` on `confirm`. */
export const BusyAndDisabled: StoryObj = {
  render: () => html`
    <ht-button @click=${show}>Delete Comment</ht-button>
    <ht-alert-dialog
      tone="danger"
      heading="Delete comment?"
      description="This action cannot be undone. The comment will be permanently deleted."
      @confirm=${(e: Event) => {
        e.preventDefault();
        const el = e.currentTarget as any;
        el.confirmDisabled = true;
        el.cancelDisabled = true;
        el.querySelector('[slot=confirm]').textContent = 'Deleting…';
        setTimeout(() => {
          el.confirmDisabled = false;
          el.cancelDisabled = false;
          el.querySelector('[slot=confirm]').textContent = 'Delete';
          el.close();
        }, 1500);
      }}
    >
      <span slot="confirm">Delete</span>
    </ht-alert-dialog>`,
};

export const ConfirmDisabledUntilChoice: StoryObj = {
  render: () => html`
    <ht-button @click=${show}>Delete Status</ht-button>
    <ht-alert-dialog tone="danger" heading="Delete status?" confirm-label="Delete Status" confirm-disabled>
      <label style="display:flex;gap:8px;align-items:center;margin-top:8px">
        <input type="checkbox" @change=${(e: Event) => {
          ((e.target as HTMLElement).closest('ht-alert-dialog') as any).confirmDisabled = !(e.target as HTMLInputElement).checked;
        }} />
        Move its tickets to another status
      </label>
    </ht-alert-dialog>`,
};
