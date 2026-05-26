import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { getDiaryFeedApi } from "../../api/diaryApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { getMoodMeta } from "../../utils/moods";

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDateStrip = (count = 6) => {
  const dates = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    dates.push({
      id: toDateKey(date),
      dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayOfMonth: String(date.getDate()),
      isToday: index === 0,
    });
  }

  return dates;
};

const isHexColor = (value) => /^#[0-9a-fA-F]{6}$/.test(String(value || ""));

const getReadableTextColor = (hex) => {
  if (!isHexColor(hex)) {
    return "#000";
  }

  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.58 ? "#000" : "#fff";
};

const formatFeedCardTime = (createdAt) => {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeDiaryFeedItems = (diaries, currentUser) => {
  return (diaries || [])
    .flatMap((diary) => {
      const owner =
        diary.user || (diary.userId === currentUser?.id ? currentUser : null);
      const snaps = diary.snaps || [];

      if (snaps.length > 0) {
        return snaps
          .filter((snap) => snap.imageUrl || snap.thumbnailUrl || snap.previewUrl)
          .map((snap) => ({
            ...snap,
            diaryId: diary.isSnapFallback ? null : diary.id,
            entryDate: diary.entryDate,
            user: snap.user || owner,
            userId: snap.userId || diary.userId,
          }));
      }

      if (!diary.coverImageUrl) {
        return [];
      }

      return [
        {
          id: `diary-cover-${diary.id}`,
          diaryId: diary.isSnapFallback ? null : diary.id,
          userId: diary.userId,
          user: owner,
          mood: diary.mood || "Happy",
          caption: diary.title || diary.content || "Daily moments",
          imageUrl: diary.coverImageUrl,
          createdAt: diary.createdAt || `${diary.entryDate}T12:00:00`,
          softFilterEnabled: false,
          entryDate: diary.entryDate,
        },
      ];
    })
    .sort(
      (first, second) =>
        new Date(second.createdAt || 0).getTime() -
        new Date(first.createdAt || 0).getTime()
    );
};

const Avatar = React.memo(function Avatar({ user }) {
  const ringColor = user?.profileColor || COLORS.primary;
  const displayName = user?.displayLabel || user?.displayName || user?.username || "M";
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

function MomentFeedCard({ item, currentUser }) {
  const snapUser =
    item.user || (item.userId === currentUser?.id ? currentUser : null);
  const mood = getMoodMeta(item.mood);
  const name =
    snapUser?.displayLabel ||
    snapUser?.displayName ||
    snapUser?.username ||
    "MoodSnap user";
  const imageUri = item.thumbnailUrl || item.previewUrl || item.imageUrl;

  const openItem = () => {
    if (item.diaryId) {
      router.push({ pathname: "/diary/[id]", params: { id: item.diaryId } });
    }
  };

  return (
    <TouchableOpacity
      style={styles.momentCard}
      onPress={openItem}
      activeOpacity={0.9}
      disabled={!item.diaryId}
      accessibilityRole="button"
      accessibilityLabel={`Open moment from ${name}`}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: "#ddd" }]} />
      )}
      {item.softFilterEnabled ? (
        <View pointerEvents="none" style={styles.softFilterOverlay} />
      ) : null}
      <View style={styles.cardScrim} />

      <View style={styles.cardTopText}>
        <Text style={styles.cardTime}>{formatFeedCardTime(item.createdAt)}</Text>
        {!!item.caption && (
          <Text style={styles.cardCaption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.userRow}>
          <Avatar user={snapUser} />
          <View style={styles.userCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.moodText} numberOfLines={1}>
              {mood.emoji} {item.mood || "Mood"}
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
  const { feedRefreshKey, user } = useContext(AuthContext);
  const dateStrip = useMemo(() => buildDateStrip(6), []);
  const todayId = dateStrip[dateStrip.length - 1]?.id || toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayId);
  const selectedDateRef = useRef(todayId);
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const calendarListRef = useRef(null);
  const accentColor = isHexColor(user?.profileColor) ? user.profileColor : COLORS.primary;
  const accentTextColor = getReadableTextColor(accentColor);
  const feedItems = useMemo(
    () => normalizeDiaryFeedItems(diaries, user),
    [diaries, user]
  );

  const loadFeed = useCallback(
    async (dateToQuery = selectedDateRef.current, options = {}) => {
      try {
        if (options.refreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const result = await getDiaryFeedApi({ date: dateToQuery, limit: 30 });
        setDiaries(result.diaries || []);
        setError("");
      } catch (loadError) {
        setDiaries([]);
        setError(loadError.message || "Failed to load feed.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadFeed(selectedDateRef.current);

      setTimeout(() => {
        calendarListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }, [loadFeed])
  );

  useEffect(() => {
    loadFeed(selectedDateRef.current);
  }, [feedRefreshKey, loadFeed]);

  const handleSelectDate = (date) => {
    selectedDateRef.current = date;
    setSelectedDate(date);
    loadFeed(date);
  };

  const renderDate = ({ item }) => {
    const selected = item.id === selectedDate;

    return (
      <TouchableOpacity
        onPress={() => handleSelectDate(item.id)}
        style={[
          styles.dateChip,
          selected && { backgroundColor: accentColor },
        ]}
        activeOpacity={0.82}
      >
        <Text
          style={[
            styles.dateWeekday,
            selected && { color: accentTextColor },
          ]}
        >
          {item.dayOfWeek}
        </Text>
        <Text
          style={[
            styles.dateDay,
            selected && { color: accentTextColor },
          ]}
        >
          {item.dayOfMonth}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: accentColor }]}>MoodSnap</Text>
        <Text style={styles.title}>{"Friends' moments"}</Text>
        <Text style={styles.subtitle}>See what your close friends are feeling.</Text>
      </View>

      <View style={styles.dateStripWrap}>
        <FlatList
          ref={calendarListRef}
          horizontal
          data={dateStrip}
          keyExtractor={(item) => item.id}
          renderItem={renderDate}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={accentColor}
              onRefresh={() => loadFeed(selectedDate, { refreshing: true })}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No snapshots on this day</Text>
              <Text style={styles.emptyBody}>
                Neither you nor your friends posted any diary moments on this date.
              </Text>
              {!!error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          }
          renderItem={({ item }) => <MomentFeedCard item={item} currentUser={user} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 40,
    fontWeight: "900",
  },
  title: {
    color: "#fff",
    fontSize: 31,
    fontWeight: "900",
    marginTop: 8,
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
  },
  dateStripWrap: {
    height: 86,
  },
  dateStrip: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dateChip: {
    width: 60,
    height: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateWeekday: {
    color: "#6F6F78",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dateDay: {
    color: "#A1A1AA",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  emptyCard: {
    minHeight: 344,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#262626",
    backgroundColor: "#080808",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    marginTop: 18,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyBody: {
    color: "#A1A1AA",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 25,
    textAlign: "center",
    marginTop: 18,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 18,
  },
  momentCard: {
    width: "100%",
    aspectRatio: 5 / 3,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#161616",
    marginBottom: 18,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  softFilterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,205,221,0.13)",
  },
  cardTopText: {
    position: "absolute",
    top: 18,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 2,
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 12,
  },
  userCopy: {
    flex: 1,
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
});
