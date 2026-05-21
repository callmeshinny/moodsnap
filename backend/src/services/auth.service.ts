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

const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const signUpService = async ({
  username,
  email,
  password
}: SignUpInput) => {
  if (!username || !email || !password) {
    throw new Error("Username, email and password are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const normalizedEmail = normalizeEmail(email);

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

  const passwordHash = await bcrypt.hash(password, 10);

  if (existingUser && !existingUser.is_verified) {
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        username,
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq("email", normalizedEmail);

    if (updateUserError) {
      throw new Error(updateUserError.message);
    }
  } else {
    const { error: createUserError } = await supabase.from("users").insert({
      username,
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
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const normalizedEmail = normalizeEmail(email);

  const { data: otpRecord, error: otpError } = await supabase
    .from("otps")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("otp_code", otp)
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
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalizedEmail = normalizeEmail(email);

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
    password,
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
  if (!email) {
    throw new Error("Email is required");
  }

  const normalizedEmail = normalizeEmail(email);

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