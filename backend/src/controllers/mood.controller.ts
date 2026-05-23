import { Request, Response } from "express";
import { getMoodCalendar, getMoodStreak } from "../services/mood.service";

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

    const { streak, postedToday } = await getMoodStreak(userId);

    res.status(200).json({
      success: true,
      streak,
      postedToday,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get mood streak";

    res.status(400).json({ success: false, message });
  }
};
