---
title: Search Home
category: Search
summary: Centred search start screen with a large field, a scope switch, keyboard hints, recent queries and a grid of what can be searched.
---

## When to use

- The landing page of a search product: docs search, an internal tool that searches several sources, an AI prompt page.
- The empty state of a search route, before the first query. Submitting goes to `search-results-01`.

## When not to use

- Search inside a page that already shows results or a list. Put an `ht-input type="search"` in that page's header instead.
- Jump-to navigation (commands, pages, settings). Use `ht-command` in a dialog.

## How to adapt

- Keep the field the biggest control on the page: `ht-input size="lg"` with the magnifying glass in `prefix`. One primary button, the submit.
- The field has no visible label, so it keeps `aria-label`. Put an example query in the placeholder, never instructions.
- Scopes in the `ht-toggle-group`: All first, then two to four more. More scopes than that go in the grid only.
- Recent queries are `ht-button variant="default" size="xs"` links, newest first, five at most. Hide the whole `.sh-recent` row, heading and Clear button included, when there are none.
- The grid lists every source that can be searched, one card each: a noun in Title Case for the heading, one sentence, and a "Search X" link. Three columns on wide screens, one on phones.
- A source that is not ready yet gets `variant="muted"`, a "Soon" `ht-tag` in `actions`, no `interactive` and no link.
- The keyboard hints must match what is wired. Remove a hint before shipping a shortcut that does nothing.

## Wiring

- Submit sends `q` and the toggle group's `value` to the results route, e.g. `/search?q=rate+limits&in=docs`.
- `/` focuses the field when focus is not already in a text control: listen for `keydown` on `document`, check `event.key === '/'` and `event.target`, call `preventDefault()`, then `field.focus()`. `Esc` in the field clears it.
- A scope card's link opens the results route with that scope and an empty query, or sets the toggle group's `value` and focuses the field. The link stretches over the card, so the whole card is the click target.
- Recent chips come from local storage or the server, newest first. Clear empties the list and hides the row. Give each chip the query as its `href`.

## Do not

- Do not add a second primary button. Scope cards are links, not buttons.
- Do not autofocus the field on phones. The keyboard covers the page.
- Do not show the Recent row empty, with only its heading.
- Do not put results on this page. Results belong in `search-results-01`.
