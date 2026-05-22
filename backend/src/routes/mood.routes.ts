import { Router } from "express";
import { getCalendar, getStreak } from "../controllers/mood.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/calendar", authMiddleware, getCalendar);
router.get("/streak", authMiddleware, getStreak);

export default router;
