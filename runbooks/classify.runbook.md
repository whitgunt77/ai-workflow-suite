# Runbook: Document Classifier

**Automation:** `classify`
**File:** `src/automations/classify.js`
**Owner:** _your team_

---

## What it does

Assigns a document to exactly one category from a predefined taxonomy and
returns a structured JSON result with:

- The **category** name
- A **confidence score** (0.0–1.0)
- A one-sentence **rationale**
- A list of **signals** (key phrases that drove the decision)

---

## Default categories

Invoice • Contract • Report • Email • Meeting Notes • Policy Document • Technical Specification • Other

You can override these at runtime with `--categories` or by passing a custom
array to the `classify()` function.

---

## How to run it

### From the command line

```bash
# Using default categories
node src/automations/classify.js --file ./examples/sample-doc.txt

# Using custom categories
node src/automations/classify.js \
  --file ./doc.txt \
  --categories "Invoice,Contract,Proposal,Other"

# From inline text
node src/automations/classify.js --text "Your document here"
```

### From another script

```js
import { classify, DEFAULT_CATEGORIES } from './src/automations/classify.js';

// With default categories
const result = await classify(documentText);

// With a custom taxonomy
const result = await classify(documentText, {
  categories: ["RFP", "SOW", "Invoice", "Other"]
});

console.log(result.category);     // "Invoice"
console.log(result.confidence);   // 0.95
console.log(result.rationale);    // "The document contains..."
console.log(result.signals);      // ["invoice number", "total due", ...]
```

---

## Output format

```js
{
  category:   "Invoice",
  confidence: 0.95,
  rationale:  "The document contains an invoice number, line items with prices, and a total due amount.",
  signals:    ["INV-2024-0892", "Total Due", "line items", "payment terms"]
}
```

---

## Tuning the taxonomy

**Add or rename categories:** Update `DEFAULT_CATEGORIES` in `classify.js`, or
pass a custom list at call time. No prompt changes required — the list is
injected into the system prompt automatically.

**Change the output schema:** Edit the JSON shape description inside
`buildSystemPrompt()`. The function always validates that the returned category
is in the allowed list.

**Adjust confidence thresholds for downstream routing:**

```js
const result = await classify(doc);

if (result.confidence < 0.6) {
  // Route to human review queue
} else {
  // Route to automated pipeline
}
```

After any change, run evals:

```bash
npm run eval:classify
```

---

## Evals

Test cases live in `src/evals/cases/classify.cases.js`.

Each case specifies an `expectedCategory`. Scoring is binary (1.0 = correct,
0.0 = wrong). The harness also reports the model's actual output when a case
fails, making it easy to debug prompt issues.

**Adding a new test case:**

```js
{
  id: "classify/your-new-case",
  categories: DEFAULT_CATEGORIES,
  expectedCategory: "Contract",
  input: `Your document text here`,
}
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Wrong category returned | Ambiguous document | Add more specific category descriptions to the system prompt |
| `InvalidCategory` error | Model returned a category not in the list | Strengthen: "You MUST pick exactly one of the listed categories" |
| Low confidence on clear documents | Model uncertain due to vague taxonomy | Rename categories to be more descriptive |
| Slow responses | Large document | Truncate input to first 2000 chars for classification; it rarely needs the full doc |

---

## Cost estimate

- Each call makes **1 API request**
- Typical document (2–4K chars): ~600 input tokens + ~100 output tokens
- Approximate cost at current pricing: **~$0.001–0.003 per document**