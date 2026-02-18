// modules/orchestrator/prompt.js

import { QUERY_TYPES } from "./classifier.js";

/**
 * Builds the final prompt sent to the primary reasoning LLM
 */
export function buildPrompt({ query, memory = {}, type }) {
    const {
        topicSummaries = [],
        conversationSummaries = [],
        rawExcerpts = []
    } = memory;

    const systemHeader = `
You are a unified reasoning assistant.

You have access to memories aggregated from multiple AI models
(ChatGPT, Gemini, Claude). These memories may differ or conflict.

Rules:
- Prefer consistency and evidence over confidence
- If sources conflict, explicitly mention it
- Do NOT invent memory that is not provided
- Use clear reasoning appropriate to the query type
`;

    const topicSection = topicSummaries.length
        ? `
LONG-TERM MEMORY:
${topicSummaries.map(t => `- ${t}`).join("\n")}
`
        : "";

    const conversationSection = conversationSummaries.length
        ? `
RELEVANT PAST CONTEXT:
${conversationSummaries.map(c => `- ${c}`).join("\n")}
`
        : "";

    const rawSection = rawExcerpts.length
        ? `
RAW EXCERPTS (verbatim, may be partial):
${rawExcerpts.map(r => `- (${r.source}) ${r.content}`).join("\n")}
`
        : "";

    const reasoningHint = getReasoningHint(type);

    return `
${systemHeader}

${topicSection}
${conversationSection}
${rawSection}

REASONING MODE:
${reasoningHint}

USER QUESTION:
${query}
`.trim();
}

/**
 * Adjusts reasoning instructions based on query type
 */
function getReasoningHint(type) {
    switch (type) {
        case QUERY_TYPES.FACTUAL:
            return "Provide a concise, accurate, fact-based answer.";
        case QUERY_TYPES.REASONING:
            return "Explain your reasoning step by step and justify decisions.";
        case QUERY_TYPES.REFLECTIVE:
            return "Answer thoughtfully using past context and long-term memory.";
        case QUERY_TYPES.CREATIVE:
            return "Be creative, but remain coherent and relevant.";
        case QUERY_TYPES.META:
            return "Explain the system or process clearly and transparently.";
        default:
            return "Use clear and structured reasoning.";
    }
}
