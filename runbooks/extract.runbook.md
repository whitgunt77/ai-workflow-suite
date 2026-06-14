# Runbook: Structured Data Extractor

**Automation:** `extract`
**File:** `src/automations/extract.js`
**Owner:** Whitney Gunter

---

## What it does

Pulls named fields out of unstructured documents and returns a typed JSON object. Ships with three built-in schemas for the most common document types. Add your own schemas without touching any other code.

---

## Built-in schemas

|
Schema
|
Document type
|
Key fields extracted
|
|
--------
|
--------------
|
----------------------
|
|
`invoice`
|
Invoices & bills
|
vendor, dates, line items, totals, currency
|
|
`contract`
|
Legal agreements
|
parties, dates, type, obligations, governing law
|
|
`meeting`
|
Meeting notes
|
date, attendees, decisions, action items
|

---

## How to run it

### From the command line

```bash
# Invoice extraction
node src/automations/extract.js --file ./examples/invoice.txt --schema invoice

# Contract extraction
node src/automations/extract.js --file ./contract.txt --schema contract

# Meeting notes
node src/automations/extract.js --file ./meeting.txt --schema meeting
```

### From another script

```js
import { extract } from './src/automations/extract.js';

// Named built-in schema
const invoice = await extract(documentText, { schemaName: 'invoice' });
console.log(invoice.vendor.name);    // "Acme Supplies Co."
console.log(invoice.total_due);    // 2376

// Custom schema
const result = await extract(documentText, {
  customSchema: {
    description: "Extract fields from a job offer letter.",
    fields: {
      candidate_name: "string",
      role_title: "string",
      start_date: "string — ISO 8601",
      base_salary: "number — annual, in USD",
      signing_bonus: "number or null",
      equity: "string or null — e.g. '0.5% over 4 years'",
    }
  }
});
```

---

## Output format

Matches the schema exactly. Example for `invoice`:

```js
{
    vendor_name:      "Acme Supplies Co.",
    invoice_number:   "INV-2024-0892",
    invoice_date:     "2024-10-01",
    due_date:         "2024-10-31",
    line_items: [
        { description: "Software Licenses", quantity: 10, unit_price: 120, total: 1200 },
        { description: "Support Hours", quantity: 5, unit_price: 200, total: 1000 }
    ],
    subtotal:         2200,
    tax:              176,
    total_due:        2376,
    currency:         "USD",
    payment_term:     "Net 30"
}
```

---

## Adding a new schema

Open `src/automations/extract.js` and add an entry to the `SCHEMAS` object:

```js
export const SCHEMAS = {
  // ... existing schemas ...

  job_offer: {
    description: "Extract fields from a job offer letter.",
    fields: {
      candidate_name: "string",
      role_title:     "string",
      start_date:     "string — ISO 8601",
      base_salary:    "number — annual USD",
      signing_bonus:  "number or null",
      equity:         "string or null",
    }
  }
};
```

Then call it with `--schema job_offer` or `schemaName: 'job_offer'`. No other
code changes required.

---

## Evals

Test cases live in `src/evals/cases/extract.cases.js`.

Scoring checks that all expected top-level fields are present in the output.
A score of 90%+ is required to pass (allowing for optional null fields).

**Adding a new test case:**

```js
{
  id: "extract/your-new-case",
  schema: "invoice",
  input: `Your document text here`,
  expectedFields: {
    vendor_name: "Vendor Name",
    total_due: 1234,
    currency: "USD",
    payment_terms: null
  }
}
```

Run evals:

```bash
npm run eval:extract
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Field returns `null` when value is present | Model missed it | Add example values to the field description: `"string — e.g. 'Net 30'"` |
| Numbers returned as strings | Model formatting issue | Add: "Always return monetary values as numbers, not strings" to system prompt |
| JSON parse error | Model wrapped in code fences | `extractJSON()` already strips these; if it fails, log the raw response |
| Wrong date format | Locale ambiguity | Add: "Normalize all dates to ISO 8601 format (YYYY-MM-DD)" to schema description |
| Missing nested array items | Document unclear structure | Pre-process the document to normalize formatting before extraction |

---

## Cost estimate

- Each call makes **1 API request**
- Typical invoice (1–2K chars): ~500 input tokens + ~200 output tokens
- Larger contracts (5–10K chars): ~2000 input tokens + ~400 output tokens
- Approximate cost: **~$0.002–0.010 per document** depending on size and schema
