import { Request, Response } from "express";
import { getMoodCalendar, getMoodStreak } from "../services/mood.service";
import { requireUserId } from "../middlewares/auth.middleware";

export const getCalendar = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const calendar = await getMoodCalendar(userId);

    res.status(200).json({
      success: true,
      ...calendar,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get mood calendar";

    res.status(400).json({ success: false, message });
  }
};

export const getStreak = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const streakData = await getMoodStreak(userId);

    res.status(200).json({
      success: true,
      ...streakData,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get mood streak";

    res.status(400).json({ success: false, message });
  }
};
