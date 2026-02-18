// modules/orchestrator/classifier.js

import { cheapLLM } from "../../config/llm.js";

/**
 * Possible query types
 */
export const QUERY_TYPES = {
    FACTUAL: "FACTUAL",
    REASONING: "REASONING",
    REFLECTIVE: "REFLECTIVE",
    CREATIVE: "CREATIVE",
    META: "META"
};

/**
 * Classifies a user query into a predefined type
 * @param {string} query
 * @returns {Promise<string>}
 */
export async function classifyQuery(query) {
    const prompt = `
Classify the following user query into exactly ONE of these categories:

FACTUAL - asking for facts, definitions, direct answers
REASONING - requires logic, architecture, decisions, tradeoffs
REFLECTIVE - personal thinking, memory, past context, introspection
CREATIVE - storytelling, naming, writing, ideation
META - questions about the system, AI behavior, or process itself

Return ONLY the category name.

Query:
"""${query}"""
`;

    try {
        const response = await cheapLLM.invoke(prompt);
        const label = response.content.trim().toUpperCase();

        if (Object.values(QUERY_TYPES).includes(label)) {
            return label;
        }

        // Safe fallback
        return QUERY_TYPES.REASONING;
    } catch (err) {
        console.error("Query classification failed:", err);
        return QUERY_TYPES.REASONING;
    }
}
