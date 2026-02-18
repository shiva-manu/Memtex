import { vectorDB } from "./src/config/vector.js";
import prisma from "./src/db/prisma.js";

async function cleanup() {
    console.log("Starting deep cleanup of dangling vectors...");
    try {
        let offset = null;
        let totalDeleted = 0;
        let totalChecked = 0;

        while (true) {
            const result = await vectorDB.scroll("memory_vectors", {
                limit: 100,
                with_payload: true,
                offset: offset
            });

            if (!result.points || result.points.length === 0) break;

            for (const point of result.points) {
                totalChecked++;
                const refId = point.payload.supabase_ref_id;

                if (!refId) continue;

                // Check BOTH types of summaries just in case
                const summaryExists = await prisma.conversationSummary.findUnique({
                    where: { id: refId }
                });

                const topicExists = await prisma.topicSummary.findUnique({
                    where: { id: refId }
                });

                if (!summaryExists && !topicExists) {
                    console.log(`[Dangling] Deleting vector ${point.id} (Ref: ${refId})`);
                    await vectorDB.delete("memory_vectors", {
                        points: [point.id]
                    });
                    totalDeleted++;
                }
            }

            offset = result.next_page_offset;
            if (!offset) break;
        }

        console.log(`\nCleanup complete.`);
        console.log(`Checked: ${totalChecked}`);
        console.log(`Deleted: ${totalDeleted}`);
    } catch (err) {
        console.error("Cleanup failed:", err.message);
    } finally {
        process.exit(0);
    }
}

cleanup();
