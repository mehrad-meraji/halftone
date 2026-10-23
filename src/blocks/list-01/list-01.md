---
title: Record List
category: Lists
summary: Admin index page with status chips, search, filter, sort and column menus, a selectable table with row menus, a bulk-action bar and pagination.
---

## When to use

- The index page of any record type people manage in bulk: clients, tickets, issues, contacts.
- Put it inside `app-shell-01` as the content of the list route. Open a row in `detail-01`.

## When not to use

- Fewer than about 20 records that never need filtering. Use a plain `ht-table` without the toolbar.
- Records grouped by stage that people drag between columns. That is a board, not a list.
- A time-ordered log of what happened. Use `activity-feed-01`.

## How to adapt

- Rename the record type everywhere at once: the `h1`, the count line, the primary button ("New Client"), the search placeholder and the `aria-label`s.
- One primary action in the header. Secondary page actions (Import) sit to its left as `variant="default"`. Bulk actions go in the bar, never in the header.
- Status chips are one `ht-toggle-group type="single"`. Each label carries its count. Keep them to five or fewer; more statuses belong in the Filters menu.
- Filters menu: one `ht-menu-label` per facet, `type="checkbox"` items under it, a separator between facets, and Clear Filters last. Show the number of active filters as an `ht-tag` in the trigger's `suffix`; remove the tag when none are active.
- Sort menu: `type="radio"` items with one shared `name`. Mirror the choice on the matching `ht-table-header` (`sortable sort="descending"`) and in the count line ("sorted by Updated").
- The Columns menu is optional. Drop it if the table has five columns or fewer.
- First column is the checkbox, second is the record name as a link with an `ht-avatar size="xs"`. The name link is the only way into `detail-01`; the row itself is not a link.
- Status is an `ht-tag` with words, never a coloured dot alone. Tones: `success` for live states, `warning` for paused or at risk, neutral for archived, `danger` only for failed or blocked.
- Numbers use `align="end"` on both header and cell. Relative times go in `<time datetime>` so the exact time is in the markup.
- Mark secondary columns with `.list-wide`; they hide under 720px. Put the class on the header and every cell of that column.
- Pagination: set `total` and `page-size` and the summary ("1–8 of 128") is drawn for you. Use `href="?page={page}"` when pages are real URLs.
- The bulk bar is plain HTML (`role="toolbar"`) with scoped CSS, because Halftone has no action-bar component. Keep at most four actions plus Clear. Delete is the only `danger` button.

## Wiring

- Bulk bar: render `.list-bulk` only while at least one row is selected, and update "N selected". The block shows it with two rows selected.
- Row selection: a row checkbox toggles `selected` on its `ht-table-row`. The header checkbox is `checked` when all visible rows are selected, `indeterminate` when some are, and selects or clears all visible rows on `change`.
- Reset the selection whenever the query changes: search text, status chip, filter, sort or page. Never carry hidden selected rows into a bulk action.
- Search: filter on `input` with a short debounce (about 200ms). Bind `/` to focus the search field when focus is not already in a text field.
- Status chips, filters and sort: listen for `change` on `ht-toggle-group` and `ht-select` on each `ht-menu`, then reload the rows and the counts. Keep the query in the URL so a reload or a shared link shows the same list.
- Filter menus close after each pick by default. Call `preventDefault()` on `ht-select` to keep the Filters menu open while people tick several boxes.
- Delete, from the bar or a row menu, opens an `ht-alert-dialog tone="danger"` that says how many records go. Not included here; add it where you wire the click.
- Loading: keep the header, chips and toolbar, and replace the body rows with five rows of `ht-skeleton` (`variant="circle" width="20"` for the avatar, `variant="text"` for the rest). Disable the bulk bar buttons while a bulk action runs.
- Empty, no records yet: replace the table, toolbar, chips and pagination with an `ht-empty-state` ("No clients yet", the primary New Client button and Import as secondary).
- Empty, nothing matches: keep the toolbar and chips so people can see what is filtering, and put an `ht-empty-state` in the table's `empty` slot ("No clients match these filters", one Clear Filters button). Hide the pagination.
- Optional keyboard: `j`/`k` move a focus ring between rows, `x` toggles the focused row's checkbox, `Enter` opens it in `detail-01`. Only when focus is not in a text field.

## Do not

- Do not put a second primary button on the page. The bulk bar and row menus use `quiet` and `danger` buttons.
- Do not make the whole row clickable. It fights with the checkbox and the row menu.
- Do not delete without a confirmation that names the count.
- Do not keep a selection across pages or filters.
- Do not put row actions that change the record (Delete, Archive) outside the row menu or the bulk bar.
