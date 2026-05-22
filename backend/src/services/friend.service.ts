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

export const getFriendLink = async (userId: string) => {
  const user = await getUserById(userId);

  return {
    userId,
    friendLink: `moodsnap.cam/${encodeURIComponent(user.username)}`,
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
  const receiver =
    (await getUserByUsername(receiverIdentifier)) ||
    (await getUserById(receiverIdentifier).catch(() => null));

  if (!receiver) {
    throw new Error("User not found");
  }

  const targetUserId = receiver.id;

  if (senderId === targetUserId) {
    throw new Error("You cannot add yourself as a friend");
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
    .map((friendId) => usersById.get(friendId))
    .filter(Boolean);
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
