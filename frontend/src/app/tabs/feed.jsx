import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  PanResponder,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { deleteSnapApi, getFeedApi } from "../../api/snapApi";
import CustomButton from "../../components/CustomButton";
import MutedText from "../../components/MutedText";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { getMoodMeta } from "../../utils/moods";
import { formatUploadTime } from "../../utils/time";

function ZoomableImage({ sourceUri, softFilterEnabled }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastPan = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);
  const gestureStart = useRef({
    distance: 0,
    scale: 1,
    pan: { x: 0, y: 0 },
    point: { x: 0, y: 0 },
  });

  const getTouchDistance = (touches) => {
    const [first, second] = touches;
    const x = first.pageX - second.pageX;
    const y = first.pageY - second.pageY;
    return Math.sqrt(x * x + y * y);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: (event) => {
        const touches = event.nativeEvent.touches;

        gestureStart.current = {
          distance: touches.length >= 2 ? getTouchDistance(touches) : 0,
          scale: lastScale.current,
          pan: { ...lastPan.current },
          point: {
            x: touches[0]?.pageX || 0,
            y: touches[0]?.pageY || 0,
          },
        };
      },
      onPanResponderMove: (event, gestureState) => {
        const touches = event.nativeEvent.touches;

        if (touches.length >= 2 && gestureStart.current.distance > 0) {
          const nextScale = Math.min(
            Math.max(
              gestureStart.current.scale *
                (getTouchDistance(touches) / gestureStart.current.distance),
              1
            ),
            4
          );
          lastScale.current = nextScale;
          scale.setValue(nextScale);
          return;
        }

        if (lastScale.current <= 1) {
          return;
        }

        const nextX = gestureStart.current.pan.x + gestureState.dx;
        const nextY = gestureStart.current.pan.y + gestureState.dy;
        lastPan.current = { x: nextX, y: nextY };
        pan.setValue(lastPan.current);
      },
      onPanResponderRelease: () => {
        if (lastScale.current <= 1.02) {
          lastScale.current = 1;
          lastPan.current = { x: 0, y: 0 };
          Animated.parallel([
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        lastPan.current = { x: 0, y: 0 };
      },
    })
  ).current;

  return (
    <View style={styles.zoomViewport} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.zoomImageWrap,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale },
            ],
          },
        ]}
      >
        <Image
          source={{ uri: sourceUri }}
          style={styles.zoomImage}
          contentFit="contain"
        />
        {softFilterEnabled ? (
          <View pointerEvents="none" style={styles.modalSoftFilterOverlay} />
        ) : null}
      </Animated.View>
    </View>
  );
}

const Avatar = React.memo(function Avatar({ user }) {
  const ringColor = user?.profileColor || COLORS.primary;
  const displayName = user?.displayLabel || user?.username || "MoodSnap user";
  const initial = displayName?.[0]?.toUpperCase() || "?";

  return (
    <View style={[styles.avatarRing, { borderColor: ringColor }]}>
      {user?.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: ringColor }]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
    </View>
  );
});

const FeedCard = React.memo(function FeedCard({
  item,
  onOpen,
  currentUser,
  onDelete,
}) {
  const snapUser =
    item.user || (item.userId === currentUser?.id ? currentUser : null);
  const mood = getMoodMeta(item.mood);
  const name = snapUser?.displayLabel || snapUser?.username || "MoodSnap user";
  const username = snapUser?.username ? `@${snapUser.username}` : "@unknown";
  const accentColor = snapUser?.profileColor || COLORS.primary;
  const canDelete = currentUser?.id && item.userId === currentUser.id;

  return (
    <TouchableOpacity
      style={[styles.card, { aspectRatio: 5 / 3 }]}
      onPress={() => onOpen(item)}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Open snap from ${name}`}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
      {item.softFilterEnabled ? (
        <View pointerEvents="none" style={styles.softFilterOverlay} />
      ) : null}
      <View style={styles.cardScrim} />
      {canDelete ? (
        <TouchableOpacity
          style={styles.deletePill}
          onPress={() => onDelete(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Delete this snap"
        >
          <Text style={styles.deletePillText}>Delete</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.cardTopText}>
        <Text style={styles.cardTime}>{formatUploadTime(item.createdAt)}</Text>
        {!!item.caption && (
          <Text style={styles.cardCaption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.userRow}>
          <Avatar user={snapUser} />
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={[styles.username, { color: accentColor }]}>
              {username}
            </Text>
            <Text style={styles.moodText}>
              {mood.emoji} {item.mood}
            </Text>
          </View>
        </View>

        <View style={[styles.moodPill, { backgroundColor: mood.color }]}>
          <Text style={styles.moodPillText}>{mood.emoji}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

function FeedEmptyState({ friendCount, onRetry, showRetry }) {
  const hasNoFriends = friendCount === 0;

  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyEmoji}>{hasNoFriends ? "👥" : "🖼️"}</Text>
      <Text style={styles.emptyTitle}>
        {hasNoFriends ? "Add friends to fill your feed" : "No snaps yet"}
      </Text>
      <MutedText style={styles.emptyText}>
        {hasNoFriends
          ? "Invite people from Profile. Once they accept, their mood snaps appear here."
          : "Post your first snap on Camera, or wait for friends to share theirs."}
      </MutedText>
      <View style={styles.emptyActions}>
        {hasNoFriends ? (
          <CustomButton
            title="Invite friends"
            onPress={() => router.push("/tabs/profile")}
            accessibilityLabel="Go to profile to invite friends"
          />
        ) : null}
        <CustomButton
          title="Post a snap"
          onPress={() => router.push("/tabs/camera")}
          variant={hasNoFriends ? "secondary" : "primary"}
          accessibilityLabel="Go to camera to post a snap"
        />
      </View>
      {showRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.retryLink}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function FeedScreen() {
  const { feedRefreshKey, friendCount, user, refreshFeed } = useContext(AuthContext);
  const [snaps, setSnaps] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [selectedSnap, setSelectedSnap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");

  const loadFeed = useCallback(async ({ reset = false } = {}) => {
    try {
      if (reset) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await getFeedApi({ limit: 20 });
      setSnaps(result.snaps || []);
      setNextCursor(result.nextCursor || null);
      setError("");
      setLoadMoreError("");
    } catch (loadError) {
      setSnaps([]);
      setNextCursor(null);
      setError(loadError.message || "Failed to load feed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    try {
      setLoadingMore(true);
      setLoadMoreError("");
      const result = await getFeedApi({ cursor: nextCursor, limit: 20 });
      setSnaps((current) => [...current, ...(result.snaps || [])]);
      setNextCursor(result.nextCursor || null);
    } catch (loadError) {
      setLoadMoreError(
        loadError.message || "Could not load more snaps. Pull down to refresh."
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteSnap = (snap) => {
    Alert.alert("Delete this snap?", "This removes the photo from MoodSnap.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSnapApi(snap.id);
            setSnaps((current) => current.filter((item) => item.id !== snap.id));
            setSelectedSnap(null);
            refreshFeed?.();
          } catch (deleteError) {
            Alert.alert(
              "Delete failed",
              deleteError.message || "Could not delete this snap."
            );
          }
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }) => (
      <FeedCard
        item={item}
        onOpen={setSelectedSnap}
        currentUser={user}
        onDelete={handleDeleteSnap}
      />
    ),
    [user]
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed, feedRefreshKey]);

  if (loading && snaps.length === 0) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={snaps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.logo}>MoodSnap</Text>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {!!loadMoreError && (
              <TouchableOpacity onPress={loadMore}>
                <Text style={styles.loadMoreError}>{loadMoreError}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <FeedEmptyState
            friendCount={friendCount}
            onRetry={() => loadFeed({ reset: true })}
            showRetry={Boolean(error)}
          />
        }
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.primary}
            onRefresh={() => loadFeed({ reset: true })}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={COLORS.primary} style={styles.footerLoader} />
          ) : null
        }
      />

      <Modal
        visible={Boolean(selectedSnap)}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedSnap(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.closeArea}
            activeOpacity={1}
            onPress={() => setSelectedSnap(null)}
          />
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedSnap(null)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>

            {selectedSnap && (
              <>
                <ZoomableImage
                  sourceUri={selectedSnap.imageUrl}
                  softFilterEnabled={selectedSnap.softFilterEnabled}
                />
                <View style={styles.modalInfoOverlay}>
                  <Text style={styles.modalTitle}>
                    {selectedSnap.user?.displayLabel ||
                      (selectedSnap.userId === user?.id && user?.displayLabel) ||
                      selectedSnap.user?.username ||
                      (selectedSnap.userId === user?.id && user?.username) ||
                      "MoodSnap user"}
                  </Text>
                  <Text
                    style={[
                      styles.modalUsername,
                      {
                        color:
                          selectedSnap.user?.profileColor ||
                          (selectedSnap.userId === user?.id &&
                            user?.profileColor) ||
                          COLORS.primary,
                      },
                    ]}
                  >
                    @
                    {selectedSnap.user?.username ||
                      (selectedSnap.userId === user?.id && user?.username) ||
                      "unknown"}
                  </Text>
                  <Text style={styles.modalMeta}>
                    {formatUploadTime(selectedSnap.createdAt)} ·{" "}
                    {getMoodMeta(selectedSnap.mood).emoji} {selectedSnap.mood}
                  </Text>
                  {!!selectedSnap.caption && (
                    <Text style={styles.modalCaption}>{selectedSnap.caption}</Text>
                  )}
                  {selectedSnap.userId === user?.id ? (
                    <TouchableOpacity
                      style={styles.modalDeleteButton}
                      onPress={() => handleDeleteSnap(selectedSnap)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalDeleteText}>Delete snap</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 18,
    paddingTop: 64,
    paddingBottom: 120,
  },
  centerState: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 22,
  },
  logo: {
    color: COLORS.primary,
    fontSize: 40,
    fontWeight: "900",
  },
  errorText: {
    color: COLORS.danger,
    marginTop: 12,
    fontWeight: "800",
  },
  loadMoreError: {
    color: COLORS.secondary,
    marginTop: 10,
    fontWeight: "800",
    fontSize: 13,
  },
  card: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#161616",
    marginBottom: 20,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  cardTopText: {
    position: "absolute",
    top: 18,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 2,
  },
  cardCaption: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    maxWidth: "88%",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  softFilterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,205,221,0.13)",
  },
  deletePill: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deletePillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  cardTime: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  cardFooter: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#333",
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  name: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
  },
  username: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 1,
  },
  moodText: {
    color: "#f4f4f4",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  moodPill: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  moodPillText: {
    fontSize: 20,
  },
  emptyCard: {
    minHeight: 280,
    borderRadius: 28,
    backgroundColor: "#151515",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 8,
  },
  emptyActions: {
    width: "100%",
    marginTop: 20,
    gap: 10,
  },
  retryLink: {
    marginTop: 16,
  },
  retryText: {
    color: COLORS.secondary,
    fontWeight: "800",
  },
  footerLoader: {
    marginVertical: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    justifyContent: "center",
    padding: 0,
  },
  closeArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalCloseButton: {
    position: "absolute",
    top: 22,
    right: 22,
    zIndex: 10,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  zoomViewport: {
    width: "100%",
    flex: 1,
    backgroundColor: "#050505",
    overflow: "hidden",
  },
  zoomImageWrap: {
    flex: 1,
  },
  zoomImage: {
    width: "100%",
    height: "100%",
  },
  modalSoftFilterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,205,221,0.13)",
    zIndex: 1,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  modalUsername: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  modalCaption: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 10,
  },
  modalInfoOverlay: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 28,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.58)",
    padding: 16,
  },
  modalDeleteButton: {
    borderRadius: 16,
    backgroundColor: "#2a1118",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  modalDeleteText: {
    color: COLORS.danger,
    fontWeight: "900",
  },
  modalMeta: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
});
