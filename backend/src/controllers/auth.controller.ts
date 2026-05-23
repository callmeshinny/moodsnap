import { Request, Response } from "express";
import {
  forgotPasswordService,
  passwordRequestOtpService,
  passwordResetService,
  passwordVerifyOtpService,
  resendOtpService,
  resetPasswordService,
  signInService,
  signupRequestOtpService,
  signupVerifyOtpService,
  signUpService,
  verifyOtpService
} from "../services/auth.service";

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await signUpService(req.body);

    res.status(201).json({
      success: true,
      data: result,
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
      data: result,
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
    const result = await signInService(req.body);

    res.status(200).json({
      success: true,
      message: "Signed in successfully",
      data: result,
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
      data: result,
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


export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await forgotPasswordService(req.body);

    res.status(200).json({
      success: true,
      data: result,
      ...result
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send reset OTP";

    res.status(400).json({
      success: false,
      message
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await resetPasswordService(req.body);

    res.status(200).json({
      success: true,
      data: result,
      ...result
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password";

    res.status(400).json({
      success: false,
      message
    });
  }
};

export const requestSignupOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await signupRequestOtpService(req.body);

    res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to request OTP";
    const statusCode =
      message.includes("already") || message.includes("taken") ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const verifySignupOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await signupVerifyOtpService(req.body);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: result,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify OTP";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const requestPasswordOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await passwordRequestOtpService(req.body);

    res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send reset OTP";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const verifyPasswordOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await passwordVerifyOtpService(req.body);

    res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify reset OTP";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const resetPasswordWithToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await passwordResetService(req.body);

    res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
