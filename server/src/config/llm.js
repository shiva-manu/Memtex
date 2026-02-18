import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "./env.js";

/**
 * Creates an LLM instance with a specific key and model.
 */
function createLLM(apiKey, model = "gemini-1.5-flash", temperature = 0.3) {
    return new ChatGoogleGenerativeAI({
        model: model,
        apiVersion: "v1beta",
        temperature: temperature,
        apiKey: apiKey,
        timeout: 30000,
        maxRetries: 0, // We handle retries manually to switch keys/models
    });
}

/**
 * A wrapper that handles 429 (Rate Limit) by rotating keys and models.
 */
async function invokeWithFallback(prompt, temperature = 0.3) {
    // Unique keys from all sources
    const keys = Array.from(new Set([
        ...env.GOOGLE_API_KEYS,
        env.GOOGLE_API_KEY,
        env.GOOGLE_EMBED_API_KEY
    ])).filter(Boolean);

    const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b"];

    let lastError = null;

    for (const key of keys) {
        for (const model of models) {
            try {
                const llm = createLLM(key, model, temperature);
                return await llm.invoke(prompt);
            } catch (err) {
                lastError = err;
                if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
                    console.log(`[LLM Fallback] Rate limited on ${model} with current key. Trying next option...`);
                    continue;
                }
                throw err; // Re-throw if it's not a rate limit error
            }
        }
    }
    throw lastError;
}

// Export the dynamic invoker for classification
export const smartInvoke = invokeWithFallback;

// Keep these for streaming (streaming is harder to fallback mid-stream, 
// so we'll just give them the best starting point)
export const reasoningLLM = createLLM(env.GOOGLE_API_KEY, "gemini-1.5-flash", 0.3);
export const cheapLLM = createLLM(env.GOOGLE_API_KEY, "gemini-1.5-flash", 0);

// Helper to get all unique keys as a pool
export function getKeyPool() {
    return Array.from(new Set([
        ...env.GOOGLE_API_KEYS,
        env.GOOGLE_API_KEY,
        env.GOOGLE_EMBED_API_KEY
    ])).filter(Boolean);
}

// Helper to get a streaming LLM with an alternative key if needed
export function getStreamingLLM(index = 0) {
    const pool = getKeyPool();
    // Handle both boolean (from old code) and numeric index
    const idx = (typeof index === "boolean") ? (index ? 1 : 0) : index;
    const key = pool[idx % pool.length] || pool[0];
    return createLLM(key, "gemini-1.5-flash", 0.3);
}