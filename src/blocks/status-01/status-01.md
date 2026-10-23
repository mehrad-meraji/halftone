---
title: Status Overview
category: Status
summary: Health page with an open-incident banner, four count tiles, a monitors table with a 90-day uptime strip, recent incidents and heartbeat checks.
---

## When to use

- An internal health dashboard for services, endpoints, cron jobs or data sources.
- A public status page: drop the Add Monitor button, the Acknowledge action and the hosts under each name.
- Put it inside `app-shell-01` as the content of a Status or Monitors route.

## When not to use

- One service. Show its state in the page header of `detail-01` instead.
- Metrics over time (latency charts, throughput). This block shows states, not graphs; Halftone has no chart component.
- A list of incidents to work through. That is a list page with filters, not an overview.

## How to adapt

- The banner shows the one open incident: `ht-banner tone="danger"` with the service, how long, and the error, then Acknowledge and View Incident in the `action` slot (they wrap under the text on phones). With two or more open, say "3 monitors are down" and link to the filtered list; never stack banners. With none, remove it.
- Tiles count states: Up, Slow, Down and one uptime figure. Slow counts as up. Keep the uptime as plain text with two decimals; `ht-number` is for whole counts.
- Every state is a dot plus a word ("Up", "Slow", "Down", "Late", "On Time"). The dot is decorative because the word sits beside it; give `ht-ping` a `label` only when it stands alone.
- Pulse (`ht-ping` without `still`) only for something that needs a person now: an ongoing Down. Everything else is `still`. Use `ht-tag` for states inside text and timelines, `ht-ping` for live states in rows.
- Order the monitors table worst first: Down, Slow, then Up by name. Show six to eight rows and link to the rest with the card's quiet button.
- The uptime strip is drawn in CSS, not one element per day: `.st-days` paints 90 green bars with a repeating gradient, and only bad days are elements, `<i class="st-down" style="--d: 34">` where `--d` is the day from 0 (oldest) to 89 (today). Use `st-slow` for a degraded day and `st-none` with `--d` set to the number of days before the monitor existed. Worst state of the day wins.
- Give each strip `role="img"` and an `aria-label` that says the same as the bars: "Last 90 days: 99.71% up, 2 incidents". The percentage beside it is always the 90-day figure.
- Below 640px the Type and Response columns (`.st-wide`) and the hosts under each name hide, and the strip shows only the last 14 days. Put `st-wide` on the header and every cell of a column you want gone on phones.
- Incidents: newest first, four or five items, `tone="danger"` with an "Ongoing" tag while open, `tone="success"` with "Resolved · duration" after. Heartbeats show the expected interval and when each was last seen.

## Wiring

- Refresh every 30 to 60 seconds, the same as the check interval, and update the "Updated 20s ago" line. Change `ht-number` `value`s in place so counts roll instead of the page reloading.
- Do not wrap the table in a live region. The banner is already `role="alert"`; it announces when it appears, which is the one change people must hear.
- Acknowledge: post it, then replace the button with "Acknowledged by Ada Lovelace" text and stop the dot's pulse (`still`). The incident stays open until the check passes.
- A heartbeat is Late after one missed interval and Down after three. Compute it on the server; the page only shows the word.

## Do not

- Do not use colour alone. Every dot, bar and marker has a word or an `aria-label` that says the same.
- Do not draw 90 elements per row. Only bad days are elements.
- Do not put the incident banner inside a card. It sits above the tiles, full width.
- Do not remove the hidden "Summary" `h2` or the `h2`s in the card header slots. They keep the heading order under the `h1`.
