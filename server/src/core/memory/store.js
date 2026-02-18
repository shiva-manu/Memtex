import prisma from "../../db/prisma.js";
import { vectorDB } from "../../config/vector.js";
import { embedText } from "../embeddings/embed.js";
import crypto from "crypto";

/**
 * Store useful AI output into long-term memory
 */
export async function storeMemory({ userId, conversationId, text, provider = null }) {
  if (!shouldStore(text)) return;

  // 1️⃣ save topic summary (with provider tag)
  const topic = await prisma.topicSummary.create({
    data: {
      userId: userId,
      provider: provider || undefined,
      topic: detectTopic(text),
      summary: text
    }
  });


  // 2️⃣ embed
  const vector = await embedText(text);

  // 3️⃣ store vector (with user_id + provider for strict isolation)
  await vectorDB.upsert("memory_vectors", {
    points: [
      {
        id: crypto.randomUUID(),
        vector,
        payload: {
          type: "topic",
          provider: provider || "unknown",
          supabase_ref_id: topic.id,
          user_id: userId
        }
      }
    ]
  });
}

function shouldStore(text) {
  if (!text) return false;
  if (text.length < 120) return false;
  if (text.length > 4000) return false;
  return true;
}

function detectTopic(text) {
  // naive heuristic (later replace with LLM classifier)
  const keywords = ["architecture", "design", "system", "database", "memory"];
  const found = keywords.find(k => text.toLowerCase().includes(k));
  return found || "general";
}