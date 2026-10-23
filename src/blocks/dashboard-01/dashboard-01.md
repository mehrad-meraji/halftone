---
title: Dashboard
category: Data
summary: Overview page with a time-range toggle, four stat cards, a table of recent items and a usage card with progress bars.
---

## When to use

- The home page of a signed-in app: a summary of numbers and the latest items.
- Put it inside `app-shell-01` as the content of the Home route.

## When not to use

- Deep analysis with charts and filters. Halftone has no chart component yet.
- A page that is only a list. Use a full-width `ht-table` instead.

## How to adapt

- Two to four stat cards. The `eyebrow` names the number in Title Case; the value is the biggest text on the page.
- Use `ht-number` for counts so changes roll. Percentages with decimals are plain text in `.dash-value`.
- Delta tags: `danger` when the change is bad, `success` when good, neutral when flat. Bad is not always up: more errors is `danger`, more users is `success`.
- The time range is one `ht-toggle-group`. When it changes, reload every number on the page, not some.
- The table shows the five latest rows at most and links to the full list with the quiet "View All" button.
- Progress tones: `warning` from 80%, `danger` from 95%.

## Do not

- Do not put more than four stat cards in a row.
- Do not colour a stat value itself. Colour goes on the delta tag only.
- Do not make the whole table card clickable. Rows link, the card does not.
- Do not remove the two hidden `h2` headings. `ht-card` titles are `h3`, so the page needs an `h2` level between them and the `h1`.
