import { Router } from "express";
import {
  forgotPassword,
  requestPasswordOtp,
  requestSignupOtp,
  resendOtp,
  resetPassword,
  resetPasswordWithToken,
  signIn,
  signUp,
  verifyPasswordOtp,
  verifySignupOtp,
  verifyOtp
} from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signUp);
router.post("/signup/request-otp", requestSignupOtp);
router.post("/signup/verify-otp", verifySignupOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signin", signIn);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/password/request-otp", requestPasswordOtp);
router.post("/password/verify-otp", verifyPasswordOtp);
router.post("/password/reset", resetPasswordWithToken);

export default router;
