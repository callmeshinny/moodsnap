import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "moodsnap_token";
const USER_KEY = "moodsnap_user";
const ONBOARDING_KEY = "moodsnap_has_seen_onboarding";

export const saveToken = async (token) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const saveUser = async (user) => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const user = await SecureStore.getItemAsync(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeUser = async () => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const getHasSeenOnboarding = async () => {
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return value === "true";
};

export const setHasSeenOnboarding = async () => {
  await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
};

export const clearHasSeenOnboarding = async () => {
  await SecureStore.deleteItemAsync(ONBOARDING_KEY);
};