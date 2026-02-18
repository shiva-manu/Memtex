import express from "express"
import multer from "multer";
import { importController } from "../controllers/import.controller.js";
import { auth } from "../../core/Auth/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", auth, upload.single("file"), importController);


export default router;
