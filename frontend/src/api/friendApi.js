import { apiClient } from "./apiClient";

export const getFriendLinkApi = async () => {
  const response = await apiClient.get("/friends/link");
  return response.data;
};

export const getFriendCountApi = async () => {
  const response = await apiClient.get("/friends/count");
  return response.data;
};

export const getFriendsApi = async () => {
  const response = await apiClient.get("/friends");
  return response.data;
};

export const getFriendRequestsApi = async () => {
  const response = await apiClient.get("/friends/requests");
  return response.data;
};

export const sendFriendRequestApi = async (receiverIdOrUsername) => {
  const response = await apiClient.post("/friends/request", {
    receiverIdOrUsername,
  });
  return response.data;
};

export const acceptFriendRequestApi = async (requestId) => {
  const response = await apiClient.post("/friends/accept", { requestId });
  return response.data;
};

export const rejectFriendRequestApi = async (requestId) => {
  const response = await apiClient.post("/friends/reject", { requestId });
  return response.data;
};


export const checkFriendStatusApi = async (receiverId) => {
  const response = await apiClient.get(
    `/friends/status/${encodeURIComponent(receiverId)}`
  );
  return response.data;
};

export const unfriendApi = async (friendUserId) => {
  const response = await apiClient.delete(
    `/friends/${encodeURIComponent(friendUserId)}`
  );
  return response.data;
};

export const blockUserApi = async (blockedUserId) => {
  const response = await apiClient.post("/friends/block", { blockedUserId });
  return response.data;
};

export const reportUserApi = async ({ reportedUserId, reason, details }) => {
  const response = await apiClient.post("/friends/report", {
    reportedUserId,
    reason,
    details,
  });
  return response.data;
};
