import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { QrCode, ScanLine, X } from "lucide-react-native";
import {
  acceptFriendRequestApi,
  blockUserApi,
  getFriendRequestsApi,
  getFriendsApi,
  reportUserApi,
  rejectFriendRequestApi,
  sendFriendRequestApi,
  unfriendApi,
} from "../../api/friendApi";
import { rateMoodSnapApi } from "../../api/ratingApi";
import { deleteMeApi } from "../../api/userApi";
import {
  ColorPickerModal,
  EditNameModal,
  PrivacyModal,
  RatingModal,
  TermsModal,
} from "../../components/profile/AboutModals";
import FriendRequestsSection from "../../components/profile/FriendRequestsSection";
import FriendsModal from "../../components/profile/FriendsModal";
import ProfileHeader from "../../components/profile/ProfileHeader";
import { Section, SettingRow } from "../../components/profile/ProfileSections";
import { profileStyles as styles } from "../../components/profile/profileStyles";
import { useToast } from "../../components/CustomToast";
import {
  APP_STORE_URL,
  buildDisplayFriendLink,
  buildShareFriendLink,
} from "../../constants/app";
import { COLORS } from "../../constants/colors";
import { AuthContext } from "../../context/AuthContext";
import { extractFriendIdentifier } from "../../utils/friendLink";

const aboutItems = [
  { icon: "⭐", label: "Rate MoodSnap" },
  { icon: "📤", label: "Share MoodSnap" },
  { icon: "📄", label: "Terms of Service" },
  { icon: "🔒", label: "Privacy Policy" },
];

const isHexColor = (value) => /^#[0-9a-fA-F]{6}$/.test(String(value || ""));

const getReadableTextColor = (hex) => {
  if (!isHexColor(hex)) {
    return "#fff";
  }

  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.58 ? "#000" : "#fff";
};

export default function ProfileScreen() {
  const { showToast } = useToast();
  const {
    user,
    logout,
    friendCount,
    refreshAppData,
    refreshFriendLink,
    refreshFriendCount,
    updateUser,
    updateProfilePhoto,
  } = useContext(AuthContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftDisplayName, setDraftDisplayName] = useState(
    user?.displayName || ""
  );
  const [draftUsername, setDraftUsername] = useState(user?.username || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [accentColor, setAccentColor] = useState(
    user?.profileColor || COLORS.primary
  );
  const [inviteUsername, setInviteUsername] = useState(user?.username || "");
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRatedMoodSnap, setHasRatedMoodSnap] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsError, setFriendRequestsError] = useState("");
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [friendLinkInput, setFriendLinkInput] = useState("");
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);

  useEffect(() => {
    refreshAppData?.();
    loadFriendRequests();
  }, []);

  useEffect(() => {
    setDraftDisplayName(user?.displayName || "");
    setDraftUsername(user?.username || "");
    setInviteUsername(user?.username || "");
  }, [user?.displayName, user?.username]);

  useEffect(() => {
    setAccentColor(user?.profileColor || COLORS.primary);
  }, [user?.profileColor]);

  // Auto-refresh friend requests when profile tab is focused
  useFocusEffect(
    React.useCallback(() => {
      loadFriendRequests();
    }, [])
  );

  const activeUsername = inviteUsername || user?.username;
  const displayFriendLink =
    buildDisplayFriendLink(activeUsername) || "Loading share URL...";
  const shareFriendLink = buildShareFriendLink(activeUsername);
  const profileColor = accentColor || user?.profileColor || COLORS.primary;
  const profileColorText = getReadableTextColor(profileColor);
  const qrPayload = JSON.stringify({
    type: "moodsnap_friend",
    userId: user?.id || "",
    username: activeUsername || "",
    link: shareFriendLink || displayFriendLink,
  });
  const qrCodeValue = shareFriendLink || qrPayload;

  const getInviteMessage = () =>
    `Add me on MoodSnap ${displayFriendLink} then share our mood`;

  const handleOpenQrScanner = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();

      if (!result.granted) {
        showToast("Camera permission is required to scan QR codes.", "error");
        return;
      }
    }

    setScanLocked(false);
    setQrScannerVisible(true);
  };

  const handleQrScanned = async (result) => {
    if (scanLocked) {
      return;
    }

    setScanLocked(true);

    try {
      const rawData = result?.data || result?.nativeEvent?.data || "";
      const trimmedData = String(rawData).trim();

      if (!trimmedData) {
        throw new Error("QR code data is empty.");
      }

      let receiverIdOrUsername = "";

      if (trimmedData.startsWith("{")) {
        const payload = JSON.parse(trimmedData);

        if (payload?.type === "moodsnap_friend") {
          receiverIdOrUsername = payload.username || payload.userId;
        }
      } else {
        receiverIdOrUsername = extractFriendIdentifier(trimmedData);
      }

      receiverIdOrUsername = String(receiverIdOrUsername || "")
        .replace(/^@+/, "")
        .trim();

      if (!receiverIdOrUsername) {
        throw new Error("This QR code is not a MoodSnap friend code.");
      }

      // Wrap API call with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout. Please try again.")), 15000)
      );
      const apiPromise = sendFriendRequestApi(receiverIdOrUsername);

      await Promise.race([apiPromise, timeoutPromise]);
      await Promise.allSettled([refreshAppData?.(), loadFriendRequests()]);
      setQrScannerVisible(false);
      showToast(`Friend request sent to ${receiverIdOrUsername}.`, "success");
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Could not scan this QR code.";
      showToast(errorMsg, "error");
      setScanLocked(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout?.();
          router.replace("/auth/signin");
        },
      },
    ]);
  };

  const handleOpenFriendLink = async () => {
    if (!shareFriendLink) {
      Alert.alert("Friend link unavailable", "Please try again in a moment.");
      return;
    }

    try {
      await Linking.openURL(shareFriendLink);
    } catch {
      Alert.alert("Could not open link", shareFriendLink);
    }
  };

  const handleCopyFriendLink = async () => {
    if (!displayFriendLink) {
      return;
    }

    try {
      await Clipboard.setStringAsync(getInviteMessage());
      Alert.alert("Copied", "Your MoodSnap invite is ready to paste.");
    } catch {
      Alert.alert("Copy failed", "Please try again.");
    }
  };

  const handleShareFriendLink = async () => {
    if (!displayFriendLink) {
      return;
    }

    try {
      await Share.share({
        message: getInviteMessage(),
        url: shareFriendLink || displayFriendLink,
        title: "Add me on MoodSnap",
      });
    } catch {
      Alert.alert("Share failed", "Please try again.");
    }
  };

  const handleEditProfilePhoto = async () => {
    const chooseFromLibrary = async () => {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Photo permission required",
            "Please allow photo access to update your profile photo."
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

        if (result.canceled || !result.assets?.[0]?.uri) {
          return;
        }

        setUploadingPhoto(true);
        await updateProfilePhoto?.(result.assets[0].uri);
        Alert.alert("Profile photo updated", "Your new photo is live.");
      } catch (error) {
        Alert.alert(
          "Upload failed",
          error.response?.data?.message ||
            error.message ||
            "Could not update your profile photo."
        );
      } finally {
        setUploadingPhoto(false);
      }
    };

    const takePhoto = async () => {
      try {
        const resultPerm = await requestCameraPermission();

        if (!resultPerm.granted) {
          Alert.alert(
            "Camera permission required",
            "Please allow camera access to take a profile photo."
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

        if (result.canceled || !result.assets?.[0]?.uri) {
          return;
        }

        setUploadingPhoto(true);
        await updateProfilePhoto?.(result.assets[0].uri);
        Alert.alert("Profile photo updated", "Your new photo is live.");
      } catch (error) {
        Alert.alert(
          "Upload failed",
          error.response?.data?.message ||
            error.message ||
            "Could not update your profile photo."
        );
      } finally {
        setUploadingPhoto(false);
      }
    };

    Alert.alert("Update profile photo", "Choose a photo source", [
      { text: "Cancel", style: "cancel" },
      { text: "Take photo", onPress: takePhoto },
      { text: "Choose from library", onPress: chooseFromLibrary },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete account",
      "Are you sure you want to delete your account? This will remove your profile, snaps, OTP records, and friendships from the database.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMeApi();
              await logout?.();
              router.replace("/auth/signin");
            } catch (error) {
              Alert.alert(
                "Delete failed",
                error.response?.data?.message ||
                  error.message ||
                  "Could not delete account."
              );
            }
          },
        },
      ]
    );
  };

  const handleOpenEditProfile = () => {
    setDraftDisplayName(user?.displayName || "");
    setDraftUsername(user?.username || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const username = draftUsername.trim().replace(/^@+/, "");

    if (!username) {
      Alert.alert("Username required", "Please enter a username.");
      return;
    }

    try {
      setSavingName(true);
      const updatedUser = await updateUser?.({
        displayName: draftDisplayName,
        username,
      });

      if (updatedUser?.username) {
        setInviteUsername(updatedUser.username);
      }

      await refreshFriendLink?.();
      setIsEditingName(false);
    } catch (error) {
      Alert.alert(
        "Update failed",
        error.response?.data?.message ||
          error.message ||
          "Could not update profile."
      );
    } finally {
      setSavingName(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const result = await getFriendRequestsApi();
      setFriendRequests(result.requests || []);
      setFriendRequestsError("");
    } catch {
      setFriendRequests([]);
      setFriendRequestsError("Could not load friend requests.");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequestApi(requestId);
      await refreshAppData?.();
      await refreshFriendCount?.();
      await loadFriendRequests();
      if (friendsVisible) {
        const result = await getFriendsApi();
        setFriends(result.friends || []);
      }
    } catch (error) {
      Alert.alert(
        "Could not accept request",
        error.response?.data?.message || error.message || "Please try again."
      );
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequestApi(requestId);
      await loadFriendRequests();
    } catch (error) {
      Alert.alert(
        "Could not update request",
        error.response?.data?.message || error.message || "Please try again."
      );
    }
  };

  const handleOpenFriends = async () => {
    try {
      setFriendsVisible(true);
      setLoadingFriends(true);
      const result = await getFriendsApi();
      setFriends(result.friends || []);
      setFriendsError("");
    } catch (error) {
      setFriends([]);
      setFriendsError(
        error.response?.data?.message || error.message || "Could not load friends."
      );
      Alert.alert(
        "Could not load friends",
        error.response?.data?.message || error.message || "Please try again."
      );
    } finally {
      setLoadingFriends(false);
    }
  };

  const refreshFriendsModal = async () => {
    await Promise.allSettled([handleOpenFriends(), loadFriendRequests()]);
  };

  const handleUnfriend = (friend) => {
    Alert.alert("Unfriend", `Remove ${friend.displayLabel || friend.username}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unfriend",
        style: "destructive",
        onPress: async () => {
          try {
            await unfriendApi(friend.id);
            await refreshAppData?.();
            await refreshFriendCount?.();
            await refreshFriendsModal();
          } catch (error) {
            Alert.alert(
              "Could not unfriend",
              error.response?.data?.message || error.message || "Please try again."
            );
          }
        },
      },
    ]);
  };

  const handleBlock = (friend) => {
    Alert.alert(
      "Block user",
      `Block ${friend.displayLabel || friend.username}? You will not see each other's snaps.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUserApi(friend.id);
              await refreshAppData?.();
              await refreshFriendCount?.();
              await refreshFriendsModal();
            } catch (error) {
              Alert.alert(
                "Could not block user",
                error.response?.data?.message || error.message || "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleReport = async (friend) => {
    try {
      await reportUserApi({
        reportedUserId: friend.id,
        reason: "profile_report",
      });
      Alert.alert("Report submitted", "Thanks for helping keep MoodSnap safe.");
    } catch (error) {
      Alert.alert(
        "Could not report user",
        error.response?.data?.message || error.message || "Please try again."
      );
    }
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
        refreshAppData?.(),
        loadFriendRequests(),
        handleOpenFriends(),
      ]);
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

  const handleRateMoodSnap = async (rating) => {
    if (hasRatedMoodSnap) {
      setRatingModalVisible(false);
      Alert.alert(
        "Already rated",
        "You have already rated MoodSnap. Thank you!"
      );
      return;
    }

    try {
      setSubmittingRating(true);
      await rateMoodSnapApi({ rating });
      setHasRatedMoodSnap(true);
      setRatingModalVisible(false);

      if (APP_STORE_URL) {
        Alert.alert(
          "Thanks for rating",
          `You rated MoodSnap ${rating}/5. Would you like to leave a review?`,
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Open store",
              onPress: () => Linking.openURL(APP_STORE_URL),
            },
          ]
        );
        return;
      }

      Alert.alert("Thanks for rating", `You rated MoodSnap ${rating}/5 stars.`);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Could not save your rating.";

      if (message.toLowerCase().includes("already rated")) {
        setHasRatedMoodSnap(true);
        setRatingModalVisible(false);
        Alert.alert(
          "Already rated",
          "You have already rated MoodSnap. Thank you!"
        );
        return;
      }

      Alert.alert("Rating failed", message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleChooseProfileColor = async (color) => {
    try {
      setColorModalVisible(false);
      setAccentColor(color);
      await updateUser?.({ profileColor: color }, { optimistic: true });
    } catch (error) {
      setAccentColor(user?.profileColor || COLORS.primary);
      Alert.alert(
        "Update failed",
        error.response?.data?.message || error.message || "Could not update colour."
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.handle} />

      <ProfileHeader
        user={user}
        friendCount={friendCount}
        displayFriendLink={displayFriendLink}
        profileColor={profileColor}
        uploadingPhoto={uploadingPhoto}
        onOpenFriendLink={handleOpenFriendLink}
        onOpenFriends={handleOpenFriends}
        onShareFriendLink={handleShareFriendLink}
        onPressAvatar={handleEditProfilePhoto}
      />

      <View style={[styles.qrCard, { borderColor: profileColor }]}>
        <View style={styles.qrHeader}>
          <View>
            <Text style={styles.qrEyebrow}>Friend QR</Text>
            <Text style={styles.qrTitle}>Add friends faster</Text>
          </View>
          <View style={[styles.qrIconBubble, { backgroundColor: profileColor }]}>
            <QrCode size={22} color={profileColorText} strokeWidth={2.8} />
          </View>
        </View>

        <View style={styles.qrBody}>
          <View style={styles.qrCodeWrap}>
            <QRCode
              value={qrCodeValue}
              size={126}
              backgroundColor="#fff"
              color="#111"
            />
          </View>
          <View style={styles.qrCopyWrap}>
            <Text style={styles.qrHandle} numberOfLines={1}>
              @{activeUsername || "moodsnap"}
            </Text>
            <Text style={styles.qrHint}>
              Friends can scan this code to send a request.
            </Text>
            <TouchableOpacity
              style={[styles.qrScanButton, { backgroundColor: profileColor }]}
              onPress={handleOpenQrScanner}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Scan friend QR code"
            >
              <ScanLine size={18} color={profileColorText} strokeWidth={2.8} />
              <Text style={[styles.qrScanButtonText, { color: profileColorText }]}>
                Scan QR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {friendRequests && friendRequests.length > 0 && (
        <FriendRequestsSection
          friendRequests={friendRequests}
          error={friendRequestsError}
          onRetry={loadFriendRequests}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
        />
      )}

      <Section title="General">
        <SettingRow icon="Aa" label="Edit profile" onPress={handleOpenEditProfile} />
        <SettingRow
          icon="🎨"
          label="Profile ring colour"
          onPress={() => setColorModalVisible(true)}
        />
        <SettingRow
          icon="📋"
          label="Copy invite link"
          onPress={handleCopyFriendLink}
        />
        <SettingRow
          icon="✉️"
          label="Email address"
          onPress={() =>
            Alert.alert("Email address", user?.email || "No email available.")
          }
        />
      </Section>

      <Section title="About">
        {aboutItems.map((item) => (
          <SettingRow
            key={item.label}
            icon={item.icon}
            label={item.label}
            onPress={() => {
              if (item.label === "Rate MoodSnap") {
                if (hasRatedMoodSnap) {
                  Alert.alert("Already rated", "You have already rated MoodSnap. Thank you!");
                  return;
                }
                setRatingModalVisible(true);
                return;
              }
              if (item.label === "Share MoodSnap") {
                handleShareFriendLink();
                return;
              }
              if (item.label === "Terms of Service") {
                setTermsVisible(true);
                return;
              }
              if (item.label === "Privacy Policy") {
                setPrivacyVisible(true);
              }
            }}
          />
        ))}
      </Section>

      <Section title="Account">
        <SettingRow
          icon="🗑️"
          label="Delete account"
          danger
          onPress={handleDeleteAccount}
        />
        <SettingRow icon="👋" label="Sign out" onPress={handleSignOut} />
      </Section>

      <Text style={styles.footer}>Mood data stays private by default.</Text>

      <ColorPickerModal
        visible={colorModalVisible}
        onClose={() => setColorModalVisible(false)}
        profileColor={profileColor}
        onChooseColor={handleChooseProfileColor}
      />

      <FriendsModal
        visible={friendsVisible}
        onClose={() => setFriendsVisible(false)}
        friends={friends}
        loadingFriends={loadingFriends}
        friendsError={friendsError}
        friendRequests={friendRequests}
        friendRequestsError={friendRequestsError}
        onRetry={refreshFriendsModal}
        onAcceptRequest={handleAcceptRequest}
        onRejectRequest={handleRejectRequest}
        onUnfriend={handleUnfriend}
        onBlock={handleBlock}
        onReport={handleReport}
        friendLinkInput={friendLinkInput}
        onChangeFriendLinkInput={setFriendLinkInput}
        onSubmitFriendLink={handleSubmitFriendLink}
        sendingFriendRequest={sendingFriendRequest}
      />

      <Modal
        visible={qrScannerVisible}
        animationType="slide"
        onRequestClose={() => setQrScannerVisible(false)}
      >
        <View style={styles.qrScannerScreen}>
          <CameraView
            style={styles.qrScannerCamera}
            facing="back"
            onBarcodeScanned={scanLocked ? undefined : handleQrScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={styles.qrScannerTopBar}>
            <TouchableOpacity
              onPress={() => setQrScannerVisible(false)}
              style={styles.qrScannerClose}
              accessibilityRole="button"
              accessibilityLabel="Close QR scanner"
            >
              <X size={22} color="#fff" strokeWidth={2.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.qrScannerFrame} pointerEvents="none" />
          <View style={styles.qrScannerFooter}>
            <Text style={styles.qrScannerTitle}>Scan friend QR</Text>
            <Text style={styles.qrScannerHint}>
              Place the MoodSnap code inside the frame.
            </Text>
          </View>
        </View>
      </Modal>

      <EditNameModal
        visible={isEditingName}
        onClose={() => setIsEditingName(false)}
        draftDisplayName={draftDisplayName}
        draftUsername={draftUsername}
        onChangeDraftDisplayName={setDraftDisplayName}
        onChangeDraftUsername={setDraftUsername}
        onSave={handleSaveName}
        savingName={savingName}
        accentColor={profileColor}
      />

      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onRate={handleRateMoodSnap}
        submittingRating={submittingRating}
      />

      <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />

      <PrivacyModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
      />
    </ScrollView>
  );
}
