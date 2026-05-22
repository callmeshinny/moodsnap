export const formatUploadTime = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const toDateKey = (value) => {
  return new Date(value).toISOString().slice(0, 10);
};
