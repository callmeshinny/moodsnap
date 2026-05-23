import { Router } from "express";
import { getAppBootstrap } from "../controllers/app.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/bootstrap", authMiddleware, getAppBootstrap);

export default router;
