import { Request, Response } from "express";
import {
  getAcceptedFriends,
  getPendingFriendRequests,
} from "../services/friend.service";
import { requireUserId } from "../middlewares/auth.middleware";

export const getFriendsOverview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const [pendingRequests, friends] = await Promise.all([
      getPendingFriendRequests(userId),
      getAcceptedFriends(userId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingRequests,
        friends,
        friendCount: friends.length,
        pendingRequestCount: pendingRequests.length,
      },
      pendingRequests,
      friends,
      friendCount: friends.length,
      pendingRequestCount: pendingRequests.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load friends";

    res.status(500).json({
      success: false,
      message,
    });
  }
};
