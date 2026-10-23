---
title: Media Library
category: Media
summary: Grid of image and video tiles with search, a filter popover, removable filter chips, a page-wide drop zone, processing and failed tiles, and a floating bulk bar.
---

## When to use

- A library of visual files people browse by eye: asset libraries, DAMs, galleries, moodboards, screenshot archives.
- Collections where people pick several items and act on them together (tag, download, move, delete).

## When not to use

- Documents and data files where the name, size and date matter more than the picture. Use an `ht-table` with a file icon column.
- A single image picker inside a form. Use `ht-dropzone` on its own.

## How to adapt

- The tiles here are token-coloured gradients and dot screens standing in for pictures. Replace `.mg-thumb`'s background with an `<img alt="" loading="lazy">` filling the box (`object-fit: cover`). The alt stays empty: the caption link names the item.
- One primary button in the header: Upload. Bulk actions go in the bar, never in the header.
- The Filters button shows the number of active filters in an accent `ht-tag`. Remove the tag when none are active.
- Every active filter is a chip, "Field: Value" with an `x` that removes it. Clear All is last, quiet, and only shown with two or more chips. Hide the row when no filter is active.
- The count says what is shown out of what exists: "36 of 248 items". Without filters, just "248 items".
- Type badge, top right: the format ("JPG", "PNG", "GIF"), or "Video" with the duration.
- Checkboxes show on hover, on keyboard focus, when the tile is selected, and always on touch screens and phones. Once one tile is selected, show every checkbox.
- A tile still processing has no checkbox and no link: `ht-skeleton variant="rect"` with an `ht-shimmer` label over it, and "Uploaded just now" as its source.
- A failed tile has a dashed danger border, says why in its caption ("File is over 200 MB") and offers Retry. It has no checkbox.
- The grid is `auto-fill` with a 200px minimum, two columns on phones. For a masonry wall keep the list order and set each tile's `aspect-ratio` from the file; do not use CSS columns, which reorder items for keyboard and screen reader users.
- List view (the second toggle): render the same items as an `ht-table` with a small thumbnail column, name, type, size and date.
- First run, no files at all: replace the toolbar, chips and grid with an `ht-empty-state heading="No Files Yet"` and an Upload button in `actions`. Keep the page-wide drop zone.
- Filters match nothing: keep the toolbar and chips, replace the grid with an `ht-empty-state heading="Nothing Matches"` and a Clear Filters button.

## Wiring

- `/` focuses the search field when focus is not in a text control. Search filters as you type, debounced.
- The `ht-dropzone page` takes drops anywhere on the page and shows its own overlay. On `change`, add a processing tile at the start of the grid for each file, upload it, then swap in the real tile, or the failed tile on error. Handle `ht-reject` with an `ht-toast` that names the file and the reason. The Upload button calls `dropzone.showPicker()`.
- Show `.mg-bulk` only while one or more tiles are checked and keep its count current. Shift-click selects a range. `Esc` clears the selection and hides the bar.
- Delete opens an `ht-alert-dialog` that says how many files go and whether they are in collections. Tag and Add to Collection open an `ht-popover` or `ht-dialog` with a picker.
- The caption link opens the item in a detail view: a route of its own, or an `ht-dialog` with the large preview, metadata in an `ht-description-list`, and Previous and Next on the arrow keys. Closing it returns focus to the tile.
- The filter popover applies on change; each change adds or removes a chip. Removing a chip unticks the filter.

## Do not

- Do not load external image URLs in the template. Use your own storage or the placeholders.
- Do not make the whole tile a checkbox. A click opens the item; the checkbox selects.
- Do not show bulk actions on hover over a tile. Per-item actions belong in the detail view.
- Do not hide failed uploads. They stay in the grid until retried or dismissed.
