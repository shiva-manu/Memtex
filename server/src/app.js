import express from "express";
import cors from "cors";
import helmet from "helmet";

import chatRoutes from "./api/routes/chat.routes.js";
import importRoutes from "./api/routes/import.routes.js";
import memoryRoutes from "./api/routes/memory.routes.js";
import authRoutes from "./api/routes/auth.routes.js";
import userRoutes from "./api/routes/user.routes.js";
import syncRoutes from "./api/routes/sync.routes.js";



const app = express();

app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for local dev/extension compatibility
}));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static("public"));

// Debug logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


app.use("/api/chat", chatRoutes);
app.use("/api/import", importRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sync", syncRoutes);



export default app;
