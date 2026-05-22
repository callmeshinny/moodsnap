import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  acceptFriendRequestApi,
  getFriendRequestsApi,
  rejectFriendRequestApi,
} from "../../api/friendApi";
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
  } = useContext(AuthContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user?.username || "");
  const [savingName, setSavingName] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    refreshAppData?.();
    loadFriendRequests();
  }, []);

  useEffect(() => {
    setDraftName(user?.username || "");
  }, [user?.username]);

  const handleSignOut = async () => {
    await logout?.();
    router.replace("/auth/signin");
  };

  const handleShareFriendLink = async () => {
    const link = friendLink || (await refreshFriendLink?.());

    if (!link) {
      Alert.alert("Friend link unavailable", "Please try again in a moment.");
      return;
    }

    await Share.share({
      message: `Add me on MoodSnap: ${link}`,
    });
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

  const displayName = user?.username || "MoodSnap user";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.handle} />

      <View style={styles.profileHeader}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitial}>
              {displayName[0]?.toUpperCase() || "M"}
            </Text>
          </View>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.link}>{friendLink || "Loading friend link..."}</Text>

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
          onPress={() => handleComingSoon("Edit profile photo")}
        />
        <SettingRow
          icon="✉️"
          label="Email address"
          onPress={() => handleComingSoon("Email address")}
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
            onPress={() => handleComingSoon(item.label)}
          />
        ))}
      </Section>

      <Section title="Account">
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
});
