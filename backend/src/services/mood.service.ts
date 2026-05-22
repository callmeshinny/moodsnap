import { supabase } from "../config/supabase";

type SnapRecord = {
  id: string;
  mood: string;
  created_at: string;
};

const toLocalDateKey = (dateValue: string) => {
  return new Date(dateValue).toISOString().slice(0, 10);
};

export const getMoodCalendar = async (userId: string) => {
  const { data: snaps, error } = await supabase
    .from("moodsnap")
    .select("id, mood, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const latestByDate = new Map<string, SnapRecord>();

  for (const snap of snaps || []) {
    const date = toLocalDateKey(snap.created_at);
    const existing = latestByDate.get(date);

    if (!existing || new Date(snap.created_at) > new Date(existing.created_at)) {
      latestByDate.set(date, snap);
    }
  }

  const entries = Array.from(latestByDate.entries()).map(([date, snap]) => ({
    date,
    mood: snap.mood,
    snapId: snap.id,
    createdAt: snap.created_at,
  }));

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
  const { data: snaps, error } = await supabase
    .from("moodsnap")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const activityDates = new Set(
    (snaps || []).map((snap) => toLocalDateKey(snap.created_at))
  );

  let cursor = new Date();
  let streak = 0;

  while (activityDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};
