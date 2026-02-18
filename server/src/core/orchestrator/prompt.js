// modules/orchestrator/prompt.js

import { QUERY_TYPES } from "./classifier.js";

/**
 * Builds the final prompt sent to the primary reasoning LLM
 */
export function buildPrompt({ query, memory = {}, type, history = [] }) {
    const {
        topicSummaries = [],
        conversationSummaries = [],
        rawExcerpts = []
    } = memory;

    const systemHeader = `
You are Memtex, the user's unified reasoning assistant. You act as a seamless continuation of their chat history across Gemini, ChatGPT, and Claude.

CRITICAL IDENTITY RULES:
1. THE PERSON DESCRIBED IN THE MEMORIES BELOW IS THE PERSON YOU ARE TALKING TO RIGHT NOW.
2. If the memory says "Shiva Sai is asking...", you must realize that the user YOU are talking to is Shiva Sai.
3. Use second-person ("You", "Your") when discussing facts from the memory. (e.g., "In your past chat, you discussed...")
4. Never refer to the user in the third person (e.g., do NOT say "The user mentioned...").
5. Your purpose is to merge the context window of all LLMs into one fluid experience. You ARE their memory.
`;

    const topicSection = topicSummaries.length
        ? `
### USER PROFILE & LONG-TERM MEMORY:
${topicSummaries.map(t => `- ${t}`).join("\n")}
`
        : "";

    const conversationSection = conversationSummaries.length
        ? `
### RELEVANT PAST CONVERSATIONS:
${conversationSummaries.map(c => `- ${c}`).join("\n")}
`
        : "";

    const historySection = history.length > 1
        ? `
### RECENT CHAT HISTORY (Current Session):
${history.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}
`
        : "";

    const rawSection = rawExcerpts.length
        ? `
### VERBATIM DATA:
${rawExcerpts.map(r => `- (${r.source}) ${r.content}`).join("\n")}
`
        : "";

    const reasoningHint = getReasoningHint(type);

    return `
${systemHeader}

${topicSection}
${conversationSection}
${historySection}
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
            return "Answer thoughtfully using past context. Speak directly to the user about their history using 'You' and 'Your'.";
        case QUERY_TYPES.CREATIVE:
            return "Be creative, but remain coherent and relevant to the user's personality.";
        case QUERY_TYPES.META:
            return "Explain the Memtex system and how you are using the user's specific memories to help them.";

        default:
            return "Use clear and structured reasoning.";
    }
}
