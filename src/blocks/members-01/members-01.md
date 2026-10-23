---
title: Team Members
category: Forms
summary: Team and access page with Members and Invitations tabs, a role select per person, remove and revoke actions, an invite link and an invite dialog.
---

## When to use

- Workspace, organisation or project members: who has access and with which role.
- Sharing settings for one document or project, with the same roles. Rename "Team" to the thing being shared.
- Put it inside `app-shell-01`, or next to `settings-01` as its own Settings tab.

## When not to use

- A directory of people with profiles and contact details. That is a record list; use `list-01`.
- More than about 50 members. Add search and `ht-pagination` from `list-01` above and below the table first.

## How to adapt

- One primary action: Invite People. Everything else is per row.
- Keep your roles in the same order everywhere (most power first) and use the same names in the table, the dialog and the invite tags. Four roles at most; more means you need permissions, not roles.
- The person who cannot be changed (the owner, or yourself) gets a `disabled` role select with a `helper` that says why ("Transfer ownership to change") and no row menu. Never hide their row.
- Disable the Owner option in every other row's select. Ownership moves through a separate transfer flow, not a role change.
- Mark the current user with an `ht-tag` "You" after their name.
- Name cell: avatar, name, then email on its own line. Do not split email into its own column; at 375px there is no room.
- Last Active and Sent carry `.members-wide` and hide under 720px. Put the class on the header and every cell. Under 720px the avatar also hides and the email truncates, so the role select and the row menu stay on screen.
- Invitations: Resend and Revoke are quiet buttons in the row. Revoke is not `danger`: it can be undone by inviting again. Say when an invite expires in the Sent column.
- The invite link is optional. Remove the whole `.members-link` section if your app has no link invites. `ht-code` gives the copy button; Reset Link must confirm first.
- Show seat usage in the description line when your plan has a seat limit. Drop it otherwise.

## Wiring

- Invite People: `dialog.show()` on click. Send Invites calls `form.requestSubmit()` on `#members-invite`; on `submit`, split the emails on commas and new lines, validate each, and put bad addresses in the textarea's `error`. On success close the dialog, switch the tabs to `invitations` and add the rows. Cancel calls `dialog.close()`.
- Role change: save on `change` of the row's `ht-select`. On failure, set the select back to the old value and show an `ht-toast`. Do not ask for confirmation, except when someone demotes themselves from Admin: then use an `ht-alert-dialog`.
- Remove from Team: on `ht-select` with `value="remove"` from a row menu, fill in the person's name in the `ht-alert-dialog` heading and call `show()`. On `confirm`, set `confirm-disabled` while the request runs, then remove the row and update both the tab count and the seat count.
- Resend: disable the button and change its label to "Sent" for a few seconds. Revoke: remove the row at once and offer Undo in an `ht-toast`.
- Reset Link: confirm with an `ht-alert-dialog` ("Old links stop working"), then swap the `ht-code` text.
- Update the counts in the tab labels whenever a row is added or removed.
- Loading: show three `ht-skeleton` rows in the table. Empty Invitations tab: put an `ht-empty-state` ("No pending invitations", an Invite People button) in the table's `empty` slot.

## Do not

- Do not let anyone remove or demote the last owner. The disabled select and the helper text are the rule, not decoration.
- Do not put Remove from Team in the row as a visible button. It lives in the ⋯ menu, behind a confirmation.
- Do not save role changes with a page-level Save button.
- Do not send invites from the dialog without a role. Default to the lowest role that can do real work (Member here).
