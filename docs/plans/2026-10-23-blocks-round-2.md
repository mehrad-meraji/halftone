# Blocks, round 2

Date: 2026-10-23. Source: a survey of seven of the user's apps (Taskscape, Command Centre, Sentinel, Magpie, Glean, People Project, Forage). Decided with the user: build all 16 blocks, and build the missing pieces as components first.

## Phase 1: components

| Component | Elements | Used by |
| --- | --- | --- |
| `pagination` | `ht-pagination` | list, activity feed, log viewer, members |
| `code` | `ht-code` | setup steps, detail, log viewer, members (token shown once) |
| `steps` | `ht-steps`, `ht-step` | wizard, setup steps |
| `timeline` | `ht-timeline`, `ht-timeline-item` (+ group) | activity feed, detail, status, comments |
| `description-list` | `ht-description-list`, `ht-description-item` | detail, invoice, status, log viewer, media grid |
| `dropzone` | `ht-dropzone` | wizard, media grid, comments |

## Phase 2: blocks

Sample content is fictional. Block notes never name the source apps or their files (notes ship in the package and in `llms.txt`); provenance lives here and in `docs/decisions.md`.

| Block | What it is | Seen in |
| --- | --- | --- |
| `list-01` | Record list: title bar, status chips with counts, search, filter menu, sort, table with selection, bulk-action bar, pagination, two empty states | Taskscape tickets, Command Centre clients, Sentinel issues, People contacts |
| `detail-01` | Record detail: breadcrumb, title with status, actions, key-fact strip, main column with tabs (Activity, Comments), properties rail | Taskscape ticket, Sentinel issue, People contact, Command Centre contact |
| `activity-feed-01` | Activity page: type filter, day-grouped timeline, load more | Command Centre activity, Taskscape activity, People timeline |
| `wizard-01` | Multi-step create or import flow: steps, one card per step, review, Back and Next | Command Centre provision wizard, Sentinel project setup, People import |
| `inbox-01` | Three panes: list with filter tabs and unread dots, reading pane with reply, context rail | Command Centre inbox, People inbox |
| `search-home-01` | Search start screen: wordmark, big search field, mode switch, recent queries, what-you-can-do cards | Glean home, Forage start |
| `search-results-01` | Results: sticky search bar, filter chips with counts, per-source status, result list, selection bar, reader aside | Glean results and reader, Forage streamed results |
| `media-grid-01` | Gallery: search, filter chips, tile grid with selection, bulk bar, upload | Magpie wall, Command Centre files, Forage cards |
| `setup-steps-01` | Quick start: language tabs, numbered steps with code to copy, token card, hand-to-agent action | Sentinel setup pages |
| `comments-01` | Comment thread: comments with replies, reactions, resolve, composer with attachments | Taskscape comments |
| `board-01` | Kanban: columns with counts and quick add, cards, move menu | Taskscape board, People pipeline |
| `status-01` | Status overview: incident banner, tiles, monitor table with 90-day bars, heartbeats | Sentinel uptime, Forage health |
| `members-01` | Team: members table with roles, invitations tab, invite dialog | People members, Taskscape share dialog |
| `interstitial-01` | Centred notice card: link expired, invitation, rate limited | Taskscape share and invitation pages, People no-access, Forage 429 |
| `invoice-01` | Invoice detail: status, amount, dates, line items with totals, actions | Command Centre invoice, People billing |
| `log-viewer-01` | Logs: query bar, saved views, volume bars, dense lines, line detail | Sentinel logs |

## Rules carried over

- One folder per block, `<name>.html` and `<name>.md`, story export in `src/blocks/blocks.stories.ts`, checks in `scripts/blocks.mjs`.
- `ht-card` still renders a fixed `h3` in a `<header>`. Until the card `level` branch lands, page-level cards need the `<section>` root and a hidden `h2`, as in `dashboard-01`.
- Docs site: STATUS `New` badges, a Roadmap Shipped row, README count, CHANGELOG line, decisions entries.
