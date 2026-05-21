import { Router } from "express";
import {
  resendOtp,
  signIn,
  signUp,
  verifyOtp
} from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signUp);
router.post("/verify-otp", verifyOtp);
router.post("/signin", signIn);
router.post("/resend-otp", resendOtp);

export default router;