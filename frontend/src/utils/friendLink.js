export const extractFriendIdentifier = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const withoutQuery = raw.split("?")[0].split("#")[0];
  const cleaned = withoutQuery.replace(/\/$/, "");
  const parts = cleaned.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1];

  if (
    cleaned.includes("moodsnap.cam/") ||
    cleaned.includes("moodsnap-92ps.onrender.com/friend/") ||
    cleaned.includes("moodsnap://friend/") ||
    cleaned.includes("frontend://friend/")
  ) {
    return decodeURIComponent(lastPart || "").trim();
  }

  return raw.replace(/^@/, "").trim();
};
