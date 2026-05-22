export const MOODS = {
  Happy: { emoji: "😊", color: "#FFD166" },
  Calm: { emoji: "😌", color: "#80ED99" },
  Sad: { emoji: "😢", color: "#74C0FC" },
  Angry: { emoji: "😡", color: "#FF6B6B" },
  Tired: { emoji: "😴", color: "#B197FC" },
};

export const moodOptions = Object.entries(MOODS).map(([label, value]) => ({
  label,
  ...value,
}));

export const getMoodMeta = (mood) => {
  return MOODS[mood] || { emoji: "💗", color: "#FF69B4" };
};
