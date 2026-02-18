import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "./env.js";

export const reasoningLLM = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiVersion: "v1beta",
    temperature: 0.3,
    apiKey: env.GOOGLE_API_KEY,
    timeout: 10000,
    maxRetries: 1,
});

export const cheapLLM = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiVersion: "v1beta",
    temperature: 0,
    apiKey: env.GOOGLE_API_KEY,
    timeout: 10000,
    maxRetries: 1,
});