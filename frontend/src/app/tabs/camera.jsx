import React, { useContext, useRef, useState, useEffect } from "react";
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
  ScrollView,
  Animated,
  PanResponder,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { BookText, SmilePlus } from "lucide-react-native";
import { createSnapApi } from "../../api/snapApi";
import { sendFriendRequestApi } from "../../api/friendApi";
import EmojiPicker from "../../components/EmojiPicker";
import JournalModal from "../../components/JournalModal";
import { useToast } from "../../components/CustomToast";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { compressSnapImage } from "../../utils/imageCompress";
import { extractFriendIdentifier } from "../../utils/friendLink";
import { moodOptions } from "../../utils/moods";

export default function CameraScreen() {
  const {
    user,
    friendCount,
    refreshAppData,
    refreshFeed,
    refreshFriendCount,
    refreshStreak,
    streak,
    postedToday,
  } = useContext(AuthContext);
  const { showToast } = useToast();
  const cameraRef = useRef(null);
  const sheetTranslate = useRef(new Animated.Value(0)).current;
  const SHEET_EXPANDED = -260;

  // Tab navigation order: diary, feed, camera, calendar, profile
  const TABS = ["diary", "feed", "camera", "calendar", "profile"];
  const CURRENT_TAB_INDEX = 2; // camera is at index 2
  
  // Horizontal swipe responder for switching tabs (left/right)
  const topPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Trigger only for mostly-horizontal swipes with sufficient distance
        return Math.abs(gesture.dx) > 40 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        const threshold = 80;
        
        if (gesture.dx > threshold && CURRENT_TAB_INDEX > 0) {
          // swipe right -> previous tab
          router.push(`/tabs/${TABS[CURRENT_TAB_INDEX - 1]}`);
        } else if (gesture.dx < -threshold && CURRENT_TAB_INDEX < TABS.length - 1) {
          // swipe left -> next tab
          router.push(`/tabs/${TABS[CURRENT_TAB_INDEX + 1]}`);
        }
      },
    })
  ).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dy) > 6 && hasCaptured;
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(Math.max(gesture.dy, SHEET_EXPANDED), 0);
        sheetTranslate.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldExpand = gesture.dy < -80;
        Animated.spring(sheetTranslate, {
          toValue: shouldExpand ? SHEET_EXPANDED : 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;
  const [permission, requestPermission] = useCameraPermissions();
  const [hasCaptured, setHasCaptured] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [caption, setCaption] = useState("");
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("back");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [softFilterEnabled, setSoftFilterEnabled] = useState(false);
  const [screenFlashVisible, setScreenFlashVisible] = useState(false);
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [friendLinkInput, setFriendLinkInput] = useState("");
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);

  const handleFlipCamera = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  };

  const wait = (duration) =>
    new Promise((resolve) => {
      setTimeout(resolve, duration);
    });

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

      if (flashEnabled && cameraFacing === "front") {
        setScreenFlashVisible(true);
        await wait(140);
      }

      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
        mirror: false,
      });

      setScreenFlashVisible(false);

      if (!photo?.uri) {
        throw new Error("Could not capture photo");
      }

      setCapturedImageUri(photo.uri);
      setHasCaptured(true);
      setSelectedMood(moodOptions[0]);
      setCaption("");
      // Keep the post sheet below the captured image by default.
      // Users can still drag the sheet up manually if they want to expand it.
      sheetTranslate.setValue(0);
    } catch (error) {
      setScreenFlashVisible(false);
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
    sheetTranslate.setValue(0);
  };

  const handlePost = async () => {
    if (!selectedMood) {
      showToast("Pick a mood before posting your snap.", "warning");
      return;
    }

    if (!capturedImageUri) {
      showToast("Take a snap before posting.", "warning");
      return;
    }

    try {
      setPosting(true);

      const compressedUri = await compressSnapImage(capturedImageUri);

      await createSnapApi({
        imageUri: compressedUri,
        mood: selectedMood.label,
        caption: caption.trim(),
        softFilterEnabled,
      });

      refreshFeed?.();
      await refreshStreak?.();
      setHasCaptured(false);
      setCapturedImageUri(null);
      setSelectedMood(null);
      setCaption("");
      sheetTranslate.setValue(0);
      showToast(`Saved as ${selectedMood.emoji} ${selectedMood.label}`, "success");
      router.push("/tabs/feed");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not post your snap.",
        "error"
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
      <View style={styles.container} {...topPanResponder.panHandlers}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
      <View
        style={[
          styles.preview,
          hasCaptured && selectedMood && { borderColor: selectedMood.color, borderWidth: 6 },
        ]}
      >
        <View style={styles.logoRow}>
          <Text style={[styles.logo, { color: (user?.profileColor || COLORS.primary) }]}>MoodSnap</Text>

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

        {postedToday ? (
          <View style={styles.postedTodayBanner}>
            <Text style={styles.postedTodayText}>Posted today — streak safe</Text>
          </View>
        ) : (
          <View style={styles.postedTodayBanner}>
            <Text style={styles.postedTodayHint}>
              Snap today to keep your {streak || 0}-day streak
            </Text>
          </View>
        )}

        {!hasCaptured || !capturedImageUri ? (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraFacing}
              mirror={cameraFacing === "front"}
              flash={flashEnabled ? "on" : "off"}
              enableTorch={flashEnabled && cameraFacing === "back"}
            />
            {softFilterEnabled && <View pointerEvents="none" style={styles.softFilterOverlay} />}
            {screenFlashVisible && <View pointerEvents="none" style={styles.screenFlash} />}

            <View style={styles.cameraToolRow}>
              <TouchableOpacity
                style={[
                  styles.cameraToolButton,
                  flashEnabled && styles.cameraToolButtonActive,
                ]}
                onPress={() => setFlashEnabled((current) => !current)}
                activeOpacity={0.8}
              >
                <Text style={styles.cameraToolText}>
                  {flashEnabled ? "Flash on" : "Flash"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cameraToolButton,
                  softFilterEnabled && styles.cameraToolButtonActive,
                ]}
                onPress={() => setSoftFilterEnabled((current) => !current)}
                activeOpacity={0.8}
              >
                <Text style={styles.cameraToolText}>Soft</Text>
              </TouchableOpacity>
            </View>

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
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.camera}
              blurRadius={softFilterEnabled ? 0.4 : 0}
            />
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
          <Animated.View
            style={[styles.postSheet, { transform: [{ translateY: sheetTranslate }] }]}
            {...panResponder.panHandlers}
          >
            <Text style={styles.sectionTitle}>How are you feeling?</Text>

            <TouchableOpacity
              style={[
                styles.moodSummary,
                selectedMood && { borderColor: selectedMood.color },
              ]}
              onPress={() => setEmojiPickerVisible(true)}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Open mood picker"
            >
              <View
                style={[
                  styles.selectedMoodOrb,
                  selectedMood && {
                    backgroundColor: "#fff",
                    borderWidth: 3,
                    borderColor: selectedMood.color,
                  },
                ]}
              >
                <Text style={styles.selectedMoodEmoji}>
                  {selectedMood?.emoji || "🙂"}
                </Text>
              </View>
              <View style={styles.moodSummaryTextWrap}>
                <Text style={styles.moodSummaryLabel}>
                  {selectedMood?.label || "Choose mood"}
                </Text>
                <Text style={styles.moodSummaryHint}>Tap to open all moods</Text>
              </View>
              <SmilePlus size={22} color="#fff" strokeWidth={2.7} />
            </TouchableOpacity>

            <View style={styles.moodRow}>
              {moodOptions.slice(0, 5).map((mood) => (
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
              <TouchableOpacity
                style={styles.moodButton}
                onPress={() => setEmojiPickerVisible(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="More moods"
              >
                <Text style={styles.moreMoodText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.journalCard, caption.trim() && styles.journalCardActive]}
              onPress={() => setJournalModalVisible(true)}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={caption.trim() ? "Edit journal note" : "Add journal note"}
            >
              <View style={styles.journalIconBubble}>
                <BookText size={19} color="#fff" strokeWidth={2.7} />
              </View>
              <View style={styles.journalTextWrap}>
                <Text style={styles.journalTitle}>
                  {caption.trim() ? "Journal added" : "Add journal"}
                </Text>
                <Text style={styles.journalBody} numberOfLines={2}>
                  {caption.trim() || "Save a quick note with this snap."}
                </Text>
              </View>
              <Text style={styles.journalAction}>
                {caption.trim() ? "Edit" : "Add"}
              </Text>
            </TouchableOpacity>

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
          </Animated.View>
        </>
      )}

      <EmojiPicker
        visible={emojiPickerVisible}
        selectedMood={selectedMood}
        onSelect={setSelectedMood}
        onClose={() => setEmojiPickerVisible(false)}
      />

      <JournalModal
        visible={journalModalVisible}
        initialText={caption}
        onSave={setCaption}
        onClose={() => setJournalModalVisible(false)}
      />

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

        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    paddingBottom: 140,
    justifyContent: "flex-start",
  },
  preview: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 32,
    borderWidth: 6,
    borderColor: "#252525",
    backgroundColor: "#151515",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 32,
  },
  camera: {
    width: "100%",
    height: "100%",
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
  postedTodayBanner: {
    position: "absolute",
    top: 88,
    alignSelf: "center",
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  postedTodayText: {
    color: "#9ef0b8",
    fontWeight: "900",
    fontSize: 12,
  },
  postedTodayHint: {
    color: "#f0d27a",
    fontWeight: "800",
    fontSize: 12,
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
  cameraToolRow: {
    position: "absolute",
    left: 18,
    bottom: 22,
    flexDirection: "row",
    gap: 10,
    zIndex: 3,
  },
  cameraToolButton: {
    minWidth: 70,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
  },
  cameraToolButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cameraToolText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  softFilterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,205,221,0.13)",
    zIndex: 1,
  },
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.92)",
    zIndex: 8,
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
  moodSummary: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#292929",
    backgroundColor: "#161616",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectedMoodOrb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2b2b2b",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedMoodEmoji: {
    fontSize: 27,
  },
  moodSummaryTextWrap: {
    flex: 1,
  },
  moodSummaryLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  moodSummaryHint: {
    color: "#9a9a9a",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
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
  moreMoodText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30,
  },
  journalCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    backgroundColor: "#151515",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  journalCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255,105,180,0.12)",
  },
  journalIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#292929",
    justifyContent: "center",
    alignItems: "center",
  },
  journalTextWrap: {
    flex: 1,
  },
  journalTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  journalBody: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  journalAction: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  journalPreviewOverlay: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    zIndex: 4,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  journalPreviewText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 120,
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
  postSheet: {
      marginTop: 12,
    paddingBottom: 6,
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
