import React, { useContext } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

const generalItems = [
  { icon: "🔔", label: "Notifications" },
  { icon: "🎂", label: "Edit birthday" },
  { icon: "Aa", label: "Edit name" },
  { icon: "👤", label: "Edit profile photo" },
  { icon: "📞", label: "Phone number" },
  { icon: "✉️", label: "Add email address" },
];

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
  const auth = useContext(AuthContext);

  const handleSignOut = async () => {
    try {
      if (typeof auth?.signOut === "function") {
        await auth.signOut();
      }
      if (typeof auth?.logout === "function") {
        await auth.logout();
      }
    } catch (error) {
      console.log("SIGN OUT ERROR:", error);
    }

    router.replace("/auth/signin");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This is only a mock button for now. Real account deletion will be added later.",
      [{ text: "OK" }]
    );
  };

  const handleComingSoon = (label) => {
    Alert.alert(label, "This setting will be connected later.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.handle} />

      <View style={styles.profileHeader}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarEmoji}>🐰</Text>
          </View>
        </View>

        <Text style={styles.name}>ngoc moodie</Text>
        <Text style={styles.link}>moodsnap.app/ngoc 🔗</Text>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleComingSoon("Friends")}
          >
            <Text style={styles.quickIcon}>👥</Text>
            <Text style={styles.quickText}>90 Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleComingSoon("Share")}
          >
            <Text style={styles.quickIcon}>📤</Text>
            <Text style={styles.quickText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Section title="General">
        {generalItems.map((item) => (
          <SettingRow
            key={item.label}
            icon={item.icon}
            label={item.label}
            onPress={() => handleComingSoon(item.label)}
          />
        ))}
      </Section>

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

      <Section title="Danger Zone">
        <SettingRow
          icon="🗑️"
          label="Delete account"
          danger
          onPress={handleDeleteAccount}
        />
        <SettingRow icon="👋" label="Sign out" onPress={handleSignOut} />
      </Section>

      <Text style={styles.footer}>Mood data stays private by default.</Text>
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
    borderColor: "#FFC400",
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
  avatarEmoji: {
    fontSize: 54,
  },
  name: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  link: {
    color: "#969696",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
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
});
