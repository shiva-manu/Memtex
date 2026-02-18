import { embedText } from "./src/core/embeddings/embed.js";
import { vectorDB } from "./src/config/vector.js";
import prisma from "./src/db/prisma.js";

async function testSearch(query) {
    try {
        console.log(`Searching memories for: "${query}"...`);
        const vector = await embedText(query);
        
        const results = await vectorDB.search("memory_vectors", {
            vector: vector,
            limit: 2,
            with_payload: true
        });

        if (results.length === 0) {
            console.log("No matches found.");
            return;
        }

        for (const [i, res] of results.entries()) {
            console.log(`\nMatch ${i+1} (Confidence Score: ${res.score.toFixed(4)}):`);
            
            // Fetch the actual text from the database using the ref_id
            const summary = await prisma.conversationSummary.findUnique({
                where: { id: res.payload.supabase_ref_id }
            });
            
            if (summary) {
                console.log(`  Provider: ${res.payload.provider}`);
                console.log(`  Memory Text: ${summary.summary.substring(0, 250)}...`);
            } else {
                console.log(`  Reference ID ${res.payload.supabase_ref_id} not found in DB.`);
            }
        }
    } catch (err) {
        console.error("Search failed:", err.message);
    } finally {
        // Exit process after a short delay
        setTimeout(() => process.exit(0), 1000);
    }
}

// Search query
testSearch("modern saas startup logo design monogram");