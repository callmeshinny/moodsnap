import { Request, Response } from "express";
import { requireUserId } from "../middlewares/auth.middleware";
import {
  createDiary,
  getDiaryDetails,
  getDiaryFeed,
  getDiaryToday,
  listMyDiaries,
  updateDiary,
} from "../services/diary.service";

const sendError = (
  res: Response,
  error: unknown,
  fallback: string,
  status = 400
) => {
  const message = error instanceof Error ? error.message : fallback;
  res.status(status).json({ success: false, message });
};

export const getTodayDiary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const result = await getDiaryToday(userId);

    res.status(200).json({
      success: true,
      ...result,
      data: result,
    });
  } catch (error) {
    sendError(res, error, "Failed to load today's diary state");
  }
};

export const listDiaries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const limit = Number(req.query.limit || 20);
    const diaries = await listMyDiaries(userId, limit);

    res.status(200).json({
      success: true,
      data: { diaries },
      diaries,
    });
  } catch (error) {
    sendError(res, error, "Failed to load diaries");
  }
};

export const listDiaryFeed = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const limit = Number(req.query.limit || 30);
    const entryDate =
      typeof req.query.date === "string" ? req.query.date : undefined;
    const diaries = await getDiaryFeed(userId, { entryDate, limit });

    res.status(200).json({
      success: true,
      data: { diaries },
      diaries,
    });
  } catch (error) {
    sendError(res, error, "Failed to load diary feed");
  }
};

export const getDiary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const diaryId = String(req.params.id || "");
    const diary = await getDiaryDetails(userId, diaryId);

    res.status(200).json({
      success: true,
      data: { diary },
      diary,
    });
  } catch (error) {
    sendError(res, error, "Failed to load diary", 404);
  }
};

export const createDiaryEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const diary = await createDiary(userId, req.body);

    res.status(201).json({
      success: true,
      message: "Diary created",
      data: { diary },
      diary,
    });
  } catch (error) {
    sendError(res, error, "Failed to create diary");
  }
};

export const updateDiaryEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const diaryId = String(req.params.id || "");
    const diary = await updateDiary(userId, diaryId, req.body);

    res.status(200).json({
      success: true,
      message: "Diary updated",
      data: { diary },
      diary,
    });
  } catch (error) {
    sendError(res, error, "Failed to update diary");
  }
};
