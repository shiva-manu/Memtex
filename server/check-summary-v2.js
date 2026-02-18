import prisma from "./src/db/prisma.js";

async function checkSummary() {
    const convoId = "bf16bf03-0c72-4d00-a4b2-a3decc434559";
    try {
        const summary = await prisma.conversationSummary.findFirst({
            where: { conversationId: convoId }
        });

        if (summary) {
            console.log("Summary created successfully:");
            console.log(JSON.stringify(summary, null, 2));
        } else {
            console.log("Summary not found yet. The worker might still be processing.");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkSummary();
