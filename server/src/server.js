import app from "./app.js";
import { initVectorDB } from "./config/vector.js";
import "./jobs/worker.js";


const PORT = process.env.PORT || 3000;

async function start() {
  console.log("Starting server...");
  console.log("Initializing Vector DB...");
  await initVectorDB();
  console.log("Vector DB Initialized.");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


start();

