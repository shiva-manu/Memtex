import { Worker } from "bullmq";
import prisma from "../db/prisma.js";

import { smartInvoke } from "../config/llm.js";
import { vectorDB } from "../config/vector.js";
import { env } from "../config/env.js";
import { embedText } from "../core/embeddings/embed.js";
import crypto from "crypto";

import connection from "../db/redis.js";

function getConversationModel(provider) {
  switch (provider) {
    case "chatgpt":
      return prisma.chatgptConversation;
    case "gemini":
      return prisma.geminiConversation;
    case "claude":
      return prisma.claudeConversation;
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

        // 1. Fetch conversation from the correct provider table
        const conversationModel = getConversationModel(provider);
        if (!conversationModel) {
          console.warn(`Unknown provider "${provider}", skipping.`);
          return;
        }

        const conversation = await conversationModel.findUnique({
          where: { id: conversationId },
          select: { messages: true }
        });

        if (!conversation || !Array.isArray(conversation.messages) || conversation.messages.length === 0) {
          console.log(`No messages found for conversation ${conversationId} (provider: ${provider})`);
          return;
        }

        const text = conversation.messages.map((m) => m.content).join("\n");
        console.log(`[Worker] Concat text length: ${text.length} chars`);

        // 2. Summarize using LLM (with fallback to raw text if quota is hit)
        let summary = "";
        try {
          console.log(`[Worker] Invoking LLM for summary...`);
          const summaryResponse = await smartInvoke(`
Summarize the following ${provider || "unknown"} conversation. 
IMPORTANT: Identify the user's name, goals, and key decisions. 
Use "The user" to refer to the person in the chat.
Focus on facts that define their personal context or project (Memtex).

${text}
`, 0);

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
            modelUsed: "ollama-mistral",
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
