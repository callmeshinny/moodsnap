import React, { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { moodCategories } from "../utils/moods";

export default function EmojiPicker({
  visible,
  selectedMood,
  onSelect,
  onClose,
}) {
  const categoryNames = useMemo(() => Object.keys(moodCategories), []);
  const [selectedCategory, setSelectedCategory] = useState(categoryNames[0]);

  const activeMoods = moodCategories[selectedCategory] || [];

  const handleSelectMood = async (mood) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    onSelect?.(mood);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.scrim}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close mood picker"
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Mood check</Text>
              <Text style={styles.title}>How are you feeling?</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close mood picker"
            >
              <X size={20} color="#fff" strokeWidth={2.8} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categoryNames.map((category) => {
              const active = selectedCategory === category;
              const sampleMood = moodCategories[category][0];

              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.categoryEmoji}>{sampleMood.emoji}</Text>
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.moodGrid}>
            {activeMoods.map((mood) => {
              const active = selectedMood?.label === mood.label;

              return (
                <TouchableOpacity
                  key={mood.label}
                  onPress={() => handleSelectMood(mood)}
                  style={[
                    styles.moodOption,
                    active && {
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}24`,
                    },
                  ]}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Choose ${mood.label} mood`}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel} numberOfLines={1}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.44)",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: "#101010",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: "#222",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 3,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 18,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#303030",
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    color: "#d7d7d7",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  categoryTextActive: {
    color: "#fff",
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moodOption: {
    width: "30.9%",
    minHeight: 92,
    borderRadius: 20,
    backgroundColor: "#1B1B1B",
    borderWidth: 1,
    borderColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
  },
});
