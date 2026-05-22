import { Router } from "express";
import {
  createSnap,
  deleteSnap,
  getSnaps,
} from "../controllers/snap.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", getSnaps);
router.post("/", authMiddleware, upload.single("image"), createSnap);
router.delete("/:id", authMiddleware, deleteSnap);

export default router;
