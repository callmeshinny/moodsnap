import { Router } from "express";
import { getFriendsOverview } from "../controllers/friendsOverview.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getFriendsOverview);

export default router;
