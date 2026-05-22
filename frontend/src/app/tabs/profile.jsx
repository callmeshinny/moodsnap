import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  acceptFriendRequestApi,
  getFriendRequestsApi,
  rejectFriendRequestApi,
} from "../../api/friendApi";
import { deleteMeApi } from "../../api/userApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

const aboutItems = [
  { icon: "⭐", label: "Rate MoodSnap" },
  { icon: "📤", label: "Share MoodSnap" },
  { icon: "📄", label: "Terms of Service" },
  { icon: "🔒", label: "Privacy Policy" },
];

function SettingRow({ icon, label, danger, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowIcon, danger && styles.dangerText]}>{icon}</Text>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>
          {label}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const {
    user,
    logout,
    friendCount,
    friendLink,
    refreshAppData,
    refreshFriendLink,
    updateUser,
    updateProfilePhoto,
  } = useContext(AuthContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user?.username || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    refreshAppData?.();
    loadFriendRequests();
  }, []);

  useEffect(() => {
    setDraftName(user?.username || "");
  }, [user?.username]);

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

  const getInviteMessage = (link) =>
    `Add me on MoodSnap ${link} then share our mood`;

  const getFriendLink = async () => {
    const link = friendLink || (await refreshFriendLink?.());

    if (!link) {
      Alert.alert("Friend link unavailable", "Please try again in a moment.");
      return null;
    }

    return link;
  };

  const handleCopyFriendLink = async () => {
    const link = await getFriendLink();

    if (!link) {
      return;
    }

    await Clipboard.setStringAsync(getInviteMessage(link));
    Alert.alert("Copied", "Your MoodSnap invite is ready to paste.");
  };

  const handleShareFriendLink = async () => {
    const link = await getFriendLink();

    if (!link) {
      return;
    }

    await Share.share({ message: getInviteMessage(link) });
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
        error instanceof Error
          ? error.message
          : "Could not update your profile photo."
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

  const handleComingSoon = (label) => {
    Alert.alert(label, "This setting will be connected later.");
  };

  const handleRateMoodSnap = (rating) => {
    setSelectedRating(rating);
    setRatingModalVisible(false);
    Alert.alert("Thanks for rating", `You rated MoodSnap ${rating}/5 stars.`);
  };

  const displayName = user?.username || "MoodSnap user";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.handle} />

      <View style={styles.profileHeader}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>
                {displayName[0]?.toUpperCase() || "M"}
              </Text>
            )}
            {uploadingPhoto && (
              <View style={styles.avatarOverlay}>
                <Text style={styles.avatarOverlayText}>Uploading</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <TouchableOpacity onPress={handleCopyFriendLink} activeOpacity={0.75}>
          <Text style={styles.link}>
            {friendLink || "Loading friend link..."}
          </Text>
        </TouchableOpacity>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickButton} activeOpacity={0.8}>
            <Text style={styles.quickIcon}>👥</Text>
            <Text style={styles.quickText}>{friendCount || 0} friends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={handleShareFriendLink}
            activeOpacity={0.8}
          >
            <Text style={styles.quickIcon}>📤</Text>
            <Text style={styles.quickText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Section title="General">
        <SettingRow
          icon="Aa"
          label="Edit name"
          onPress={() => setIsEditingName(true)}
        />
        <SettingRow
          icon="👤"
          label="Edit profile photo"
          onPress={handleEditProfilePhoto}
        />
        <SettingRow
          icon="✉️"
          label="Email address"
          onPress={() =>
            Alert.alert("Email address", user?.email || "No email available.")
          }
        />
      </Section>

      {friendRequests.length > 0 && (
        <Section title="Friend requests">
          {friendRequests.map((request) => (
            <View key={request.id} style={styles.requestRow}>
              <View>
                <Text style={styles.requestName}>
                  {request.sender?.username || "MoodSnap user"}
                </Text>
                <Text style={styles.requestMeta}>wants to add you</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectRequest(request.id)}
                >
                  <Text style={styles.rejectText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRequest(request.id)}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Section>
      )}

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

              handleComingSoon(item.label);
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

      <Modal
        visible={isEditingName}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditingName(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit name</Text>
            <TextInput
              style={styles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Display name"
              placeholderTextColor="#777"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditingName(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                <Text style={styles.saveText}>
                  {savingName ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={ratingModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate MoodSnap</Text>
            <Text style={styles.modalBody}>
              How does MoodSnap feel today?
            </Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={styles.starButton}
                  onPress={() => handleRateMoodSnap(rating)}
                  activeOpacity={0.72}
                >
                  <Text
                    style={[
                      styles.starText,
                      rating <= selectedRating && styles.starTextSelected,
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.fullCancelButton}
              onPress={() => setRatingModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={termsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTermsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.termsCard}>
            <Text style={styles.modalTitle}>Terms of Service</Text>
            <ScrollView style={styles.termsScroll}>
              <Text style={styles.termsText}>
                Welcome to MoodSnap. MoodSnap is for sharing real mood moments
                with people you choose.
              </Text>
              <Text style={styles.termsText}>
                Be kind. Post only photos you have the right to share. Do not
                harass, impersonate, spam, scrape, or use MoodSnap for anything
                illegal or unsafe.
              </Text>
              <Text style={styles.termsText}>
                You own your photos, profile, and mood posts. You give MoodSnap
                permission to host, process, and show that content so the app can
                work for you and your friends.
              </Text>
              <Text style={styles.termsText}>
                We may remove content or accounts that break these terms, hurt
                other people, or put the service at risk. MoodSnap is provided
                as is, and some features may change as the app grows.
              </Text>
              <Text style={styles.termsText}>
                By using MoodSnap, you agree to keep the space honest, private,
                and fun for the people you add.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setTermsVisible(false)}
            >
              <Text style={styles.saveText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 62,
    paddingBottom: 120,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 6,
    borderRadius: 99,
    backgroundColor: "#555",
    marginBottom: 30,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarOuter: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 6,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  avatarInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#2b2b2b",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "900",
  },
  name: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  link: {
    color: "#969696",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
  },
  quickRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 24,
  },
  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#3a3a3a",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 28,
    minWidth: 132,
    justifyContent: "center",
  },
  quickIcon: {
    fontSize: 14,
  },
  quickText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  sectionWrap: {
    marginTop: 22,
  },
  sectionTitle: {
    color: "#bdbdbd",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: "#3a3a3a",
    borderRadius: 24,
    overflow: "hidden",
    paddingVertical: 8,
  },
  row: {
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rowIcon: {
    width: 34,
    textAlign: "center",
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
  },
  rowLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  requestRow: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  requestName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  requestMeta: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  rejectButton: {
    borderRadius: 14,
    backgroundColor: "#292929",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rejectText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  acceptButton: {
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  acceptText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  chevron: {
    color: "#777",
    fontSize: 34,
    fontWeight: "500",
    marginTop: -4,
  },
  dangerText: {
    color: "#ff4d4d",
  },
  footer: {
    color: "#7a7a7a",
    textAlign: "center",
    marginTop: 34,
    fontSize: 13,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    backgroundColor: "#151515",
    borderRadius: 28,
    padding: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 14,
  },
  modalBody: {
    color: "#aaa",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  nameInput: {
    backgroundColor: "#222",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "#292929",
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "900",
  },
  fullCancelButton: {
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "#292929",
    alignItems: "center",
    marginTop: 18,
  },
  saveButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
  },
  doneButton: {
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  starButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#242424",
  },
  starText: {
    color: "#777",
    fontSize: 30,
    fontWeight: "900",
  },
  starTextSelected: {
    color: COLORS.primary,
  },
  termsCard: {
    backgroundColor: "#151515",
    borderRadius: 28,
    padding: 20,
    maxHeight: "82%",
  },
  termsScroll: {
    marginBottom: 18,
  },
  termsText: {
    color: "#d9d9d9",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 14,
  },
});
