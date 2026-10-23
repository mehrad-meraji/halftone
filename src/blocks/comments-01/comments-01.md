---
title: Comment Thread
category: Communication
summary: Comment thread with a sort select, comments with reactions, Reply, Resolve and a more menu, one level of nested replies, and a composer with attachments.
---

## When to use

- Discussion under one object: a ticket, a pull request, a document, a support case.
- Put it under the main content of `detail-01`, or in a tab of it. It starts at `h2`, so the page above it owns the `h1`.

## When not to use

- Live chat with many short messages. Comments here are threaded and slow; a chat needs a message list pinned to the bottom.
- A log of system events (status changed, assigned). Use `activity-feed-01` or `ht-timeline`. Mix system events into this list only as one-line rows without actions.

## How to adapt

- The count in the `h2` is the number of top-level comments, not replies.
- Replies nest one level only. A reply to a reply goes in the same `.cm-replies` list and starts with an @mention.
- Show the first two replies and collapse the rest behind "Show N More Replies". Expand in place; never navigate.
- Tags after the time: `Resolved` (`tone="success"`) and `Edited` (neutral). At most one of each. A resolved comment keeps its text, muted, and its Resolve button becomes Reopen.
- Reactions are `ht-toggle variant="outline"`, emoji then count. `pressed` means you reacted. Hide a reaction when its count reaches 0. Keep the "+" button last; it opens the picker.
- Actions in the bar: Reply, Resolve, then the ⋯ menu with Edit, Copy Link, a separator and Delete (`danger`). Edit and Delete appear only on the viewer's own comments; Copy Link on all.
- Times are `<time datetime="…">` with relative text. Put the full date in the `title` or a tooltip if people need it.
- Inline code uses `<code>`; longer snippets use `ht-code`.
- The composer label stays visible ("Add a Comment"). Its placeholder says what formatting works.

## Wiring

- Submit: Cmd+Enter (Ctrl+Enter elsewhere) submits the form from the `ht-textarea`; Esc resets it and blurs. Plain Enter makes a new line.
- Post optimistically: append the comment at once with the time "Sending…", disable its actions, and replace it with the server copy. On failure, keep the text in the composer and set `error="Not sent. Try again."` on the `ht-textarea`.
- Reply opens a second composer inside `.cm-replies` with the same form, label "Reply to Linus", focused. Only one reply composer open at a time.
- Reactions: on `change` of an `ht-toggle`, update the count right away and send the change; roll back on failure.
- "+" opens `ht-emoji-picker` in an `ht-popover` anchored on the button; on `ht-select`, add the reaction.
- Delete opens an `ht-alert-dialog` ("Delete this comment? Replies stay."). Copy Link writes the comment's permalink and shows a toast.
- The sort `ht-select` reloads the list. "Unresolved Only" hides resolved threads.
- Attachments: read `files` from `ht-dropzone` on submit and upload them first; show progress in its file list.

## Do not

- Do not nest deeper than one level.
- Do not put Delete outside the ⋯ menu, or show it on other people's comments unless the viewer is an admin.
- Do not use colour alone for "you reacted"; `ht-toggle` sets `aria-pressed`, keep it.
- Do not drop the `aria-label` on each `article`; it is how screen readers tell comments apart.
