import { classifyQuery } from "./classifier.js";
import { retrieveMemory } from "../memory/retrieve.js";
import { buildPrompt } from "./prompt.js";
import { reasoningLLM } from "../../config/llm.js";


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
  const stream = await reasoningLLM.stream(prompt);

  // 5. yield chunks
  for await (const chunk of stream) {
    yield chunk.content;
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