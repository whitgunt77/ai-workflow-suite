// Centralized Claude client + shared helpers used by all automations

import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to your .env file or environment."
    );
}

export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Single-turn completion

/**
 * Call the Claude API with a system prompt and user message.
 * Returns the raw text content of the first response block.
 * 
 * @param {object} opts
 * @param {string} opts.system           - System-level instruction
 * @param {string} opts.user             - User message / document content
 * @param {string} [opts.model]          - Model ID (defaults to claude-sonnet-4-6)
 * @param {number} [opts.maxTokens]      - Max tokens to generate (default 1024)
 */
export async function complete({ system, user, model, maxTokens = 1024 }) {
    const response = await claude.messages.create({
        model: model ?? "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) throw new Error("Claude returned no text block");
    return textBlock.text.trim();
}

// Prompt chaining

/**
 * Run a sequence of prompts where each step receives the previous step's
 * output injected into the next user message via the {{previous}} placeholder.
 * 
 * @param {Array<{system: string, user: string}>} steps - Ordered chain steps
 * @param {string} input - Initial document / text fed to step 1
 * @param {object} [opts]
 * @param {boolean} [opts.verbose] - Log intermediate outputs
 */
export async function chain(steps, input, { verbose = false } = {}) {
    let current = input;
    const outputs = [];

    for (let i = 0; i < steps.length; i++) {
        const { system, user } = steps[i];
        const userMsg = user.replace("{{previous}}", current);

        if (verbose) {
            console.log(`\n-- Chain step ${i + 1}/${steps.length} --`);
            console.log(`System: ${system.slice(0, 80)}...`);
        }

        current = await complete({ system, user: userMsg });
        outputs.push(current);

        if (verbose) console.log(`Output: ${current.slice(0, 120)}...`);
    }

    return { final: current, outputs };
}

// JSON extraction helper

/**
 * Ask Claude to return a JSON object matching a schema description.
 * Automatically strips any markdown code fences and parses the result.
 */
export async function extractJSON({ system, user, model }) {
    const rawSystem = `${system}
    
    IMPORTANT: Respond ONLY with valid JSON — no markdown fences, no commentary, no preamble.`;

    const text = await complete({ system: rawSystem, user, model });

    // Strip optional ```json ... ``` wrappers just in case
    const clean = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

    try {
        return JSON.parse(clean);
    } catch {
        throw new Error(
            `Claude did not return valid JSON.\n\nRaw response:\n${text}`
        );
    }
}