import { supabase } from "../config/supabase";
import {
  getNotificationPreferencesForUser,
  isExpoPushToken,
  sendExpoMessages,
} from "./notification.service";
import { getSafeTimezone } from "./mood.service";

type ReminderStageKey = "sent_3h" | "sent_12h" | "sent_1d" | "sent_2d" | "sent_3d";

type ReminderStage = {
  stage: "3h" | "12h" | "1d" | "2d" | "3d";
  key: ReminderStageKey;
  thresholdMs: number;
  title: string;
  body: string;
};

const REMINDER_STAGES: ReminderStage[] = [
  {
    stage: "3h",
    key: "sent_3h",
    thresholdMs: 3 * 60 * 60 * 1000,
    title: "MoodSnap check-in",
    body: "It’s been 3 hours. Share a quick snap?",
  },
  {
    stage: "12h",
    key: "sent_12h",
    thresholdMs: 12 * 60 * 60 * 1000,
    title: "Your friends miss your mood",
    body: "Post a snap and keep your streak alive.",
  },
  {
    stage: "1d",
    key: "sent_1d",
    thresholdMs: 24 * 60 * 60 * 1000,
    title: "1 day without a snap",
    body: "Capture today’s mood before it disappears.",
  },
  {
    stage: "2d",
    key: "sent_2d",
    thresholdMs: 2 * 24 * 60 * 60 * 1000,
    title: "MoodSnap is getting lonely",
    body: "It’s been 2 days. Want to share a new snap?",
  },
  {
    stage: "3d",
    key: "sent_3d",
    thresholdMs: 3 * 24 * 60 * 60 * 1000,
    title: "Come back to MoodSnap",
    body: "Your mood diary is waiting for a new snap.",
  },
];

const getLocalDateTimeLabel = (dateValue: string, timezone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: getSafeTimezone(timezone),
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
};

export const resetReminderStateForSnap = async (
  userId: string,
  lastSnapAt: string
) => {
  const { error } = await supabase.from("notification_reminder_state").upsert(
    {
      user_id: userId,
      last_snap_at: lastSnapAt,
      sent_3h: false,
      sent_12h: false,
      sent_1d: false,
      sent_2d: false,
      sent_3d: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

const getUsersWithActiveTokens = async () => {
  const { data, error } = await supabase
    .from("notification_tokens")
    .select("user_id")
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(new Set((data || []).map((item) => String(item.user_id))));
};

const getActiveTokensForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("notification_tokens")
    .select("expo_push_token")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data || [])
    .map((item) => String(item.expo_push_token || ""))
    .filter((token) => token && isExpoPushToken(token));
};

const getReminderPreferenceEnabled = async (userId: string) => {
  const preferences = await getNotificationPreferencesForUser(userId);
  return preferences.remindersEnabled;
};

const getUserAndLastSnap = async (userId: string) => {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, timezone, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    return null;
  }

  const { data: snap, error: snapError } = await supabase
    .from("moodsnap")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapError) {
    throw new Error(snapError.message);
  }

  return {
    user,
    timezone: getSafeTimezone(user.timezone),
    lastSnapAt: snap?.created_at || user.created_at,
  };
};

const getReminderState = async (userId: string) => {
  const { data, error } = await supabase
    .from("notification_reminder_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const saveReminderState = async (
  userId: string,
  lastSnapAt: string,
  updates: Partial<Record<ReminderStageKey, boolean>>
) => {
  const { error } = await supabase.from("notification_reminder_state").upsert(
    {
      user_id: userId,
      last_snap_at: lastSnapAt,
      ...updates,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
};

const pickReminderStage = (
  elapsedMs: number,
  state: Record<string, unknown> | null
) => {
  const eligible = REMINDER_STAGES.filter((stage) => {
    return elapsedMs >= stage.thresholdMs && state?.[stage.key] !== true;
  });

  return eligible[eligible.length - 1] || null;
};

const buildSentUpdates = (selectedStage: ReminderStage) => {
  const updates: Partial<Record<ReminderStageKey, boolean>> = {};

  for (const stage of REMINDER_STAGES) {
    if (stage.thresholdMs <= selectedStage.thresholdMs) {
      updates[stage.key] = true;
    }
  }

  return updates;
};

export const sendSnapReminderNotifications = async () => {
  const userIds = await getUsersWithActiveTokens();
  let checked = 0;
  let sent = 0;
  let skipped = 0;
  const errors: Array<{ userId: string; message: string }> = [];

  for (const userId of userIds) {
    checked += 1;

    try {
      const remindersEnabled = await getReminderPreferenceEnabled(userId);

      if (!remindersEnabled) {
        skipped += 1;
        continue;
      }

      const userData = await getUserAndLastSnap(userId);

      if (!userData?.lastSnapAt) {
        skipped += 1;
        continue;
      }

      const state = await getReminderState(userId);
      const stateLastSnapAt = state?.last_snap_at
        ? new Date(state.last_snap_at).toISOString()
        : null;
      const currentLastSnapAt = new Date(userData.lastSnapAt).toISOString();

      let effectiveState = state as Record<string, unknown> | null;

      if (!state || stateLastSnapAt !== currentLastSnapAt) {
        await saveReminderState(userId, currentLastSnapAt, {
          sent_3h: false,
          sent_12h: false,
          sent_1d: false,
          sent_2d: false,
          sent_3d: false,
        });
        effectiveState = null;
      }

      const elapsedMs = Date.now() - new Date(currentLastSnapAt).getTime();
      const stage = pickReminderStage(elapsedMs, effectiveState);

      if (!stage) {
        skipped += 1;
        continue;
      }

      const tokens = await getActiveTokensForUser(userId);

      if (tokens.length === 0) {
        skipped += 1;
        continue;
      }

      const lastSnapLabel = getLocalDateTimeLabel(
        currentLastSnapAt,
        userData.timezone
      );

      await sendExpoMessages(
        tokens.map((token) => ({
          to: token,
          sound: "default" as const,
          title: stage.title,
          body: stage.body,
          data: {
            type: "SNAP_REMINDER",
            stage: stage.stage,
            url: "/tabs/camera",
            lastSnapAt: currentLastSnapAt,
            lastSnapLabel,
          },
        }))
      );

      await saveReminderState(
        userId,
        currentLastSnapAt,
        buildSentUpdates(stage)
      );

      sent += tokens.length;
    } catch (error) {
      errors.push({
        userId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    checked,
    sent,
    skipped,
    errors,
  };
};
