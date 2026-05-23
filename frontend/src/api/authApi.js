import axios from "axios";
import { API_BASE_URL } from "../constants/config";

export const signUpApi = async (data) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/signup/request-otp`,
    data
  );
  return response.data;
};

export const verifyOtpApi = async (data) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/signup/verify-otp`,
    data
  );
  return response.data;
};

export const signInApi = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signin`, data);
  return response.data;
};

export const resendOtpApi = async (email) => {
  const response = await axios.post(`${API_BASE_URL}/auth/resend-otp`, { email });
  return response.data;
};


export const forgotPasswordApi = async (email) => {
  const response = await axios.post(`${API_BASE_URL}/auth/password/request-otp`, {
    email
  });
  return response.data;
};

export const verifyPasswordOtpApi = async (data) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/password/verify-otp`,
    data
  );
  return response.data;
};

export const resetPasswordApi = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/auth/password/reset`, data);
  return response.data;
};
