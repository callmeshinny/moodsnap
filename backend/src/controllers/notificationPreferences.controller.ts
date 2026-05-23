import { Request, Response } from "express";
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

const mapPreferences = (record: any) => ({
  newSnapEnabled: record?.new_snap_enabled !== false,
  remindersEnabled: record?.reminders_enabled !== false,
});

export const getNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      data: {
        preferences: mapPreferences(data),
      },
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

    const updates: Record<string, boolean | string> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (typeof req.body.newSnapEnabled === "boolean") {
      updates.new_snap_enabled = req.body.newSnapEnabled;
    }

    if (typeof req.body.remindersEnabled === "boolean") {
      updates.reminders_enabled = req.body.remindersEnabled;
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(updates, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      message: "Notification preferences updated",
      data: {
        preferences: mapPreferences(data),
      },
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
