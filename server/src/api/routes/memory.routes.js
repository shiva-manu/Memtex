import express from "express";
import { auth } from "../../core/Auth/auth.middleware.js";
import { memoryController } from "../controllers/memory.controller.js";
const router = express.Router();

router.get("/", auth, memoryController);

export default router;
