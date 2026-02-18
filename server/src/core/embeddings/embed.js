import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { env } from "../../config/env.js";
import crypto from "crypto";

const embedder = new GoogleGenerativeAIEmbeddings({
    apiKey: env.GOOGLE_API_KEY,
    model: "gemini-embedding-001", // Using available model
    apiVersion: "v1beta",
});





/**
 * Embed single text
*/

export async function embedText(text) {
    if (!text || typeof text !== "string") {
        throw new Error("Invalid text for embedding");
    }
    return embedder.embedQuery(clean(text));
}

/**
 * Embed multiple texts
*/

export async function embedBatch(texts = []) {
    if (!texts.length) return [];
    return embedder.embedDocuments(texts.map(clean));
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