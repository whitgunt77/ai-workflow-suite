# AI Workflow Automation Suite

Claude-powered automations for repetitive document workflows — prompt-chaining
summaries, classification, and structured data extraction — with built-in eval
harnesses and runbooks.

---

## Automations

| Automation | What it does | Runbook |
|-----------|-------------|---------|
| `summarize` | Two-step prompt chain: extract key points → executive summary | [runbooks/summarize.runbook.md](runbooks/summarize.runbook.md) |
| `classify` | Assign a document to a category with confidence score | [runbooks/classify.runbook.md](runbooks/classify.runbook.md) |
| `extract` | Pull named fields from a document into structured JSON | [runbooks/extract.runbook.md](runbooks/extract.runbook.md) |

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Add your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 3. Try each automation
npm run summarize -- --file ./examples/sample-doc.txt
npm run classify  -- --file ./examples/sample-doc.txt
npm run extract   -- --file ./examples/invoice.txt --schema invoice

# 4. Run all evals
npm run eval
```

---

## Project structure

ai-workflow-suite/
├── .env ← ANTHROPIC_API_KEY (never commit this)
├── .gitignore
├── package.json
├── README.md
|
├── examples/
| ├── invoice.txt ⬅ Sample invoice for testing extract
| └──  sample-doc.txt ⬅ Sample strategy doc for testing summarize/classify
|
├── runbooks/
| ├── summarize.runbook.md ⬅ How to run, tune, and debug summarize
| ├── classify.runbook.md ⬅ How to run, tune, and debug classify
| └──  extract.runbook.md ⬅ How to run, tune, and debug extract
|
├── src/
| ├── utils/
| | └── claude.js ⬅ Shared Claude client: complete(),chain(),extractJSON()
| ├── automations/
| | ├── summarize.js ⬅ Prompt-chaining summarizer
| | ├── classify.js ⬅ Document classifier
| | └──  extract.js ⬅ Structured data extractor
| └── evals/
| | ├── run-evals.js ⬅ Eval harness runner
| | └── cases/
| | | ├── summarize.cases.js
| | | ├── classify.cases.js
└──── └──  extract.cases.js

---

## Running automations

Each automation works as a CLI command or as an importable module.

### Summarize
```bash
npm run summarize -- --file ./examples/sample-doc.txt
npm run summarize -- --file ./examples/sample-doc.txt --verbose
npm run summarize -- --text "Paste your document text here"
```

### Classify
```bash
npm run classify -- --file ./examples/sample-doc.txt
npm run classify -- --file ./examples/invoice.txt
npm run classify -- --text "Your document" --categories "Invoice,Contract,Report,Other"
```

### Extract
```bash
npm run extract -- --file ./examples/invoice.txt --schema invoice
npm run extract -- --file ./contract.txt --schema contract
npm run extract -- --file ./meeting-notes.txt --schema meeting
```

---

## Running evals

Evals measure output quality and catch regressions when prompts are updated.

```bash
npm run eval                 # All automations
npm run eval:summarize       # Summarize only
npm run eval:classify        # Classify only
npm run eval:extract         # Extract only
```

### How scoring works

| Automation | Metric |
|-----------|--------|
| `summarize` | Keyword coverage — % of expected terms present in output |
| `classify` | Exact match — correct category = 1.0, wrong = 0.0 |
| `extract` | Field presence — % of expected fields populated |

Exit code is `1` if any case fails, making evals usable in CI.

---

## Using automations in your own scripts

```js
import { summarize } from './src/automations/summarize.js';
import { classify }  from './src/automations/classify.js';
import { extract }   from './src/automations/extract.js';

const doc = "Your document text here";

const { summary, keyPoints } = await summarize(doc);
const { category, confidence } = await classify(doc);
const fields = await extract(doc, { schemaName: 'invoice' });
```

---

## Shared utilities (`src/utils/claude.js`)

Three helpers power all automations:

```js
// Single-turn completion
const text = await complete({ system, user });

// Prompt chain — {{previous}} passes prior step output forward
const { final, outputs } = await chain(steps, initialInput);

// JSON extraction — strips code fences and parses automatically
const obj = await extractJSON({ system, user });
```

---

## Adding a new automation

1. Create `src/automations/your-automation.js`
2. Export a core function: `export async function yourAutomation(input, opts) {}`
3. Add a CLI entry point at the bottom of the file
4. Add eval cases in `src/evals/cases/your-automation.cases.js`
5. Wire it into `src/evals/run-evals.js`
6. Write a runbook in `runbooks/your-automation.runbook.md`

---

## npm scripts

| Script | Command |
|--------|---------|
| `npm run summarize` | Run the summarize automation |
| `npm run classify` | Run the classify automation |
| `npm run extract` | Run the extract automation |
| `npm run eval` | Run all eval suites |
| `npm run eval:summarize` | Run summarize evals only |
| `npm run eval:classify` | Run classify evals only |
| `npm run eval:extract` | Run extract evals only |

---

## Environment variables

| Variable | Required | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key |

Get your key at [console.anthropic.com](https://console.anthropic.com).

---

## Requirements

- Node.js 18+
- An Anthropic API key with available credits