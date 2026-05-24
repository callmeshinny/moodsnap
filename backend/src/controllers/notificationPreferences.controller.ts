import { Request, Response } from "express";
import { requireUserId } from "../middlewares/auth.middleware";
import {
  getNotificationPreferencesForUser,
  updateNotificationPreferencesForUser,
} from "../services/notification.service";

export const getNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const preferences = await getNotificationPreferencesForUser(userId);

    res.status(200).json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load preferences";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const updateNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const preferences = await updateNotificationPreferencesForUser(
      userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Notification preferences updated",
      data: { preferences },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update preferences";

    res.status(500).json({
      success: false,
      message,
    });
  }
};
