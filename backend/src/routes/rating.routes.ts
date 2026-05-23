import { Router } from "express";
import {
  createRating,
  getMyAppRating,
} from "../controllers/rating.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/me", getMyAppRating);
router.post("/", createRating);

export default router;
