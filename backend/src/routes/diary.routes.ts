import { Router } from "express";
import {
  createDiaryEntry,
  getDiary,
  getTodayDiary,
  listDiaries,
  listDiaryFeed,
  updateDiaryEntry,
} from "../controllers/diary.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/today", getTodayDiary);
router.get("/feed", listDiaryFeed);
router.get("/", listDiaries);
router.post("/", createDiaryEntry);
router.get("/:id", getDiary);
router.patch("/:id", updateDiaryEntry);

export default router;
