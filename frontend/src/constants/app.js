/** App Store / Play Store URL when published; empty until listing exists. */
export const APP_STORE_URL = "";

export const FRIEND_LINK_DISPLAY_HOST = "moodsnap.cam";
export const FRIEND_LINK_API_HOST =
  "https://moodsnap-92ps.onrender.com/friend";

export const buildDisplayFriendLink = (username) =>
  username ? `${FRIEND_LINK_DISPLAY_HOST}/${encodeURIComponent(username)}` : "";

export const buildShareFriendLink = (username) =>
  username
    ? `${FRIEND_LINK_API_HOST}/${encodeURIComponent(username)}`
    : "";
