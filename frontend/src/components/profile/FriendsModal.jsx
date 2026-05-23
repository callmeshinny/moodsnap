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
  friendsError,
  friendRequests,
  friendRequestsError,
  onRetry,
  onAcceptRequest,
  onRejectRequest,
  onUnfriend,
  onBlock,
  onReport,
  friendLinkInput,
  onChangeFriendLinkInput,
  onSubmitFriendLink,
  sendingFriendRequest,
}) {
  const pendingRequests = friendRequests || [];
  const acceptedFriends = friends || [];

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

          {friendRequestsError || friendsError ? (
            <View style={styles.retryBox}>
              <Text style={styles.friendsEmptyText}>
                {friendRequestsError || friendsError}
              </Text>
              <TouchableOpacity style={styles.addFriendButton} onPress={onRetry}>
                <Text style={styles.addFriendButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : loadingFriends ? (
            <Text style={styles.friendsEmptyText}>Loading friends...</Text>
          ) : (
            <ScrollView style={styles.friendsList}>
              <Text style={styles.friendsSectionTitle}>Pending requests</Text>
              {!pendingRequests.length ? (
                <Text style={styles.friendsEmptyText}>
                  No pending requests.
                </Text>
              ) : (
                pendingRequests.map((request) => (
                  <View key={request.id} style={styles.friendRow}>
                    <View style={styles.friendAvatar}>
                      {request.sender?.avatarUrl ? (
                        <Image
                          source={{ uri: request.sender.avatarUrl }}
                          style={styles.friendAvatarImage}
                        />
                      ) : (
                        <Text style={styles.friendAvatarInitial}>
                          {request.sender?.username?.[0]?.toUpperCase() || "?"}
                        </Text>
                      )}
                    </View>

                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>
                        {request.sender?.displayLabel ||
                          request.sender?.username ||
                          "MoodSnap user"}
                      </Text>
                      <Text style={styles.friendMeta}>
                        @{request.sender?.username || "unknown"}
                      </Text>
                      <View style={styles.friendActionRow}>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => onAcceptRequest(request.id)}
                        >
                          <Text style={styles.acceptText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => onRejectRequest(request.id)}
                        >
                          <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}

              <Text style={styles.friendsSectionTitle}>Accepted friends</Text>
              {acceptedFriends.length === 0 ? (
                <Text style={styles.friendsEmptyText}>
                  No accepted friends yet.
                </Text>
              ) : (
                acceptedFriends.map((friend) => (
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
                        {friend.displayLabel || friend.username || "MoodSnap user"}
                      </Text>
                      <Text style={styles.friendMeta}>@{friend.username}</Text>
                      <View style={styles.friendActionRow}>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => onUnfriend(friend)}
                        >
                          <Text style={styles.rejectText}>Unfriend</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => onBlock(friend)}
                        >
                          <Text style={styles.rejectText}>Block</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.reportButton}
                          onPress={() => onReport(friend)}
                        >
                          <Text style={styles.reportText}>Report</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
