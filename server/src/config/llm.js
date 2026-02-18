import { ChatOllama } from "@langchain/ollama";
import { env } from "./env.js";

/**
 * Creates an Ollama LLM instance.
 */
function createLLM(model = "mistral", temperature = 0.3) {
    return new ChatOllama({
        model: model,
        temperature: temperature,
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    });
}

/**
 * Unified invoker for local LLM
 */
export async function smartInvoke(prompt, temperature = 0.3) {
    try {
        const llm = createLLM("mistral", temperature);
        return await llm.invoke(prompt);
    } catch (err) {
        console.error("[Ollama] Invoke Error:", err.message);
        throw err;
    }
}

// Helper to get a streaming LLM
export function getStreamingLLM(keyIndex = 0, model = "mistral") {
    return createLLM(model, 0.3);
}

// Placeholder for key pool since Ollama doesn't need external keys
export function getKeyPool() {
    return ["local-ollama"];
}

// Available local models
export function getAvailableModels() {
    return ["mistral"];
}