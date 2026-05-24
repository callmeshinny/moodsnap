import { Request, Response } from "express";
import {
  registerNotificationToken,
  unregisterNotificationToken,
} from "../services/notification.service";
import { requireUserId } from "../middlewares/auth.middleware";

export const registerToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const token = await registerNotificationToken(userId, req.body);

    res.status(200).json({
      success: true,
      message: "Push notification token registered",
      data: { token },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to register push token";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const unregisterToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    await unregisterNotificationToken(userId, req.body.expoPushToken);

    res.status(200).json({
      success: true,
      message: "Push notification token unregistered",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to unregister push token";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
