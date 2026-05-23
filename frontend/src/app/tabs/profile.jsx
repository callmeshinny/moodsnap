import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  acceptFriendRequestApi,
  getFriendRequestsApi,
  getFriendsApi,
  rejectFriendRequestApi,
  sendFriendRequestApi,
} from "../../api/friendApi";
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

export default function ProfileScreen() {
  const {
    user,
    logout,
    friendCount,
    refreshAppData,
    updateUser,
    updateProfilePhoto,
  } = useContext(AuthContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user?.username || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendLinkInput, setFriendLinkInput] = useState("");
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);

  useEffect(() => {
    refreshAppData?.();
    loadFriendRequests();
  }, []);

  useEffect(() => {
    setDraftName(user?.username || "");
  }, [user?.username]);

  const displayFriendLink = buildDisplayFriendLink(user?.username) || "Loading share URL...";
  const shareFriendLink = buildShareFriendLink(user?.username);
  const profileColor = user?.profileColor || COLORS.primary;

  const getInviteMessage = () =>
    `Add me on MoodSnap: ${displayFriendLink}\n${shareFriendLink}`;

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
        mediaTypes: "images",
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

  const handleSaveName = async () => {
    try {
      setSavingName(true);
      await updateUser?.({ username: draftName });
      setIsEditingName(false);
    } catch (error) {
      Alert.alert(
        "Update failed",
        error.response?.data?.message || error.message || "Could not update name."
      );
    } finally {
      setSavingName(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const result = await getFriendRequestsApi();
      setFriendRequests(result.requests || []);
    } catch {
      setFriendRequests([]);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequestApi(requestId);
      await refreshAppData?.();
      await loadFriendRequests();
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
    } catch (error) {
      setFriends([]);
      Alert.alert(
        "Could not load friends",
        error.response?.data?.message || error.message || "Please try again."
      );
    } finally {
      setLoadingFriends(false);
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
  };

  const handleChooseProfileColor = async (color) => {
    try {
      setColorModalVisible(false);
      await updateUser?.({ profileColor: color });
      await refreshAppData?.();
    } catch (error) {
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
        onOpenColorPicker={() => setColorModalVisible(true)}
      />

      <Section title="General">
        <SettingRow icon="Aa" label="Edit name" onPress={() => setIsEditingName(true)} />
        <SettingRow
          icon="👤"
          label="Edit profile photo"
          onPress={handleEditProfilePhoto}
        />
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

      <FriendRequestsSection
        friendRequests={friendRequests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
      />

      <Section title="About">
        {aboutItems.map((item) => (
          <SettingRow
            key={item.label}
            icon={item.icon}
            label={item.label}
            onPress={() => {
              if (item.label === "Rate MoodSnap") {
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
        friendLinkInput={friendLinkInput}
        onChangeFriendLinkInput={setFriendLinkInput}
        onSubmitFriendLink={handleSubmitFriendLink}
        sendingFriendRequest={sendingFriendRequest}
      />

      <EditNameModal
        visible={isEditingName}
        onClose={() => setIsEditingName(false)}
        draftName={draftName}
        onChangeDraftName={setDraftName}
        onSave={handleSaveName}
        savingName={savingName}
      />

      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onRate={handleRateMoodSnap}
      />

      <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />

      <PrivacyModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
      />
    </ScrollView>
  );
}
