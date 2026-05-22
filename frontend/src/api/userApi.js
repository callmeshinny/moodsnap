import { apiClient } from "./apiClient";

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
