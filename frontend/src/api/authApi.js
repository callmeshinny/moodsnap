import { apiClient } from "./apiClient";

export const signUpApi = async ({ username, email, password }) => {
  const response = await apiClient.post("/auth/signup", {
    username,
    email,
    password
  });

  return response.data;
};

export const verifyOtpApi = async ({ email, otp }) => {
  const response = await apiClient.post("/auth/verify-otp", {
    email,
    otp
  });

  return response.data;
};

export const signInApi = async ({ email, password }) => {
  const response = await apiClient.post("/auth/signin", {
    email,
    password
  });

  return response.data;
};

export const resendOtpApi = async ({ email }) => {
  const response = await apiClient.post("/auth/resend-otp", {
    email
  });

  return response.data;
};