import { vectorDB } from "../../config/vector.js";
import prisma from "../../db/prisma.js";
import { embedText } from "../embeddings/embed.js";
import { rankMemories } from "./ranking.js";

/**
 * Retrieve relevant memory for a user query.
 * Strictly filters by user_id so no cross-user context leakage occurs.
 * Optionally filters by provider for provider-specific queries.
 */
export async function retrieveMemory({ userId, query, provider = null }) {
  // 1️⃣ embed query
  const embedding = await embedText(query);

  // 2️⃣ Build filter — always filter by user_id
  const filterClauses = [
    { key: "user_id", match: { value: userId } }
  ];

  // Optionally filter by provider (e.g., "show me only my ChatGPT data")
  if (provider) {
    filterClauses.push({ key: "provider", match: { value: provider } });
  }

  // 3️⃣ vector search — strictly scoped to this user
  const hits = await vectorDB.search("memory_vectors", {
    vector: embedding,
    limit: 12,
    filter: {
      must: filterClauses
    }
  });

  if (!hits?.length) {
    return emptyMemory();
  }

  // 4️⃣ split by type
  const refs = hits.map(h => h.payload);

  const convoIds = refs.filter(r => r.type === "conversation").map(r => r.supabase_ref_id);
  const topicIds = refs.filter(r => r.type === "topic").map(r => r.supabase_ref_id);

  // 5️⃣ hydrate DB data (summaries are in unified tables, already filtered by user)
  const [convos, topics] = await Promise.all([
    fetchConversationSummaries(convoIds, userId),
    fetchTopicSummaries(topicIds, userId)
  ]);

  // 6️⃣ ranking
  return rankMemories({
    rawExcerpts: [],
    conversationSummaries: convos,
    topicSummaries: topics
  });
}

function emptyMemory() {
  return { rawExcerpts: [], conversationSummaries: [], topicSummaries: [] };
}

/**
 * Fetch conversation summaries — double-checks userId to prevent leaks
 */
async function fetchConversationSummaries(ids, userId) {
  if (!ids.length) return [];
  const summaries = await prisma.conversationSummary.findMany({
    where: {
      id: { in: ids },
      userId: userId  // ← critical: ensures no cross-user data
    },
    select: { summary: true, provider: true }
  });

  return summaries.map(c => `[${c.provider}] ${c.summary}`);
}

/**
 * Fetch topic summaries — double-checks userId to prevent leaks
 */
async function fetchTopicSummaries(ids, userId) {
  if (!ids.length) return [];
  const summaries = await prisma.topicSummary.findMany({
    where: {
      id: { in: ids },
      userId: userId  // ← critical: ensures no cross-user data
    },
    select: { summary: true, provider: true }
  });

  return summaries.map(t => t.provider ? `[${t.provider}] ${t.summary}` : t.summary);
}