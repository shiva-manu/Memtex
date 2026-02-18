import express from "express";
import { generateApiKey, getApiKeys, deleteApiKey } from "../controllers/user.controller.js";
import { auth } from "../../core/Auth/auth.middleware.js";

const router = express.Router();

router.use(auth); // Protect all user routes

router.get("/keys", getApiKeys);
router.post("/keys", generateApiKey);
router.delete("/keys/:key", deleteApiKey);

export default router;
