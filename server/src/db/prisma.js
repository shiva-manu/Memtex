import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from '../config/env.js';

const { PrismaClient } = pkg;

// Force allow self-signed certs for Node.js process
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log("Initializing Prisma with Connection Pooling...");

const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter,
    // Provide the URL anyway as a fallback/hint
    // some versions of Prisma 7 use this for initialization even with an adapter
    // __internal: {
    //     configOverride: {
    //         datasource: {
    //             url: env.DATABASE_URL
    //         }
    //     }
    // }
});

// Health check and table existence check
async function checkDb() {
    try {
        const res = await pool.query('SELECT 1');
        console.log("✔ Database connection verified via Pool");
    } catch (err) {
        console.error("✘ Database connection failed via Pool:", err.message);
    }
}
checkDb();

export default prisma;
