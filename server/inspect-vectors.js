import { vectorDB } from "./src/config/vector.js";

async function inspect() {
    try {
        const collection = "memory_vectors";
        const status = await vectorDB.getCollection(collection);
        console.log(`Collection Name: ${collection}`);
        console.log(`Vector Size: ${status.config.params.vectors.size}`);
        console.log(`Points count: ${status.points_count}`);

        const points = await vectorDB.scroll(collection, {
            limit: 10,
            with_payload: true,
            with_vector: false
        });

        console.log("\n--- Sample Points ---");
        points.points.forEach((p, i) => {
            console.log(`[${i}] ID: ${p.id}`);
            console.log(`    Payload: ${JSON.stringify(p.payload, null, 2)}`);
        });
    } catch (err) {
        console.error("Failed to inspect Qdrant:", err.message);
    } finally {
        process.exit(0);
    }
}

inspect();
