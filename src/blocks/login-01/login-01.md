---
title: Sign In
category: Authentication
summary: Centred sign-in card with GitHub and Google buttons, email and password, and a link to sign up.
---

## When to use

- The first screen of an app that needs an account.
- Email and password sign-in, with or without OAuth providers.

## When not to use

- Sign-up. Copy this block and change the fields, the heading and the submit label instead of adding a toggle.
- Sign-in inside an app that is already open. Use `ht-dialog` around the form, not this full page.

## How to adapt

- Keep one primary button: the submit. OAuth buttons stay `variant="default"`.
- Remove the OAuth group and the `ht-separator` together, never one without the other.
- Put server errors on the field with `error="…"`, not in a banner. Use `ht-banner tone="danger"` above the form only for errors that are not about one field (account locked, too many tries).
- Set `autocomplete` on every field. Password managers depend on it.
- The tagline is the product voice: short and dry. Replace it, do not remove it.

## Do not

- Do not put a placeholder in place of a label.
- Do not add a "show password" button by hand. It is not part of `ht-input` yet.
- Do not change the panel width above 440px. Wide sign-in forms read as a different page.
