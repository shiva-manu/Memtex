import IORedis from "ioredis";
import { env } from "../config/env.js";

const redisOptions = {
    maxRetriesPerRequest: null,
    connectTimeout: 10000, // 10 seconds
    reconnectOnError: (err) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    }
};

const connection = env.REDIS_HOST.startsWith("redis://") || env.REDIS_HOST.startsWith("rediss://")
    ? new IORedis(env.REDIS_HOST, redisOptions)
    : new IORedis({
        host: env.REDIS_HOST,
        port: Number(env.REDIS_PORT),
        ...redisOptions
    });

connection.on("error", (err) => {
    console.error("Redis Connection Error:", err);
});

connection.on("connect", () => {
    console.log("Successfully connected to Redis");
});

export default connection;
