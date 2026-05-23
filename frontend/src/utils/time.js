const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatUploadTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (localDateKey(date) === localDateKey(today)) {
    return `Today, ${timeFormatter.format(date)}`;
  }

  if (localDateKey(date) === localDateKey(yesterday)) {
    return `Yesterday, ${timeFormatter.format(date)}`;
  }

  return `${date.getDate()} ${
    monthNames[date.getMonth()]
  } ${date.getFullYear()}, ${timeFormatter.format(date)}`;
};

export const toDateKey = (value) => {
  return new Date(value).toISOString().slice(0, 10);
};
