// core/memory/ranking.js

const MAX_RAW = 4;
const MAX_CONVO = 4;
const MAX_TOPIC = 3;

export function rankMemories(memory) {
  return {
    rawExcerpts: trim(memory.rawExcerpts, MAX_RAW),
    conversationSummaries: trim(memory.conversationSummaries, MAX_CONVO),
    topicSummaries: trim(memory.topicSummaries, MAX_TOPIC)
  };
}

function trim(arr = [], max) {
  return arr.slice(0, max);
}
