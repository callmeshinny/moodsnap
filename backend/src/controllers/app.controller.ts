import { Request, Response } from "express";
import { getUserById } from "../services/user.service";
import { getFriendCount, getFriendLink } from "../services/friend.service";
import { getMoodStreak } from "../services/mood.service";
import { getMyRating } from "../services/rating.service";
import { supabase } from "../config/supabase";

const requireUserId = (req: Request, res: Response): string | null => {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      message: "Authentication is required",
    });
    return null;
  }

  return req.user.id;
};

const getNotificationPreferences = async (userId: string) => {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("new_snap_enabled, reminders_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    newSnapEnabled: data?.new_snap_enabled !== false,
    remindersEnabled: data?.reminders_enabled !== false,
  };
};

export const getAppBootstrap = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const [
      user,
      friendCount,
      friendLink,
      streak,
      rating,
      notificationPreferences,
    ] = await Promise.all([
      getUserById(userId),
      getFriendCount(userId),
      getFriendLink(userId),
      getMoodStreak(userId),
      getMyRating(userId),
      getNotificationPreferences(userId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        friendCount,
        friendLink: friendLink.friendLink,
        streak,
        rating: {
          hasRated: Boolean(rating),
          rating,
        },
        notificationPreferences,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load app data";

    res.status(500).json({
      success: false,
      message,
    });
  }
};
