import { supabase } from "../config/supabase";
import { getUserById } from "./user.service";
import { getVisibleSnapUserIds } from "./friend.service";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_BATCH_SIZE = 100;

type ExpoPushMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: Record<string, unknown>;
};

type RegisterTokenInput = {
  expoPushToken?: unknown;
  platform?: unknown;
  deviceId?: unknown;
};

type SnapNotificationInput = {
  snap: {
    id: string;
    user_id: string;
    caption?: string | null;
    mood?: string | null;
    image_url?: string | null;
    created_at?: string;
  };
};

type NotificationPreferencesRecord = {
  new_snap_enabled?: boolean | null;
  reminders_enabled?: boolean | null;
};

export const isExpoPushToken = (token: string) => {
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

export const sendExpoMessages = async (messages: ExpoPushMessage[]) => {
  for (const batch of chunk(messages, EXPO_PUSH_BATCH_SIZE)) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Expo push failed: ${response.status} ${text}`);
    }
  }
};

const mapNotificationPreferences = (
  record?: NotificationPreferencesRecord | null
) => ({
  newSnapEnabled: record?.new_snap_enabled !== false,
  remindersEnabled: record?.reminders_enabled !== false,
});

export const getNotificationPreferencesForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("new_snap_enabled, reminders_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return mapNotificationPreferences(data);
};

export const updateNotificationPreferencesForUser = async (
  userId: string,
  input: { newSnapEnabled?: unknown; remindersEnabled?: unknown }
) => {
  const updates: Record<string, boolean | string> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (typeof input.newSnapEnabled === "boolean") {
    updates.new_snap_enabled = input.newSnapEnabled;
  }

  if (typeof input.remindersEnabled === "boolean") {
    updates.reminders_enabled = input.remindersEnabled;
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(updates, { onConflict: "user_id" })
    .select("new_snap_enabled, reminders_enabled")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapNotificationPreferences(data);
};

const getNewSnapEnabledUserIds = async (userIds: string[]) => {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("user_id, new_snap_enabled")
    .in("user_id", userIds);

  if (error) {
    throw new Error(error.message);
  }

  const disabledUserIds = new Set(
    (data || [])
      .filter((preference) => preference.new_snap_enabled === false)
      .map((preference) => String(preference.user_id))
  );

  return userIds.filter((userId) => !disabledUserIds.has(userId));
};

export const registerNotificationToken = async (
  userId: string,
  input: RegisterTokenInput
) => {
  const token =
    typeof input.expoPushToken === "string" ? input.expoPushToken.trim() : "";

  if (!token) {
    throw new Error("Expo push token is required");
  }

  if (!isExpoPushToken(token)) {
    throw new Error("Invalid Expo push token");
  }

  const platform =
    typeof input.platform === "string" ? input.platform.trim() : null;
  const deviceId =
    typeof input.deviceId === "string" ? input.deviceId.trim() : null;

  const { data, error } = await supabase
    .from("notification_tokens")
    .upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform,
        device_id: deviceId,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "expo_push_token" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    userId: data.user_id,
    expoPushToken: data.expo_push_token,
    platform: data.platform,
    deviceId: data.device_id,
    isActive: data.is_active,
  };
};

export const unregisterNotificationToken = async (
  userId: string,
  expoPushToken: unknown
) => {
  const token = typeof expoPushToken === "string" ? expoPushToken.trim() : "";

  if (!token) {
    throw new Error("Expo push token is required");
  }

  const { error } = await supabase
    .from("notification_tokens")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("expo_push_token", token);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

export const sendNewSnapNotifications = async ({
  snap,
}: SnapNotificationInput) => {
  const sender = await getUserById(snap.user_id);
  const visibleUserIds = await getVisibleSnapUserIds(snap.user_id);
  const recipientIds = visibleUserIds.filter((id) => id !== snap.user_id);

  if (recipientIds.length === 0) {
    return { sent: 0 };
  }

  const enabledRecipientIds = await getNewSnapEnabledUserIds(recipientIds);

  if (enabledRecipientIds.length === 0) {
    return { sent: 0 };
  }

  const { data: tokens, error } = await supabase
    .from("notification_tokens")
    .select("expo_push_token, user_id")
    .in("user_id", enabledRecipientIds)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const validTokens = (tokens || [])
    .map((item) => item.expo_push_token)
    .filter((token) => typeof token === "string" && isExpoPushToken(token));

  if (validTokens.length === 0) {
    return { sent: 0 };
  }

  const displayLabel = sender.displayLabel || sender.username || "A friend";
  const caption = snap.caption?.trim();
  const body = caption ? `${caption}` : "Open MoodSnap to see it.";

  const messages = validTokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title: `${displayLabel} added a new snap`,
    body,
    data: {
      type: "NEW_SNAP",
      snapId: snap.id,
      senderId: snap.user_id,
      senderUsername: sender.username,
      senderDisplayLabel: displayLabel,
      senderAvatarUrl: sender.avatarUrl || null,
      senderProfileColor: sender.profileColor || null,
      imageUrl: snap.image_url || null,
      caption: caption || null,
      mood: snap.mood || null,
      createdAt: snap.created_at || null,
      url: `/tabs/feed?snapId=${snap.id}`,
    },
  }));

  await sendExpoMessages(messages);

  return { sent: messages.length };
};
