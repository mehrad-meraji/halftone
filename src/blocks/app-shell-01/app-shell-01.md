---
title: App Shell
category: Layout
summary: Full-height app frame with a collapsible sidebar, an account menu, a top bar with breadcrumbs and a scrolling content area.
---

## When to use

- The outer frame of a signed-in app with more than three sections.
- Start here, then put another block (dashboard, settings, a table) inside `.shell-content`.

## When not to use

- Marketing pages and docs. They need a top nav, not a sidebar.
- Apps with two or three pages. Use tabs in a top bar instead.

## How to adapt

- Replace the rows in each `ht-sidebar-group`. Every row is an `ht-nav-item` with an `ht-icon` in `prefix`, because the collapsed rail shows only the icon.
- Mark the current page with `active` on its `ht-nav-item`. Exactly one row is active.
- Counts go in `suffix` as `ht-tag`; shortcuts as `ht-kbd`. Never both on one row.
- Text that must hide in the rail gets `data-expanded-only` (brand name, user name).
- The shell is `height: 100vh` and is meant to be the whole page. If something sits above it (a global banner), lower the height by that much, or the page scrolls twice.
- Put the page title and its one primary action in `.shell-head`. Secondary page actions go next to it as `variant="default"`.

## Wiring

- The menu button in the top bar has `data-sidebar-toggle`. Connect it: `button.addEventListener('click', () => sidebar.toggle())`. On narrow screens this opens the drawer, on wide screens it collapses the rail.
- `hotkey="mod+b"` already toggles the rail. Keep the button anyway: touch users have no keyboard.
- Replace `href="#"` with real routes. In a single-page app, listen for clicks on `ht-nav-item` and move `active`.

## Do not

- Do not nest a second sidebar. Use `ht-sidebar-group collapsible` for depth.
- Do not put primary actions in the sidebar. They belong in `.shell-head`.
- Do not remove the `label` on `ht-sidebar`. It names the navigation landmark.
