import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import '../input/input.js';
import './steps.js';
import type { HtSteps } from './steps.js';

const meta: Meta = {
  title: 'Components/Steps',
  component: 'ht-steps',
  subcomponents: { HtStep: 'ht-step' },
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: 3 } },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    clickable: { control: 'boolean' },
    nonlinear: { control: 'boolean' },
  },
  args: { current: 1, orientation: 'horizontal', clickable: false, nonlinear: false },
  render: (a) => html`
    <ht-steps
      label="Project setup"
      current=${a.current}
      orientation=${a.orientation}
      ?clickable=${a.clickable}
      ?nonlinear=${a.nonlinear}
      style="max-width:720px"
    >
      <ht-step value="repo" label="Repository"></ht-step>
      <ht-step value="env" label="Environment"></ht-step>
      <ht-step value="checks" label="Checks"></ht-step>
      <ht-step value="review" label="Review"></ht-step>
    </ht-steps>`,
};
export default meta;

export const Horizontal: StoryObj = {};

export const Vertical: StoryObj = { args: { orientation: 'vertical' } };

/** Without `current` the steps are a plain numbered list. */
export const NoCurrentStep: StoryObj = {
  render: () => html`
    <ht-steps label="Steps" style="max-width:720px">
      <ht-step label="Install"></ht-step>
      <ht-step label="Configure"></ht-step>
      <ht-step label="Deploy"></ht-step>
    </ht-steps>`,
};

/** Every state, set with `state` on each step. */
export const States: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:32px;max-width:720px">
      <ht-steps label="States">
        <ht-step state="done" label="Done"></ht-step>
        <ht-step state="error" label="Error" description="Token rejected"></ht-step>
        <ht-step state="current" label="Current"></ht-step>
        <ht-step state="upcoming" label="Upcoming"></ht-step>
        <ht-step state="upcoming" label="Disabled" disabled></ht-step>
      </ht-steps>
      <ht-steps label="States" orientation="vertical">
        <ht-step state="done" label="Done"></ht-step>
        <ht-step state="error" label="Error" description="Token rejected"></ht-step>
        <ht-step state="current" label="Current"></ht-step>
        <ht-step state="upcoming" label="Upcoming"></ht-step>
        <ht-step state="upcoming" label="Disabled" disabled></ht-step>
      </ht-steps>
    </div>`,
};

/** `description` adds a short line under the label, `optional` an "Optional" note. */
export const DescriptionAndOptional: StoryObj = {
  render: () => html`
    <ht-steps label="Import contacts" current="1" style="max-width:720px">
      <ht-step label="Upload" description="CSV or XLSX"></ht-step>
      <ht-step label="Map Columns" description="Match fields"></ht-step>
      <ht-step label="Sheets" optional></ht-step>
      <ht-step label="Review" description="Check before import"></ht-step>
    </ht-steps>`,
};

/** A step with `hidden` is skipped and does not take a number, for steps a flow leaves out. */
export const SkippedStep: StoryObj = {
  render: () => html`
    <ht-steps label="Import contacts" current="2" style="max-width:720px">
      <ht-step label="Upload"></ht-step>
      <ht-step label="Sheets" hidden></ht-step>
      <ht-step label="Map Columns"></ht-step>
      <ht-step label="Review"></ht-step>
    </ht-steps>`,
};

/** `clickable`: done steps are buttons. Click one to go back; later steps stay inert. */
export const Clickable: StoryObj = { args: { current: 2, clickable: true } };

/** `clickable nonlinear`: every step but the current one is a button. */
export const ClickableNonlinear: StoryObj = { args: { current: 0, clickable: true, nonlinear: true } };

/** A disabled done step stays focusable but says it is unavailable and does nothing. */
export const ClickableWithDisabled: StoryObj = {
  render: () => html`
    <ht-steps label="Project setup" current="3" clickable style="max-width:720px">
      <ht-step label="Repository" disabled></ht-step>
      <ht-step label="Environment"></ht-step>
      <ht-step label="Checks"></ht-step>
      <ht-step label="Review"></ht-step>
    </ht-steps>`,
};

/** Too narrow for every label: only the current one stays visible, and the rest are still read out. */
export const Narrow: StoryObj = {
  render: () => html`
    <div style="width:300px;border:1px dashed var(--ht-border);padding:8px">
      <ht-steps label="Project setup" current="2">
        <ht-step label="Repository"></ht-step>
        <ht-step label="Environment"></ht-step>
        <ht-step label="Checks"></ht-step>
        <ht-step label="Alerts"></ht-step>
        <ht-step label="Review"></ht-step>
      </ht-steps>
    </div>`,
};

const WIZARD = [
  { value: 'repo', label: 'Repository', field: 'Repository URL', placeholder: 'github.com/acme/api' },
  { value: 'env', label: 'Environment', field: 'Environment name', placeholder: 'production' },
  { value: 'checks', label: 'Checks', field: 'Health check URL', placeholder: 'https://api.acme.dev/up' },
  { value: 'review', label: 'Review', field: '', placeholder: '' },
];

/** A wizard header: Back and Next drive `current`, and done steps take you back. */
export const InWizard: StoryObj = {
  render: () => {
    let i = 0;
    const go = (e: Event, next: number) => {
      const root = (e.target as Element).closest('.wizard')!;
      i = Math.max(0, Math.min(WIZARD.length - 1, next));
      (root.querySelector('ht-steps') as HtSteps).current = WIZARD[i].value;
      show(root);
    };
    const show = (root: Element) => {
      root.querySelectorAll<HTMLElement>('[data-panel]').forEach((p, n) => (p.hidden = n !== i));
      (root.querySelector('[data-back]') as HTMLElement & { disabled: boolean }).disabled = i === 0;
      root.querySelector('[data-next]')!.textContent = i === WIZARD.length - 1 ? 'Create Project' : 'Next';
    };
    const onSelect = (e: CustomEvent<{ index: number }>) => {
      i = e.detail.index;
      show((e.target as Element).closest('.wizard')!);
    };
    return html`
      <section
        class="wizard"
        style="max-width:640px;display:grid;gap:24px;padding:24px;background:var(--ht-surface);border:1px solid var(--ht-border);border-radius:var(--ht-radius-lg)"
      >
        <ht-steps label="New project" current="repo" clickable @ht-step-select=${onSelect}>
          ${WIZARD.map((s) => html`<ht-step value=${s.value} label=${s.label}></ht-step>`)}
        </ht-steps>
        ${WIZARD.map(
          (s, n) => html`<div data-panel ?hidden=${n !== 0} style="min-height:72px">
            ${s.field
              ? html`<ht-input label=${s.field} placeholder=${s.placeholder}></ht-input>`
              : html`<p style="margin:0;color:var(--ht-text-muted)">Three steps done. Nothing is created until you say so.</p>`}
          </div>`,
        )}
        <div style="display:flex;justify-content:space-between">
          <ht-button data-back disabled @click=${(e: Event) => go(e, i - 1)}>Back</ht-button>
          <ht-button data-next variant="primary" @click=${(e: Event) => go(e, i + 1)}>Next</ht-button>
        </div>
      </section>`;
  },
};

const pre = 'margin:8px 0 0;padding:10px 12px;overflow-x:auto;font:0.8125rem/1.5 var(--ht-font-mono);color:var(--ht-text);background:var(--ht-surface-sunken);border:1px solid var(--ht-border);border-radius:var(--ht-radius-md)';

/** A setup guide: vertical steps with text, code and an action in each. */
export const InSetupGuide: StoryObj = {
  render: () => html`
    <ht-steps label="Health check setup" orientation="vertical" style="max-width:560px">
      <ht-step label="Install the SDK">
        <p style="margin:0">Add the package to the app you want to watch.</p>
        <pre style=${pre}><code>composer require acme/health</code></pre>
      </ht-step>
      <ht-step label="Add the ping URL" description="One line in your env file">
        <p style="margin:0">The URL is secret. Treat it like a password.</p>
        <pre style=${pre}><code>HEALTH_PING_URL=https://ping.example.dev/abc123</code></pre>
      </ht-step>
      <ht-step label="Schedule the ping">
        <p style="margin:0">Run it every minute. Miss three and the monitor goes red.</p>
        <pre style=${pre}><code>Schedule::command('health:ping')->everyMinute();</code></pre>
      </ht-step>
      <ht-step label="Send a test ping" optional>
        <p style="margin:0 0 8px">Or wait a minute and see if it shows up on its own.</p>
        <ht-button size="sm">Send Test Ping</ht-button>
      </ht-step>
    </ht-steps>`,
};

/** The same guide part-way through: the first two steps are done. */
export const InSetupGuideWithProgress: StoryObj = {
  render: () => html`
    <ht-steps label="Health check setup" orientation="vertical" current="2" style="max-width:560px">
      <ht-step label="Install the SDK"></ht-step>
      <ht-step label="Add the ping URL"></ht-step>
      <ht-step label="Schedule the ping">
        <p style="margin:0">Run it every minute. Miss three and the monitor goes red.</p>
        <pre style=${pre}><code>Schedule::command('health:ping')->everyMinute();</code></pre>
      </ht-step>
      <ht-step label="Send a test ping" optional></ht-step>
    </ht-steps>`,
};
