import { API_BASE_URL } from "../constants/config";

export const getSnapsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/snaps`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get snaps");
  }

  return data;
};

export const createSnapApi = async ({ imageUri, mood, caption }) => {
  const formData = new FormData();

  formData.append("image", {
    uri: imageUri,
    name: "snap.jpg",
    type: "image/jpeg",
  });

  formData.append("mood", mood);

  if (caption) {
    formData.append("caption", caption);
  }

  const response = await fetch(`${API_BASE_URL}/snaps`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create snap");
  }

  return data;
};
