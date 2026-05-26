import { supabase } from "../config/supabase";
import { areAcceptedFriends, getVisibleSnapUserIds } from "./friend.service";
import { getUserById, getUsersByIds } from "./user.service";

type DiaryRecord = {
  id: string;
  user_id: string;
  entry_date: string;
  title: string;
  content: string;
  mood: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

type SnapRecord = {
  id: string;
  user_id: string;
  mood: string;
  caption?: string | null;
  image_url: string;
  image_public_id?: string | null;
  cloudinary_public_id?: string | null;
  soft_filter_enabled?: boolean | null;
  created_at: string;
  updated_at?: string | null;
};

const DIARY_SELECT =
  "id, user_id, entry_date, title, content, mood, cover_image_url, created_at, updated_at";
const SNAP_SELECT =
  "id, user_id, mood, caption, image_url, image_public_id, cloudinary_public_id, soft_filter_enabled, created_at, updated_at";
const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

const isDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const getSafeTimezone = (timezone?: string | null) => {
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

const mapSnap = (snap: SnapRecord) => ({
  id: snap.id,
  userId: snap.user_id,
  mood: snap.mood,
  caption: snap.caption || null,
  imageUrl: snap.image_url,
  imagePublicId: snap.cloudinary_public_id || snap.image_public_id || null,
  softFilterEnabled: Boolean(snap.soft_filter_enabled),
  createdAt: snap.created_at,
  updatedAt: snap.updated_at || null,
});

const mapDiary = (
  diary: DiaryRecord,
  options: {
    user?: any;
    snaps?: SnapRecord[];
    snapCount?: number;
  } = {}
) => ({
  id: diary.id,
  userId: diary.user_id,
  entryDate: diary.entry_date,
  title: diary.title,
  content: diary.content,
  mood: diary.mood || "normal",
  coverImageUrl: diary.cover_image_url || null,
  createdAt: diary.created_at,
  updatedAt: diary.updated_at,
  user: options.user || null,
  snaps: options.snaps?.map(mapSnap) || [],
  snapCount: options.snapCount ?? options.snaps?.length ?? 0,
});

const getSnapsForUserDate = async (
  userId: string,
  entryDate: string,
  timezone?: string
) => {
  const safeTimezone = timezone || (await getUserTimezone(userId));
  const { data: snaps, error } = await supabase
    .from("moodsnap")
    .select(SNAP_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((snaps || []) as SnapRecord[]).filter(
    (snap) => toZonedDateKey(snap.created_at, safeTimezone) === entryDate
  );
};

const getDiaryById = async (diaryId: string) => {
  const { data: diary, error } = await supabase
    .from("diaries")
    .select(DIARY_SELECT)
    .eq("id", diaryId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return diary as DiaryRecord | null;
};

export const getDiaryToday = async (userId: string) => {
  const timezone = await getUserTimezone(userId);
  const todayKey = toZonedDateKey(new Date(), timezone);
  const snaps = await getSnapsForUserDate(userId, todayKey, timezone);

  const { data: diary, error } = await supabase
    .from("diaries")
    .select(DIARY_SELECT)
    .eq("user_id", userId)
    .eq("entry_date", todayKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    todayKey,
    hasDiaryToday: Boolean(diary),
    unsnappedCount: diary ? 0 : snaps.length,
    snaps: snaps.map(mapSnap),
    diary: diary ? mapDiary(diary as DiaryRecord, { snaps }) : null,
  };
};

export const listMyDiaries = async (userId: string, limit = 20) => {
  const { data: diaries, error } = await supabase
    .from("diaries")
    .select(DIARY_SELECT)
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) {
    throw new Error(error.message);
  }

  return (diaries || []).map((diary) => mapDiary(diary as DiaryRecord));
};

export const createDiary = async (
  userId: string,
  input: {
    entryDate?: unknown;
    title?: unknown;
    content?: unknown;
    mood?: unknown;
    coverImageUrl?: unknown;
  }
) => {
  const timezone = await getUserTimezone(userId);
  const entryDate =
    typeof input.entryDate === "string" && isDateKey(input.entryDate)
      ? input.entryDate
      : toZonedDateKey(new Date(), timezone);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content.trim() : "";
  const mood = typeof input.mood === "string" ? input.mood.trim() : "normal";

  if (!title) {
    throw new Error("Diary title is required");
  }

  if (!content) {
    throw new Error("Diary content is required");
  }

  const snaps = await getSnapsForUserDate(userId, entryDate, timezone);
  const coverImageUrl =
    typeof input.coverImageUrl === "string" && input.coverImageUrl.trim()
      ? input.coverImageUrl.trim()
      : snaps[0]?.image_url || null;

  const { data: diary, error } = await supabase
    .from("diaries")
    .insert({
      user_id: userId,
      entry_date: entryDate,
      title,
      content,
      mood,
      cover_image_url: coverImageUrl,
    })
    .select(DIARY_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("You already created a diary for this day");
    }

    throw new Error(error.message);
  }

  return mapDiary(diary as DiaryRecord, { snaps });
};

export const updateDiary = async (
  userId: string,
  diaryId: string,
  input: {
    title?: unknown;
    content?: unknown;
    mood?: unknown;
    coverImageUrl?: unknown;
  }
) => {
  const current = await getDiaryById(diaryId);

  if (!current || current.user_id !== userId) {
    throw new Error("Diary not found");
  }

  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.title === "string") {
    const title = input.title.trim();
    if (!title) {
      throw new Error("Diary title is required");
    }
    updates.title = title;
  }

  if (typeof input.content === "string") {
    const content = input.content.trim();
    if (!content) {
      throw new Error("Diary content is required");
    }
    updates.content = content;
  }

  if (typeof input.mood === "string") {
    updates.mood = input.mood.trim() || "normal";
  }

  if (typeof input.coverImageUrl === "string") {
    updates.cover_image_url = input.coverImageUrl.trim() || null;
  }

  const { data: diary, error } = await supabase
    .from("diaries")
    .update(updates)
    .eq("id", diaryId)
    .eq("user_id", userId)
    .select(DIARY_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const timezone = await getUserTimezone(userId);
  const snaps = await getSnapsForUserDate(userId, diary.entry_date, timezone);

  return mapDiary(diary as DiaryRecord, { snaps });
};

export const getDiaryDetails = async (viewerId: string, diaryId: string) => {
  const diary = await getDiaryById(diaryId);

  if (!diary) {
    throw new Error("Diary not found");
  }

  if (diary.user_id !== viewerId) {
    const canView = await areAcceptedFriends(viewerId, diary.user_id);
    if (!canView) {
      throw new Error("Diary not found");
    }
  }

  const [owner, timezone] = await Promise.all([
    getUserById(diary.user_id),
    getUserTimezone(diary.user_id),
  ]);
  const snaps = await getSnapsForUserDate(diary.user_id, diary.entry_date, timezone);

  return mapDiary(diary, { user: owner, snaps });
};

export const getDiaryFeed = async (
  viewerId: string,
  options: {
    entryDate?: unknown;
    limit?: unknown;
  } = {}
) => {
  const visibleUserIds = await getVisibleSnapUserIds(viewerId);
  const limit =
    typeof options.limit === "number" && Number.isFinite(options.limit)
      ? Math.min(Math.max(options.limit, 1), 50)
      : 30;

  let query = supabase
    .from("diaries")
    .select(DIARY_SELECT)
    .in("user_id", visibleUserIds)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (typeof options.entryDate === "string" && isDateKey(options.entryDate)) {
    query = query.eq("entry_date", options.entryDate);
  }

  const { data: diaries, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (diaries || []) as DiaryRecord[];
  const usersById = await getUsersByIds(rows.map((diary) => diary.user_id));

  return Promise.all(
    rows.map(async (diary) =>
      mapDiary(diary, {
        user: usersById.get(diary.user_id) || null,
        snaps: await getSnapsForUserDate(diary.user_id, diary.entry_date),
      })
    )
  );
};
