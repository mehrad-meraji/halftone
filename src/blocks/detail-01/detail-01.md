---
title: Record Detail
category: Detail
summary: Record page with a breadcrumb, a title and status, header actions, a key-facts strip, tabs with an activity timeline, and a properties rail with related records.
---

## When to use

- The page a row in `list-01` opens: one client, ticket, issue or contact.
- Put it inside `app-shell-01` as the content of the record route.

## When not to use

- Editing many fields at once. Use a form page like `settings-01`, or a dialog for two or three fields.
- A record with no history and three fields or fewer. A row expansion or a `ht-sheet` is enough.

## How to adapt

- The breadcrumb goes back to the list. The last item is the record name and has no `href`.
- The status `ht-tag size="md"` sits next to the `h1` and says the state in words. Repeat it in the rail only if it can be changed there.
- Header actions: one primary (the most common next step), at most one `default`, and everything else in the ⋯ menu. Delete is last in the menu, after a separator, with `danger`.
- Key facts strip: three to five facts that never need editing here (owner, created, last activity, ID). Put the exact timestamp in the `hint` slot as `<time datetime>`, and set `copy` on IDs.
- Properties rail: facts people change (status, priority, assignee, labels, due date), as `layout="inline"`. Empty values stay empty; the list draws a dash.
- Tabs: Activity first and selected. Put counts in the tab label ("Comments (3)"). Drop a tab rather than show one that is always empty.
- Activity: newest first, an avatar marker for people and an `ht-icon` marker for system events. Say the outcome in words; `tone` is colour only. For a full log across records, link to `activity-feed-01`.
- The related card lists at most five records, each a link with a status tag, and links to the full list with the quiet "View All" button. Add one card per related type.
- At 900px and below the rail moves under the main column. Keep the rail at 320px on wide screens.

## Wiring

- Tabs: `ht-tabs` switches panels by itself. Load Comments and Files on first `change` if they are expensive.
- Delete: on `ht-select` from the ⋯ menu with `value="delete"`, call `show()` on the `ht-alert-dialog`. On `confirm`, set `confirm-disabled` while the request runs, then go back to the list. The dialog names what is lost; update the counts from the record.
- Properties: make each value an inline control (an `ht-select` or `ht-menu`) when it is editable. Save on `change`, add an entry to the timeline, and show errors with an `ht-toast`.
- Log Activity opens a composer (`ht-dialog` with an `ht-textarea`). New entries go to the top of the timeline and bump the Activity count.
- Loading: keep the breadcrumb and title area, and show `ht-skeleton` lines in the facts strip, the summary and the rail.
- Not found or no access: replace everything under the breadcrumb with an `ht-empty-state tone="error"` and a button back to the list.

## Do not

- Do not put two primary buttons in the header.
- Do not delete without the alert dialog.
- Do not repeat a fact in both the strip and the rail.
- Do not remove the hidden "History" `h2`: the tabs need a heading between the `h1` and the timeline. The card in the rail renders an `h3`, so keep the "Related" `h2` above it.
