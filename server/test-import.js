console.log("Starting script...");
import prisma from './src/db/prisma.js';
console.log("Import done. Waiting for potential pool logs...");
setTimeout(() => {
    console.log("Closing script.");
    process.exit(0);
}, 5000);
