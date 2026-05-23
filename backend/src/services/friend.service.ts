import { supabase } from "../config/supabase";
import { getUserById, getUserByUsername, getUsersByIds } from "./user.service";

type FriendshipRecord = {
  id: string;
  user_one_id: string;
  user_two_id: string;
  status: "pending" | "accepted" | "rejected";
  requested_by: string;
  created_at: string;
  updated_at: string;
};

const orderedPair = (firstUserId: string, secondUserId: string) => {
  return [firstUserId, secondUserId].sort();
};

const mapFriendship = (friendship: FriendshipRecord) => ({
  id: friendship.id,
  userOneId: friendship.user_one_id,
  userTwoId: friendship.user_two_id,
  status: friendship.status,
  requestedBy: friendship.requested_by,
  createdAt: friendship.created_at,
  updatedAt: friendship.updated_at,
});

const getUserFromIdentifier = async (identifier: string) => {
  return (
    (await getUserByUsername(identifier)) ||
    (await getUserById(identifier).catch(() => null))
  );
};

const areUsersBlocked = async (firstUserId: string, secondUserId: string) => {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id")
    .or(
      `and(blocker_id.eq.${firstUserId},blocked_user_id.eq.${secondUserId}),and(blocker_id.eq.${secondUserId},blocked_user_id.eq.${firstUserId})`
    )
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.length);
};

export const getFriendLink = async (userId: string) => {
  const user = await getUserById(userId);

  return {
    userId,
    username: user.username,
    friendLink: `https://moodsnap-92ps.onrender.com/friend/${encodeURIComponent(user.username)}`,
  };
};

export const sendFriendRequest = async (
  senderId: string,
  receiverId: unknown
) => {
  if (typeof receiverId !== "string" || !receiverId.trim()) {
    throw new Error("Receiver id is required");
  }

  const receiverIdentifier = receiverId.trim();
  const receiver = await getUserFromIdentifier(receiverIdentifier);

  if (!receiver) {
    throw new Error("User not found");
  }

  const targetUserId = receiver.id;

  if (senderId === targetUserId) {
    throw new Error("You cannot add yourself as a friend");
  }

  if (await areUsersBlocked(senderId, targetUserId)) {
    throw new Error("You cannot add this user.");
  }

  const [userOneId, userTwoId] = orderedPair(senderId, targetUserId);

  const { data: existing, error: existingError } = await supabase
    .from("friendships")
    .select("*")
    .eq("user_one_id", userOneId)
    .eq("user_two_id", userTwoId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.status === "accepted") {
    throw new Error("You are already friends");
  }

  if (existing?.status === "pending") {
    if (existing.requested_by === senderId) {
      throw new Error("Friend request already sent");
    }

    const { data: accepted, error } = await supabase
      .from("friendships")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapFriendship(accepted);
  }

  if (existing?.status === "rejected") {
    const { data: updated, error } = await supabase
      .from("friendships")
      .update({
        status: "pending",
        requested_by: senderId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapFriendship(updated);
  }

  const { data: friendship, error } = await supabase
    .from("friendships")
    .insert({
      user_one_id: userOneId,
      user_two_id: userTwoId,
      status: "pending",
      requested_by: senderId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFriendship(friendship);
};

export const acceptFriendRequest = async (
  currentUserId: string,
  requestId: unknown
) => {
  if (typeof requestId !== "string" || !requestId.trim()) {
    throw new Error("Friend request id is required");
  }

  const { data: friendship, error: findError } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", requestId.trim())
    .eq("status", "pending")
    .single();

  if (findError || !friendship) {
    throw new Error("Friend request not found");
  }

  if (
    friendship.requested_by === currentUserId ||
    ![friendship.user_one_id, friendship.user_two_id].includes(currentUserId)
  ) {
    throw new Error("You cannot accept this friend request");
  }

  const { data: accepted, error } = await supabase
    .from("friendships")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", friendship.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFriendship(accepted);
};

export const rejectFriendRequest = async (
  currentUserId: string,
  requestId: unknown
) => {
  if (typeof requestId !== "string" || !requestId.trim()) {
    throw new Error("Friend request id is required");
  }

  const { data: friendship, error: findError } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", requestId.trim())
    .eq("status", "pending")
    .single();

  if (findError || !friendship) {
    throw new Error("Friend request not found");
  }

  if (![friendship.user_one_id, friendship.user_two_id].includes(currentUserId)) {
    throw new Error("You cannot update this friend request");
  }

  const { data: rejected, error } = await supabase
    .from("friendships")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", friendship.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFriendship(rejected);
};


export const areAcceptedFriends = async (
  firstUserId: string,
  secondUserId: string
): Promise<boolean> => {
  if (firstUserId === secondUserId) {
    return true;
  }

  if (await areUsersBlocked(firstUserId, secondUserId)) {
    return false;
  }

  const [userOneId, userTwoId] = orderedPair(firstUserId, secondUserId);

  const { data, error } = await supabase
    .from("friendships")
    .select("id")
    .eq("user_one_id", userOneId)
    .eq("user_two_id", userTwoId)
    .eq("status", "accepted")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
};


export const getFriendStatus = async (
  currentUserId: string,
  receiverId: unknown
) => {
  if (typeof receiverId !== "string" || !receiverId.trim()) {
    throw new Error("Receiver id is required");
  }

  const receiverIdentifier = receiverId.trim();
  const receiver = await getUserFromIdentifier(receiverIdentifier);

  if (!receiver) {
    throw new Error("User not found");
  }

  if (currentUserId === receiver.id) {
    return {
      targetUser: receiver,
      status: "self",
      alreadyFriends: false,
      pending: false,
    };
  }

  if (await areUsersBlocked(currentUserId, receiver.id)) {
    return {
      targetUser: receiver,
      status: "blocked",
      alreadyFriends: false,
      pending: false,
      friendship: null,
    };
  }

  const [userOneId, userTwoId] = orderedPair(currentUserId, receiver.id);

  const { data: friendship, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("user_one_id", userOneId)
    .eq("user_two_id", userTwoId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    targetUser: receiver,
    status: friendship?.status || "none",
    alreadyFriends: friendship?.status === "accepted",
    pending: friendship?.status === "pending",
    friendship: friendship ? mapFriendship(friendship) : null,
  };
};

export const getFriendCount = async (userId: string) => {
  const { count, error } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
};

export const getAcceptedFriends = async (userId: string) => {
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const friendIds = (friendships || []).map((friendship) =>
    friendship.user_one_id === userId
      ? friendship.user_two_id
      : friendship.user_one_id
  );
  const usersById = await getUsersByIds(friendIds);

  return friendIds
    .map((friendId) => {
      const user = usersById.get(friendId);
      const friendship = (friendships || []).find(
        (item) => item.user_one_id === friendId || item.user_two_id === friendId
      );

      return user
        ? {
            ...user,
            friendshipId: friendship?.id || null,
          }
        : null;
    })
    .filter(Boolean);
};

export const getAcceptedFriendIds = async (userId: string): Promise<string[]> => {
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("user_one_id, user_two_id")
    .eq("status", "accepted")
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }

  return (friendships || [])
    .map((friendship) =>
      friendship.user_one_id === userId
        ? friendship.user_two_id
        : friendship.user_one_id
    )
    .filter(Boolean);
};

export const removeFriend = async (
  currentUserId: string,
  friendUserId: unknown
) => {
  if (typeof friendUserId !== "string" || !friendUserId.trim()) {
    throw new Error("Friend user id is required");
  }

  const targetUserId = friendUserId.trim();
  const [userOneId, userTwoId] = orderedPair(currentUserId, targetUserId);

  const { data: friendship, error: findError } = await supabase
    .from("friendships")
    .select("*")
    .eq("user_one_id", userOneId)
    .eq("user_two_id", userTwoId)
    .eq("status", "accepted")
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (!friendship) {
    throw new Error("Friendship not found");
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendship.id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

export const blockUser = async (
  currentUserId: string,
  blockedUserId: unknown
) => {
  if (typeof blockedUserId !== "string" || !blockedUserId.trim()) {
    throw new Error("Blocked user id is required");
  }

  const targetUserId = blockedUserId.trim();

  if (currentUserId === targetUserId) {
    throw new Error("You cannot block yourself");
  }

  const [userOneId, userTwoId] = orderedPair(currentUserId, targetUserId);

  const { error: upsertError } = await supabase
    .from("blocked_users")
    .upsert(
      {
        blocker_id: currentUserId,
        blocked_user_id: targetUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "blocker_id,blocked_user_id" }
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { error: friendshipError } = await supabase
    .from("friendships")
    .delete()
    .eq("user_one_id", userOneId)
    .eq("user_two_id", userTwoId);

  if (friendshipError) {
    throw new Error(friendshipError.message);
  }

  return true;
};

export const reportUser = async (
  reporterId: string,
  reportedUserId: unknown,
  reason?: unknown,
  details?: unknown
) => {
  if (typeof reportedUserId !== "string" || !reportedUserId.trim()) {
    throw new Error("Reported user id is required");
  }

  if (reporterId === reportedUserId.trim()) {
    throw new Error("You cannot report yourself");
  }

  const { data: report, error } = await supabase
    .from("user_reports")
    .insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId.trim(),
      reason: typeof reason === "string" ? reason.trim() || null : null,
      details: typeof details === "string" ? details.trim() || null : null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: report.id,
    reporterId: report.reporter_id,
    reportedUserId: report.reported_user_id,
    reason: report.reason,
    details: report.details,
    createdAt: report.created_at,
  };
};

const getBlockedCounterpartIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_user_id")
    .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((block) =>
    block.blocker_id === userId ? block.blocked_user_id : block.blocker_id
  );
};

export const getVisibleSnapUserIds = async (userId: string): Promise<string[]> => {
  const friendIds = await getAcceptedFriendIds(userId);
  const blockedIds = new Set(await getBlockedCounterpartIds(userId));

  return Array.from(
    new Set([userId, ...friendIds.filter((friendId) => !blockedIds.has(friendId))])
  );
};

export const getPendingFriendRequests = async (userId: string) => {
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .neq("requested_by", userId)
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const senderIds = (friendships || []).map(
    (friendship) => friendship.requested_by
  );
  const usersById = await getUsersByIds(senderIds);

  return (friendships || []).map((friendship) => ({
    ...mapFriendship(friendship),
    sender: usersById.get(friendship.requested_by) || null,
  }));
};
