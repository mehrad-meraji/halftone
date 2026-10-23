---
title: Activity Feed
category: Lists
summary: Full-page audit log with a type filter, search and time range, events grouped by day on a timeline, and a Load Older button.
---

## When to use

- A workspace or project audit log: who changed what, deploys, member changes, comments.
- Put it inside `app-shell-01` as the content of an Activity route. Link each event's target to its `detail-01` page.

## When not to use

- The history of one record. Use the Activity tab in `detail-01`.
- Raw machine logs with thousands of lines per minute. Use `ht-timeline density="dense"` or a log viewer, not this page.
- Notifications a person has to act on and mark as read. That is an inbox, not a feed.

## How to adapt

- Rename the event types in the `ht-toggle-group` to your own. Five at most, All first. Types beyond five go in an `ht-menu` with checkbox items.
- One `ht-timeline-group` per day, newest first: "Today", "Yesterday", then "Monday 20 October". Set `datetime` on every group and item. Keep `level="2"` on the groups; the page has an `h1` and no other `h2`.
- Title line: actor, verb, target, in that order ("Ada Lovelace moved CL-0131 Globex to Paused"). The target is a link to the record. Bold names and new values; keep verbs plain.
- Markers: an `ht-avatar size="sm"` when a person acted, an `ht-icon` when the system did (deploys, invites, imports).
- Tones: `success` for something that went live or got done, `danger` for failures, `accent` for a status change, neutral for everything else. Always say the outcome in the title too.
- `meta` holds at most two tags: the type and the new state, or the service name. `body` holds a quoted comment or a short diff; never both on one item.
- Times inside a day group are clock times (`14:02`). Use the viewer's time zone and say so in a tooltip or settings, not on every row.

## Wiring

- Type filter, search and range: reload from the top on `change` (toggle group, select) and on `input` with a short debounce (search). Keep all three in the URL.
- Load Older: fetch the next page with a cursor (the oldest `datetime` shown), append items to the last group or add new groups, and update "Showing N of M". Hide the button when there is nothing older. `ht-pagination` works too if people need to jump to a page; do not use both.
- New events while the page is open: do not insert them at the top under the reader. Show a "3 new events" button above the timeline and insert on click.
- Loading: keep the header and toolbar, and show three `ht-skeleton` rows in place of the timeline (`variant="circle" width="24"` plus `variant="text" lines="2"`).
- Empty, nothing ever happened: replace the timeline and Load Older with an `ht-empty-state` ("No activity yet", "Changes in this workspace show up here as they happen."). No button.
- Empty, filters match nothing: keep the toolbar and show an `ht-empty-state` ("No events match", a Clear Filters button that resets the type, search and range).

## Do not

- Do not mark outcomes with colour alone. "Failed" is in the title and the tag, not only in the red marker.
- Do not let people edit or delete events here. An audit log is read-only.
- Do not group by anything but time on this page.
- Do not show relative times ("3h ago") inside a day group; the group heading already says the day.
