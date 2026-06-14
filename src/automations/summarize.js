// Automation: Prompt-chaining summarizer
//
// Runs a two-step chain:
//   Step 1 — Extract key points from the document
//   Step 2 — Synthesize those points into a concise executive summary
//
// Usage:
//   node src/automations/summarize.js --file ./examples/sample-doc.txt
//   node src/automations/summarize.js --text "Paste raw text here..."

import { chain } from "../utils/claude.js";
import { program } from "commander";
import fs from "fs/promises";
import chalk from "chalk";

// ----------------------------------------------------------------------------
// Prompt chain definition
// Each step receives `{{previous}}` = the prior step's output.
// ----------------------------------------------------------------------------

export const SUMMARIZE_CHAIN = [
    {
        // Step 1: Extract structured key points
        system: `You are a precise document analyst. Your job is to read a document and extract
        the most important information as a structured list of bullet points. Focus on facts,
        decisions, numbers, and action items. Avoid filler language.`,

        user: `Extract the key points from this document as a bullet list: {{previous}}`,
    },
    {
        // Step 2: Turn bullet points into a crisp executive summary
        system: `You are a senior executive assistant who writes concise, clear briefings.
        Given a structured list of key points, write a 2-4 sentence executive summary.
        Use plain language. Do not add information not present in the bullet points.`,

        user: `Write an executive summary based on these key points: {{previous}}`,
    },
];

// ----------------------------------------------------------------------------
// Core function (importable for evals)
// ----------------------------------------------------------------------------

/**
 * Summarize a document using a two-step prompt chain.
 * 
 * @param {string} document — Raw document text
 * @param {object} [opts]
 * @param {boolean} [opts.verbose] — Print intermediate chain outputs
 * @returns {{ summary: string, keyPoints: string, inputLength: number }}
 */
export async function summarize(document, { verbose = false } = {}) {
    const { final, outputs } = await chain(SUMMARIZE_CHAIN, document, {
        verbose,
    });

    return {
        summary: final,
        keyPoints: outputs[0],     // Step 1 bullet points
        inputLength: document.length,
    };
}

// ----------------------------------------------------------------------------
// CLI entry point
// ----------------------------------------------------------------------------

if (process.argv[1].endsWith("summarize.js")) {
    program
        .option("--file <path>", "Path to a text file to summarize")
        .option("--text <string>", "Inline text to summarize")
        .option("--verbose", "Print intermediate chain steps")
        .parse(process.argv);

    const opts = program.opts();

    (async () => {
        let input;

        if (opts.file) {
            input = await fs.readFile(opts.file, "utf8");
        } else if (opts.text) {
            input = opts.text;
        } else {
            // Read from stdin if neither flag is provided
            const chunks = [];
            for await (const chunk of process.stdin) chunks.push(chunk);
            input = Buffer.concat(chunks).toString("utf8");
        }

        if (!input.trim()) {
            console.error("No input provided. Use --file, --text, or pipe via stdin.");
            process.exit(1);
        }

        console.log(chalk.cyan("\n📄 Summarizing document...\n"));

        const result = await summarize(input, { verbose: opts.verbose });

        console.log(chalk.bold.green("-- Key Points ---------------------------------------------"));
        console.log(result.keyPoints);
        console.log(chalk.bold.green("\n-- Executive Summary ---------------------------------------"));
        console.log(result.summary);
        console.log(
            chalk.gray(
                `\n[Input: ${result.inputLength} chars | Chain: ${SUMMARIZE_CHAIN.length} steps]`
            )
        );
    })();
}