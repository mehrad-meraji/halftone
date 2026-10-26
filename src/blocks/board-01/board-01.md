---
title: Kanban Board
category: Lists
summary: Board of four status columns that scroll sideways, with cards carrying an ID, labels, assignees and a due date, a Move To menu on each card, an empty column and a quick-add form.
---

## When to use

- Work items that move through a few fixed stages: tickets, a sales pipeline, a hiring funnel, content in review.
- Three to six stages. Each column is one status.
- Put it inside `app-shell-01` as the content of a Board route. The List view of the same items is `list-01`.

## When not to use

- More than six stages, or items that sit in no stage. Use `list-01` with a status column.
- When order inside a column matters more than the stage (a ranked backlog). Use a list with Move Up and Move Down.
- Fewer than about five items in total. A list is easier to scan.

## How to adapt

- One `<section class="board-col">` per status, in workflow order, each with an `h2`. Cards inside are `<li>` with an `h3` link to the item, so the outline reads Board → Status → Card.
- Column dot colours: neutral for not started, `--ht-info` for active, `--ht-warning` for waiting, `--ht-success` for done. The name is always written next to the dot.
- The count after the name is the number of cards in that column after filters. Keep it in step with the list.
- A card shows, in this order: title, ID tag (mono), one to three label tags, then assignees left and due date right. Leave anything else for the detail page (`detail-01`).
- Late due dates get `.board-late`, an icon and the word "Late". Never colour alone. Done cards show "Done" and the date, and their title is muted.
- One assignee is an `ht-avatar size="xs"`; two or more are an `ht-avatar-group size="xs" label="Assignees"`. No assignee is the text "Unassigned".
- The ⋯ menu starts with an `ht-menu-label` "Move To" and lists every other column, never the current one. Then Copy Link, then Delete (`danger`).
- An empty column keeps its header and shows "Nothing here yet" in `.board-empty`. Do not hide empty columns; the stage still exists.
- Quick add (`.board-add`) opens at the top of a column from its "+" button. Only one open at a time.
- Columns are 288px (280px on phones), so four fit at 1280px. The board scrolls sideways inside `ht-scroll-area`, never the page.
- One primary button in the header: New Card. The Board / List switch is an `ht-toggle-group`.

## Wiring

- Move To: on `ht-select` from a card's `ht-menu`, read `detail.value` (the target column), move the `<li>` to the end of that column's list, update both counts and save. Announce it with a toast ("Moved ACME-204 to In Review.") and keep focus on the moved card's menu button.
- Drag and drop: replace each column's `<ul class="board-cards">` with an `ht-sortable-list` that has the same `group` on every column (`group="cards"`), and wrap each card in an `ht-sortable-item item-id="…"`. On `ht-reorder`, read `detail.from`, `detail.to` and `detail.index`, move the card in your data, update both counts and save, the same as Move To. The list never moves the DOM itself.
- An empty `ht-sortable-list` keeps one row of height, so an empty column can still take a drop. Keep `.board-empty` next to it as the visible text.
- Quick add: "+" shows the `.board-add` form in that column and focuses its input. Enter submits, Esc or Cancel closes it. Add the card at the top optimistically.
- Filter: on `input` of the search, hide cards whose title, ID or labels do not match, and update the counts. Empty after filtering shows "No cards match."
- View switch: on `change` of the `ht-toggle-group`, route to the list view of the same query. Keep the filter text.
- Columns can hold many cards. Past about 50, load more at the end of the column instead of rendering all.

## Do not

- Do not remove the Move To menu when you add drag and drop.
- Do not put more than one primary button on the board. Column "+" buttons are `quiet`.
- Do not make the whole card a link. The title is the link; the menu is a separate control.
- Do not let the page scroll sideways. Only `ht-scroll-area` scrolls.
