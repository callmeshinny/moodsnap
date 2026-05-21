import axios from "axios";
import { API_BASE_URL } from "../constants/config";

export const signUpApi = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, data);
  return response.data;
};

export const verifyOtpApi = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, data);
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
