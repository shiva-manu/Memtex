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

  // 1.1️⃣ Check for personal identity queries
  let personalEmbedding = null;
  if (/name|my name|who am i|who is|about me/i.test(query)) {
    personalEmbedding = await embedText("user profile, identity, name, and background");
  }

  // 2️⃣ Build filter — always filter by user_id
  const filterClauses = [
    { key: "user_id", match: { value: userId } }
  ];

  // Optionally filter by provider
  if (provider) {
    filterClauses.push({ key: "provider", match: { value: provider } });
  }

  // 3️⃣ vector search — strictly scoped to this user
  let hits = [];
  const start = Date.now();
  const searchVectors = [embedding];
  if (personalEmbedding) searchVectors.push(personalEmbedding);

  for (let i = 0; i < 3; i++) {
    try {
      const results = await Promise.all(searchVectors.map(vec =>
        vectorDB.search("memory_vectors", {
          vector: vec,
          limit: 10,
          filter: { must: filterClauses }
        })
      ));

      const uniqueHits = new Map();
      results.flat().forEach(h => uniqueHits.set(h.id, h));
      hits = Array.from(uniqueHits.values());
      break;
    } catch (err) {
      if (err.message.includes("timeout") || err.message.toLowerCase().includes("fetch failed")) {
        console.warn(`[Retrieve] Qdrant search timeout (attempt ${i + 1}/3). Retrying...`);
        if (i === 2) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }


  const duration = Date.now() - start;
  console.log(`[Retrieve] Qdrant search took ${duration}ms, found ${hits?.length || 0} hits.`);


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