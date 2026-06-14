// src/automations/extract.js
// Automation: Structured data extractor
//
// Pulls named fields from unstructured documents and returns them as a
// typed JSON object. Ships with three built-in schemas; add your own easily.
//
// Usage:
//   node src/automations/extract.js --file ./examples/invoice.txt --schema invoice
//   node src/automations/extract.js --file ./examples/contract.txt --schema contract
//   node src/automations/extract.js --file ./examples/meeting.txt --schema meeting

import { extractJSON } from "../utils/claude.js";
import { program } from "commander";
import fs from "fs/promises";
import chalk from "chalk";
 
// ---------------------------------------------------------------------------
// Built-in extraction schemas
// Each schema tells Claude exactly what fields to look for and their types.
// ---------------------------------------------------------------------------
 
export const SCHEMAS = {
  invoice: {
    description: "Extract structured fields from an invoice document.",
    fields: {
      vendor_name: "string — name of the company or person issuing the invoice",
      invoice_number: "string — invoice or reference number",
      invoice_date: "string — date of the invoice (ISO 8601 if possible)",
      due_date: "string or null — payment due date",
      line_items: [
        {
          description: "string — item description",
          quantity: "number",
          unit_price: "number",
          total: "number",
        },
      ],
      subtotal: "number",
      tax: "number or null",
      total_due: "number",
      currency: "string — 3-letter ISO code, e.g. USD",
      payment_terms: "string or null",
    },
  },
 
  contract: {
    description: "Extract key metadata from a legal contract or agreement.",
    fields: {
      parties: ["string — full legal name of each party"],
      effective_date: "string — contract start date",
      expiration_date: "string or null — contract end date if present",
      contract_type: "string — e.g. NDA, SaaS Agreement, Employment Contract",
      governing_law: "string or null — jurisdiction / governing law",
      key_obligations: ["string — one sentence per major obligation"],
      termination_conditions: "string or null — how the contract can be ended",
      renewal_terms: "string or null — auto-renew or extension clauses",
    },
  },
 
  meeting: {
    description: "Extract structured information from meeting notes.",
    fields: {
      meeting_date: "string — date of the meeting",
      attendees: ["string — full name or role of each attendee"],
      topics_discussed: ["string — one phrase per agenda topic covered"],
      decisions: ["string — concrete decisions made"],
      action_items: [
        {
          task: "string — what needs to be done",
          owner: "string or null — person responsible",
          due_date: "string or null — target completion date",
        },
      ],
      next_meeting: "string or null — scheduled date/time of next meeting",
    },
  },
};
 
// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------
 
function buildSystemPrompt(schema) {
  const fieldJSON = JSON.stringify(schema.fields, null, 2);
 
  return `You are a precise data extraction specialist.
${schema.description}
 
Return a JSON object that exactly matches the following field schema.
For fields described as "null" use JSON null if the information is absent.
Do not invent data — only extract what is explicitly present in the document.
 
Schema:
${fieldJSON}`;
}
 
// ---------------------------------------------------------------------------
// Core function (importable for evals)
// ---------------------------------------------------------------------------
 
/**
 * Extract structured data from a document using a named or custom schema.
 *
 * @param {string} document     - Raw document text
 * @param {object} opts
 * @param {string} [opts.schemaName]   - Key into SCHEMAS (e.g. "invoice")
 * @param {object} [opts.customSchema] - Custom schema object (overrides schemaName)
 * @returns {object} Extracted JSON matching the schema
 */
export async function extract(document, { schemaName, customSchema } = {}) {
  const schema =
    customSchema ??
    SCHEMAS[schemaName] ??
    (() => {
      throw new Error(
        `Unknown schema "${schemaName}". Available: ${Object.keys(SCHEMAS).join(", ")}`
      );
    })();
 
  return extractJSON({
    system: buildSystemPrompt(schema),
    user: `Extract structured data from this document:\n\n${document}`,
  });
}
 
// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
 
if (process.argv[1].endsWith("extract.js")) {
  program
    .option("--file <path>", "Path to a text file to extract from")
    .option("--text <string>", "Inline document text")
    .option(
      "--schema <name>",
      `Schema to use: ${Object.keys(SCHEMAS).join(", ")}`,
      "invoice"
    )
    .parse(process.argv);
 
  const opts = program.opts();
 
  (async () => {
    let input;
 
    if (opts.file) {
      input = await fs.readFile(opts.file, "utf8");
    } else if (opts.text) {
      input = opts.text;
    } else {
      const chunks = [];
      for await (const chunk of process.stdin) chunks.push(chunk);
      input = Buffer.concat(chunks).toString("utf8");
    }
 
    if (!input.trim()) {
      console.error("No input provided. Use --file, --text, or pipe via stdin.");
      process.exit(1);
    }
 
    console.log(chalk.cyan(`\n🔍 Extracting data using schema: ${chalk.bold(opts.schema)}\n`));
 
    const result = await extract(input, { schemaName: opts.schema });
 
    console.log(chalk.bold.green("── Extracted Data ──────────────────────"));
    console.log(JSON.stringify(result, null, 2));
  })();
}