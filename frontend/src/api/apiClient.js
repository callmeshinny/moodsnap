import axios from "axios";
import { API_BASE_URL } from "../constants/config";
import { getToken } from "../storage/tokenStorage";
import { notifyUnauthorized } from "./sessionHandler";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      notifyUnauthorized(
        error.response?.data?.message ||
          "Your session expired. Please sign in again."
      );
    }

    return Promise.reject(error);
  }
);
