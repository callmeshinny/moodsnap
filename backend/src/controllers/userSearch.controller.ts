import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mapUser } from "../services/user.service";
import { requireUserId } from "../middlewares/auth.middleware";

const normalizeQuery = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^@+/, "").toLowerCase();
};

const orderedPair = (firstUserId: string, secondUserId: string) => {
  return [firstUserId, secondUserId].sort();
};

const getFriendStatuses = async (
  currentUserId: string,
  targetUserIds: string[]
) => {
  const uniqueTargetIds = Array.from(new Set(targetUserIds));
  const statuses = new Map(
    uniqueTargetIds.map((targetUserId) => [
      targetUserId,
      currentUserId === targetUserId ? "self" : "none",
    ])
  );
  const lookupIds = uniqueTargetIds.filter(
    (targetUserId) => targetUserId !== currentUserId
  );

  if (lookupIds.length === 0) {
    return statuses;
  }

  const blockFilter = lookupIds
    .flatMap((targetUserId) => [
      `and(blocker_id.eq.${currentUserId},blocked_user_id.eq.${targetUserId})`,
      `and(blocker_id.eq.${targetUserId},blocked_user_id.eq.${currentUserId})`,
    ])
    .join(",");

  const { data: blocks, error: blockError } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_user_id")
    .or(blockFilter);

  if (blockError) {
    throw new Error(blockError.message);
  }

  for (const block of blocks || []) {
    const targetUserId =
      block.blocker_id === currentUserId
        ? block.blocked_user_id
        : block.blocker_id;
    statuses.set(String(targetUserId), "blocked");
  }

  const friendshipFilter = lookupIds
    .map((targetUserId) => {
      const [userOneId, userTwoId] = orderedPair(currentUserId, targetUserId);
      return `and(user_one_id.eq.${userOneId},user_two_id.eq.${userTwoId})`;
    })
    .join(",");

  const { data: friendships, error: friendshipError } = await supabase
    .from("friendships")
    .select("user_one_id, user_two_id, status, requested_by")
    .or(friendshipFilter);

  if (friendshipError) {
    throw new Error(friendshipError.message);
  }

  for (const friendship of friendships || []) {
    const targetUserId =
      friendship.user_one_id === currentUserId
        ? friendship.user_two_id
        : friendship.user_one_id;

    if (statuses.get(String(targetUserId)) === "blocked") {
      continue;
    }

    if (friendship.status === "accepted") {
      statuses.set(String(targetUserId), "accepted");
      continue;
    }

    if (friendship.status === "pending") {
      statuses.set(
        String(targetUserId),
        friendship.requested_by === currentUserId
          ? "pending_sent"
          : "pending_received"
      );
      continue;
    }

    statuses.set(String(targetUserId), friendship.status || "none");
  }

  return statuses;
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

    const mappedUsers = (data || []).map(mapUser);
    const friendStatuses = await getFriendStatuses(
      currentUserId,
      mappedUsers.map((user) => user.id)
    );
    const users = mappedUsers.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      displayLabel: user.displayLabel,
      avatarUrl: user.avatarUrl,
      profileColor: user.profileColor,
      friendStatus: friendStatuses.get(user.id) || "none",
    }));

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
