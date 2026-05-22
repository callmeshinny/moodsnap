import React, { useContext, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { sendFriendRequestApi } from "../api/friendApi";
import { AuthContext } from "../context/AuthContext";
import { COLORS } from "../constants/colors";

export default function UsernameFriendRequestScreen() {
  const { username } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user) {
      router.replace("/auth/signin");
      return;
    }

    try {
      setSending(true);
      await sendFriendRequestApi(username);
      Alert.alert("Request sent", "Your friend request has been sent.");
      router.replace("/tabs/feed");
    } catch (error) {
      Alert.alert(
        "Could not send request",
        error.response?.data?.message || error.message || "Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Do you want to add this user as a friend?</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>{sending ? "Sending..." : "Send"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: "#151515",
    borderRadius: 30,
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "900",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#292929",
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "900",
  },
  sendButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontWeight: "900",
  },
});
