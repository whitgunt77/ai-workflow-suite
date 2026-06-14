# Runbook: Document Summarizer

**Automation:** `summarize`
**File:** `src/automations/summarize.js`
**Owner:** _your team_

---

## What it does

Takes a raw text document and returns two things:

1. **Key points** — a bullet list of the most important facts, decisions, and numbers
2. **Executive summary** — a 2–4 sentence synthesis suitable for leadership review

It uses a **two-step prompt chain**: step 1 extracts key points, step 2 turns
those points into a summary. The intermediate output (key points) is available
in the response object, which is useful for debugging when the final summary
looks off.

---

## When to use it

- Processing inbound documents before routing them (combine with `classify`)
- Generating briefings from long reports or meeting transcripts
- Reducing the time teammates spend skimming documents for status updates

---

## How to run it

### From the command line

```bash
# From a file
node src/automations/summarize.js --file ./examples/sample-doc.txt

# From inline text
node src/automations/summarize.js --text "Your document content here"

# From stdin (pipe)
cat my-report.txt | node src/automations/summarize.js

# With verbose output (shows intermediate chain steps)
node src/automations/summarize.js --file my-doc.txt --verbose
```

### From another script

```js
import { summarize } from './src/automations/summarize.js';

const { summary, keyPoints, inputLength } = await summarize(documentText);
console.log(summary);
```

---

## Output format

```js
{
  summary: "2–4 sentence executive summary string",
  keyPoints: "Bullet-point list as a multi-line string",
  inputLength: 4823  // character count of the input
}
```

---

## Prompt chain

| Step | Role | Goal |
|------|------|------|
| 1 | Document analyst | Extract key points as a bullet list |
| 2 | Executive assistant | Turn bullet points into an executive summary |

The chain is defined in `SUMMARIZE_CHAIN` (exported). You can modify or extend
it without touching any other logic.

---

## Tuning the prompts

The prompts live at the top of `summarize.js` in the `SUMMARIZE_CHAIN` array.
Each entry has a `system` and a `user` field.

**Common edits:**

- **Change tone** → adjust the persona in the `system` prompt of step 2
  (e.g. "You are a risk analyst…" for a more cautious summary)
- **Add a third step** → append a new entry to `SUMMARIZE_CHAIN` that takes
  `{{previous}}` and performs additional transformation
- **Restrict length** → add "Limit your response to 3 bullet points" to step 1's system prompt
- **Change language** → add "Respond in Spanish" to both system prompts

After any prompt change, run the evals to check for regressions:

```bash
npm run eval:summarize
```

---

## Evals

Test cases live in `src/evals/cases/summarize.cases.js`.

Each case specifies an `expectedKeywords` list — the eval checks that all
expected keywords appear in the combined output (key points + summary).

**Adding a new test case:**

```js
{
  id: "summarize/your-new-case",
  input: `Your document text here`,
  expectedKeywords: ["word1", "key phrase", "number"],
}
```

Run evals:

```bash
npm run eval:summarize
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Summary misses key facts | Step 1 didn't extract them | Add "Pay special attention to…" to step 1 system prompt |
| Summary is too verbose | Step 2 ignoring length instruction | Strengthen: "Respond in exactly 2 sentences" |
| Output seems hallucinated | Model adding info not in doc | Add "Do not add information not present in the bullet points" to step 2 |
| Error: `Claude returned no text block` | API issue or empty input | Check `ANTHROPIC_API_KEY` and that input is non-empty |

---

## Cost estimate

- Each call makes **2 API requests** (one per chain step)
- Typical document (2–4K chars): ~800 input tokens + ~300 output tokens per step
- Approximate cost at current pricing: **~$0.003–0.008 per document**