import 'dotenv/config';
import prisma from './src/db/prisma.js';
import { v4 as uuidv4 } from 'uuid';

async function test() {
    try {
        console.log("DATABASE_URL check:", process.env.DATABASE_URL ? "Defined" : "UNDEFINED");
        console.log("Attempting to create a test API key...");
        const key = `mtx_test_${uuidv4().replace(/-/g, "")}`;
        const userId = `test_user_${Date.now()}`;

        const apiKey = await prisma.userApiKey.create({
            data: {
                userId,
                key
            }
        });
        console.log("Success! Created key:", apiKey.key);

        // Clean up
        await prisma.userApiKey.delete({
            where: { id: apiKey.id }
        });
        console.log("Cleanup successful.");
    } catch (err) {
        console.error("Direct Prisma test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
