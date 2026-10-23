---
title: Invoice
category: Billing
summary: One invoice with its status, the amount due and key dates, both addresses, line items with totals, notes and terms, and print styles.
---

## When to use

- Viewing one invoice, quote, order or receipt inside an app, with actions on it (download, mark paid, duplicate, void).
- The page an invoice row in `list-01` opens.
- Put it inside `app-shell-01`; the block keeps a readable width of 960px on its own.

## When not to use

- A list of invoices. Use `list-01` with a status tag and an amount column.
- A checkout or payment form. This block shows a document; it does not take card details.
- A plan or usage page. Use the usage card from `dashboard-01` (`ht-progress`), not an invoice.

## How to adapt

- Status tag next to the `h1`: Draft (neutral), Sent (`info`), Paid (`success`), Overdue (`danger`), Void (neutral). One tag, and the dates say the same in words: an overdue due date gets "Overdue by 1 day" in `--ht-danger-text`, never red text alone.
- Header actions by state. Draft: Send (primary), Preview, ⋯ Delete. Sent or Overdue: Download PDF, Mark Paid (primary), ⋯ Duplicate, Void. Paid: Download PDF and Duplicate only. One primary at most.
- Every money value is `ht-number currency="USD" decimals="2"`. Set the currency per invoice, not per page, and `lang` on the block root (or `locale`) to the customer's locale so separators and symbols are right. Zero-decimal currencies (JPY) take `decimals="0"`.
- Amount block: the amount still due, not the total, once part is paid ("Amount Due", with "Paid $1,000.00 on Oct 2" as a fifth item). Keep four to five facts in the `columns` list.
- Line items: description with a muted second line that repeats the quantity and unit ("24 hours, Sep 1–19"), then Qty, Rate and Amount right-aligned. Subtotal, each tax, and Total are the last rows of the same table, labels in the Rate column next to their amounts, Total in bold. Below 640px the Qty column hides (`.inv-wide`), which is why the second line repeats it.
- Drafts are editable: swap the read-only alert for an "Add Line" `ht-button variant="quiet"` under the table, and make each row's description, Qty and Rate `ht-input`s with `aria-label`s. Totals recompute on `input`.
- Sent invoices are locked. Keep the `ht-alert` "Sent invoices are read only. Duplicate to change." and never show edit controls.
- A quote is the same block: title "Q-0042", tags Draft / Sent / Accepted / Declined, "Valid Until" instead of "Due", and Convert to Invoice as the primary action instead of Mark Paid. An order or receipt drops the terms and shows the payment method instead.

## Wiring

- Mark Paid opens an `ht-dialog` that asks for the date and amount received (default: today and the full amount), then changes the tag to Paid and removes the overdue hint.
- Void goes through an `ht-alert-dialog tone="danger"` that says the invoice number stays used and the client is not notified.
- Duplicate creates a Draft copy with today's date and a new number, and opens it.
- Download PDF: render on the server from the same data. For a quick version, `window.print()` uses the `@media print` styles in the block, which hide the actions, breadcrumb and alert.

## Do not

- Do not add Edit on a sent invoice. Duplicate is the way to change one.
- Do not format money by hand (`"$" + n`). Use `ht-number currency`.
- Do not delete sent invoices. Void them, so the numbering has no gaps.
- Do not put totals in a separate box away from the table. They are the last rows, aligned with Amount.
