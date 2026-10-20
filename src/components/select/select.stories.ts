import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../dialog/dialog.js';
import '../icon/icon.js';
import '../separator/separator.js';
import './select.js';

const meta: Meta = {
  title: 'Components/Select',
  component: 'ht-select',
  tags: ['autodocs'],
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { label: 'Theme', helper: '', error: '', placeholder: '', size: 'md', disabled: false, required: false },
  render: (a) => html`
    <ht-select
      style="width:320px"
      label=${a.label} helper=${a.helper} error=${a.error} placeholder=${a.placeholder}
      size=${a.size} ?disabled=${a.disabled} ?required=${a.required}
    >
      <ht-option value="system">Default to system</ht-option>
      <ht-option value="light">Light</ht-option>
      <ht-option value="dark">Dark</ht-option>
    </ht-select>`,
};
export default meta;

export const Default: StoryObj = {};
export const WithPlaceholder: StoryObj = { args: { placeholder: 'Choose a theme', label: 'Theme' } };
export const WithHelper: StoryObj = { args: { helper: 'Applies to every device you sign in on.' } };
export const WithError: StoryObj = { args: { error: 'Pick one. Any one.', placeholder: 'Choose a theme' } };
export const Disabled: StoryObj = { args: { disabled: true } };

/** Submit shows FormData; reset restores the initial option; required blocks an empty choice. */
export const InForm: StoryObj = {
  render: () => html`
    <form
      style="display:grid;gap:16px;width:320px"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const f = e.target as HTMLFormElement;
        f.querySelector('pre')!.textContent = JSON.stringify(Object.fromEntries(new FormData(f)), null, 2);
      }}
    >
      <ht-select name="region" label="Region" required placeholder="Choose a region">
        <ht-option value="us">United States</ht-option>
        <ht-option value="eu">European Union</ht-option>
      </ht-select>
      <ht-select name="order" label="Stack Trace Order" value="newest">
        <ht-option value="newest">Most recent call first</ht-option>
        <ht-option value="oldest">Most recent call last</ht-option>
      </ht-select>
      <div style="display:flex;gap:8px">
        <ht-button type="submit">Save</ht-button>
        <ht-button type="reset" variant="default">Reset</ht-button>
      </div>
      <pre style="margin:0;font:400 12px var(--ht-font-mono);color:var(--ht-text-muted)">submit to see FormData</pre>
    </form>`,
};

/** Groups with labels, and a separator between them. */
export const WithGroups: StoryObj = {
  render: () => html`
    <ht-select style="width:320px" label="Timezone" placeholder="Choose a timezone">
      <ht-option-group label="Americas">
        <ht-option value="America/Toronto">Toronto</ht-option>
        <ht-option value="America/New_York">New York</ht-option>
        <ht-option value="America/Sao_Paulo" disabled>São Paulo (soon)</ht-option>
      </ht-option-group>
      <ht-separator></ht-separator>
      <ht-option-group label="Europe">
        <ht-option value="Europe/London">London</ht-option>
        <ht-option value="Europe/Berlin">Berlin</ht-option>
      </ht-option-group>
    </ht-select>`,
};

/** Options hold any content. Set `label` so the trigger shows a short name instead of both lines. */
export const RichOptions: StoryObj = {
  render: () => html`
    <ht-select style="width:360px" label="Role" value="contributor">
      <ht-option value="viewer" label="Viewer">
        <ht-icon slot="prefix" name="list"></ht-icon>
        <div><strong>Viewer</strong><div style="font-size:12px;color:var(--ht-text-muted)">Can view project and tickets</div></div>
      </ht-option>
      <ht-option value="contributor" label="Contributor">
        <ht-icon slot="prefix" name="copy"></ht-icon>
        <div><strong>Contributor</strong><div style="font-size:12px;color:var(--ht-text-muted)">Can view and edit project content</div></div>
      </ht-option>
      <ht-option value="manager" label="Manager">
        <ht-icon slot="prefix" name="chat-circle"></ht-icon>
        <div><strong>Manager</strong><div style="font-size:12px;color:var(--ht-text-muted)">Full access including member management</div></div>
      </ht-option>
    </ht-select>`,
};

/** More options than fit: the list scrolls and arrows appear at its ends. Type a letter to jump. */
export const ManyOptions: StoryObj = {
  render: () => html`
    <ht-select style="width:320px" label="Country" placeholder="Choose a country">
      ${[
        'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'Denmark', 'Egypt', 'Finland', 'France',
        'Germany', 'Greece', 'Iceland', 'India', 'Ireland', 'Italy', 'Japan', 'Kenya', 'Mexico', 'Netherlands', 'Norway',
        'Peru', 'Poland', 'Portugal', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine',
      ].map((c) => html`<ht-option>${c}</ht-option>`)}
    </ht-select>`,
};

/** The list is in the top layer, so it opens above a modal dialog. */
export const InsideDialog: StoryObj = {
  parameters: { layout: 'centered' },
  render: () => html`
    <ht-button variant="primary" @click=${(e: Event) => ((e.target as HTMLElement).nextElementSibling as any).show()}>Open dialog</ht-button>
    <ht-dialog heading="Add Member">
      <ht-select label="Role" placeholder="Choose a role">
        <ht-option value="viewer">Viewer</ht-option>
        <ht-option value="contributor">Contributor</ht-option>
        <ht-option value="manager">Manager</ht-option>
      </ht-select>
      <ht-button slot="footer" variant="primary" @click=${(e: Event) => (e.target as any).closest('ht-dialog').close()}>Add</ht-button>
    </ht-dialog>`,
};

/** A select near the bottom of the window opens upward. */
export const FlipsAtEdge: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => html`
    <div style="position:fixed;left:16px;right:16px;bottom:16px">
      <ht-select label="Theme" placeholder="Choose a theme" style="width:280px">
        <ht-option value="system">Default to system</ht-option>
        <ht-option value="light">Light</ht-option>
        <ht-option value="dark">Dark</ht-option>
      </ht-select>
    </div>`,
};

export const Glass: StoryObj = {
  render: () => html`
    <div style="padding:48px;background:linear-gradient(135deg,#e838e8,#4f46e5)">
      <ht-select glass label="Theme" style="width:280px" value="dark">
        <ht-option value="light">Light</ht-option>
        <ht-option value="dark">Dark</ht-option>
      </ht-select>
    </div>`,
};

/** Plain `<option>`, `<optgroup>` and `<hr>` still work, as text only. */
export const NativeOptions: StoryObj = {
  render: () => html`
    <ht-select style="width:320px" label="Theme" placeholder="Choose a theme">
      <optgroup label="Built in">
        <option value="system">Default to system</option>
        <option value="light">Light</option>
      </optgroup>
      <hr />
      <option value="dark">Dark</option>
    </ht-select>`,
};
