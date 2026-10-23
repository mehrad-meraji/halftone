---
title: Multi-Step Flow
category: Onboarding
summary: Wizard with horizontal steps and one card per step, shown on the Map Columns step of a spreadsheet import with a target field per column.
---

## When to use

- A task with three to five ordered steps where later steps depend on earlier answers: importing a file, provisioning a service, setting up a project.
- Flows that save nothing until the end, so people can go back and change an answer.

## When not to use

- A checklist people finish in any order over days. Use `ht-steps orientation="vertical"` as a setup guide.
- Two steps. Use one form, or a form and a confirmation `ht-dialog`.
- Settings someone returns to. Use `settings-01`.

## How to adapt

- Three to five `ht-step`s, each with a `value` and a Title Case `label`. `description` is optional; on done steps use it for the answer ("contacts-2024.csv").
- One `<form>` with one `ht-card` per step, and only the current step's card on the page. The card's `h2` (in the `header` slot) repeats the step label.
- Footer order: Cancel (quiet) on the left, "Step N of M", Back (default), then the one primary button. Label it Continue on every step except the last real one, which names the action ("Import 1,284 Contacts"). The first step has no Back.
- Steps in this import, one card each:
  - Upload: `ht-dropzone name="file" accept=".csv,.xlsx" max-size="10485760" required label="Contacts File" helper="CSV or XLSX up to 10 MB. The first row must be column names."`. Continue reads the header row.
  - Map Columns (shown): an `ht-table density="dense"` with the file's column, one sample value and an `ht-select size="sm"` per row with `aria-label="Import <column> as"`. Mark guesses with an accent "AI Suggested" `ht-tag`. Columns that match no field default to "Skip this column".
  - Review: totals in `ht-description-list layout="columns"` (Rows, New, Updates, Skipped), then `ht-alert tone="warning"` naming the flagged rows ("12 rows have no email and will be skipped") with a link to download them.
  - Done: a card with a `success` `ht-alert` ("1,284 contacts imported"), View Contacts as the primary button and Undo Import as a default button, for as long as undo is possible.
- Hide the Sample column below 640px (`.wz-sample`). The column name and the select are what matter.
- In place of a table, use an `ht-description-list` or plain fields for steps that are not row-shaped (a deploy's region and size, a project's name).

## Wiring

- Keep every step's data in one object for the whole flow. Back changes the step and keeps what was entered, and so does clicking a done step.
- Set `ht-steps` `current` to the step's `value` on every move. Steps before it render done. Add `clickable` so done steps fire `ht-step-select`; go there on that event. Never let people jump ahead.
- Validate the current step on Continue, not on every keystroke. On failure, stay on the step, set `error="…"` on each bad field and focus the first. Keep Continue enabled: a disabled button does not say what is wrong.
- Map Columns fails when two columns target the same field, or when a required field (Name or Email) has no column. Put the error on the duplicate selects, and an `ht-alert tone="danger"` above the table for a missing field.
- If a step fails on the server (a bad file), set the step `state="error"` with a `description` saying why, and show the error in the card.
- Cancel asks for confirmation with `ht-alert-dialog` once anything is entered, then leaves without saving.
- After the import finishes the flow cannot go back: remove Back and Cancel on Done.

## Do not

- Do not put more than one primary button in the footer.
- Do not disable Continue to signal invalid input. Show the errors.
- Do not save partial data between steps unless the flow says so ("Draft saved").
- Do not show every step's card at once. That is a long form, not a wizard.
