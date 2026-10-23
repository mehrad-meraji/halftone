---
title: Notice Card
category: Feedback
summary: Centred single card between flows, shown as a workspace invitation with the inviter, a short fact list, Accept and Decline, with exact copy for expired links, passwords, no access, rate limits and 404.
---

## When to use

- A full page that stops someone between two flows and asks for one decision: accept an invitation, enter a share password, wait out a rate limit.
- A shared link that cannot open: expired, revoked, not found, or for another account.
- The same family as `login-01`: same stage, same panel. Use both in one app and they read as one set.

## When not to use

- An error inside a page that is already open. Use `ht-banner` or `ht-empty-state tone="error"` in place.
- An empty list. Use `ht-empty-state`.
- Anything with more than one field. That is a form page; start from `login-01`.

## How to adapt

- Pick one state from the list below and swap the eyebrow, `h1`, sentence, body and buttons together. Never mix two states on one card.
- One primary button at most, and it is the first. The second button is `variant="default"`. Both are `block` and `size="lg"`.
- The `h1` is a sentence in sentence case that says what happened. The line under it says what to do next. One sentence each.
- Show the inviter's `ht-avatar` only when a person did something (invitation, access request). Other states drop it.
- The fact list holds two to four facts, labels in Title Case. Keep `Invited As` in the invitation: it is how people notice the wrong account.
- The small print under the card names the signed-in account and offers Sign out. Keep it whenever someone is signed in; drop it on the password and 404 states if nobody is.
- Keep the panel at 420px. Wider reads as a form page.

## Other states

Exact copy for each state. "Eyebrow / H1 / Sentence → Body → Primary + Secondary".

- **Invitation (shown)**: Invitation / "Ada invited you to Acme" / "Join the workspace to see its projects and issues." → fact list Workspace, Role, Invited As, Expires → Accept Invitation + Decline.
- **Invitation invalid**: Invitation / "This invitation no longer works" / "It was used, revoked or sent to another address. Ask Ada for a new one." → no avatar, no list → Go to Acme (`variant="default"`) only, or Sign In With Another Account if signed in as the wrong address.
- **Link expired**: Shared Link / "This link has expired" / "Links last 7 days. Ask the person who shared it for a new one." → list: Shared By, Expired (`<time>`) → Request New Link + Go Home.
- **Password required**: Shared Link / "This link is protected" / "Enter the password the owner gave you." → replace the list with `<ht-input type="password" name="password" label="Password" autocomplete="current-password" required>` inside the form → Open (submit) + no secondary. A wrong password goes on the field: `error="That password is not right."`.
- **No access**: Access / "You do not have access to this project" / "It belongs to Acme. Ask an owner to add you, or switch accounts." → list: Workspace, Signed In As → Request Access + Switch Account. After a request: swap the sentence for "Request sent. You will get an email when an owner answers." and disable Request Access.
- **Rate limited (429)**: Slow Down / "Too many requests" / "Try again in 30 seconds." → no list → Try Again (`disabled` until the timer ends) + Go Home. Show the countdown in the sentence, not on the button.
- **Not found (404)**: Error 404 / "Nothing lives here" / "The page moved or never existed. Check the address or start from home." → no list → Go Home + Search.

## Wiring

- Accept submits the form; on success, redirect into the workspace. Decline posts to the decline endpoint, then shows "Invitation declined." as the sentence with a single Go Home button.
- Rate limit: read `Retry-After` from the 429 response. Count down once a second in the sentence ("Try again in 29 seconds."), keep the button `disabled`, and enable it at zero with the sentence "You can try again now." Do not auto-retry.
- Password: submit with `fetch`, and on a 401 set `error` on the `ht-input`, not a banner. After five failures, switch to the rate-limited state.
- Set `document.title` to the `h1` so the tab says what happened.

## Do not

- Do not add a sidebar, top bar or navigation. The page is one decision.
- Do not use a danger button. Decline is not destructive; it is `variant="default"`.
- Do not blame the person ("You entered an invalid link"). Say what happened to the link.
- Do not show a spinner card while checking the token. Render the final state on the server, or show `ht-skeleton` in the panel.
