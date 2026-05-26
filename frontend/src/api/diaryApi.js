import { apiClient } from "./apiClient";
import { getFeedApi } from "./snapApi";

const toLocalDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const buildSnapFallbackDiaries = (snaps, targetDate) => {
  const groups = new Map();

  for (const snap of snaps || []) {
    const entryDate = toLocalDateKey(snap.createdAt);

    if (targetDate && entryDate !== targetDate) {
      continue;
    }

    const ownerKey = snap.userId || snap.user?.id || "unknown";
    const groupKey = `${ownerKey}-${entryDate}`;
    const current = groups.get(groupKey) || {
      id: `snap-day-${groupKey}`,
      userId: ownerKey,
      entryDate,
      title: "Daily moments",
      content: "",
      mood: snap.mood || "normal",
      coverImageUrl: snap.thumbnailUrl || snap.previewUrl || snap.imageUrl || null,
      createdAt: snap.createdAt,
      updatedAt: snap.createdAt,
      user: snap.user || null,
      snaps: [],
      snapCount: 0,
      isSnapFallback: true,
    };

    current.snaps.push(snap);
    current.snapCount = current.snaps.length;
    current.coverImageUrl =
      current.coverImageUrl ||
      snap.thumbnailUrl ||
      snap.previewUrl ||
      snap.imageUrl ||
      null;
    current.title =
      current.user?.displayLabel || current.user?.username
        ? `${current.user.displayLabel || current.user.username}'s moments`
        : "Daily moments";
    current.content =
      current.snaps
        .map((item) => item.caption || item.mood)
        .filter(Boolean)
        .slice(0, 4)
        .join(" · ") || "Moments captured on this day.";

    groups.set(groupKey, current);
  }

  return Array.from(groups.values()).sort(
    (first, second) =>
      new Date(second.createdAt || 0).getTime() -
      new Date(first.createdAt || 0).getTime()
  );
};

export const getTodayDiaryApi = async () => {
  const response = await apiClient.get("/diaries/today");
  return response.data;
};

export const getDiariesApi = async ({ limit = 20 } = {}) => {
  const response = await apiClient.get("/diaries", {
    params: { limit },
  });
  return {
    ...response.data,
    diaries: response.data.diaries || response.data.data?.diaries || [],
  };
};

export const createDiaryApi = async ({
  entryDate,
  title,
  content,
  mood,
  coverImageUrl,
}) => {
  const response = await apiClient.post("/diaries", {
    entryDate,
    title,
    content,
    mood,
    coverImageUrl,
  });

  return response.data;
};

export const updateDiaryApi = async (
  diaryId,
  { title, content, mood, coverImageUrl }
) => {
  const response = await apiClient.patch(`/diaries/${encodeURIComponent(diaryId)}`, {
    title,
    content,
    mood,
    coverImageUrl,
  });

  return response.data;
};

export const getDiaryApi = async (diaryId) => {
  const response = await apiClient.get(`/diaries/${encodeURIComponent(diaryId)}`);
  return {
    ...response.data,
    diary: response.data.diary || response.data.data?.diary || null,
  };
};

export const getDiaryFeedApi = async ({ date, limit = 30 } = {}) => {
  try {
    const response = await apiClient.get("/diaries/feed", {
      params: {
        date,
        limit,
      },
    });

    const diaries = response.data.diaries || response.data.data?.diaries || [];

    if (diaries.length > 0) {
      return {
        ...response.data,
        diaries,
      };
    }
  } catch {
    // Fall through to snap grouping while deployed backend catches up with diary APIs.
  }

  const snapFeed = await getFeedApi({ limit: 50 });
  const diaries = buildSnapFallbackDiaries(snapFeed.snaps || [], date);

  return {
    success: true,
    fallback: "snaps",
    diaries,
  };
};
