import { Request, Response } from "express";
import { uploadImageToCloudinary } from "../services/upload.service";
import { supabase } from "../config/supabase";
import cloudinary from "../config/cloudinary";
import { getUsersByIds } from "../services/user.service";
import { getVisibleSnapUserIds, getPendingFriendRequests } from "../services/friend.service";
import { getMoodStreak } from "../services/mood.service";
import { sendNewSnapNotifications } from "../services/notification.service";
import { resetReminderStateForSnap } from "../services/reminder.service";

const TABLE_NAME = "moodsnap";

const buildCloudinaryTransformUrl = (
  imageUrl?: string | null,
  transform = "w_900,q_auto,f_auto"
) => {
  if (!imageUrl || !imageUrl.includes("/upload/")) {
    return imageUrl || null;
  }

  return imageUrl.replace("/upload/", `/upload/${transform}/`);
};

const mapSnap = (snap: any, user: any = null) => {
  const imageUrl = snap.image_url;

  return {
    id: snap.id,
    userId: snap.user_id,
    mood: snap.mood,
    caption: snap.caption,
    imageUrl,
    thumbnailUrl: buildCloudinaryTransformUrl(imageUrl, "w_900,q_auto,f_auto"),
    previewUrl: buildCloudinaryTransformUrl(imageUrl, "w_320,q_auto,f_auto"),
    imagePublicId: snap.cloudinary_public_id || snap.image_public_id,
    softFilterEnabled: Boolean(snap.soft_filter_enabled),
    createdAt: snap.created_at,
    user,
  };
};


export const createSnap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mood, caption, softFilterEnabled } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Image is required",
      });
      return;
    }

    if (!mood) {
      res.status(400).json({
        success: false,
        message: "Mood is required",
      });
      return;
    }

    const uploadedImage = await uploadImageToCloudinary(req.file.buffer);

    const { data: snap, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        user_id: userId,
        mood,
        caption: caption || null,
        image_url: uploadedImage.secure_url,
        image_public_id: uploadedImage.public_id,
        cloudinary_public_id: uploadedImage.public_id,
        soft_filter_enabled:
          softFilterEnabled === true || softFilterEnabled === "true",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    void resetReminderStateForSnap(userId, snap.created_at).catch((reminderError) => {
      console.error("Failed to reset snap reminder state:", reminderError);
    });

    void sendNewSnapNotifications({ snap }).catch((notificationError) => {
      console.error("Failed to send new snap notifications:", notificationError);
    });

    res.status(201).json({
      success: true,
      message: "Snap uploaded to Cloudinary and saved to Supabase successfully",
      data: { snap: mapSnap(snap) },
      snap: mapSnap(snap),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload snap";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getSnaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const visibleUserIds = await getVisibleSnapUserIds(userId);

    const { data: snaps, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .in("user_id", visibleUserIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    const rows = snaps || [];
    const usersById = await getUsersByIds(rows.map((snap) => String(snap.user_id)));

    const mappedSnaps = rows.map((snap) =>
      mapSnap(snap, usersById.get(String(snap.user_id)) || null)
    );

    res.status(200).json({
      success: true,
      data: { snaps: mappedSnaps },
      snaps: mappedSnaps,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get snaps";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const limitParam = Number(req.query.limit || 20);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : 20;
    const cursor =
      typeof req.query.cursor === "string" && req.query.cursor.trim()
        ? req.query.cursor.trim()
        : null;

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const visibleUserIds = await getVisibleSnapUserIds(userId);

    let query = supabase
      .from(TABLE_NAME)
      .select("*")
      .in("user_id", visibleUserIds)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: snaps, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = snaps || [];
    const pageRows = rows.slice(0, limit);
    const usersById = await getUsersByIds(
      pageRows.map((snap) => String(snap.user_id))
    );
    const feed = pageRows.map((snap) =>
      mapSnap(snap, usersById.get(String(snap.user_id)) || null)
    );
    const nextCursor =
      rows.length > limit ? pageRows[pageRows.length - 1]?.created_at : null;

    res.status(200).json({
      success: true,
      data: { snaps: feed, nextCursor },
      snaps: feed,
      nextCursor,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get feed";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getSnapById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const visibleUserIds = await getVisibleSnapUserIds(userId);

    const { data: snap, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!snap || !visibleUserIds.includes(String(snap.user_id))) {
      res.status(404).json({
        success: false,
        message: "Snap not found",
      });
      return;
    }

    const usersById = await getUsersByIds([String(snap.user_id)]);
    const mappedSnap = mapSnap(
      snap,
      usersById.get(String(snap.user_id)) || null
    );

    res.status(200).json({
      success: true,
      data: { snap: mappedSnap },
      snap: mappedSnap,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get snap";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getFeedHome = async (req: Request, res: Response): Promise<void> => {
  try {
    const limitParam = Number(req.query.limit || 20);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : 20;
    const cursor =
      typeof req.query.cursor === "string" && req.query.cursor.trim()
        ? req.query.cursor.trim()
        : null;

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const visibleUserIds = await getVisibleSnapUserIds(userId);

    let query = supabase
      .from(TABLE_NAME)
      .select("*")
      .in("user_id", visibleUserIds)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: snaps, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = snaps || [];
    const pageRows = rows.slice(0, limit);
    const usersById = await getUsersByIds(
      pageRows.map((snap) => String(snap.user_id))
    );
    const feed = pageRows.map((snap) =>
      mapSnap(snap, usersById.get(String(snap.user_id)) || null)
    );
    const nextCursor =
      rows.length > limit ? pageRows[pageRows.length - 1]?.created_at : null;

    const [streak, pendingRequests] = await Promise.all([
      getMoodStreak(userId),
      getPendingFriendRequests(userId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        snaps: feed,
        nextCursor,
        meta: {
          streak: streak.streak || 0,
          hasPostedToday: Boolean(streak.hasPostedToday ?? streak.postedToday),
          pendingRequestCount: pendingRequests.length,
        },
      },
      snaps: feed,
      nextCursor,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get home feed";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const deleteSnap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const { data: snap, error: findError } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (findError || !snap) {
      res.status(404).json({
        success: false,
        message: "Snap not found",
      });
      return;
    }

    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const publicId = snap.cloudinary_public_id || snap.image_public_id;

    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(() => null);
    }

    res.status(200).json({
      success: true,
      message: "Snap deleted successfully.",
      data: { id },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete snap";

    res.status(500).json({
      success: false,
      message,
    });
  }
};
