import { smartInvoke } from "./src/config/llm.js";

async function testSmartInvoke() {
    try {
        console.log("Testing SmartInvoke (Query Classification)...");
        const response = await smartInvoke("What is the capital of France?", 0);
        console.log("Response:", response.content);
        console.log("Test Passed!");
    } catch (err) {
        console.error("SmartInvoke Test Failed:", err);
    } finally {
        process.exit(0);
    }
}

testSmartInvoke();
