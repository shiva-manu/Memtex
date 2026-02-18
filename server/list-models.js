import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./src/config/env.js";

async function listModels() {
    const key = env.GOOGLE_API_KEYS[0] || env.GOOGLE_API_KEY;
    console.log("Using key:", key.substring(0, 10) + "...");
    const genAI = new GoogleGenerativeAI(key);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        console.log("Available Models:");
        data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
    } catch (err) {
        console.error("List Models Failed:", err);
    } finally {
        process.exit(0);
    }
}

listModels();
