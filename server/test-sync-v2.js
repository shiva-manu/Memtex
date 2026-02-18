import { syncConversation } from "./src/core/sync/sync.service.js";
import prisma from "./src/db/prisma.js";

async function testSync() {
    const userId = "58475018-25c0-457f-8490-ed35316539e2"; // Example user id from logs
    const provider = "chatgpt";
    const externalId = "test-convo-" + Date.now();
    const title = "Single Row Test Chat";
    const messages = [
        { role: "user", content: "Hello, this should be stored in a single row." },
        { role: "assistant", content: "Understood. I am being stored as part of a JSON blob now." }
    ];

    console.log("Starting sync...");
    try {
        const result = await syncConversation({
            userId,
            provider,
            title,
            externalId,
            messages
        });
        console.log("Sync complete. Conversation ID:", result.id);

        // Check the database
        const convo = await prisma.chatgptConversation.findUnique({
            where: { id: result.id }
        });
        console.log("Stored Conversation Data:");
        console.log(JSON.stringify(convo, null, 2));

    } catch (err) {
        console.error("Sync failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

testSync();
