import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import crypto from "crypto";
import { getKeyPool } from "../../config/llm.js";

function getEmbedder(apiKey) {
    return new GoogleGenerativeAIEmbeddings({
        apiKey: apiKey,
        model: "text-embedding-004", // Fixed model name
        apiVersion: "v1beta",
    });
}

/**
 * Embed single text with fallback
 */
export async function embedText(text) {
    if (!text || typeof text !== "string") {
        throw new Error("Invalid text for embedding");
    }

    const pool = getKeyPool();
    let lastError = null;

    for (let i = 0; i < pool.length; i++) {
        try {
            const embedder = getEmbedder(pool[i]);
            return await embedder.embedQuery(clean(text));
        } catch (err) {
            lastError = err;
            if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
                console.warn(`[Embedding] Key ${i} rate limited. Retrying with next key...`);
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

/**
 * Embed multiple texts with fallback
 */
export async function embedBatch(texts = []) {
    if (!texts.length) return [];

    const pool = getKeyPool();
    let lastError = null;

    for (let i = 0; i < pool.length; i++) {
        try {
            const embedder = getEmbedder(pool[i]);
            return await embedder.embedDocuments(texts.map(clean));
        } catch (err) {
            lastError = err;
            if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
                console.warn(`[Embedding Batch] Key ${i} rate limited.`);
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

/**
 * Small cleanup to improve embedding quality
 */
function clean(text) {
    return text
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000); // prevent huge tokens
}

/**
 * Generate deterministic memory id
*/

export function memoryId(text) {
    return crypto.createHash("sha1").update(text).digest("hex");
}