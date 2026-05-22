import { supabase } from "../config/supabase";

type SnapRecord = {
  id: string;
  mood: string;
  image_url: string;
  image_public_id?: string | null;
  cloudinary_public_id?: string | null;
  created_at: string;
};

const toLocalDateKey = (dateValue: string) => {
  return new Date(dateValue).toISOString().slice(0, 10);
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
