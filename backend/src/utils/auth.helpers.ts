import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { generateOtp as generateSixDigitOtp } from "./generateOtp";

type ResetPayload = {
  email: string;
  purpose: "password_reset";
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const normalizeUsername = (username: string): string => {
  return username.trim().toLowerCase();
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidUsername = (username: string): boolean => {
  return /^[A-Za-z0-9._]+$/.test(username);
};

export const generateOtp = (): string => generateSixDigitOtp();

export const hashOtp = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

export const compareOtp = async (
  otp: string,
  otpHash: string
): Promise<boolean> => {
  return bcrypt.compare(otp, otpHash);
};

export const createResetToken = (email: string): string => {
  return jwt.sign(
    {
      email: normalizeEmail(email),
      purpose: "password_reset",
    },
    env.jwtSecret,
    { expiresIn: "15m" }
  );
};

export const verifyResetToken = (token: string): ResetPayload | null => {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as Partial<ResetPayload>;

    if (payload.purpose !== "password_reset" || !payload.email) {
      return null;
    }

    return {
      email: normalizeEmail(payload.email),
      purpose: "password_reset",
    };
  } catch {
    return null;
  }
};
