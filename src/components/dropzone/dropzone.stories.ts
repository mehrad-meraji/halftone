import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './dropzone.js';
import type { DropzoneRejectDetail, HtDropzone } from './dropzone.js';

/** A file of `size` bytes, for stories. */
const fake = (name: string, size: number, type = '') => new File([new Uint8Array(size)], name, { type, lastModified: 1 });
const MB = 1024 * 1024;

const log = (e: Event, text: string) => {
  const out = (e.currentTarget as HTMLElement).closest('.story')?.querySelector('pre');
  if (out) out.textContent = text;
};
const pre = (text: string) => html`<pre style="margin:0;font:400 12px/1.5 var(--ht-font-mono);color:var(--ht-text-muted);white-space:pre-wrap">${text}</pre>`;

const meta: Meta = {
  title: 'Components/Dropzone',
  component: 'ht-dropzone',
  tags: ['autodocs'],
  args: {
    label: 'Attachments',
    helper: 'Any file up to 10 MB',
    error: '',
    accept: '',
    multiple: false,
    compact: false,
    disabled: false,
    required: false,
  },
  render: (a) => html`
    <ht-dropzone
      style="width:420px"
      label=${a.label} helper=${a.helper} error=${a.error} accept=${a.accept}
      max-size=${10 * MB}
      ?multiple=${a.multiple} ?compact=${a.compact} ?disabled=${a.disabled} ?required=${a.required}
    ></ht-dropzone>`,
};
export default meta;

export const Default: StoryObj = {};

/** New picks and drops are added to the list; duplicates are skipped. */
export const Multiple: StoryObj = { args: { label: 'Photos', helper: 'Images up to 10 MB', accept: 'image/*', multiple: true } };

/**
 * `accept` and `max-size` turn files away with a sentence-case reason and an `ht-reject` event.
 * The buttons add files as a drop would, through `addFiles`.
 */
export const AcceptAndSizeLimit: StoryObj = {
  render: () => html`
    <div class="story" style="display:grid;gap:12px;width:420px">
      <ht-dropzone
        label="Contacts File" helper="CSV up to 1 MB" accept=".csv,text/csv" max-size=${MB}
        @ht-reject=${(e: CustomEvent<DropzoneRejectDetail>) => log(e, `ht-reject: ${e.detail.reason}\n${e.detail.message}`)}
      ></ht-dropzone>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <ht-button size="sm" variant="default" @click=${(e: Event) => pick(e).addFiles([fake('contacts.csv', 48_000, 'text/csv')])}>Add contacts.csv</ht-button>
        <ht-button size="sm" variant="default" @click=${(e: Event) => pick(e).addFiles([fake('export.csv', 2.4 * MB, 'text/csv')])}>Add a 2.4 MB CSV</ht-button>
        <ht-button size="sm" variant="default" @click=${(e: Event) => pick(e).addFiles([fake('report.pdf', 90_000, 'application/pdf')])}>Add a PDF</ht-button>
      </div>
      ${pre('add a file to see ht-reject')}
    </div>`,
  // Starts with one accepted and one turned-away file, so the rejected state shows on load.
  play: async ({ canvasElement }) => {
    const zone = canvasElement.querySelector('ht-dropzone')!;
    await zone.updateComplete;
    zone.addFiles([fake('contacts.csv', 48_000, 'text/csv'), fake('report.pdf', 90_000, 'application/pdf')]);
  },
};
const pick = (e: Event) => (e.currentTarget as HTMLElement).closest('.story')!.querySelector('ht-dropzone')!;

/** One row with a paperclip, for comment composers and tight forms. */
export const Compact: StoryObj = {
  render: () => html`
    <ht-dropzone style="width:480px" compact multiple aria-label="Attach files" helper="Up to 50 MB each" max-size=${50 * MB}></ht-dropzone>`,
};

const listed = [fake('q3-board-deck.pdf', 4.2 * MB, 'application/pdf'), fake('contacts-export.csv', 182_400, 'text/csv'), fake('logo-final-final-v7-approved.png', 640_000, 'image/png')];

/**
 * The built-in list: name, size, a remove button named "Remove <file>". Upload progress comes from
 * the consumer: a `Map` of `File` to 0–100 on `progress` draws a bar per row.
 */
export const WithFileList: StoryObj = {
  render: () => html`
    <ht-dropzone
      style="width:420px" label="Attachments" helper="Up to 10 files, 10 MB each" multiple max-files="10" max-size=${10 * MB}
      .files=${listed}
      .progress=${new Map([[listed[0], 100], [listed[1], 42]])}
    ></ht-dropzone>`,
};

export const Disabled: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:24px;width:420px">
      <ht-dropzone label="Attachments" helper="Any file up to 10 MB" disabled .files=${[listed[1]]}></ht-dropzone>
      <ht-dropzone compact disabled aria-label="Attach files"></ht-dropzone>
    </div>`,
};

/** Proves form participation: submit lists the FormData entries (one per file), reset clears the list, required blocks submit. */
export const InForm: StoryObj = {
  render: () => html`
    <form
      class="story"
      enctype="multipart/form-data"
      style="display:grid;gap:16px;width:420px"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const lines = [...new FormData(form).entries()].map(([k, v]) =>
          v instanceof File ? `${k}: ${v.name} (${v.size} bytes)` : `${k}: ${v}`);
        form.querySelector('pre')!.textContent = lines.join('\n') || '(empty)';
      }}
      @reset=${(e: Event) => ((e.target as HTMLFormElement).querySelector('pre')!.textContent = 'submit to see FormData')}
    >
      <ht-dropzone name="receipts" label="Receipts" helper="PDF or image, up to 5 MB each" accept=".pdf,image/*" max-size=${5 * MB} multiple required></ht-dropzone>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Submit Expense</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      ${pre('submit to see FormData')}
    </form>`,
};

/** Drops anywhere on the page are taken, with a full-window overlay. Drag a file over the canvas. */
export const Page: StoryObj = {
  render: () => html`
    <ht-dropzone style="width:420px" page multiple label="Library" helper="Drop images anywhere on the page" accept="image/*"></ht-dropzone>`,
};

/** Simulates an upload: each new file counts up to 100 in `progress`. */
function fakeUpload(e: Event) {
  const zone = e.currentTarget as HtDropzone;
  const next = (e.target as HTMLElement).closest('.story')!.querySelector<HTMLElement>('ht-button[data-next]')!;
  for (const file of zone.files) {
    if (zone.progress.has(file)) continue;
    zone.progress = new Map(zone.progress).set(file, 0);
    const tick = setInterval(() => {
      if (!zone.files.includes(file)) return clearInterval(tick);
      const p = Math.min(100, (zone.progress.get(file) ?? 0) + 7 + Math.random() * 12);
      zone.progress = new Map(zone.progress).set(file, p);
      if (p >= 100) clearInterval(tick);
    }, 180);
  }
  next.toggleAttribute('disabled', !zone.files.length);
}

/** The upload step of a contacts import: one CSV or Excel file, uploaded as soon as it is chosen. */
export const ImportStep: StoryObj = {
  render: () => html`
    <section class="story" style="display:grid;gap:20px;width:520px;padding:24px;background:var(--ht-surface);border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg)">
      <header style="display:grid;gap:6px">
        <span style="font:500 11px/1 var(--ht-font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ht-text-muted)">Step 1 of 3</span>
        <h2 style="margin:0;font:600 1.25rem/1.2 var(--ht-font-display);color:var(--ht-text)">Upload Contacts</h2>
        <p style="margin:0;font:400 .875rem/1.5 var(--ht-font-ui);color:var(--ht-text-muted)">The header row can be anywhere in the sheet. You map the columns next.</p>
      </header>
      <ht-dropzone
        name="file" label="Contacts File" required
        accept=".csv,.xlsx,.xls" max-size=${10 * MB}
        helper="CSV or Excel, up to 10 MB"
        @change=${fakeUpload}
      ></ht-dropzone>
      <footer style="display:flex;justify-content:flex-end;gap:8px">
        <ht-button variant="quiet">Cancel</ht-button>
        <ht-button data-next disabled>Map Columns</ht-button>
      </footer>
    </section>`,
};
