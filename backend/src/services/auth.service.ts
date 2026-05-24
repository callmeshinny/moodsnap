import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase";
import {
  compareOtp,
  createResetToken,
  generateOtp,
  hashOtp,
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  verifyResetToken,
} from "../utils/auth.helpers";
import { generateToken } from "../utils/generateToken";
import { sendOtpEmail } from "./email.service";
import { mapUser, USER_SELECT, UserRecord } from "./user.service";

type SignUpInput = {
  username: string;
  displayName?: string;
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

type ForgotPasswordInput = {
  email: string;
};

type VerifyPasswordOtpInput = {
  email: string;
  otp: string;
};

type ResetPasswordInput = {
  resetToken?: string;
  newPassword: string;
  email?: string;
  otp?: string;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_OTP_REQUESTS = 5;
const MAX_OTP_ATTEMPTS = 5;
const requireString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
};

const validateOtp = (otp: string): void => {
  if (!/^\d{6}$/.test(otp)) {
    throw new Error("OTP must be exactly 6 digits");
  }
};

const validatePassword = (password: string): void => {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
};

const validateEmail = (email: string): void => {
  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address");
  }
};

const validateUsername = (username: string): void => {
  if (!isValidUsername(username)) {
    throw new Error(
      "Username can only contain letters, numbers, underscore, and dot"
    );
  }
};

const nextRateState = (
  currentCount?: number | null,
  currentWindowStart?: string | null
) => {
  const now = Date.now();
  const windowStartMs = currentWindowStart
    ? new Date(currentWindowStart).getTime()
    : 0;
  const isSameWindow = now - windowStartMs < OTP_RATE_WINDOW_MS;
  const nextCount = isSameWindow ? (currentCount || 0) + 1 : 1;

  if (nextCount > MAX_OTP_REQUESTS) {
    throw new Error("Too many OTP requests. Please try again later.");
  }

  return {
    otp_request_count: nextCount,
    otp_request_window_start: isSameWindow
      ? currentWindowStart
      : new Date(now).toISOString(),
  };
};

const getUserByEmail = async (email: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select(`${USER_SELECT}, password_hash`)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return user as (UserRecord & { password_hash: string }) | null;
};

const getUserByUsernameNormalized = async (usernameNormalized: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("username_normalized", usernameNormalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return user;
};

export const signupRequestOtpService = async ({
  username,
  displayName,
  email,
  password,
}: SignUpInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  const cleanUsername = requireString(username, "Username");
  const usernameNormalized = normalizeUsername(cleanUsername);
  const cleanDisplayName =
    typeof displayName === "string" && displayName.trim()
      ? displayName.trim()
      : null;
  const normalizedPassword = requireString(password, "Password");

  validateEmail(normalizedEmail);
  validateUsername(cleanUsername);
  validatePassword(normalizedPassword);

  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("Email is already registered.");
  }

  const usernameOwner = await getUserByUsernameNormalized(usernameNormalized);

  if (usernameOwner) {
    throw new Error("Username is already taken.");
  }

  const { data: pendingForUsername, error: pendingUsernameError } =
    await supabase
      .from("pending_registrations")
      .select("id, email, expires_at")
      .eq("username_normalized", usernameNormalized)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

  if (pendingUsernameError) {
    throw new Error(pendingUsernameError.message);
  }

  if (
    pendingForUsername &&
    pendingForUsername.email !== normalizedEmail
  ) {
    throw new Error("Username is already taken.");
  }

  const { data: currentPending, error: currentPendingError } = await supabase
    .from("pending_registrations")
    .select("otp_request_count, otp_request_window_start")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (currentPendingError) {
    throw new Error(currentPendingError.message);
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(normalizedPassword, 10);
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const rateState = nextRateState(
    currentPending?.otp_request_count,
    currentPending?.otp_request_window_start
  );

  const { error: upsertError } = await supabase
    .from("pending_registrations")
    .upsert(
      {
        username: cleanUsername,
        username_normalized: usernameNormalized,
        display_name: cleanDisplayName,
        email: normalizedEmail,
        password_hash: passwordHash,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempt_count: 0,
        ...rateState,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  await sendOtpEmail(normalizedEmail, otp);

  return {
    email: normalizedEmail,
    message: "OTP sent to your email",
  };
};

export const signupVerifyOtpService = async ({
  email,
  otp,
}: VerifyOtpInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  const normalizedOtp = requireString(otp, "OTP");

  validateEmail(normalizedEmail);
  validateOtp(normalizedOtp);

  const { data: pending, error: pendingError } = await supabase
    .from("pending_registrations")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  if (!pending) {
    throw new Error("Invalid OTP. Please try again.");
  }

  if (new Date(pending.expires_at) < new Date()) {
    throw new Error("OTP has expired. Please request a new code.");
  }

  if ((pending.attempt_count || 0) >= MAX_OTP_ATTEMPTS) {
    throw new Error("Too many incorrect attempts. Please request a new code.");
  }

  const isOtpCorrect = await compareOtp(normalizedOtp, pending.otp_hash);

  if (!isOtpCorrect) {
    await supabase
      .from("pending_registrations")
      .update({
        attempt_count: (pending.attempt_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pending.id);

    throw new Error("Invalid OTP. Please try again.");
  }

  if (await getUserByEmail(normalizedEmail)) {
    throw new Error("Email is already registered.");
  }

  if (await getUserByUsernameNormalized(pending.username_normalized)) {
    throw new Error("Username is already taken.");
  }

  const { data: user, error: createUserError } = await supabase
    .from("users")
    .insert({
      username: pending.username,
      username_normalized: pending.username_normalized,
      display_name: pending.display_name || null,
      email: normalizedEmail,
      password_hash: pending.password_hash,
      is_verified: true,
    })
    .select(USER_SELECT)
    .single();

  if (createUserError) {
    throw new Error(createUserError.message);
  }

  await supabase
    .from("pending_registrations")
    .delete()
    .eq("id", pending.id);

  const mappedUser = mapUser(user as UserRecord);
  const token = generateToken({
    id: mappedUser.id,
    email: mappedUser.email,
  });

  return {
    token,
    user: mappedUser,
  };
};

export const signInService = async ({ email, password }: SignInInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  const normalizedPassword = requireString(password, "Password");

  validateEmail(normalizedEmail);

  const user = await getUserByEmail(normalizedEmail);

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

  const mappedUser = mapUser(user);
  const token = generateToken({
    id: mappedUser.id,
    email: mappedUser.email,
  });

  return {
    token,
    user: mappedUser,
  };
};

export const resendOtpService = async (email: string) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  validateEmail(normalizedEmail);

  if (await getUserByEmail(normalizedEmail)) {
    throw new Error("Email is already registered.");
  }

  const { data: pending, error } = await supabase
    .from("pending_registrations")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!pending) {
    throw new Error("Pending registration not found. Please sign up again.");
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const rateState = nextRateState(
    pending.otp_request_count,
    pending.otp_request_window_start
  );

  const { error: updateError } = await supabase
    .from("pending_registrations")
    .update({
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      attempt_count: 0,
      ...rateState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pending.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await sendOtpEmail(normalizedEmail, otp);

  return {
    email: normalizedEmail,
    message: "OTP resent to your email",
  };
};

export const passwordRequestOtpService = async ({
  email,
}: ForgotPasswordInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  validateEmail(normalizedEmail);

  const user = await getUserByEmail(normalizedEmail);

  if (!user || !user.is_verified) {
    throw new Error("Verified account not found.");
  }

  const { data: currentOtp, error: currentOtpError } = await supabase
    .from("password_reset_otps")
    .select("otp_request_count, otp_request_window_start")
    .eq("email", normalizedEmail)
    .eq("is_used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (currentOtpError) {
    throw new Error(currentOtpError.message);
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const rateState = nextRateState(
    currentOtp?.otp_request_count,
    currentOtp?.otp_request_window_start
  );

  await supabase
    .from("password_reset_otps")
    .update({
      is_used: true,
      updated_at: new Date().toISOString(),
    })
    .eq("email", normalizedEmail)
    .eq("is_used", false);

  const { error: insertError } = await supabase
    .from("password_reset_otps")
    .insert({
      email: normalizedEmail,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      attempt_count: 0,
      is_used: false,
      ...rateState,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  await sendOtpEmail(normalizedEmail, otp);

  return {
    email: normalizedEmail,
    message: "Password reset OTP sent to your email",
  };
};

export const passwordVerifyOtpService = async ({
  email,
  otp,
}: VerifyPasswordOtpInput) => {
  const normalizedEmail = normalizeEmail(requireString(email, "Email"));
  const normalizedOtp = requireString(otp, "OTP");

  validateEmail(normalizedEmail);
  validateOtp(normalizedOtp);

  const { data: otpRecord, error } = await supabase
    .from("password_reset_otps")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("is_used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!otpRecord) {
    throw new Error("Invalid OTP. Please try again.");
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    throw new Error("OTP has expired. Please request a new code.");
  }

  if ((otpRecord.attempt_count || 0) >= MAX_OTP_ATTEMPTS) {
    throw new Error("Too many incorrect attempts. Please request a new code.");
  }

  const isOtpCorrect = await compareOtp(normalizedOtp, otpRecord.otp_hash);

  if (!isOtpCorrect) {
    await supabase
      .from("password_reset_otps")
      .update({
        attempt_count: (otpRecord.attempt_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", otpRecord.id);

    throw new Error("Invalid OTP. Please try again.");
  }

  await supabase
    .from("password_reset_otps")
    .update({
      is_used: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", otpRecord.id);

  return {
    resetToken: createResetToken(normalizedEmail),
    message: "OTP verified. You can now reset your password.",
  };
};

export const passwordResetService = async ({
  resetToken,
  newPassword,
}: ResetPasswordInput) => {
  const cleanResetToken = requireString(resetToken, "Reset token");
  const normalizedPassword = requireString(newPassword, "New password");

  validatePassword(normalizedPassword);

  const payload = verifyResetToken(cleanResetToken);

  if (!payload) {
    throw new Error("Reset token is invalid or expired.");
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);
  const { error } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("email", payload.email);

  if (error) {
    throw new Error(error.message);
  }

  return {
    email: payload.email,
    message: "Password reset successfully",
  };
};

export const signUpService = signupRequestOtpService;
export const verifyOtpService = signupVerifyOtpService;
export const forgotPasswordService = passwordRequestOtpService;

export const resetPasswordService = async (input: ResetPasswordInput) => {
  if (input.resetToken) {
    return passwordResetService(input);
  }

  if (input.email && input.otp) {
    const verified = await passwordVerifyOtpService({
      email: input.email,
      otp: input.otp,
    });

    return passwordResetService({
      resetToken: verified.resetToken,
      newPassword: input.newPassword,
    });
  }

  throw new Error("Reset token is required");
};
