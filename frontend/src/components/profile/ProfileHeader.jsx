import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { profileStyles as styles, withAlpha } from "./profileStyles";

export default function ProfileHeader({
  user,
  friendCount,
  displayFriendLink,
  profileColor,
  uploadingPhoto,
  onOpenFriendLink,
  onOpenFriends,
  onShareFriendLink,
  onOpenColorPicker,
}) {
  const displayName = user?.username || "MoodSnap user";

  return (
    <View style={styles.profileHeader}>
      <TouchableOpacity
        style={[styles.avatarOuter, { borderColor: profileColor }]}
        onPress={onOpenColorPicker}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Change profile ring colour"
      >
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
      </TouchableOpacity>

      <Text style={styles.name}>{displayName}</Text>
      <TouchableOpacity
        onPress={onOpenFriendLink}
        activeOpacity={0.75}
        accessibilityRole="link"
        accessibilityLabel={`Friend invite link ${displayFriendLink}`}
      >
        <Text
          style={[
            styles.link,
            {
              color: profileColor,
              borderColor: profileColor,
              backgroundColor: withAlpha(profileColor, "22"),
            },
          ]}
        >
          {displayFriendLink}
        </Text>
      </TouchableOpacity>

      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={onOpenFriends}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${friendCount || 0} friends`}
        >
          <Text style={styles.quickIcon}>👥</Text>
          <Text style={styles.quickText}>{friendCount || 0} friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={onShareFriendLink}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Share friend invite link"
        >
          <Text style={styles.quickIcon}>📤</Text>
          <Text style={styles.quickText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
