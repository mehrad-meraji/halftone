---
title: Search Results
category: Search
summary: Federated search results with a sticky query bar, filter chips with counts, a live per-source status strip, selectable result rows and a reader preview.
---

## When to use

- Results that come from several sources at once and arrive at different speeds: federated search, docs plus code plus issues, research tools.
- Results people collect and hand on (copy into a prompt, export, attach to an issue). The checkboxes and selection bar are for that.
- The page after `search-home-01`. Put it inside `app-shell-01` when the app has other sections.

## When not to use

- One source, fast results. Remove the source strip and the progress bar, or use a plain filtered list.
- Records with many columns to compare (status, owner, dates). Use an `ht-table`.
- Jump-to navigation. Use `ht-command`.

## How to adapt

- The query bar stays sticky with an opaque `--ht-bg` background. Keep the query in the field so people can edit it in place. Enter submits; there is no Search button.
- Filter chips are one `ht-toggle-group`: All first, then each result state, each with its count in the item's `count` attribute (not an `ht-tag`). Hide a chip whose count is 0, except All.
- Put the total and the time on the right of the heading: "20 results · 1.2 s". Update the total as sources finish.
- Source states each carry text or an icon, never colour alone: done is `success` with a check and the count, waiting is a neutral tag with `ht-ping` (give it `label="Waiting"`), slow is `warning` with a clock, failed is a quiet button with `x-circle` whose `ht-tooltip` gives the reason.
- Show `ht-progress` only while sources are running; its label counts sources ("5 of 8 sources done"), not percent. Remove the progress bar and the waiting chips when every source has finished, and keep the strip only if something failed or ran slow.
- Each result row: checkbox, letter avatar for the source (`aria-hidden`, the site name follows), site name, URL as a breadcrumb with ` › `, title link as `h3`, one or two lines of snippet with the match in `<mark>`, and a status tag on the right.
- The row open in the reader gets `sr-open` and `aria-current="true"` on its title link. Checked rows get `sr-on`.
- The reader pane shows the open result: site as the eyebrow, title, "Read · N characters", the extracted text, then "Open Page" (primary) and "Copy Text". Below 1024px the pane is hidden; open the result in an `ht-sheet side="right" size="lg"` or on its own route instead.
- Below 640px the per-page select and the avatars hide. Keep the checkbox and title.
- Loading before the first source returns: three `ht-skeleton variant="text" lines="3"` rows in place of the list.
- No results: an `ht-empty-state heading="No results for “…”"` with two or three suggestions in its description (check spelling, try All, remove a filter) and a Clear Filters button in `actions`.
- A whole search that fails (not one source): an `ht-alert tone="danger"` above the list with a Retry button in its `action` slot. Keep results already received.
- More than one page: put `ht-pagination` under the list with `total` and `page-size` from the per-page select.

## Wiring

- Stream results per source and append them to the `ol` as they arrive. Update each source chip, the counts on the filter chips and the progress value at the same time.
- A source chip moves waiting → done, waiting → slow (after a threshold you choose, e.g. 3 s) → done, or to failed. Clicking a failed source retries only that source.
- The filter toggle group filters the list on `change`; it does not refetch.
- Show `.sr-selbar` only while one or more rows are checked, and update its count. Clear unchecks every row. Copy for AI copies the checked results as Markdown (title, URL, extracted text), then shows an `ht-toast` "Copied 2 results".
- Clicking a title opens it in the reader on wide screens and in the sheet on narrow ones. Open Page follows the real URL in a new tab.
- Reset clears the field and the results and returns to `search-home-01` if you have one.

## Do not

- Do not block the page until every source finishes. Show what is in, with the strip saying what is still running.
- Do not hide failed sources. Say which failed and why.
- Do not put bulk actions in the query bar. They belong in the selection bar.
- Do not open results in a modal dialog. The reader is non-modal so people can keep scanning the list.
