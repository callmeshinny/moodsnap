import { Router } from "express";
import {
  createSnap,
  deleteSnap,
  getSnaps,
} from "../controllers/snap.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", getSnaps);
router.post("/", upload.single("image"), createSnap);
router.delete("/:id", deleteSnap);

export default router;
