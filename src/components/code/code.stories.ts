import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../card/card.js';
import './code.js';

const payload = JSON.stringify(
  { event: 'deploy.finished', project: 'api', version: 'v0.4.2', duration_ms: 38120, ok: true },
  null,
  2,
);

const log = Array.from({ length: 40 }, (_, i) => {
  const s = String(i).padStart(2, '0');
  return `2026-10-23T09:14:${s}Z INFO  worker.3 job=send-digest id=${4810 + i} took=${12 + ((i * 7) % 30)}ms`;
}).join('\n');

const meta: Meta = {
  title: 'Components/Code',
  component: 'ht-code',
  tags: ['autodocs'],
  argTypes: {
    noHighlight: { control: 'boolean' },
    wrap: { control: 'boolean' },
    lineNumbers: { control: 'boolean' },
    noCopy: { control: 'boolean' },
    secret: { control: 'boolean' },
    maxLines: { control: 'number' },
  },
  args: { label: 'Terminal', language: 'bash', wrap: false, lineNumbers: false, noCopy: false, noHighlight: false, secret: false, maxLines: 0 },
  render: (a) => html`
    <ht-code
      style="max-width:520px"
      label=${a.label}
      language=${a.language}
      ?wrap=${a.wrap}
      ?line-numbers=${a.lineNumbers}
      ?no-copy=${a.noCopy}
      ?no-highlight=${a.noHighlight}
      ?secret=${a.secret}
      max-lines=${a.maxLines}
    >
      npm install @_mehrad/halftone
      npx @_mehrad/halftone add code
    </ht-code>`,
};
export default meta;

export const Default: StoryObj = {};

/** Long lines scroll sideways by default. The scroll area becomes focusable, so the keyboard can scroll it. */
export const LongLines: StoryObj = {
  render: () => html`
    <ht-code style="max-width:420px" label=".env" language="env">
      SENTINEL_URL=https://sentinel.soopercooler.com
      SENTINEL_DSN=https://pk_7f3a9c1e5b2d4f60a8e1c3b5d7f9a2c4@sentinel.soopercooler.com/api/12
    </ht-code>`,
};

export const Wrap: StoryObj = {
  render: () => html`
    <ht-code style="max-width:420px" label=".env" language="env" wrap>
      SENTINEL_URL=https://sentinel.soopercooler.com
      SENTINEL_DSN=https://pk_7f3a9c1e5b2d4f60a8e1c3b5d7f9a2c4@sentinel.soopercooler.com/api/12
    </ht-code>`,
};

/** The `code` property is shown exactly as given, which suits generated text like JSON. */
export const LineNumbers: StoryObj = {
  render: () => html`<ht-code style="max-width:520px" label="Payload" language="json" line-numbers .code=${payload}></ht-code>`,
};

export const MaxLines: StoryObj = {
  render: () => html`<ht-code style="max-width:640px" label="worker.log" language="log" max-lines="8" .code=${log}></ht-code>`,
};

export const NoCopy: StoryObj = {
  render: () => html`
    <ht-code style="max-width:520px" label="Output" no-copy>
      Deployed api v0.4.2 in 38s. 0 errors.
    </ht-code>`,
};

/** No label, no language and no copy button: the header goes away. */
export const Bare: StoryObj = {
  render: () => html`<ht-code style="max-width:520px" no-copy>curl -fsS https://sentinel.soopercooler.com/up</ht-code>`,
};

/** A token shown once. The display is masked until Reveal; Copy always copies the real value. */
export const Secret: StoryObj = {
  render: () => html`
    <ht-code style="max-width:520px" label="New Token · Shown Once" secret wrap>
      sk_env_9d2f71c4a0b84e6f93c1d5a7e2b06f48
    </ht-code>`,
};

export const SetupSteps: StoryObj = {
  render: () => html`
    <ht-card style="max-width:560px" eyebrow="Production" heading="Connect the server">
      <ol style="display:grid;gap:16px;margin:0;padding-left:1.25rem">
        <li>
          <p style="margin:0 0 8px">Install the agent.</p>
          <ht-code label="Terminal" language="bash">
            curl -fsSL https://sentinel.soopercooler.com/install.sh | sudo sh
          </ht-code>
        </li>
        <li>
          <p style="margin:0 0 8px">Save the key. It is shown once, so copy it now.</p>
          <ht-code label="/etc/sentinel.conf" secret>
            SENTINEL_URL=https://sentinel.soopercooler.com
            SENTINEL_KEY=srv_4c8e1a7f3b9d2e60
          </ht-code>
        </li>
        <li>
          <p style="margin:0 0 8px">Start it and check it reports in.</p>
          <ht-code label="Terminal" language="bash" @ht-copy=${(e: CustomEvent<{ text: string }>) => console.log('copied', e.detail.text)}>
            sudo systemctl enable --now sentinel-agent
            sentinel-agent status
          </ht-code>
        </li>
      </ol>
    </ht-card>`,
};

const samples: [string, string, string][] = [
  ['instrument.ts', 'ts', `import { init } from '@acme/sdk';

// Start before anything else imports.
const client = init({ token: process.env.ACME_TOKEN, sampleRate: 0.5, debug: false });
client.capture(\`deploy \${version}\`);`],
  ['payload.json', 'json', payload],
  ['Terminal', 'bash', `$ npm install @acme/sdk --save  # once
export ACME_ENV="production" && npx acme deploy --tag v0.4.2`],
  ['theme.css', 'css', `:root { --ht-accent: #7c3aed; }
.toolbar > a:hover { color: var(--ht-accent); padding: 4px 1.5rem; }
@media (min-width: 40em) { .toolbar { gap: 8px; } }`],
  ['card.html', 'html', `<!-- A card with a header -->
<ht-card heading="Usage" eyebrow="Billing">
  <p class="lede">12 of 20 seats &amp; 3 invites.</p>
</ht-card>`],
  ['.env', 'env', `# Keep out of git
ACME_TOKEN=acme_tok_7f3c9
export ACME_DEBUG="false"`],
  ['worker.log', 'log', `2026-10-23T09:14:02Z INFO  worker.3 job=send-digest id=4810 took=31ms
2026-10-23T09:14:03Z WARN  worker.3 retrying job=send-digest attempt=2
2026-10-23T09:14:05Z ERROR worker.3 job=send-digest error="smtp timeout" took=3000ms`],
  ['main.py', 'py', `import acme

@app.route("/hook")
def hook(event=None):
    return acme.capture(event, rate=0.5)  # sampled`],
];

/** Syntax colours for each language. Any other `language` shows plain text, and `no-highlight` turns colours off. */
export const Languages: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:16px;max-width:620px">
      ${samples.map(([label, language, code]) => html`<ht-code label=${label} language=${language} .code=${code}></ht-code>`)}
      <ht-code label="Plain" language="ts" no-highlight .code=${"const off = true; // no-highlight"}></ht-code>
    </div>
  `,
};

export const LanguagesWithLineNumbers: StoryObj = {
  render: () => html`<ht-code style="max-width:620px" label="instrument.ts" language="ts" line-numbers .code=${samples[0][2]}></ht-code>`,
};
