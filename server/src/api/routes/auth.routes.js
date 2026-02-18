import express from "express";
import { signup, login, socialLogin, callback } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/social", socialLogin);
router.get("/callback", callback);

export default router;
