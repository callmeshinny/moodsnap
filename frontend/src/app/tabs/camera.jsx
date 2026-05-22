import React, { useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { createSnapApi } from "../../api/snapApi";
import { sendFriendRequestApi } from "../../api/friendApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { moodOptions } from "../../utils/moods";

export default function CameraScreen() {
  const {
    friendCount,
    refreshAppData,
    refreshFeed,
    refreshFriendCount,
    refreshStreak,
    streak,
  } = useContext(AuthContext);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasCaptured, setHasCaptured] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("back");
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [friendLinkInput, setFriendLinkInput] = useState("");
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [friendLinkInput, setFriendLinkInput] = useState("");
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);

  const handleFlipCamera = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  };


  const extractFriendIdentifier = (value) => {
    const raw = String(value || "").trim();

    if (!raw) {
      return "";
    }

    const withoutQuery = raw.split("?")[0].split("#")[0];
    const cleaned = withoutQuery.replace(/\/$/, "");
    const parts = cleaned.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];

    if (
      cleaned.includes("moodsnap.cam/") ||
      cleaned.includes("moodsnap-92ps.onrender.com/friend/") ||
      cleaned.includes("moodsnap://friend/") ||
      cleaned.includes("frontend://friend/")
    ) {
      return decodeURIComponent(lastPart || "").trim();
    }

    return raw.replace(/^@/, "").trim();
  };

  const handleOpenAddFriend = () => {
    setFriendLinkInput("");
    setFriendModalVisible(true);
  };

  const handleSubmitFriendLink = async () => {
    const receiverId = extractFriendIdentifier(friendLinkInput);

    if (!receiverId) {
      Alert.alert("Friend link required", "Paste a MoodSnap link or username.");
      return;
    }

    try {
      setSendingFriendRequest(true);
      await sendFriendRequestApi(receiverId);
      await Promise.allSettled([
        refreshFriendCount?.(),
        refreshAppData?.(),
      ]);

      setFriendModalVisible(false);
      setFriendLinkInput("");

      Alert.alert(
        "Friend request sent",
        `${receiverId} will see your request in their profile.`
      );
    } catch (error) {
      Alert.alert(
        "Could not send request",
        error.response?.data?.message ||
          error.message ||
          "Please check the link and try again."
      );
    } finally {
      setSendingFriendRequest(false);
    }
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
      setCaption("");
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
    setCaption("");
    setCaption("");
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
        caption: caption.trim(),
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
      setCaption("");
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
      <View
        style={[
          styles.preview,
          hasCaptured && selectedMood && { borderColor: selectedMood.color },
        ]}
      >
        <View style={styles.logoRow}>
          <Text style={styles.logo}>MoodSnap</Text>

          <View style={styles.topBadgeRow}>
            <TouchableOpacity
              style={styles.friendCountBadge}
              onPress={handleOpenAddFriend}
              activeOpacity={0.82}
            >
              <Text style={styles.friendCountText}>👥 {friendCount || 0}</Text>
            </TouchableOpacity>

            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak || 0}</Text>
            </View>
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
                  styles.selectedMoodTopBadge,
                  { backgroundColor: selectedMood.color },
                ]}
              >
                <Text style={styles.moodBadgeText}>
                  {selectedMood.emoji} {selectedMood.label}
                </Text>
              </View>
            )}

            <View style={styles.captionOverlay}>
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a note..."
                placeholderTextColor="#cfcfcf"
                maxLength={160}
                multiline
              />
            </View>
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

      <Modal
        visible={friendModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setFriendModalVisible(false)}
      >
        <View style={styles.friendModalBackdrop}>
          <View style={styles.friendModalCard}>
            <Text style={styles.friendModalTitle}>Add friend</Text>
            <Text style={styles.friendModalBody}>
              Paste a MoodSnap link or enter a username.
            </Text>

            <TextInput
              style={styles.friendInput}
              value={friendLinkInput}
              onChangeText={setFriendLinkInput}
              placeholder="moodsnap.cam/username"
              placeholderTextColor="#777"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.friendModalActions}>
              <TouchableOpacity
                style={styles.friendCancelButton}
                onPress={() => setFriendModalVisible(false)}
                disabled={sendingFriendRequest}
              >
                <Text style={styles.friendCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.friendSendButton,
                  sendingFriendRequest && styles.disabledButton,
                ]}
                onPress={handleSubmitFriendLink}
                disabled={sendingFriendRequest}
              >
                <Text style={styles.friendSendText}>
                  {sendingFriendRequest ? "Sending..." : "Send"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      </View>
    </TouchableWithoutFeedback>
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
  selectedMoodTopBadge: {
    position: "absolute",
    top: 78,
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 4,
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
  captionInput: {
    minHeight: 52,
    maxHeight: 100,
    borderRadius: 18,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#2b2b2b",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 14,
  },
  captionOverlay: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    zIndex: 4,
  },
  captionInput: {
    minHeight: 46,
    maxHeight: 92,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "800",
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

  topBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  friendCountBadge: {
    backgroundColor: "rgba(0,0,0,0.56)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  friendCountText: {
    color: "#fff",
    fontWeight: "900",
  },
  friendModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 22,
  },
  friendModalCard: {
    backgroundColor: "#151515",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#242424",
  },
  friendModalTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },
  friendModalBody: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  friendInput: {
    backgroundColor: "#222",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: "#333",
  },
  friendModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  friendCancelButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "#292929",
    alignItems: "center",
  },
  friendSendButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  friendCancelText: {
    color: "#fff",
    fontWeight: "900",
  },
  friendSendText: {
    color: "#fff",
    fontWeight: "900",
  },
});
