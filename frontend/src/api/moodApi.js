import { apiClient } from "./apiClient";

export const getMoodCalendarApi = async () => {
  const response = await apiClient.get("/moods/calendar");
  return response.data;
};

export const getMoodStreakApi = async () => {
  const response = await apiClient.get("/moods/streak");
  return response.data;
};
