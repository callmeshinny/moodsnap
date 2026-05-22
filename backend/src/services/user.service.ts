import { supabase } from "../config/supabase";
import cloudinary from "../config/cloudinary";

export type UserRecord = {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  timezone?: string | null;
  calendar_mode?: string | null;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const mapUser = (user: UserRecord) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatar_url || null,
  timezone: user.timezone || null,
  calendarMode: user.calendar_mode || null,
  isVerified: Boolean(user.is_verified),
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const getUserById = async (userId: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, email, avatar_url, timezone, calendar_mode, is_verified, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapUser(user);
};

export const getUserByUsername = async (username: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, email, avatar_url, timezone, calendar_mode, is_verified, created_at, updated_at")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return user ? mapUser(user) : null;
};

export const updateUserProfile = async (
  userId: string,
  input: { username?: unknown }
) => {
  if (typeof input.username !== "string") {
    throw new Error("Username is required");
  }

  const { data: user, error } = await supabase
    .from("users")
    .update({
      username: input.username,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, username, email, avatar_url, timezone, calendar_mode, is_verified, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapUser(user);
};

export const getUsersByIds = async (userIds: string[]) => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return new Map<string, ReturnType<typeof mapUser>>();
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, email, avatar_url, timezone, calendar_mode, is_verified, created_at, updated_at")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  const userMap = new Map<string, ReturnType<typeof mapUser>>();

  for (const user of users || []) {
    userMap.set(user.id, mapUser(user));
  }

  return userMap;
};

export const deleteUserAccount = async (userId: string) => {
  const user = await getUserById(userId);

  const { data: snaps, error: snapsError } = await supabase
    .from("moodsnap")
    .select("image_public_id")
    .eq("user_id", userId);

  if (snapsError) {
    throw new Error(snapsError.message);
  }

  for (const snap of snaps || []) {
    if (snap.image_public_id) {
      await cloudinary.uploader.destroy(snap.image_public_id).catch(() => null);
    }
  }

  const { error: snapDeleteError } = await supabase
    .from("moodsnap")
    .delete()
    .eq("user_id", userId);

  if (snapDeleteError) {
    throw new Error(snapDeleteError.message);
  }

  const { error: friendshipDeleteError } = await supabase
    .from("friendships")
    .delete()
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId},requested_by.eq.${userId}`);

  if (friendshipDeleteError) {
    throw new Error(friendshipDeleteError.message);
  }

  const { error: otpDeleteError } = await supabase
    .from("otps")
    .delete()
    .eq("email", user.email);

  if (otpDeleteError) {
    throw new Error(otpDeleteError.message);
  }

  const { error: userDeleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (userDeleteError) {
    throw new Error(userDeleteError.message);
  }

  return true;
};
