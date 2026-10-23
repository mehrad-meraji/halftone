---
title: Settings Page
category: Forms
summary: Settings page in sections, title and description on the left, fields on the right, each section with its own save, and a danger zone.
---

## When to use

- Account, project or workspace settings with two or more groups of fields.
- Put it inside `app-shell-01` as the content of a Settings route.

## When not to use

- One or two fields. Use a dialog or edit them in place.
- A first-run setup flow. That is a step-by-step form, not a settings page.

## How to adapt

- One `<form class="settings-section">` per group. Each section saves on its own, so one bad field never blocks another section.
- Left column: an `h2` in Title Case and one sentence in sentence case. Keep the sentence short.
- Pair two short fields in `.settings-pair`. Long fields (bio, address) take the full width.
- One primary button per section, at the end, labelled with what it saves ("Save Profile", not "Save").
- On/off settings use `ht-switch`. Here they wait for the section's Save. If a section should apply each switch at once, remove its Save button and save on `change`; never mix the two in one section.
- Show server errors on the field with `error="…"`.

## Danger zone

- Keep it last, with a `variant="danger"` button.
- The button must open an `ht-alert-dialog` that names what is lost. The block does not include the dialog; add it where you wire the click.

## Do not

- Do not use one Save button for the whole page.
- Do not put destructive actions in the normal sections.
- Do not disable Save until something changes. Let it submit and say "Nothing to save" if so.
