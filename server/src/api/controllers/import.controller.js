import fs from "fs/promises";
import { syncConversation } from "../../core/sync/sync.service.js";

const VALID_PROVIDERS = ["chatgpt", "gemini", "claude"];

export async function importController(req, res) {
  try {
    let title = "New Import";
    let messageData = [];
    const provider = req.body.provider || req.query.provider || "chatgpt"; // default to chatgpt for backward compat

    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}`
      });
    }

    // Case 1: Direct JSON Import (from Extension)
    if (req.body.messages && Array.isArray(req.body.messages)) {
      title = req.body.title || `Synced ${provider} Chat`;
      messageData = req.body.messages.map(m => ({
        role: m.role || "user",
        content: m.content
      }));
    }
    // Case 2: File Upload
    else if (req.file) {
      const raw = await fs.readFile(req.file.path, "utf-8");
      title = req.file.originalname;
      const lines = raw.split("\n").filter(Boolean);
      messageData = lines.map(text => ({
        role: "user",
        content: text
      }));
    }
    else {
      return res.status(400).json({ error: "No data provided" });
    }

    // Use the sync service to store in provider-specific table
    // and trigger vectorization pipeline
    const result = await syncConversation({
      userId: req.user.id,
      provider,
      title,
      messages: messageData
    });

    res.json({ success: true, conversationId: result.id, provider });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).json({ error: "Storage failed" });
  }
}
