import { Request, Response } from "express";
import { env } from "../config/env";
import { sendSnapReminderNotifications } from "../services/reminder.service";

const getBearerToken = (authorization?: string) => {
  if (!authorization) {
    return "";
  }

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.replace("Bearer ", "").trim();
};

export const sendSnapRemindersJob = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!env.cronSecret) {
      res.status(500).json({
        success: false,
        message: "CRON_SECRET is not configured",
      });
      return;
    }

    const token = getBearerToken(req.headers.authorization);

    if (token !== env.cronSecret) {
      res.status(401).json({
        success: false,
        message: "Unauthorized cron request",
      });
      return;
    }

    const result = await sendSnapReminderNotifications();

    res.status(200).json({
      success: true,
      message: "Snap reminders processed",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process reminders";

    res.status(500).json({
      success: false,
      message,
    });
  }
};
