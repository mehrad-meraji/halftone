---
title: Log Viewer
category: Data
summary: Query bar, saved views, a stacked volume histogram, dense log lines with one selected, and a detail panel with fields, raw JSON and context.
---

## When to use

- Searching and tailing structured logs from one or many services.
- Any long stream of timestamped records with a level and key/value fields: audit trails, build output, webhook deliveries, job runs.
- Put it inside `app-shell-01` as the content of a Logs route.

## When not to use

- Fewer than about 50 records, or records without a level. Use `ht-timeline` (as in `activity-feed-01`) instead.
- Grouped errors with counts and owners. That is an issue list (`list-01`), which links here for the raw lines.
- A single build log read top to bottom. One `ht-code language="log" line-numbers` is enough.

## How to adapt

- The query is one `ht-input` with a mono font and a `>` prefix. Keep the syntax as `key:value` terms, `-` to negate. Show the match count next to it and update it after every Run, not on each keystroke.
- One primary button, Run. Save View is `variant="default"`.
- Saved views are one `ht-toggle-group` (exactly one pressed). Picking a view replaces the query text. The `+` button saves the current query as a new view; keep its icon `label`.
- The histogram is drawn in CSS: one `<i>` per time bucket with `--e`, `--w` and `--n` set to its error, warning and info counts. Change `--u` (pixels per line) so the tallest bucket fits the 72px track. Use 20 to 60 buckets. Keep the `role="img"` `aria-label` in step with the numbers: total, count per level, and anything notable ("Errors spike 10 minutes ago").
- Lines are newest first. Each line: time (mono, to the millisecond), level `ht-tag` (Error `danger`, Warn `warning`, Info neutral, Debug neutral), service, message, then fields as grey `key=value` in `.lv-kv`. The message truncates with an ellipsis; the detail panel holds the full text.
- The time is the link that opens a line, so the row is reachable by keyboard. Mark the open line with `selected` on its `ht-table-row` and `aria-current="true"` on its link.
- The detail panel: level and full UTC timestamp, a linked-issue `ht-alert` only when one exists, then tabs. Fields are an `ht-description-list layout="inline"` with `copy` on every item; set `copy-value` when the shown value is formatted (`3,004 ms` copies `3004`).
- Below 1100px the panel moves under the lines. Below 640px the Service column (`.lv-wide`) and the grey fields (`.lv-kv`) hide and the message truncates sooner.
- For one service, drop the Service column. For audit trails, rename Level to Action and Service to Actor.

## Wiring

- Live / Paused: the `ht-toggle` is pressed while tailing. On `change`, start or stop the stream; when paused, change its text to "Paused", set `still` on its `ht-ping` (or remove it) and update the tail line to "Paused · 38 new lines". Pause on its own when the person scrolls away from the top or selects a line, so lines do not move under the pointer.
- New lines go in at the top, at most a few times per second, batched. Keep the list to a few hundred rows in the DOM and load older lines on scroll.
- Clicking a time link: prevent the navigation (or route to `?line=<id>`), move `selected` and `aria-current`, and fill the panel. On phones, scroll the panel into view.
- Run submits the form. Put the query in the URL so a view can be shared.
- The tail line is not a live region. Announcing every new line would drown a screen reader.

## Do not

- Do not wrap long messages in the list. Truncate; the detail panel shows everything.
- Do not use colour alone for levels. The tag carries the word.
- Do not add a second primary button. Run is the only one.
- Do not remove the hidden `h2`s ("Volume", "Log Lines"). They keep the heading order under the `h1`.
