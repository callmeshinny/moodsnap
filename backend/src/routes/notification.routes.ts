import { Router } from "express";
import {
  registerToken,
  unregisterToken,
} from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/register-token", registerToken);
router.delete("/unregister-token", unregisterToken);

export default router;