import { supabase } from "../../config/supabase.js";
import prisma from "../../db/prisma.js";

export async function auth(req, res, next) {
    try {
        // 1. Check for API Key (Premium/Extension flow)
        const apiKey = req.headers["x-api-key"];
        if (apiKey) {
            const keyRecord = await prisma.userApiKey.findUnique({
                where: { key: apiKey }
            });

            if (!keyRecord) {
                return res.status(401).json({ error: "Invalid API Key" });
            }

            req.user = { id: keyRecord.userId };
            return next();
        }

        // 2. Fallback to JWT (Native App flow)
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "No authorization header or API key" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        res.status(500).json({ error: "Authentication failed" });
    }
}


