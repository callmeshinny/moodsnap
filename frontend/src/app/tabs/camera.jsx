import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { COLORS } from "../../constants/colors";

const moods = [
  { label: "Happy", emoji: "😊", color: "#FFD166" },
  { label: "Calm", emoji: "😌", color: "#80ED99" },
  { label: "Sad", emoji: "😢", color: "#74C0FC" },
  { label: "Angry", emoji: "😡", color: "#FF6B6B" },
  { label: "Tired", emoji: "😴", color: "#B197FC" },
];

export default function CameraScreen() {
  const [hasCaptured, setHasCaptured] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const handleCapture = () => {
    setHasCaptured(true);
    setSelectedMood(null);
  };

  const handleRetake = () => {
    setHasCaptured(false);
    setSelectedMood(null);
  };

  const handlePost = () => {
    if (!selectedMood) {
      Alert.alert("Choose your mood", "Pick a mood before posting your snap.");
      return;
    }

    Alert.alert(
      "MoodSnap posted",
      `Your snap was saved with mood: ${selectedMood.emoji} ${selectedMood.label}`
    );

    setHasCaptured(false);
    setSelectedMood(null);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.preview,
          hasCaptured && selectedMood && { borderColor: selectedMood.color },
        ]}
      >
        <Text style={styles.logo}>MoodSnap</Text>

        {!hasCaptured ? (
          <>
            <Text style={styles.previewTitle}>Camera preview</Text>
            <Text style={styles.previewSubtitle}>
              Mock mode for Simulator testing
            </Text>
          </>
        ) : (
          <>
            <View style={styles.fakePhoto}>
              <Text style={styles.fakePhotoEmoji}>📸</Text>
              <Text style={styles.fakePhotoText}>Captured moment</Text>
            </View>

            {selectedMood && (
              <View
                style={[
                  styles.moodBadge,
                  { backgroundColor: selectedMood.color },
                ]}
              >
                <Text style={styles.moodBadgeText}>
                  {selectedMood.emoji} {selectedMood.label}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {!hasCaptured ? (
        <>
          <TouchableOpacity style={styles.snapButton} onPress={handleCapture}>
            <View style={styles.snapInner} />
          </TouchableOpacity>

          <Text style={styles.hint}>Tap to take a snap first.</Text>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>

          <View style={styles.moodRow}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                style={[
                  styles.moodButton,
                  selectedMood?.label === mood.label && {
                    backgroundColor: mood.color,
                    transform: [{ scale: 1.08 }],
                  },
                ]}
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRetake}>
              <Text style={styles.secondaryText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.postButton} onPress={handlePost}>
              <Text style={styles.postText}>Post Snap</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  preview: {
    height: "64%",
    borderRadius: 32,
    borderWidth: 4,
    borderColor: "#252525",
    backgroundColor: "#151515",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    overflow: "hidden",
  },
  logo: {
    position: "absolute",
    top: 28,
    left: 24,
    color: COLORS?.primary || "#D6509A",
    fontSize: 28,
    fontWeight: "900",
  },
  previewTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 10,
  },
  previewSubtitle: {
    color: "#888",
    fontSize: 15,
  },
  fakePhoto: {
    width: "100%",
    height: "72%",
    borderRadius: 28,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  fakePhotoEmoji: {
    fontSize: 58,
    marginBottom: 12,
  },
  fakePhotoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  moodBadge: {
    position: "absolute",
    bottom: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  moodBadgeText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "900",
  },
  snapButton: {
    alignSelf: "center",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  snapInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 24,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  moodButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1f1f1f",
    justifyContent: "center",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 25,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#202020",
    alignItems: "center",
  },
  secondaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  postButton: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: COLORS?.primary || "#D6509A",
    alignItems: "center",
  },
  postText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  hint: {
    color: "#777",
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
  },
});
