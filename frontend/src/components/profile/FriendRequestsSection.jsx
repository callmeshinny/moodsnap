import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Section } from "./ProfileSections";
import { profileStyles as styles } from "./profileStyles";

export default function FriendRequestsSection({
  friendRequests,
  error,
  onRetry,
  onAccept,
  onReject,
}) {
  if (!friendRequests.length && !error) {
    return null;
  }

  return (
    <Section title="Friend requests">
      {!!error && (
        <View style={styles.requestRow}>
          <Text style={styles.requestMeta}>{error}</Text>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry friend requests"
          >
            <Text style={styles.acceptText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {friendRequests.map((request) => (
        <View key={request.id} style={styles.requestRow}>
          <View>
            <Text style={styles.requestName}>
              {request.sender?.displayLabel ||
                request.sender?.username ||
                "MoodSnap user"}
            </Text>
            <Text style={styles.requestMeta}>
              @{request.sender?.username || "unknown"} wants to add you
            </Text>
          </View>
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => onReject(request.id)}
              accessibilityRole="button"
              accessibilityLabel="Reject friend request"
            >
              <Text style={styles.rejectText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAccept(request.id)}
              accessibilityRole="button"
              accessibilityLabel="Accept friend request"
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </Section>
  );
}
