import { OllamaEmbeddings } from "@langchain/ollama";
import crypto from "crypto";

function getEmbedder() {
    return new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    });
}

/**
 * Embed single text with Ollama
 */
export async function embedText(text) {
    if (!text || typeof text !== "string") {
        throw new Error("Invalid text for embedding");
    }

    try {
        const embedder = getEmbedder();
        return await embedder.embedQuery(clean(text));
    } catch (err) {
        console.error("[Ollama Embedding] Error:", err.message);
        throw err;
    }
}

/**
 * Embed multiple texts with Ollama
 */
export async function embedBatch(texts = []) {
    if (!texts.length) return [];

    try {
        const embedder = getEmbedder();
        return await embedder.embedDocuments(texts.map(clean));
    } catch (err) {
        console.error("[Ollama Embedding Batch] Error:", err.message);
        throw err;
    }
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