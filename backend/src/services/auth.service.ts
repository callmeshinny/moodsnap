import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase";
import { generateOtp } from "../utils/generateOtp";
import { generateToken } from "../utils/generateToken";
import { sendOtpEmail } from "./email.service";

type SignUpInput = {
  username: string;
  email: string;
  password: string;
};

type VerifyOtpInput = {
  email: string;
  otp: string;
};

type SignInInput = {
  email: string;
  password: string;
};

const requireString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
};

const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const signUpService = async ({
  username,
  email,
  password
}: SignUpInput) => {
  const normalizedUsername = requireString(username, "Username");
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  const normalizedPassword = requireString(password, "Password");

  if (normalizedPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const { data: existingUser, error: findUserError } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (findUserError) {
    throw new Error(findUserError.message);
  }

  if (existingUser && existingUser.is_verified) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);

  if (existingUser && !existingUser.is_verified) {
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        username: normalizedUsername,
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq("email", normalizedEmail);

    if (updateUserError) {
      throw new Error(updateUserError.message);
    }
  } else {
    const { error: createUserError } = await supabase.from("users").insert({
      username: normalizedUsername,
      email: normalizedEmail,
      password_hash: passwordHash,
      is_verified: false
    });

    if (createUserError) {
      throw new Error(createUserError.message);
    }
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from("otps")
    .update({
      is_used: true
    })
    .eq("email", normalizedEmail)
    .eq("is_used", false);

  const { error: otpError } = await supabase.from("otps").insert({
    email: normalizedEmail,
    otp_code: otp,
    expires_at: expiresAt,
    is_used: false
  });

  if (otpError) {
    throw new Error(otpError.message);
  }

  await sendOtpEmail(normalizedEmail, otp);

  return {
    email: normalizedEmail,
    message: "OTP sent to your email"
  };
};

export const verifyOtpService = async ({ email, otp }: VerifyOtpInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  const normalizedOtp = requireString(otp, "OTP");

  const { data: otpRecord, error: otpError } = await supabase
    .from("otps")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("otp_code", normalizedOtp)
    .eq("is_used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError) {
    throw new Error(otpError.message);
  }

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }

  const now = new Date();
  const expiresAt = new Date(otpRecord.expires_at);

  if (expiresAt < now) {
    throw new Error("OTP has expired");
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .update({
      is_verified: true,
      updated_at: new Date().toISOString()
    })
    .eq("email", normalizedEmail)
    .select("*")
    .single();

  if (userError) {
    throw new Error(userError.message);
  }

  await supabase
    .from("otps")
    .update({
      is_used: true
    })
    .eq("id", otpRecord.id);

  const token = generateToken({
    id: user.id,
    email: user.email
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      timezone: user.timezone,
      calendarMode: user.calendar_mode,
      isVerified: user.is_verified
    }
  };
};

export const signInService = async ({ email, password }: SignInInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  const normalizedPassword = requireString(password, "Password");

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.is_verified) {
    throw new Error("Please verify your email before signing in");
  }

  const isPasswordCorrect = await bcrypt.compare(
    normalizedPassword,
    user.password_hash
  );

  if (!isPasswordCorrect) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: user.id,
    email: user.email
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      timezone: user.timezone,
      calendarMode: user.calendar_mode,
      isVerified: user.is_verified
    }
  };
};

export const resendOtpService = async (email: string) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("User not found");
  }

  if (user.is_verified) {
    throw new Error("Email is already verified");
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from("otps")
    .update({
      is_used: true
    })
    .eq("email", normalizedEmail)
    .eq("is_used", false);

  const { error: otpError } = await supabase.from("otps").insert({
    email: normalizedEmail,
    otp_code: otp,
    expires_at: expiresAt,
    is_used: false
  });

  if (otpError) {
    throw new Error(otpError.message);
  }

  await sendOtpEmail(normalizedEmail, otp);

  return {
    email: normalizedEmail,
    message: "OTP resent to your email"
  };
};


type ForgotPasswordInput = {
  email: string;
};

type ResetPasswordInput = {
  email: string;
  otp: string;
  newPassword: string;
};

export const forgotPasswordService = async ({ email }: ForgotPasswordInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.is_verified) {
    throw new Error("Please verify your email before resetting password");
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from("otps")
    .update({
      is_used: true
    })
    .eq("email", normalizedEmail)
    .eq("is_used", false);

  const { error: otpError } = await supabase.from("otps").insert({
    email: normalizedEmail,
    otp_code: otp,
    expires_at: expiresAt,
    is_used: false
  });

  if (otpError) {
    throw new Error(otpError.message);
  }

  await sendOtpEmail(normalizedEmail, otp);

  return {
    email: normalizedEmail,
    message: "Password reset OTP sent to your email"
  };
};

export const resetPasswordService = async ({
  email,
  otp,
  newPassword
}: ResetPasswordInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  const normalizedOtp = requireString(otp, "OTP");
  const normalizedPassword = requireString(newPassword, "New password");

  if (normalizedPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const { data: otpRecord, error: otpError } = await supabase
    .from("otps")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("otp_code", normalizedOtp)
    .eq("is_used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError) {
    throw new Error(otpError.message);
  }

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    throw new Error("OTP has expired");
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);

  const { error: updateError } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    })
    .eq("email", normalizedEmail);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await supabase
    .from("otps")
    .update({
      is_used: true
    })
    .eq("id", otpRecord.id);

  return {
    email: normalizedEmail,
    message: "Password reset successfully"
  };
};

