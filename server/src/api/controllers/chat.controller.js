import { orchestrateStream } from "../../core/orchestrator/orchestrator.js";
export async function chatController(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log("Starting orchestrateStream for message:", message);
    const stream = orchestrateStream({
      userId: req.user.id,
      query: message
    });

    for await (const chunk of stream) {
      console.log("Sending chunk:", chunk);
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
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

