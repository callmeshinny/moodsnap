import { Router } from "express";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/notificationPreferences.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getNotificationPreferences);
router.patch("/", authMiddleware, updateNotificationPreferences);

export default router;
