---
title: Three-Pane Inbox
category: Communication
summary: Full-height inbox with a searchable, filtered thread list in groups, a reading pane with toolbar, messages and a Reply or Internal Note composer, and a collapsible rail about the sender.
---

## When to use

- Conversations someone works through one at a time: support desk, shared mailbox, direct messages, a notification centre with replies.
- Each thread has a person or account on the other side worth showing in the rail.
- Put it inside `app-shell-01` in place of `.shell-content`; it fills the height it is given.

## When not to use

- Notifications with no reply. Use `activity-feed-01`.
- Comments on one object. Use `comments-01` under the object.
- Fewer than about ten threads a week. A list page (`list-01`) that opens a detail page is simpler.

## How to adapt

- Three panes: list 360px, reader flexible, rail 280px. Below 1180px the rail hides; below 768px only the list shows and opening a thread navigates to the reader as its own page with a Back button in `.inbox-tools`.
- Exactly one row has `aria-current="true"`: the thread in the reader. Move it on selection; do not use a selected class alone.
- Unread rows get `.inbox-unread` (bold sender and subject) and an `ht-ping still tone="accent" label="Unread"`. Read rows keep the empty `.inbox-mark` so text lines up.
- Group headings name what to do, not dates, when you can: "Needs Action", then "Earlier". Two or three groups at most. Empty groups disappear.
- Filters are one `ht-toggle-group`. Put the count in the `count` attribute (`count="4"`), and only on Unread. Keep the count in step with the rows.
- The star is a sibling of the row link, never inside it. `pressed` swaps the icon to `weight="fill"`.
- Toolbar: Archive, Snooze, Mark Unread as quiet buttons with text, each in an `ht-tooltip` that shows its shortcut with `ht-kbd`. Everything else, including Move To Trash, goes in the ⋯ menu.
- Messages are oldest first, newest at the bottom next to the composer. Collapse older messages to one line (sender, time, first sentence) past five.
- The composer mode is one `ht-toggle-group`: Reply and Internal Note, over a single `ht-textarea`. Notes never reach the customer; in note mode the placeholder says "Only your team sees notes", the Send button reads "Add Note", and the textarea gets a `--ht-warning` tint mixed toward transparent so the two never look alike.
- The rail is about the other party: avatar, name, company, an `ht-description-list` of three to five facts, and recent threads with them. No actions that change the thread.
- Trash state: when the open thread is in Trash, put `<ht-banner tone="warning">` at the top of `.inbox-thread` with "This thread is in Trash. It is deleted for good after 30 days." and two actions in its `action` slot, Restore (`variant="default"`) and Delete Forever (`variant="danger"`, behind an `ht-alert-dialog`). Hide the composer.

## Wiring

- Selecting a row: load the thread into the reader, move `aria-current`, remove `.inbox-unread` and its ping, and lower the Unread count. Update the URL so the thread is linkable.
- Keyboard: J and K move between rows, E archives, H snoozes, U marks unread, R focuses the reply box. Ignore the shortcuts while a text field has focus.
- Archive and Snooze remove the row with an undo toast (`ht-toast` with an Undo action) and open the next thread, not the previous one.
- Snooze opens an `ht-menu` with Later Today, Tomorrow, Next Week and Pick a Date (an `ht-calendar` in an `ht-popover`).
- Search filters on `input` with a 200ms debounce and shows matches in one group, "Results".
- Composer: Cmd+Enter sends. On `change` of the mode `ht-toggle-group`, swap the textarea's `aria-label` ("Reply to Grace Hopper" / "Internal note"), placeholder and the Send label, and keep the draft text. Send the mode with the body. Attachments come from the `ht-dropzone` `files`.
- The rail button hides the rail: set `grid-template-columns: 360px minmax(0, 1fr)` on the block, hide `.inbox-rail`, and remember the choice in `localStorage`. Show a "Show details" button in `.inbox-tools-end` while hidden.
- On phones, the reader is a separate route. Add a quiet Back button (`caret-left`, `label="Back to inbox"`) as the first item in `.inbox-tools`.

## Do not

- Do not put buttons inside the row link. Star and other row actions sit beside it.
- Do not mark unread with colour alone. Keep the bold text and the labelled ping.
- Do not put Delete in the toolbar. Trash is in the menu; Delete Forever only exists in Trash.
- Do not let the page scroll. The list, the thread and the rail each scroll on their own.
