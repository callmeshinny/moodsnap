import { Request, Response } from "express";
import {
  acceptFriendRequest,
  blockUser,
  getAcceptedFriends,
  getFriendCount,
  getFriendLink,
  getFriendStatus,
  getPendingFriendRequests,
  removeFriend,
  reportUser,
  rejectFriendRequest,
  sendFriendRequest,
} from "../services/friend.service";

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

export const getMyFriendLink = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const result = await getFriendLink(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get friend link";

    res.status(400).json({ success: false, message });
  }
};

export const createFriendRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const receiverIdOrUsername =
      req.body.receiverIdOrUsername || req.body.receiverId;
    const friendship = await sendFriendRequest(userId, receiverIdOrUsername);

    res.status(201).json({
      success: true,
      message:
        friendship.status === "accepted"
          ? "Friend request accepted automatically"
          : "Friend request sent",
      data: friendship,
      friendship,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send friend request";

    res.status(400).json({ success: false, message });
  }
};

export const acceptRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const friendship = await acceptFriendRequest(userId, req.body.requestId);

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
      data: friendship,
      friendship,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to accept friend request";

    res.status(400).json({ success: false, message });
  }
};

export const rejectRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const friendship = await rejectFriendRequest(userId, req.body.requestId);

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
      data: friendship,
      friendship,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update friend request";

    res.status(400).json({ success: false, message });
  }
};


export const checkFriendStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const result = await getFriendStatus(userId, req.params.receiverId);

    res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check friend status";

    res.status(400).json({ success: false, message });
  }
};

export const countFriends = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const count = await getFriendCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
      count,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get friend count";

    res.status(400).json({ success: false, message });
  }
};

export const listFriends = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const friends = await getAcceptedFriends(userId);

    res.status(200).json({
      success: true,
      data: { friends },
      friends,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get friends";

    res.status(400).json({ success: false, message });
  }
};

export const listPendingRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const requests = await getPendingFriendRequests(userId);

    res.status(200).json({
      success: true,
      data: { requests },
      requests,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get friend requests";

    res.status(400).json({ success: false, message });
  }
};

export const unfriend = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    await removeFriend(userId, req.params.friendUserId);

    res.status(200).json({
      success: true,
      message: "Friend removed",
      data: { friendUserId: req.params.friendUserId },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove friend";

    res.status(400).json({ success: false, message });
  }
};

export const blockFriend = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    await blockUser(userId, req.body.blockedUserId);

    res.status(200).json({
      success: true,
      message: "User blocked",
      data: { blockedUserId: req.body.blockedUserId },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to block user";

    res.status(400).json({ success: false, message });
  }
};

export const reportFriend = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const report = await reportUser(
      userId,
      req.body.reportedUserId,
      req.body.reason,
      req.body.details
    );

    res.status(201).json({
      success: true,
      message: "Report submitted",
      data: report,
      report,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to report user";

    res.status(400).json({ success: false, message });
  }
};
