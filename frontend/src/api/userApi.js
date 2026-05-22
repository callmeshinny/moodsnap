import { apiClient } from "./apiClient";
import { API_BASE_URL } from "../constants/config";
import { getToken } from "../storage/tokenStorage";

export const getMeApi = async () => {
  const response = await apiClient.get("/users/me");
  return response.data;
};

export const updateMeApi = async (data) => {
  const response = await apiClient.patch("/users/me", data);
  return response.data;
};

export const deleteMeApi = async () => {
  const response = await apiClient.delete("/users/me");
  return response.data;
};

export const uploadProfilePhotoApi = async (imageUri) => {
  const token = await getToken();
  const formData = new FormData();
  const fileName = imageUri.split("/").pop() || "profile-photo.jpg";
  const extension = fileName.split(".").pop()?.toLowerCase();
  const imageType = extension === "png" ? "image/png" : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: fileName.includes(".") ? fileName : "profile-photo.jpg",
    type: imageType,
  });

  const response = await fetch(`${API_BASE_URL}/users/me/photo`, {
    method: "PATCH",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile photo");
  }

  return data;
};
