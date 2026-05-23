import { Request, Response } from "express";
import { createAppRating, getMyRating } from "../services/rating.service";

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

export const createRating = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const rating = await createAppRating(userId, req.body);

    res.status(201).json({
      success: true,
      message: "Thanks for rating MoodSnap.",
      data: { rating },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save rating";
    const status = message.includes("already rated") ? 409 : 400;

    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const getMyAppRating = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const rating = await getMyRating(userId);

    res.status(200).json({
      success: true,
      data: { rating },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get rating";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
