import { Router } from "express";
import {
  createSnap,
  deleteSnap,
  getFeed,
  getFeedHome,
  getSnapById,
  getSnaps,
} from "../controllers/snap.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", authMiddleware, getSnaps);
router.get("/feed/home", authMiddleware, getFeedHome);
router.get("/feed", authMiddleware, getFeed);
router.get("/:id", authMiddleware, getSnapById);
router.post("/", authMiddleware, upload.single("image"), createSnap);
router.delete("/:id", authMiddleware, deleteSnap);


export default router;
