import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import CustomButton from "../components/CustomButton";
import Screen from "../components/Screen";
import { COLORS } from "../constants/colors";
import { SPACING } from "../constants/spacing";
import { setHasSeenOnboarding } from "../storage/tokenStorage";
import { moodOptions } from "../utils/moods";

const steps = [
  {
    emoji: "📸",
    title: "Snap your mood",
    body: "Take a photo, pick one of five moods, and add an optional note. Your daily check-in lives on the Camera tab.",
    preview: moodOptions.map((m) => m.emoji).join(" "),
  },
  {
    emoji: "🔒",
    title: "Friends only",
    body: "Your snaps are visible to you and accepted friends—not the public internet. Share mindfully with people you trust.",
  },
  {
    emoji: "👥",
    title: "Invite friends",
    body: "Copy your invite link from Profile or paste a friend's link to connect. The more friends you add, the richer your feed becomes.",
  },
];

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const finish = async () => {
    await setHasSeenOnboarding();
    router.replace("/tabs/camera");
  };

  const handleNext = async () => {
    if (isLast) {
      await finish();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const handleSkip = async () => {
    await finish();
  };

  return (
    <Screen contentStyle={styles.container}>
      <TouchableOpacity
        onPress={handleSkip}
        style={styles.skipButton}
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <Text style={styles.emoji}>{step.emoji}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
        {step.preview ? (
          <Text style={styles.preview}>{step.preview}</Text>
        ) : null}
      </View>

      <View style={styles.dots}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === stepIndex && styles.dotActive]}
          />
        ))}
      </View>

      <CustomButton
        title={isLast ? "Start snapping" : "Next"}
        onPress={handleNext}
        accessibilityLabel={isLast ? "Finish onboarding" : "Next onboarding step"}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    justifyContent: "space-between",
  },
  skipButton: {
    alignSelf: "flex-end",
    padding: SPACING.sm,
  },
  skipText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 15,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: SPACING.lg,
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    marginBottom: SPACING.sm,
  },
  body: {
    color: COLORS.muted,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600",
  },
  preview: {
    marginTop: SPACING.lg,
    fontSize: 28,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 22,
  },
});
