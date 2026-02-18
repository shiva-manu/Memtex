import { Queue } from "bullmq";
import { env } from "../../config/env.js";


import connection from "../../db/redis.js";




/**
 * Main memory processing queue
 * Handles summarization + embedding
 */
export const memoryQueue = new Queue("memory-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Enqueue conversation summarization
 */
export async function enqueueSummarize({ conversationId, userId, provider }) {
  if (!conversationId || !userId) return;

  await memoryQueue.add(
    "summarize-conversation",
    { conversationId, userId, provider: provider || null },
    {
      jobId: `summary-${conversationId}`, // prevents duplicate jobs
      priority: 1
    }
  );
}

/**
 * Enqueue embedding creation
 */
export async function enqueueEmbedding({ summaryId, text, userId, type }) {
  if (!text || !userId) return;

  await memoryQueue.add(
    "embed-memory",
    {
      summaryId,
      text,
      userId,
      type // "conversation" | "topic"
    },
    {
      priority: 2
    }
  );
}

/**
 * Enqueue cleanup/pruning
 */
export async function enqueueCleanup(userId) {
  await memoryQueue.add(
    "cleanup-memory",
    { userId },
    {
      priority: 5
    }
  );
}
