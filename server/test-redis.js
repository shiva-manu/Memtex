import connection from "./src/db/redis.js";

async function ping() {
    console.log("Pinging Redis...");
    try {
        const res = await connection.ping();
        console.log("Ping response:", res);
    } catch (err) {
        console.error("Ping failed:", err);
    } finally {
        process.exit(0);
    }
}

ping();
