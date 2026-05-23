import { supabase } from "../config/supabase";
import cloudinary from "../config/cloudinary";
import { uploadImageToCloudinary } from "./upload.service";
import { isValidUsername, normalizeUsername } from "../utils/auth.helpers";

export type UserRecord = {
  id: string;
  username: string;
  username_normalized?: string | null;
  display_name?: string | null;
  email: string;
  avatar_url?: string | null;
  avatar_public_id?: string | null;
  profile_color?: string | null;
  timezone?: string | null;
  calendar_mode?: string | null;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
};

const USER_SELECT =
  "id, username, username_normalized, display_name, email, avatar_url, avatar_public_id, profile_color, timezone, calendar_mode, is_verified, created_at, updated_at";

export const isUuid = (value: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
};

export const mapUser = (user: UserRecord) => ({
  id: user.id,
  username: user.username,
  displayName: user.display_name || null,
  displayLabel: user.display_name?.trim() || user.username,
  email: user.email,
  avatarUrl: user.avatar_url || null,
  avatarPublicId: user.avatar_public_id || null,
  profileColor: user.profile_color || "#F65078",
  timezone: user.timezone || null,
  calendarMode: user.calendar_mode || null,
  isVerified: Boolean(user.is_verified),
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const getUserById = async (userId: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapUser(user);
};

export const getUserByUsername = async (username: string) => {
  const normalizedUsername = normalizeUsername(username);

  const { data: user, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("username_normalized", normalizedUsername)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return user ? mapUser(user) : null;
};

export const updateUserProfile = async (
  userId: string,
  input: { username?: unknown; displayName?: unknown; profileColor?: unknown }
) => {
  const updates: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.username === "string") {
    const username = input.username.trim();

    if (!username) {
      throw new Error("Username is required");
    }

    if (!isValidUsername(username)) {
      throw new Error(
        "Username can only contain letters, numbers, underscore, and dot"
      );
    }

    const usernameNormalized = normalizeUsername(username);
    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("id")
      .eq("username_normalized", usernameNormalized)
      .neq("id", userId)
      .maybeSingle();

    if (ownerError) {
      throw new Error(ownerError.message);
    }

    if (owner) {
      throw new Error("Username is already taken.");
    }

    updates.username = username;
    updates.username_normalized = usernameNormalized;
  }

  if (typeof input.displayName === "string") {
    updates.display_name = input.displayName.trim();
  }

  if (typeof input.profileColor === "string") {
    updates.profile_color = input.profileColor;
  }

  if (!updates.username && !updates.display_name && !updates.profile_color) {
    throw new Error("Nothing to update");
  }

  let { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select(USER_SELECT)
    .single();

  if (error && error.message?.includes("profile_color")) {
    const fallbackUpdates = { ...updates };
    delete fallbackUpdates.profile_color;

    const fallback = await supabase
      .from("users")
      .update(fallbackUpdates)
      .eq("id", userId)
      .select(USER_SELECT)
      .single();

    user = fallback.data as any;
    error = fallback.error as any;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Failed to update profile");
  }

  return mapUser(user);
};

export const getUsersByIds = async (userIds: string[]) => {
  const uniqueIds = Array.from(new Set(userIds.filter(isUuid)));

  if (uniqueIds.length === 0) {
    return new Map<string, ReturnType<typeof mapUser>>();
  }

  const { data: users, error } = await supabase
    .from("users")
    .select(USER_SELECT)
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

export const updateUserProfilePhoto = async (
  userId: string,
  fileBuffer: Buffer
) => {
  const currentUser = await getUserById(userId);
  const uploadedImage = await uploadImageToCloudinary(
    fileBuffer,
    "moodsnap/profile_photos"
  );

  let { data: user, error } = await supabase
    .from("users")
    .update({
      avatar_url: uploadedImage.secure_url,
      avatar_public_id: uploadedImage.public_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select(USER_SELECT)
    .single();

  if (error && error.message?.includes("avatar_public_id")) {
    const fallback = await supabase
      .from("users")
      .update({
        avatar_url: uploadedImage.secure_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select(USER_SELECT)
      .single();

    user = fallback.data as any;
    error = fallback.error as any;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Failed to update profile photo");
  }

  if (currentUser.avatarPublicId) {
    await cloudinary.uploader
      .destroy(currentUser.avatarPublicId)
      .catch(() => null);
  }

  return mapUser(user);
};

export const deleteUserAccount = async (userId: string) => {
  const user = await getUserById(userId);

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => null);
  }

  const { data: snaps, error: snapsError } = await supabase
    .from("moodsnap")
    .select("image_public_id, cloudinary_public_id")
    .eq("user_id", userId);

  if (snapsError) {
    throw new Error(snapsError.message);
  }

  for (const snap of snaps || []) {
    const publicId = snap.cloudinary_public_id || snap.image_public_id;

    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(() => null);
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

  const { error: blockedDeleteError } = await supabase
    .from("blocked_users")
    .delete()
    .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);

  if (blockedDeleteError && !blockedDeleteError.message.includes("does not exist")) {
    throw new Error(blockedDeleteError.message);
  }

  await supabase
    .from("pending_registrations")
    .delete()
    .eq("email", user.email);

  await supabase
    .from("password_reset_otps")
    .delete()
    .eq("email", user.email);

  await supabase.from("otps").delete().eq("email", user.email);

  const { error: userDeleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (userDeleteError) {
    throw new Error(userDeleteError.message);
  }

  return true;
};
