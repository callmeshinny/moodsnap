import { Router } from "express";
import {
  forgotPassword,
  resendOtp,
  resetPassword,
  signIn,
  signUp,
  verifyOtp
} from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signUp);
router.post("/verify-otp", verifyOtp);
router.post("/signin", signIn);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;