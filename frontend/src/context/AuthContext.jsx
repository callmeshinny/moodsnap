import React, { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { getFriendCountApi, getFriendLinkApi } from "../api/friendApi";
import { getMoodStreakApi } from "../api/moodApi";
import { setUnauthorizedHandler } from "../api/sessionHandler";
import { getMeApi, updateMeApi, uploadProfilePhotoApi } from "../api/userApi";
import { registerCurrentDevicePushToken } from "../services/pushNotificationService";
import NewSnapBanner from "../components/NewSnapBanner";
import {
  getToken,
  getUser,
  removeToken,
  removeUser,
  saveToken,
  saveUser,
} from "../storage/tokenStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friendCount, setFriendCount] = useState(0);
  const [friendLink, setFriendLink] = useState("");
  const [streak, setStreak] = useState(0);
  const [postedToday, setPostedToday] = useState(false);
  const [lastSnapAt, setLastSnapAt] = useState(null);
  const [todayKey, setTodayKey] = useState(null);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [foregroundSnapNotification, setForegroundSnapNotification] = useState(null);

  const clearSession = async () => {
    await removeToken();
    await removeUser();
    setToken(null);
    setUser(null);
    setFriendCount(0);
    setFriendLink("");
    setStreak(0);
    setPostedToday(false);
    setLastSnapAt(null);
    setTodayKey(null);
  };

  const loadSession = async () => {
    try {
      const storedToken = await getToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);

      const result = await getMeApi();

      if (result.user) {
        await saveUser(result.user);
        setUser(result.user);
        return;
      }

      await clearSession();
    } catch {
      const storedUser = await getUser();

      if (storedUser) {
        setUser(storedUser);
        return;
      }

      await clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async (message) => {
      await clearSession();
      router.replace("/auth/signin");
      Alert.alert("Session expired", message);
    });
  }, []);

  const refreshProfile = async () => {
    const result = await getMeApi();

    if (result.user) {
      await saveUser(result.user);
      setUser(result.user);
    }

    return result.user;
  };

  const buildOptimisticUser = (currentUser, data) => {
    if (!currentUser) {
      return currentUser;
    }

    const nextUsername =
      typeof data.username === "string" && data.username.trim()
        ? data.username.trim().replace(/^@+/, "")
        : currentUser.username;
    const nextDisplayName =
      typeof data.displayName === "string"
        ? data.displayName.trim() || null
        : currentUser.displayName || null;
    const nextProfileColor =
      typeof data.profileColor === "string" && data.profileColor.trim()
        ? data.profileColor.trim()
        : currentUser.profileColor;

    return {
      ...currentUser,
      username: nextUsername,
      displayName: nextDisplayName,
      displayLabel: nextDisplayName || nextUsername,
      profileColor: nextProfileColor,
    };
  };

  const updateUser = async (data, options = {}) => {
    const previousUser = user;

    if (options.optimistic) {
      setUser((currentUser) => buildOptimisticUser(currentUser, data));
    }

    try {
      const result = await updateMeApi(data);

      if (result.user) {
        await saveUser(result.user);
        setUser(result.user);
        setFeedRefreshKey((current) => current + 1);
        const linkResult = await getFriendLinkApi().catch(() => null);
        setFriendLink(linkResult?.friendLink || "");
      }

      return result.user;
    } catch (error) {
      if (options.optimistic && previousUser) {
        setUser(previousUser);
      }

      throw error;
    }
  };

  const updateProfilePhoto = async (imageUri) => {
    const result = await uploadProfilePhotoApi(imageUri);

    if (result.user) {
      await saveUser(result.user);
      setUser(result.user);
      setFeedRefreshKey((current) => current + 1);
    }

    return result.user;
  };

  const refreshFriendCount = async () => {
    const result = await getFriendCountApi();
    setFriendCount(result.count || 0);
    return result.count || 0;
  };

  const refreshFriendLink = async () => {
    const result = await getFriendLinkApi();
    setFriendLink(result.friendLink || "");
    return result.friendLink || "";
  };

  const refreshStreak = async () => {
    const result = await getMoodStreakApi();
    setStreak(result.streak || 0);
    setPostedToday(Boolean(result.hasPostedToday ?? result.postedToday));
    setLastSnapAt(result.lastSnapAt || null);
    setTodayKey(result.todayKey || null);
    return result.streak || 0;
  };

  const refreshAppData = async () => {
    await Promise.allSettled([
      refreshProfile(),
      refreshFriendCount(),
      refreshFriendLink(),
      refreshStreak(),
    ]);
  };

  useEffect(() => {
    if (user) {
      refreshAppData();
    }
  }, [user?.id]);

  const login = async (nextToken, userData) => {
    await saveToken(nextToken);
    await saveUser(userData);
    setToken(nextToken);
    setUser(userData);
  };

  const logout = async () => {
    await clearSession();
  };

  const refreshFeed = () => {
    setFeedRefreshKey((current) => current + 1);
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data || {};

        if (data.type === "NEW_SNAP") {
          setForegroundSnapNotification({
            id: `${data.snapId || "snap"}-${Date.now()}`,
            ...data,
          });
          refreshFeed?.();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);


  useEffect(() => {
    if (!token || !user?.id) {
      return;
    }

    registerCurrentDevicePushToken().catch((error) => {
      console.log("Could not register push token:", error?.message || error);
    });
  }, [token, user?.id]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data || {};

        if (data.type === "NEW_SNAP") {
          refreshFeed?.();
          router.push({
            pathname: "/tabs/feed",
            params: data.snapId ? { snapId: String(data.snapId) } : undefined,
          });
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);


  const handleOpenForegroundSnap = () => {
    const snapId = foregroundSnapNotification?.snapId;

    setForegroundSnapNotification(null);
    refreshFeed?.();

    router.push({
      pathname: "/tabs/feed",
      params: snapId ? { snapId: String(snapId) } : undefined,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        friendCount,
        friendLink,
        streak,
        postedToday,
        lastSnapAt,
        todayKey,
        feedRefreshKey,
        login,
        logout,
        refreshAppData,
        refreshProfile,
        updateUser,
        updateProfilePhoto,
        refreshFriendCount,
        refreshFriendLink,
        refreshStreak,
        refreshFeed,
      }}
    >
      <>
        {children}
        <NewSnapBanner
          visible={Boolean(foregroundSnapNotification)}
          notification={foregroundSnapNotification}
          onClose={() => setForegroundSnapNotification(null)}
          onPress={handleOpenForegroundSnap}
        />
      </>
    </AuthContext.Provider>
  );
}
