import { API_BASE_URL } from "../constants/config";
import { getToken } from "../storage/tokenStorage";

export const getSnapsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/snaps`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get snaps");
  }

  return data;
};

export const getFeedApi = async ({ cursor, limit = 20 } = {}) => {
  const token = await getToken();
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(`${API_BASE_URL}/snaps/feed?${params.toString()}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get feed");
  }

  return data;
};

export const createSnapApi = async ({ imageUri, mood, caption }) => {
  const token = await getToken();
  const formData = new FormData();

  const fileName = imageUri.split("/").pop() || "snap.jpg";
  const extension = fileName.split(".").pop()?.toLowerCase();
  const imageType = extension === "png" ? "image/png" : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: fileName.includes(".") ? fileName : "snap.jpg",
    type: imageType,
  });

  formData.append("mood", mood);

  if (caption) {
    formData.append("caption", caption);
  }

  const response = await fetch(`${API_BASE_URL}/snaps`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create snap");
  }

  return data;
};
