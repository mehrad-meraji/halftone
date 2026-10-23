---
title: Quick Start
category: Onboarding
summary: Install guide for an SDK, API or CLI with language tabs, numbered steps with code, a once-only token, a test action and a Verify card.
---

## When to use

- The first page after someone creates a project in a developer product: install an SDK, add a token, send a test event.
- Any "connect this" page with three to five ordered steps that each need a command or a snippet: a server agent, a deploy hook, a health check.
- Put it inside `app-shell-01` as the content of a project's Setup route.

## When not to use

- A form that collects answers step by step. That is a wizard: horizontal `ht-steps` over one form.
- A single command. Show one `ht-code` with a sentence, not a list of one step.
- Reference docs. Steps are for doing once, in order.

## How to adapt

- Three to five steps. Each step: a label in Title Case ("Install the SDK"), one sentence, then at most one `ht-code`. Split a step that needs two snippets.
- `ht-code` gets a `label` that names where the code goes (`Terminal`, `.env`, `instrument.js`) and a `language`. Long lines in env files get `wrap`.
- A token appears in exactly one step, with `secret`, followed by the warning `ht-alert` that says it is shown once. Keep the code label short (`.env`); long labels truncate on phones. Never print it in plain text elsewhere, and never put it in the agent prompt.
- The last step is the test: one `ht-button size="sm"` and a status line. Waiting is `ht-ping tone="warning"` plus text; received is `tone="success" still` plus "Event received 2s ago"; failed is `tone="danger" still` plus what went wrong.
- Tabs name the language or install method. Keep the `value`s short and stable (`node`, `python`), since they are stored. Every panel holds the full steps in your app; the block writes them out for Node only and gives the others one line and the install command, to stay short.
- Keep the `display: block` rule on `ht-tabs`. `fit` makes the tab bar hug its tabs but also makes the host inline-block, which would shrink the panels to their content.
- The Verify card says what success looks like in two to four checks a person can see, and links to the place the data lands. One button, `variant="default"`.
- With no side card, drop `.ss-grid` to one column and move the Verify card under the steps.

## Wiring

- Track progress with `current` on `ht-steps` (0-based index). Leave it unset until the person acts; move it as each check passes, e.g. set `current="3"` when the SDK reports in. Use `state="error"` and a `description` on a step whose check failed.
- Remember the tab: on `ht-tabs` `change`, store `tabs.value` (localStorage or the user's profile) and set it back on load. Default to the language you detect from the project, else the first tab.
- "Send Test Event": disable the button while the request runs, then update the status line. Poll or subscribe for the first event; stop after it arrives or after two minutes and say "Nothing yet. Check the token and try again."
- "Hand to an Agent" opens the closed `ht-dialog` at the end of the block: `button.addEventListener('click', () => dialog.show())`, and the dialog's Close button calls `dialog.close()`. The prompt's `ht-code` already has a Copy button. Build the prompt from the selected tab so it names the right package and file.

## Do not

- Do not show the token anywhere but the `secret` code block: not in the agent prompt, not in other steps, not in logs. Fetch it once and drop it when the person leaves the page.
- Do not mark steps done by default. A finished list on first load tells the person nothing.
- Do not add a second primary button. The test step's button is the only primary on the page.
- Do not remove the hidden `h2` above the tabs or the `h2` in the Verify card's header slot. They keep the heading order between the `h1` and the rest.
