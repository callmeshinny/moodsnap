let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const notifyUnauthorized = (message) => {
  if (typeof onUnauthorized === "function") {
    onUnauthorized(message);
  }
};
