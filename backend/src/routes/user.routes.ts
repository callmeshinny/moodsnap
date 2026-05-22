import { Router } from "express";
import {
  deleteMe,
  getMe,
  updateMe,
  updateMyProfilePhoto,
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, updateMe);
router.patch("/me/photo", authMiddleware, upload.single("image"), updateMyProfilePhoto);
router.delete("/me", authMiddleware, deleteMe);

export default router;
