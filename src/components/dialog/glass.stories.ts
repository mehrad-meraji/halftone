import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './dialog.js';
import '../alert-dialog/alert-dialog.js';
import '../sheet/sheet.js';
import '../popover/popover.js';
import '../menu/menu.js';
import '../command/command.js';
import '../button/button.js';

// Stories are not copied by `halftone add`, so this one may import across components.
// The modal ones are native dialogs: docs render this story in its own iframe.
const meta: Meta = {
  title: 'Patterns/Liquid Glass',
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, height: '560px' } } },
};
export default meta;

/** Glass only shows against something to blur, so the stage is a colourful backdrop. */
const stage = (inner: unknown) => html`
  <div style="min-height:100vh;padding:32px;box-sizing:border-box;background:
      radial-gradient(60% 50% at 15% 20%, oklch(0.75 0.2 20) 0%, transparent 70%),
      radial-gradient(55% 55% at 85% 15%, oklch(0.78 0.16 250) 0%, transparent 70%),
      radial-gradient(60% 60% at 70% 85%, oklch(0.8 0.2 150) 0%, transparent 70%),
      radial-gradient(50% 50% at 20% 90%, oklch(0.78 0.2 320) 0%, transparent 70%),
      oklch(0.85 0.05 270)">
    ${inner}
  </div>`;

const open = (e: Event) => ((e.currentTarget as HTMLElement).nextElementSibling as any).show();

export const Overlays: StoryObj = {
  render: () =>
    stage(html`
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">
        <ht-button @click=${open}>Dialog</ht-button>
        <ht-dialog glass eyebrow="New" heading="Create Ticket">
          Give it a title. You can change everything later.
          <ht-button slot="footer" variant="primary" flush>Create</ht-button>
          <ht-button slot="footer" flush>Cancel</ht-button>
        </ht-dialog>

        <ht-button @click=${open}>Alert dialog</ht-button>
        <ht-alert-dialog glass tone="danger" heading="Delete this project?" description="This removes every ticket. There is no undo." confirm-label="Delete" cancel-label="Keep It"></ht-alert-dialog>

        <ht-button @click=${open}>Sheet</ht-button>
        <ht-sheet glass heading="Filters" eyebrow="List">Narrow the list by status, owner and label.</ht-sheet>

        <ht-popover glass placement="bottom-start">
          <ht-button>Popover</ht-button>
          <div slot="content">Copy the branch name, or open the pull request.</div>
        </ht-popover>

        <ht-menu glass>
          <ht-button slot="trigger">Menu</ht-button>
          <ht-menu-label>Ticket</ht-menu-label>
          <ht-menu-item shortcut="E">Edit</ht-menu-item>
          <ht-menu-item shortcut="D">Duplicate</ht-menu-item>
          <ht-menu-separator></ht-menu-separator>
          <ht-menu-item danger>Delete</ht-menu-item>
        </ht-menu>
      </div>

      <div style="margin-top:32px;max-width:340px">
        <ht-command glass placeholder="Search">
          <ht-command-group heading="Go to">
            <ht-command-item value="projects">Projects</ht-command-item>
            <ht-command-item value="tickets">Tickets</ht-command-item>
            <ht-command-item value="docs">Documents</ht-command-item>
          </ht-command-group>
        </ht-command>
      </div>
    `),
};
