import { memoryQueue } from "./src/jobs/producers/memory.producer.js";

async function check() {
    console.log("Checking Queue Stats...");
    const counts = await memoryQueue.getJobCounts();
    console.log("Job Counts:", JSON.stringify(counts, null, 2));

    const waiting = await memoryQueue.getWaiting();
    console.log(`Waiting jobs: ${waiting.length}`);
    if (waiting.length > 0) {
        waiting.slice(0, 5).forEach(job => {
            console.log(`- Job ${job.id}: ${job.name}`);
        });
    }

    const active = await memoryQueue.getActive();
    console.log(`Active jobs: ${active.length}`);

    const failed = await memoryQueue.getFailed();
    console.log(`Failed jobs: ${failed.length}`);
    if (failed.length > 0) {
        console.log("Last failed job error:", failed[failed.length - 1].failedReason);
    }

    process.exit(0);
}

check();
