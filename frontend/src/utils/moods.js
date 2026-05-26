export const MOODS = {
  Happy: { emoji: "😊", color: "#FFD166" },
  Excited: { emoji: "🤩", color: "#FF9F1C" },
  Proud: { emoji: "😌", color: "#F4D35E" },
  Loved: { emoji: "🥰", color: "#FF6FAE" },
  Calm: { emoji: "😌", color: "#80ED99" },
  Grateful: { emoji: "🙏", color: "#58D68D" },
  Focused: { emoji: "🧠", color: "#4D96FF" },
  Sad: { emoji: "😢", color: "#74C0FC" },
  Lonely: { emoji: "🥺", color: "#8ECAE6" },
  Overwhelmed: { emoji: "🫠", color: "#A8A8FF" },
  Angry: { emoji: "😡", color: "#FF6B6B" },
  Stressed: { emoji: "😤", color: "#F3722C" },
  Anxious: { emoji: "😬", color: "#F8961E" },
  Tired: { emoji: "😴", color: "#B197FC" },
  Bored: { emoji: "😐", color: "#ADB5BD" },
  Silly: { emoji: "🤪", color: "#C77DFF" },
  Inspired: { emoji: "✨", color: "#00B4D8" },
};

export const moodOptions = Object.entries(MOODS).map(([label, value]) => ({
  label,
  ...value,
}));

export const moodCategories = {
  happy: ["Happy", "Excited", "Proud", "Silly"].map((label) => ({
    label,
    ...MOODS[label],
  })),
  soft: ["Calm", "Grateful", "Loved", "Inspired"].map((label) => ({
    label,
    ...MOODS[label],
  })),
  heavy: ["Sad", "Lonely", "Overwhelmed", "Tired"].map((label) => ({
    label,
    ...MOODS[label],
  })),
  tense: ["Angry", "Stressed", "Anxious", "Focused"].map((label) => ({
    label,
    ...MOODS[label],
  })),
  neutral: ["Bored", "Calm", "Focused", "Happy"].map((label) => ({
    label,
    ...MOODS[label],
  })),
};

export const getMoodMeta = (mood) => {
  return MOODS[mood] || { emoji: "💗", color: "#FF69B4" };
};
