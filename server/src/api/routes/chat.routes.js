import express from "express"
import { chatController } from "../controllers/chat.controller.js";
import { auth } from "../../core/Auth/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/chat
 * Body: { message: string }
 */
router.post("/", auth, chatController);


export default router;
