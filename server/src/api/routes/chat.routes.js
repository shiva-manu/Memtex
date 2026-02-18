import express from "express"
import { chatController, listConversations, getConversation, deleteConversation } from "../controllers/chat.controller.js";
import { auth } from "../../core/Auth/auth.middleware.js";

const router = express.Router();

/**
 * Chat interactions
 */
router.post("/", auth, chatController);
router.get("/", auth, listConversations);
router.get("/:id", auth, getConversation);
router.delete("/:id", auth, deleteConversation);

export default router;

