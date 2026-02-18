import prisma from "./src/db/prisma.js";

async function listAllSummaries() {
    try {
        const summaries = await prisma.conversationSummary.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Found ${summaries.length} summaries:\n`);
        summaries.forEach((s, i) => {
            console.log(`[${i}] ID: ${s.id}`);
            console.log(`    Provider: ${s.provider}`);
            console.log(`    ConversationID: ${s.conversationId}`);
            console.log(`    Summary: ${s.summary}`);
            console.log('------------------');
        });
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

listAllSummaries();
