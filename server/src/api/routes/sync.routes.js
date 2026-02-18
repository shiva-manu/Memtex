import express from "express";
import { auth } from "../../core/Auth/auth.middleware.js";
import {
    syncSingleConversation,
    syncBatch,
    getSyncedProviders,
    getConversationsByProvider,
    getAllConversations,
    removeSyncProvider
} from "../controllers/sync.controller.js";

const router = express.Router();

// ─── Provider management ────────────────────────────────────────
router.get("/providers", auth, getSyncedProviders);

// ─── Sync conversations ────────────────────────────────────────
router.post("/:provider", auth, syncSingleConversation);
router.post("/:provider/batch", auth, syncBatch);

// ─── Fetch conversations ────────────────────────────────────────
router.get("/conversations/all", auth, getAllConversations);
router.get("/:provider/conversations", auth, getConversationsByProvider);

// ─── Remove sync ────────────────────────────────────────────────
router.delete("/:provider", auth, removeSyncProvider);

export default router;
