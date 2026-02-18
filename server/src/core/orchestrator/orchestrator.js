import { classifyQuery } from "./classifier.js";
import { retrieveMemory } from "../memory/retrieve.js";
import { buildPrompt } from "./prompt.js";
import { getStreamingLLM, getKeyPool, getAvailableModels } from "../../config/llm.js";


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
  const models = getAvailableModels();
  const startIdx = Math.floor(Math.random() * pool.length);

  for (let i = 0; i < pool.length; i++) {
    const keyIdx = (startIdx + i) % pool.length;
    let keySuccess = false;

    for (const model of models) {
      try {
        console.log(`[Orchestrator] Attempting stream with key index ${keyIdx}, model ${model}...`);
        stream = await getStreamingLLM(keyIdx, model).stream(prompt);
        keySuccess = true;
        break; // Success with this model!
      } catch (err) {
        if (err.message.includes("429") || err.message.toLowerCase().includes("quota") || err.message.includes("503") || err.message.includes("timeout")) {
          console.warn(`[Orchestrator] Key ${keyIdx} issue (${err.message}) for model ${model}. Trying next...`);
          continue; // Try next model or key
        } else {
          console.error(`[Orchestrator] Critical LLM error with key ${keyIdx} / model ${model}:`, err.message);
          // If we have more keys/models, maybe we shouldn't give up immediately?
          // But for now, let's keep the error and try the next option instead of returning.
          continue;
        }
      }
    }

    if (keySuccess) break; // Finished trying models, found one that worked

    if (i === pool.length - 1) {
      yield "⚠️ **Memtex Service Notice**: All available AI keys and models are currently rate-limited. Please try again in a few minutes.";
      return;
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