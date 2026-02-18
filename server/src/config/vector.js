import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "./env.js";

export const vectorDB = new QdrantClient({
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
    timeout: 30000 // 30 seconds
});


const COLLECTION = "memory_vectors";

/**
 * Ensure vector collection exits
 */
export async function initVectorDB() {
    try {
        let collectionInfo = null;
        try {
            collectionInfo = await vectorDB.getCollection(COLLECTION);
        } catch (err) {
            // If it's not a 404, rethrow
            if (err.status !== 404) throw err;
        }

        const targetSize = 768; // nomic-embed-text size

        if (collectionInfo) {
            const currentSize = collectionInfo.config?.params?.vectors?.size;
            const hasUserIdIndex = collectionInfo.payload_schema?.user_id;

            if (currentSize !== targetSize) {
                console.log(`Vector size mismatch (${currentSize} vs ${targetSize}). Recreating collection...`);
                await vectorDB.deleteCollection(COLLECTION);
                await new Promise(r => setTimeout(r, 2000)); // Longer wait for deletion
            } else if (!hasUserIdIndex) {
                console.log("Missing user_id index. Creating...");
                await vectorDB.createPayloadIndex(COLLECTION, {
                    field_name: "user_id",
                    field_schema: "keyword",
                    wait: true
                });
                return;
            } else {
                return; // Already correct
            }
        }

        console.log("Creating vector collection...");
        // Check if it still exists (race condition)
        try {
            await vectorDB.createCollection(COLLECTION, {
                vectors: {
                    size: targetSize,
                    distance: "Cosine"
                }
            });
        } catch (err) {
            if (err.status !== 409) throw err;
            console.log("Collection created by another process.");
        }

        console.log("Creating payload index for user_id...");
        try {
            await vectorDB.createPayloadIndex(COLLECTION, {
                field_name: "user_id",
                field_schema: "keyword",
                wait: true
            });
        } catch (err) {
            // Ignore if already exists
        }

        console.log("Creating payload index for provider...");
        try {
            await vectorDB.createPayloadIndex(COLLECTION, {
                field_name: "provider",
                field_schema: "keyword",
                wait: true
            });
        } catch (err) {
            // Ignore if already exists
        }

        console.log("Vector collection and indices ready");
    } catch (error) {
        console.error("Vector DB init failed:", error);
    }
}