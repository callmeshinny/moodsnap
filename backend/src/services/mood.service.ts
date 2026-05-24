import { supabase } from "../config/supabase";

type SnapRecord = {
  id: string;
  mood: string;
  image_url: string;
  image_public_id?: string | null;
  cloudinary_public_id?: string | null;
  created_at: string;
};

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

export const getSafeTimezone = (timezone?: string | null) => {
  if (!timezone) {
    return DEFAULT_TIMEZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

const toLocalDateKey = (dateValue: string | Date) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toZonedDateKey = (dateValue: string | Date, timezone: string) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const getUserTimezone = async (userId: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return getSafeTimezone(user?.timezone);
};

export const getMoodCalendar = async (userId: string) => {
  const { data: snaps, error } = await supabase
    .from("moodsnap")
    .select("id, mood, image_url, image_public_id, cloudinary_public_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const snapsByDate = new Map<string, SnapRecord[]>();

  for (const snap of snaps || []) {
    const date = toLocalDateKey(snap.created_at);
    const current = snapsByDate.get(date) || [];
    current.push(snap);
    snapsByDate.set(date, current);
  }

  const entries = Array.from(snapsByDate.entries()).map(([date, daySnaps]) => {
    const sortedSnaps = [...daySnaps].sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime()
    );
    const latestSnap = sortedSnaps[0];

    return {
      date,
      mood: latestSnap.mood,
      snapId: latestSnap.id,
      imageUrl: latestSnap.image_url,
      imagePublicId:
        latestSnap.cloudinary_public_id || latestSnap.image_public_id || null,
      createdAt: latestSnap.created_at,
      snaps: sortedSnaps.map((snap) => ({
        id: snap.id,
        mood: snap.mood,
        imageUrl: snap.image_url,
        imagePublicId: snap.cloudinary_public_id || snap.image_public_id || null,
        createdAt: snap.created_at,
      })),
    };
  });

  const now = new Date();
  const currentMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).toISOString();

  return {
    entries,
    startedAt: snaps?.[0]?.created_at || null,
    currentMonthEnd,
  };
};

export const getMoodStreak = async (userId: string) => {
  const timezone = await getUserTimezone(userId);
  const { data: snaps, error } = await supabase
    .from("moodsnap")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const activityDates = new Set(
    (snaps || []).map((snap) => toZonedDateKey(snap.created_at, timezone))
  );

  const now = new Date();
  const todayKey = toZonedDateKey(now, timezone);
  const hasPostedToday = activityDates.has(todayKey);
  const lastSnapAt = snaps?.[0]?.created_at || null;
  let cursor = hasPostedToday ? now : addDays(now, -1);
  let streak = 0;

  while (activityDates.has(toZonedDateKey(cursor, timezone))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    streak,
    hasPostedToday,
    postedToday: hasPostedToday,
    lastSnapAt,
    todayKey,
  };
};
