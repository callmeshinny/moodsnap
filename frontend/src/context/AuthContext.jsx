import React, { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { getFriendCountApi, getFriendLinkApi } from "../api/friendApi";
import { getMoodStreakApi } from "../api/moodApi";
import { setUnauthorizedHandler } from "../api/sessionHandler";
import { getMeApi, updateMeApi, uploadProfilePhotoApi } from "../api/userApi";
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
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  const clearSession = async () => {
    await removeToken();
    await removeUser();
    setToken(null);
    setUser(null);
    setFriendCount(0);
    setFriendLink("");
    setStreak(0);
    setPostedToday(false);
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

  const updateUser = async (data) => {
    const result = await updateMeApi(data);

    if (result.user) {
      await saveUser(result.user);
      setUser(result.user);
      setFeedRefreshKey((current) => current + 1);
      const linkResult = await getFriendLinkApi().catch(() => null);
      setFriendLink(linkResult?.friendLink || "");
    }

    return result.user;
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
    setPostedToday(Boolean(result.postedToday));
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
      {children}
    </AuthContext.Provider>
  );
}
