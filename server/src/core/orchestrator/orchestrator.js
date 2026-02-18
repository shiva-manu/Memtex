import { classifyQuery } from "./classifier.js";
import { retrieveMemory } from "../memory/retrieve.js";
import { buildPrompt } from "./prompt.js";
import { getStreamingLLM, getKeyPool } from "../../config/llm.js";


/**
 * Main orchestration pipeline
 */
/**
 * Streaming orchestration pipeline
 */
export async function* orchestrateStream({ userId, query }) {
  // 1. classify query
  console.log("Classifying query:", query);
  const type = await classifyQuery(query);
  console.log("Query classified as:", type);

  // 2. retrieve relevant memory
  console.log("Retrieving memory...");
  const memory = await retrieveMemory({
    userId,
    query,
    type
  });
  console.log("Memory retrieved:", memory ? "matches found" : "no matches");

  // 3. construct final prompt
  const prompt = buildPrompt({
    query,
    memory,
    type
  });

  // 4. reasoning model generates answer as a stream
  console.log("Calling reasoningLLM.stream...");
  let stream;
  const pool = getKeyPool();

  for (let i = 0; i < pool.length; i++) {
    try {
      console.log(`[Orchestrator] Attempting stream with key index ${i}...`);
      stream = await getStreamingLLM(i).stream(prompt);
      break; // Success!
    } catch (err) {
      if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
        console.warn(`[Orchestrator] Key ${i} rate limited.`);
        if (i === pool.length - 1) {
          yield "⚠️ **Memtex Service Notice**: All available AI keys are currently rate-limited. Please try again in a few minutes.";
          return;
        }
        continue; // Try next key
      } else {
        console.error("Orchestration LLM error:", err.message);
        yield "❌ **Orchestration Error**: I encountered an issue while processing your request.";
        return;
      }
    }
  }

  // 5. yield chunks
  if (stream) {
    for await (const chunk of stream) {
      yield chunk.content;
    }
  }
}

/**
 * Main orchestration pipeline
 */
export async function orchestrate({ userId, query }) {
  const iterator = orchestrateStream({ userId, query });
  let fullResponse = "";
  for await (const chunk of iterator) {
    fullResponse += chunk;
  }
  return fullResponse;
}