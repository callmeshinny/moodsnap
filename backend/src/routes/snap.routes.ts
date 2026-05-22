import { Router } from "express";
import {
  createSnap,
  deleteSnap,
  getFeed,
  getSnaps,
} from "../controllers/snap.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", authMiddleware, getSnaps);
router.get("/feed", authMiddleware, getFeed);
router.post("/", authMiddleware, upload.single("image"), createSnap);
router.delete("/:id", authMiddleware, deleteSnap);

export default router;
