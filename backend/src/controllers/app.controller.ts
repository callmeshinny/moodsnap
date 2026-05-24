import { Request, Response } from "express";
import { getUserById } from "../services/user.service";
import { getFriendCount, getFriendLink } from "../services/friend.service";
import { getMoodStreak } from "../services/mood.service";
import { getMyRating } from "../services/rating.service";
import { requireUserId } from "../middlewares/auth.middleware";
import { getNotificationPreferencesForUser } from "../services/notification.service";

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
      getNotificationPreferencesForUser(userId),
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
