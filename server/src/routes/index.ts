import { Router } from "express";
import AuthController from "../controllers/AuthControllers.js";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import ChatGroupController from "../controllers/ChatGroupController.js";
import ChatGroupUserController from "../controllers/ChatGroupUserController.js";
import ChatController from "../controllers/ChatController.js";
const router = Router();

//Auth Routes
router.post("/auth/login", AuthController.login);

// Chat Group Routes
router.get("/chat-group", authMiddleware, ChatGroupController.index);
router.post("/chat-group", authMiddleware, ChatGroupController.store);

router.get("/chat-group/:id", ChatGroupController.show);
router.put("/chat-group/:id", authMiddleware, ChatGroupController.update);
router.delete("/chat-group/:id", authMiddleware, ChatGroupController.destroy);

// Chat Group User Routes
router.get("/chat-group-user", ChatGroupUserController.index);
router.post("/chat-group-user", ChatGroupUserController.store);

// Chat Routes
router.get("/chat/:groupId", ChatController.index);

export default router;
