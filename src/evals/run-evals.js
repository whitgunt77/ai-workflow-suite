// src/evals/run-evals.js
// Evaluation harness — measures output quality and catches prompt regressions
//
// Each automation has a companion eval file in src/evals/cases/
// that defines test cases with inputs + expected outputs.
//
// Usage:
//   node src/evals/run-evals.js                        — run all evals
//   node src/evals/run-evals.js --automation=summarize  — run one automation
//   node src/evals/run-evals.js --automation=classify
//   node src/evals/run-evals.js --automation=extract

import { program } from "commander";
import chalk from "chalk";
import { summarizeCases } from "./cases/summarize.cases.js";
import { classifyCases } from "./cases/classify.cases.js";
import { extractCases } from "./cases/extract.cases.js";
import { summarize } from "../automations/summarize.js";
import { classify } from "../automations/classify.js";
import { extract } from "../automations/extract.js";

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether expected keywords/phrases appear in the actual output.
 * Returns a score between 0.0 and 1.0.
 */
function scoreKeywordCoverage(actual, expectedKeywords) {
  if (!expectedKeywords || expectedKeywords.length === 0) return 1.0;
  const lc = actual.toLowerCase();
  const hits = expectedKeywords.filter((kw) => lc.includes(kw.toLowerCase()));
  return hits.length / expectedKeywords.length;
}

/**
 * Checks exact equality for a string field.
 */
function scoreExact(actual, expected) {
  return actual === expected ? 1.0 : 0.0;
}

/**
 * Checks that all expected keys exist in an extracted object and
 * non-null values are truthy.
 */
function scoreFieldPresence(actualObj, expectedFields) {
  const keys = Object.keys(expectedFields);
  const hits = keys.filter((k) => {
    if (expectedFields[k] === null) return true; // null is always acceptable
    return actualObj[k] !== undefined && actualObj[k] !== null;
  });
  return hits.length / keys.length;
}

// ---------------------------------------------------------------------------
// Automation-specific eval runners
// ---------------------------------------------------------------------------

async function evalSummarize(cases) {
  const results = [];

  for (const tc of cases) {
    try {
      const output = await summarize(tc.input);
      const score = scoreKeywordCoverage(
        output.summary + " " + output.keyPoints,
        tc.expectedKeywords
      );
      results.push({ id: tc.id, status: "pass", score, output, error: null });
    } catch (error) {
      results.push({ id: tc.id, status: "error", score: 0, output: null, error: error.message });
    }
  }

  return results;
}

async function evalClassify(cases) {
  const results = [];

  for (const tc of cases) {
    try {
      const output = await classify(tc.input, { categories: tc.categories });
      const score = scoreExact(output.category, tc.expectedCategory);
      const passed = score === 1.0;
      results.push({
        id: tc.id,
        status: passed ? "pass" : "fail",
        score,
        output,
        error: null,
        detail: passed
          ? null
          : `Expected "${tc.expectedCategory}", got "${output.category}"`,
      });
    } catch (error) {
      results.push({ id: tc.id, status: "error", score: 0, output: null, error: error.message });
    }
  }

  return results;
}

async function evalExtract(cases) {
  const results = [];

  for (const tc of cases) {
    try {
      const output = await extract(tc.input, { schemaName: tc.schema });
      const score = scoreFieldPresence(output, tc.expectedFields);
      const passed = score >= 0.9;
      results.push({
        id: tc.id,
        status: passed ? "pass" : "fail",
        score,
        output,
        error: null,
      });
    } catch (error) {
      results.push({ id: tc.id, status: "error", score: 0, output: null, error: error.message });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Report printer
// ---------------------------------------------------------------------------

function printReport(automationName, results) {
  const total = results.length;
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const errors = results.filter((r) => r.status === "error").length;
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;

  console.log(
    chalk.bold(`\n╔══ ${automationName.toUpperCase()} EVALS ` +
      "═".repeat(Math.max(0, 40 - automationName.length)) + "╗")
  );

  for (const r of results) {
    const icon =
      r.status === "pass" ? chalk.green("✓") :
      r.status === "fail" ? chalk.red("✗") :
      chalk.yellow("⚠");

    const scoreStr = `[${(r.score * 100).toFixed(0)}%]`;
    console.log(`  ${icon} ${chalk.bold(r.id.padEnd(30))} ${scoreStr}`);

    if (r.detail) console.log(chalk.gray(`       → ${r.detail}`));
    if (r.error)  console.log(chalk.red(`       → ERROR: ${r.error}`));
  }

  const summaryColor =
    passed === total ? chalk.green :
    passed >= total / 2 ? chalk.yellow :
    chalk.red;

  console.log(
    summaryColor(
      `\n  ${passed}/${total} passed  |  ${failed} failed  |  ${errors} errors  |  avg score ${(avgScore * 100).toFixed(1)}%`
    )
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

program
  .option("--automation <name>", "Run evals for a single automation (summarize|classify|extract)")
  .parse(process.argv);

const { automation } = program.opts();

(async () => {
  const suites = [];

  if (!automation || automation === "summarize")
    suites.push({ name: "summarize", fn: () => evalSummarize(summarizeCases) });

  if (!automation || automation === "classify")
    suites.push({ name: "classify",  fn: () => evalClassify(classifyCases) });

  if (!automation || automation === "extract")
    suites.push({ name: "extract",   fn: () => evalExtract(extractCases) });

  if (suites.length === 0) {
    console.error(`Unknown automation "${automation}". Choose: summarize, classify, extract`);
    process.exit(1);
  }

  console.log(chalk.cyan(`\n🧪 Running ${suites.length} eval suite(s)…`));

  let totalPassed = 0;
  let totalCases = 0;

  for (const suite of suites) {
    const results = await suite.fn();
    printReport(suite.name, results);
    totalPassed += results.filter((r) => r.status === "pass").length;
    totalCases  += results.length;
  }

  console.log(
    chalk.bold(`\n══ OVERALL: ${totalPassed}/${totalCases} test cases passed ══\n`)
  );

  if (totalPassed < totalCases) process.exit(1);
})();