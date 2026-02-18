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
      if (job.name === "summarize-conversation") {
        const { conversationId, userId, provider } = job.data;

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

        // 2. Summarize using LLM
        const summaryResponse = await cheapLLM.invoke(`
Summarize the following ${provider || "unknown"} conversation concisely.
Focus on decisions, insights, and facts.
Tag any provider-specific context.

${text}
`);

        const summary = summaryResponse.content.trim();

        // 3. Store summary in the unified conversation_summaries table
        //    This includes userId + provider for isolation
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

        // 4. Embed summary
        const vector = await embedText(summary);

        // 5. Store vector with user_id AND provider for strict isolation
        //    This ensures NO cross-user context contamination
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
