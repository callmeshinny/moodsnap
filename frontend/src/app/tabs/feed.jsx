import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getFeedApi } from "../../api/snapApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { getMoodMeta } from "../../utils/moods";
import { formatUploadTime } from "../../utils/time";

const { height } = Dimensions.get("window");
const CARD_HEIGHT = Math.round(height * 0.33);

function Avatar({ user }) {
  if (user?.avatarUrl) {
    return <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />;
  }

  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

function FeedCard({ item, onOpen }) {
  const mood = getMoodMeta(item.mood);
  const name = item.user?.username || "MoodSnap user";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onOpen(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardScrim} />
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
          <Avatar user={item.user} />
          <View>
            <Text style={styles.name}>{name}</Text>
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
}

export default function FeedScreen() {
  const { feedRefreshKey } = useContext(AuthContext);
  const [snaps, setSnaps] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [selectedSnap, setSelectedSnap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

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
      const result = await getFeedApi({ cursor: nextCursor, limit: 20 });
      setSnaps((current) => [...current, ...(result.snaps || [])]);
      setNextCursor(result.nextCursor || null);
    } catch (loadError) {
      setError("");
    } finally {
      setLoadingMore(false);
    }
  };

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
            <Text style={styles.title}>Friends' moments</Text>
            <Text style={styles.subtitle}>
              See what your close friends are feeling.
            </Text>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No snaps yet</Text>
            <Text style={styles.emptyText}>
              Upload your first mood snap or add friends to fill your feed.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <FeedCard item={item} onOpen={setSelectedSnap} />
        )}
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
            {selectedSnap && (
              <>
                <Image
                  source={{ uri: selectedSnap.imageUrl }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <Text style={styles.modalTitle}>
                  {selectedSnap.user?.username || "MoodSnap user"}
                </Text>
                <Text style={styles.modalMeta}>
                  {formatUploadTime(selectedSnap.createdAt)} ·{" "}
                  {getMoodMeta(selectedSnap.mood).emoji} {selectedSnap.mood}
                </Text>
                {!!selectedSnap.caption && (
                  <Text style={styles.modalCaption}>{selectedSnap.caption}</Text>
                )}
                {!!selectedSnap.caption && (
                  <Text style={styles.modalCaption}>{selectedSnap.caption}</Text>
                )}
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
  title: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 16,
  },
  subtitle: {
    color: "#888",
    fontSize: 15,
    marginTop: 6,
  },
  errorText: {
    color: COLORS.danger,
    marginTop: 12,
    fontWeight: "800",
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#161616",
    marginBottom: 20,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardTopText: {
    position: "absolute",
    top: 28,
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
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  cardTime: {
    position: "absolute",
    alignSelf: "center",
    top: "39%",
    color: "#fff",
    fontSize: 42,
    fontWeight: "900",
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#333",
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    minHeight: 220,
    borderRadius: 28,
    backgroundColor: "#151515",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  footerLoader: {
    marginVertical: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    padding: 18,
  },
  closeArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderRadius: 30,
    backgroundColor: "#111",
    padding: 14,
  },
  modalImage: {
    width: "100%",
    height: height * 0.62,
    borderRadius: 24,
    backgroundColor: "#050505",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 16,
  },
  modalCaption: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 10,
  },
  modalMeta: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
});
