import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { registerPushTokenApi } from "../api/notificationApi";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getProjectId = () => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    null
  );
};

export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device.");
    return null;
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (existingPermission.status !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission was not granted.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F65078",
    });
  }

  const projectId = getProjectId();

  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  return tokenResult.data;
};

export const registerCurrentDevicePushToken = async () => {
  const expoPushToken = await registerForPushNotificationsAsync();

  if (!expoPushToken) {
    return null;
  }

  await registerPushTokenApi({
    expoPushToken,
    platform: Platform.OS,
    deviceId: Device.osInternalBuildId || Device.deviceName || null,
  });

  return expoPushToken;
};
