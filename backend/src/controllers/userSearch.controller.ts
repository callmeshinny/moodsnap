import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mapUser } from "../services/user.service";

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

const normalizeQuery = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^@+/, "").toLowerCase();
};

const getFriendStatus = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    return "self";
  }

  const { data: block } = await supabase
    .from("blocked_users")
    .select("id")
    .or(
      `and(blocker_id.eq.${currentUserId},blocked_user_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_user_id.eq.${currentUserId})`
    )
    .limit(1);

  if (block?.length) {
    return "blocked";
  }

  const [userOneId, userTwoId] = [currentUserId, targetUserId].sort();

  const { data: friendship } = await supabase
    .from("friendships")
    .select("status, requested_by")
    .eq("user_one_id", userOneId)
    .eq("user_two_id", userTwoId)
    .maybeSingle();

  if (!friendship) {
    return "none";
  }

  if (friendship.status === "accepted") {
    return "accepted";
  }

  if (friendship.status === "pending") {
    return friendship.requested_by === currentUserId
      ? "pending_sent"
      : "pending_received";
  }

  return friendship.status || "none";
};

export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) return;

    const q = normalizeQuery(req.query.q);

    if (q.length < 2) {
      res.status(200).json({
        success: true,
        data: { users: [] },
        users: [],
      });
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, username, username_normalized, display_name, email, avatar_url, avatar_public_id, profile_color, timezone, calendar_mode, is_verified, created_at, updated_at"
      )
      .or(`username_normalized.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(15);

    if (error) {
      throw new Error(error.message);
    }

    const users = await Promise.all(
      (data || []).map(async (record) => {
        const user = mapUser(record);
        const friendStatus = await getFriendStatus(currentUserId, user.id);

        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          displayLabel: user.displayLabel,
          avatarUrl: user.avatarUrl,
          profileColor: user.profileColor,
          friendStatus,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { users },
      users,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search users";

    res.status(500).json({
      success: false,
      message,
    });
  }
};
