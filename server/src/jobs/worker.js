import { Worker } from "bullmq";
import prisma from "../db/prisma.js";

import { cheapLLM } from "../config/llm.js";
import { vectorDB } from "../config/vector.js";
import { env } from "../config/env.js";
import { embedText } from "../core/embeddings/embed.js";
import crypto from "crypto";

import connection from "../db/redis.js";

// ─── Provider-specific message fetchers ─────────────────────────
function getMessageModel(provider) {
  switch (provider) {
    case "chatgpt":
      return prisma.chatgptMessage;
    case "gemini":
      return prisma.geminiMessage;
    case "claude":
      return prisma.claudeMessage;
    default:
      return null;
  }
}

export const memoryWorker = new Worker(
  "memory-queue",
  async (job) => {
    try {
      console.log(`[Worker] Received job: ${job.name} (ID: ${job.id})`);
      if (job.name === "summarize-conversation") {
        const { conversationId, userId, provider } = job.data;
        console.log(`[Worker] Processing conversation ${conversationId} for user ${userId} (${provider})`);

        // 1. Fetch messages from the correct provider table
        let messages = [];
        const messageModel = getMessageModel(provider);

        if (messageModel) {
          // Provider-specific table
          messages = await messageModel.findMany({
            where: { conversationId },
            select: { content: true },
            take: 50
          });
        } else {
          // Fallback: try legacy table (for old data without provider)
          console.warn(`Unknown provider "${provider}", skipping.`);
          return;
        }

        if (!messages?.length) {
          console.log(`No messages found for conversation ${conversationId} (provider: ${provider})`);
          return;
        }

        const text = messages.map((m) => m.content).join("\n");
        console.log(`[Worker] Concat text length: ${text.length} chars`);

        // 2. Summarize using LLM (with fallback to raw text if quota is hit)
        let summary = "";
        try {
          console.log(`[Worker] Invoking LLM for summary...`);
          const summaryResponse = await cheapLLM.invoke(`
Summarize the following ${provider || "unknown"} conversation concisely.
Focus on decisions, insights, and facts.
Tag any provider-specific context.

${text}
`);
          summary = summaryResponse.content.trim();
          console.log(`[Worker] LLM summary complete.`);
        } catch (llmErr) {
          console.error("Summarization failed (likely quota), falling back to raw text:", llmErr.message);
          summary = text.slice(0, 1000); // Use first 1000 chars as fallback
        }

        // 3. Store summary in the unified conversation_summaries table
        console.log(`[Worker] Creating conversation summary in DB...`);
        const summaryRow = await prisma.conversationSummary.create({
          data: {
            userId,
            provider: provider || "chatgpt",
            conversationId,
            summary,
            modelUsed: "gemini-flash-latest",
            vectorized: false
          }
        });
        console.log(`[Worker] DB Row created: ${summaryRow.id}`);

        // 4. Embed summary
        console.log(`[Worker] Creating embedding...`);
        const vector = await embedText(summary);
        console.log(`[Worker] Embedding complete (dim: ${vector.length})`);

        // 5. Store vector with user_id AND provider for strict isolation
        console.log(`[Worker] Upserting to Qdrant...`);
        await vectorDB.upsert("memory_vectors", {
          points: [
            {
              id: crypto.randomUUID(),
              vector,
              payload: {
                type: "conversation",
                provider: provider || "unknown",
                supabase_ref_id: summaryRow.id,
                user_id: userId,
              },
            },
          ],
        });
        console.log(`[Worker] Successfully upserted vector to Qdrant for summary ${summaryRow.id}`);

        // 6. Mark summary as vectorized
        await prisma.conversationSummary.update({
          where: { id: summaryRow.id },
          data: { vectorized: true }
        });

        console.log(`✔ Summarized & vectorized: ${conversationId} (${provider}) for user ${userId}`);
      }
    } catch (err) {
      console.error("Worker error:", err);
      throw err;
    }
  },
  { connection }
);

console.log("Memory worker started (multi-provider support enabled)");
