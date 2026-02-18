import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString: url,
    ssl: {
        rejectUnauthorized: false
    }
});

const sql = `
CREATE TABLE IF NOT EXISTS "memtex_conversations" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'New Chat',
  "messages" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "memtex_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "memtex_conversations_user_id_idx" ON "memtex_conversations"("user_id");
`;

async function run() {
    try {
        console.log("Connecting to database...");
        const client = await pool.connect();
        console.log("Connected. Creating table...");
        await client.query(sql);
        console.log("Table 'memtex_conversations' created or already exists.");
        client.release();
    } catch (err) {
        console.error("Failed to create table:", err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
