import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './textarea.js';

const long =
  'The importer ran for forty minutes, failed on row 18,204, and left the table half full. '.repeat(6).trim();

const meta: Meta = {
  title: 'Components/Textarea',
  component: 'ht-textarea',
  tags: ['autodocs'],
  argTypes: {
    rows: { control: 'number' },
    maxRows: { control: 'number' },
    maxLength: { control: 'number' },
  },
  args: {
    label: 'Description',
    placeholder: 'What happened?',
    helper: '',
    error: '',
    rows: 3,
    autosize: false,
    maxRows: 0,
    maxLength: 0,
    counter: false,
    disabled: false,
    readonly: false,
    required: false,
  },
  render: (a) => html`
    <ht-textarea
      style="width:360px"
      label=${a.label} placeholder=${a.placeholder} helper=${a.helper} error=${a.error}
      rows=${a.rows} max-rows=${a.maxRows} maxlength=${a.maxLength || ''}
      ?autosize=${a.autosize} ?counter=${a.counter} ?disabled=${a.disabled} ?readonly=${a.readonly} ?required=${a.required}
    ></ht-textarea>`,
};
export default meta;

export const Default: StoryObj = {};
export const WithHelper: StoryObj = { args: { helper: 'Plain text. Markdown is not rendered.' } };
export const WithError: StoryObj = { args: { error: 'Say something. Even one word.', placeholder: '' } };
export const Required: StoryObj = { args: { required: true } };
export const Disabled: StoryObj = {
  render: () => html`<ht-textarea style="width:360px" label="Description" value="Locked while the import runs." disabled></ht-textarea>`,
};
export const ReadOnly: StoryObj = {
  render: () => html`<ht-textarea style="width:360px" label="Stack trace" value=${long} readonly rows="4"></ht-textarea>`,
};

/** Grows with its content and stops at `max-rows`, then scrolls. */
export const Autosize: StoryObj = {
  args: { autosize: true, maxRows: 6, rows: 2, helper: 'Grows to six lines, then scrolls.' },
};

export const WithCounter: StoryObj = {
  render: () => html`
    <ht-textarea style="width:360px" label="Commit Message" maxlength="80" counter value="Fix the importer" helper="Keep the first line short."></ht-textarea>`,
};

export const LongContent: StoryObj = {
  render: () => html`<ht-textarea style="width:360px" label="Notes" value=${long} rows="4"></ht-textarea>`,
};

/** No visible label: the host `aria-label` is forwarded to the native textarea. */
export const NoVisibleLabel: StoryObj = {
  render: () => html`<ht-textarea style="width:360px" aria-label="Reply" placeholder="Write a reply"></ht-textarea>`,
};

/** Proves form participation: submit shows FormData, reset restores the default value, required blocks submit. */
export const InForm: StoryObj = {
  render: () => html`
    <form
      style="display:grid;gap:16px;width:360px"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const out = (e.target as HTMLFormElement).querySelector('pre')!;
        out.textContent = JSON.stringify(Object.fromEntries(new FormData(e.target as HTMLFormElement)), null, 2);
      }}
    >
      <ht-textarea name="summary" label="Summary" required helper="Required."></ht-textarea>
      <ht-textarea name="notes" label="Notes" value="Seen twice on Tuesday." autosize max-rows="5"></ht-textarea>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};
