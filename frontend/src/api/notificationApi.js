import { apiClient } from "./apiClient";

export const registerPushTokenApi = async ({
  expoPushToken,
  platform,
  deviceId,
}) => {
  const response = await apiClient.post("/notifications/register-token", {
    expoPushToken,
    platform,
    deviceId,
  });

  return response.data;
};

export const unregisterPushTokenApi = async (expoPushToken) => {
  const response = await apiClient.delete("/notifications/unregister-token", {
    data: { expoPushToken },
  });

  return response.data;
};
