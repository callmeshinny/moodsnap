import { apiClient } from "./apiClient";

export const rateMoodSnapApi = async ({ rating, feedback }) => {
  const response = await apiClient.post("/ratings", {
    rating,
    feedback,
  });
  return response.data;
};

export const getMyRatingApi = async () => {
  const response = await apiClient.get("/ratings/me");
  return response.data;
};
