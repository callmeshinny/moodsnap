import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  checkFriendStatusApi,
  sendFriendRequestApi,
} from "../../api/friendApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

export default function FriendInviteScreen() {
  const { username } = useLocalSearchParams();
  const { user, refreshAppData } = useContext(AuthContext);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyFriends, setAlreadyFriends] = useState(false);
  const [pending, setPending] = useState(false);

  const targetUsername = Array.isArray(username) ? username[0] : username;

  useEffect(() => {
    if (!user) {
      Alert.alert(
        "Sign in required",
        "Please sign in before adding a friend.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth/signin"),
          },
        ]
      );
    }
  }, [user]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user || !targetUsername) {
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        const result = await checkFriendStatusApi(targetUsername);
        setAlreadyFriends(Boolean(result.alreadyFriends));
        setPending(Boolean(result.pending));
      } catch {
        setAlreadyFriends(false);
        setPending(false);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [user, targetUsername]);

  const handleSend = async () => {
    if (!targetUsername) {
      Alert.alert("Invalid link", "This friend link is not valid.");
      return;
    }

    try {
      setSending(true);
      await sendFriendRequestApi(targetUsername);
      await refreshAppData?.();

      Alert.alert(
        "Friend request sent",
        `${targetUsername} will see your request in their profile.`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/tabs/profile"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Could not send request",
        error.response?.data?.message ||
          error.message ||
          "Please try again.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/tabs/profile"),
          },
        ]
      );
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    router.replace("/tabs/profile");
  };

  if (!user || checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (alreadyFriends) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>💖</Text>
          <Text style={styles.title}>You are already friends!</Text>
          <Text style={styles.body}>
            You and <Text style={styles.name}>{targetUsername}</Text> are already connected on MoodSnap.
          </Text>

          <TouchableOpacity style={styles.sendButton} onPress={() => router.replace("/tabs/feed")}>
            <Text style={styles.sendText}>Go to feed</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (pending) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>⏳</Text>
          <Text style={styles.title}>Request already sent</Text>
          <Text style={styles.body}>
            Your friend request to <Text style={styles.name}>{targetUsername}</Text> is waiting for approval.
          </Text>

          <TouchableOpacity style={styles.sendButton} onPress={() => router.replace("/tabs/profile")}>
            <Text style={styles.sendText}>Back to profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.title}>Add friend?</Text>
        <Text style={styles.body}>
          Do you want to send a friend request to{" "}
          <Text style={styles.name}>{targetUsername}</Text>?
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={sending}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, sending && styles.disabledButton]}
            onPress={handleSend}
            disabled={sending}
          >
            <Text style={styles.sendText}>
              {sending ? "Sending..." : "Send"}
            </Text>
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
    borderWidth: 1,
    borderColor: "#242424",
  },
  emoji: {
    fontSize: 44,
    marginBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },
  body: {
    color: "#bdbdbd",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
    marginTop: 10,
  },
  name: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  sendButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.58,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "900",
  },
  sendText: {
    color: "#fff",
    fontWeight: "900",
  },
});
