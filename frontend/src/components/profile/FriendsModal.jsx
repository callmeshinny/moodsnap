import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { profileStyles as styles } from "./profileStyles";

export default function FriendsModal({
  visible,
  onClose,
  friends,
  loadingFriends,
  friendLinkInput,
  onChangeFriendLinkInput,
  onSubmitFriendLink,
  sendingFriendRequest,
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.friendsModalCard}>
          <View style={styles.friendsModalHeader}>
            <Text style={styles.modalTitle}>Friends</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Close friends list"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addFriendBox}>
            <TextInput
              style={styles.addFriendInput}
              value={friendLinkInput}
              onChangeText={onChangeFriendLinkInput}
              placeholder="Paste link or username"
              placeholderTextColor="#777"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Friend link or username"
            />
            <TouchableOpacity
              style={[
                styles.addFriendButton,
                sendingFriendRequest && styles.disabledButton,
              ]}
              onPress={onSubmitFriendLink}
              disabled={sendingFriendRequest}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Send friend request"
            >
              <Text style={styles.addFriendButtonText}>
                {sendingFriendRequest ? "..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingFriends ? (
            <Text style={styles.friendsEmptyText}>Loading friends...</Text>
          ) : friends.length === 0 ? (
            <Text style={styles.friendsEmptyText}>
              No accepted friends yet.
            </Text>
          ) : (
            <ScrollView style={styles.friendsList}>
              {friends.map((friend) => (
                <View key={friend.id} style={styles.friendRow}>
                  <View style={styles.friendAvatar}>
                    {friend.avatarUrl ? (
                      <Image
                        source={{ uri: friend.avatarUrl }}
                        style={styles.friendAvatarImage}
                      />
                    ) : (
                      <Text style={styles.friendAvatarInitial}>
                        {friend.username?.[0]?.toUpperCase() || "?"}
                      </Text>
                    )}
                  </View>

                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>
                      {friend.username || "MoodSnap user"}
                    </Text>
                    <Text style={styles.friendMeta}>Accepted friend</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
