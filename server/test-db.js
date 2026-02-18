import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL;
console.log("Testing URL:", url ? url.replace(/:[^:@]+@/, ':****@') : "MISSING");

const pool = new pg.Pool({
    connectionString: url,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("Connection failed:", err);
    } else {
        console.log("Connection successful:", res.rows[0]);
    }
    pool.end();
});
