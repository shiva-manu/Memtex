import { QdrantClient } from "@qdrant/js-client-rest";
import "dotenv/config";

const vectorDB = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

async function debugQdrant() {
    try {
        const info = await vectorDB.getCollection("memory_vectors");
        console.log("Collection Info:", JSON.stringify(info, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

debugQdrant();
