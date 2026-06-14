// Automation: Document classifier
//
// Assigns a document to one or more predefined categories and returns a
// structured JSON result including the category, confidence, and rationale.
//
// Usage:
//   node src/automations/classify.js --file ./examples/sample-doc.txt
//   node src/automations/classify.js --text "Your document text" --categories "Invoice,Contract,Report"

import { extractJSON } from "../utils/claude";
import { program } from "commander";
import fs from "fs/promises";
import chalk from "chalk";

// ----------------------------------------------------------------------------------
// Default taxonomy — override via --categories CLI flag or the `categories` param
// ----------------------------------------------------------------------------------

export const DEFAULT_CATEGORIES = [
    "Invoice",
    "Contract",
    "Report",
    "Email",
    "Meeting Notes",
    "Policy Document",
    "Technical Specification",
    "Other",
];

// ----------------------------------------------------------------------------
// Prompts
// ----------------------------------------------------------------------------

function buildSystemPrompt(categories) {
    return `You are a document classification expert. Given a document,
    classify it into exactly one of the following categories:
    ${categories.map((c) => ` - ${c}`).join("\n")}
    
    Return a JSON object with this exact shape:
    {
      "category": "<one of the categories above>",
      "confidence": <number between 0.0 and 1.0>,
      "rationale": "<one sentence explaining your choice>",
      "signals": ["<key phrase or feature that supports this classification>"]
    }`;
}

function buildUserPrompt(document) {
    return `Classify the following document:\n\n${document}`;
}

// ----------------------------------------------------------------------------
// Core function (importable for evals)
// ----------------------------------------------------------------------------

/**
 * Classify a document against a set of categories.
 * 
 * @param {string} document                                     - Raw document text
 * @param {object} [opts]
 * @param {string[]} [opts.categories]                          - Custom category list
 * @returns {{ category: string, confidence: number, rationale: string, signals: string[] }}
 */
export async function classify(document, { categories = DEFAULT_CATEGORIES } = {}) {
    const result = await extractJSON({
        system: buildSystemPrompt(categories),
        user: buildUserPrompt(document),
    });

    // Basic validation
    if (!categories.includes(result.category)) {
        throw new Error(
            `Claude returned an invalid category "${result.category}". Valid options: ${categories.join(", ")}`
        );
    }

    return result;
}

// ----------------------------------------------------------------------------
// CLI entry point
// ----------------------------------------------------------------------------

if (process.argv[1].endsWith("classify.js")) {
    program
        .option("--file <path>", "Path to a text file to classify")
        .option("--text <string>", "Inline text to classify")
        .option(
            "--categories <list>",
            "Comma-separated list of categories",
            (val) => val.split(",").map((c) => c.trim())
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

        const categories = opts.categories ?? DEFAULT_CATEGORIES;
        
        console.log(chalk.cyan("\n🗂️ Classifying document...\n"));

        const result = await classify(input, { categories });

        const confidencePct = Math.round(result.confidence * 100);
        const confidenceColor = confidencePct >= 80 ? chalk.green : confidencePct >= 50 ? chalk.yellow : chalk.red;

        console.log(`${chalk.bold("Category:")}   ${chalk.bold.blue(result.category)}   ${confidenceColor(`(${confidencePct}% confidence)`)}`);
        console.log(`${chalk.bold("Rationale:")}   ${result.rationale}`);
        console.log(`${chalk.bold("Signals:")}`);
        result.signals.forEach((s) => console.log(`  • ${s}`));
    })();
}