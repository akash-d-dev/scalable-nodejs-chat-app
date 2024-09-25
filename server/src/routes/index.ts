import { Router } from "express";
import AuthController from "../controllers/AuthControllers.js";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import ChatGroupController from "../controllers/ChatGroupController.js";
const router = Router();

//Auth Routes
router.post("/auth/login", AuthController.login);

// Chat Group Routes
router.post("/chat-group", authMiddleware, ChatGroupController.store);

export default router;
