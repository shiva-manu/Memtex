import prisma from "../../db/prisma.js";
import { v4 as uuidv4 } from "uuid";

export async function generateApiKey(req, res) {
    try {
        const userId = req.user.id;
        console.log("Generating API Key for user:", userId);

        // In this app, we might allow multiple keys or just one. 
        // Let's go with one active key for now for simplicity.

        const key = `mtx_${uuidv4().replace(/-/g, "")}`;

        const apiKey = await prisma.userApiKey.create({
            data: {
                userId,
                key
            }
        });

        res.json({ apiKey: apiKey.key });
    } catch (err) {
        console.error("Generate API Key error:", err);
        res.status(500).json({ error: "Failed to generate API Key" });
    }
}

export async function getApiKeys(req, res) {
    try {
        const userId = req.user.id;
        console.log("Fetching API Keys for user:", userId);
        const keys = await prisma.userApiKey.findMany({
            where: { userId },
            select: { key: true, createdAt: true }
        });
        res.json({ keys });
    } catch (err) {
        console.error("Get API Keys error:", err);
        res.status(500).json({ error: "Failed to retrieve API Keys" });
    }
}

export async function deleteApiKey(req, res) {
    try {
        const { key } = req.params;
        const userId = req.user.id;

        await prisma.userApiKey.deleteMany({
            where: {
                key,
                userId
            }
        });

        res.json({ message: "API Key deleted" });
    } catch (err) {
        console.error("Delete API Key error:", err);
        res.status(500).json({ error: "Failed to delete API Key" });
    }
}
