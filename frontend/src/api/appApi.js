import { apiClient } from "./apiClient";

export const getAppBootstrapApi = async () => {
  const response = await apiClient.get("/app/bootstrap");
  return response.data;
};
