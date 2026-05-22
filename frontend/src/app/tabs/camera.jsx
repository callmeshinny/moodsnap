import React, { useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { createSnapApi } from "../../api/snapApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { moodOptions } from "../../utils/moods";

export default function CameraScreen() {
  const { refreshFeed, refreshStreak, streak } = useContext(AuthContext);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasCaptured, setHasCaptured] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [posting, setPosting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("back");

  const handleFlipCamera = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleCapture = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();

        if (!result.granted) {
          Alert.alert(
            "Camera permission required",
            "Please allow camera access to take a snap."
          );
          return;
        }
      }

      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
        mirror: false,
      });

      if (!photo?.uri) {
        throw new Error("Could not capture photo");
      }

      setCapturedImageUri(photo.uri);
      setHasCaptured(true);
      setSelectedMood(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not capture photo";

      Alert.alert("Camera error", message);
    }
  };

  const handleRetake = () => {
    setHasCaptured(false);
    setCapturedImageUri(null);
    setSelectedMood(null);
  };

  const handlePost = async () => {
    if (!selectedMood) {
      Alert.alert("Choose your mood", "Pick a mood before posting your snap.");
      return;
    }

    if (!capturedImageUri) {
      Alert.alert("No snap", "Take a snap before posting.");
      return;
    }

    try {
      setPosting(true);

      await createSnapApi({
        imageUri: capturedImageUri,
        mood: selectedMood.label,
      });

      Alert.alert(
        "MoodSnap posted",
        `Your snap was saved with mood: ${selectedMood.emoji} ${selectedMood.label}`
      );

      refreshFeed?.();
      await refreshStreak?.();
      setHasCaptured(false);
      setCapturedImageUri(null);
      setSelectedMood(null);
    } catch (error) {
      Alert.alert(
        "Post failed",
        error instanceof Error ? error.message : "Could not post your snap."
      );
    } finally {
      setPosting(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access is needed</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.preview,
          hasCaptured && selectedMood && { borderColor: selectedMood.color },
        ]}
      >
        <View style={styles.logoRow}>
          <Text style={styles.logo}>MoodSnap</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak || 0}</Text>
          </View>
        </View>

        {!hasCaptured || !capturedImageUri ? (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraFacing}
              mirror={cameraFacing === "front"}
            />
            <TouchableOpacity
              style={styles.flipButton}
              onPress={handleFlipCamera}
              activeOpacity={0.8}
            >
              <Text style={styles.flipText}>↻</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Image source={{ uri: capturedImageUri }} style={styles.camera} />

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
            {moodOptions.map((mood) => (
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

            <TouchableOpacity
              style={[styles.postButton, posting && styles.disabledButton]}
              onPress={handlePost}
              disabled={posting}
            >
              <Text style={styles.postText}>
                {posting ? "Posting..." : "Post Snap"}
              </Text>
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
    overflow: "hidden",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  logoRow: {
    position: "absolute",
    top: 28,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  logo: {
    color: COLORS?.primary || "#D6509A",
    fontSize: 28,
    fontWeight: "900",
  },
  streakBadge: {
    backgroundColor: "rgba(0,0,0,0.56)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  streakText: {
    color: "#fff",
    fontWeight: "900",
  },
  flipButton: {
    position: "absolute",
    right: 22,
    bottom: 22,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  flipText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 32,
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
  disabledButton: {
    opacity: 0.6,
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
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: COLORS?.primary || "#D6509A",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
