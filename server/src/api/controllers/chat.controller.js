import { orchestrateStream } from "../../core/orchestrator/orchestrator.js";
import prisma from "../../db/prisma.js";

export async function chatController(req, res) {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Load or initialize conversation
    let conversation = null;
    let history = [];

    if (conversationId) {
      conversation = await prisma.memtexConversation.findUnique({
        where: { id: conversationId, userId }
      });
      if (conversation) {
        history = conversation.messages || [];
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 2. Add user message to history
    const userMsg = { role: "user", content: message };
    history.push(userMsg);

    console.log("Starting orchestrateStream for message:", message);
    const stream = orchestrateStream({
      userId,
      query: message,
      history // Pass history to orchestrator for short-term context
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    }

    // 3. Save to DB
    const assistantMsg = { role: "assistant", content: fullResponse };
    history.push(assistantMsg);

    if (conversation) {
      // Update existing
      await prisma.memtexConversation.update({
        where: { id: conversation.id },
        data: { messages: history }
      });
    } else {
      // Create new
      const newConvo = await prisma.memtexConversation.create({
        data: {
          userId,
          title: message.slice(0, 40) + "...",
          messages: history
        }
      });
      // Send the conversationId back so the client can use it
      res.write(`data: ${JSON.stringify({ conversationId: newConvo.id })}\n\n`);
    }

    console.log("Stream complete");
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
}
// ─── NEW FUNCTIONS ────────────────────────────────────────────────
export async function listConversations(req, res) {
  try {
    const userId = req.user.id;
    const conversations = await prisma.memtexConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true }
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: "Failed to list conversations" });
  }
}

export async function getConversation(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const conversation = await prisma.memtexConversation.findUnique({
      where: { id, userId }
    });
    if (!conversation) return res.status(404).json({ error: "Not found" });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Failed to get conversation" });
  }
}

export async function deleteConversation(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await prisma.memtexConversation.deleteMany({
      where: { id, userId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
}
