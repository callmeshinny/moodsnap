import { Request, Response } from "express";
import {
  resendOtpService,
  signInService,
  signUpService,
  verifyOtpService
} from "../services/auth.service";

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await signUpService(req.body);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign up";

    const statusCode = message.includes("already registered") ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await verifyOtpService(req.body);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      ...result
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify OTP";

    res.status(400).json({
      success: false,
      message
    });
  }
};

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // TEMP TEST ACCOUNT - remove later when Supabase/database is ready
    if (email === "nngoc@gmail.com" && password === "123456") {
      res.status(200).json({
        success: true,
        message: "Signed in successfully",
        token: "test-token-123456",
        user: {
          id: "test-user-1",
          name: "Ngoc",
          email: "nngoc@gmail.com"
        }
      });
      return;
    }

    const result = await signInService(req.body);

    res.status(200).json({
      success: true,
      message: "Signed in successfully",
      ...result
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign in";

    res.status(400).json({
      success: false,
      message
    });
  }
};

export const resendOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const result = await resendOtpService(email);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resend OTP";

    res.status(400).json({
      success: false,
      message
    });
  }
};