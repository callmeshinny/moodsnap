import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { getMoodCalendarApi } from "../../api/moodApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { getMoodMeta } from "../../utils/moods";
import { formatUploadTime } from "../../utils/time";
import { toLocalDateKey } from "../../utils/date";

const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date, amount) => {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
};

const getMondayFirstOffset = (date) => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const buildMonthDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const start = addDays(firstOfMonth, -getMondayFirstOffset(firstOfMonth));
  const end = addDays(lastOfMonth, 6 - getMondayFirstOffset(lastOfMonth));
  const days = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push({
      date: new Date(cursor),
      key: toLocalDateKey(cursor),
      isCurrentMonth: cursor.getMonth() === month,
      isToday: toLocalDateKey(cursor) === toLocalDateKey(new Date()),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const getEntryDateLabel = (entry) => {
  const date = entry?.createdAt ? new Date(entry.createdAt) : new Date(entry?.date);

  if (Number.isNaN(date.getTime())) {
    return entry?.date || "Mood entry";
  }

  return `${monthLabels[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const getRecentMoodSummary = (entry) => {
  const snaps = entry?.snaps?.length ? entry.snaps : [entry].filter(Boolean);

  if (!snaps.length) {
    return { ...getMoodMeta(entry?.mood), mood: entry?.mood || "Mood", snapCount: 0 };
  }

  const sortedSnaps = [...snaps].sort((first, second) => {
    const firstDate = new Date(first.createdAt || entry?.createdAt || entry?.date).getTime();
    const secondDate = new Date(second.createdAt || entry?.createdAt || entry?.date).getTime();
    return secondDate - firstDate;
  });

  const moodCounts = new Map();

  for (const snap of sortedSnaps) {
    const mood = snap?.mood;
    if (!mood) {
      continue;
    }

    moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
  }

  let dominantMood = sortedSnaps[0]?.mood || entry?.mood;
  let dominantCount = 0;

  for (const [mood, count] of moodCounts.entries()) {
    if (count > dominantCount) {
      dominantMood = mood;
      dominantCount = count;
    }
  }

  return {
    ...getMoodMeta(dominantMood),
    mood: dominantMood || "Mood",
    snapCount: sortedSnaps.length,
  };
};

function MonthGrid({ currentMonth, entriesByDate, onOpenEntry }) {
  const days = buildMonthDays(currentMonth);
  const weeks = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return (
    <View style={styles.monthCard}>
      <View style={styles.weekRow}>
        {weekLabels.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.dayRow}>
            {week.map((day) => {
              const entry = entriesByDate.get(day.key);
              const mood = entry ? getMoodMeta(entry.mood) : null;
              const isFuture = day.key > toLocalDateKey(new Date());
              const pressable = Boolean(entry?.imageUrl || entry?.snaps?.length);
              const CellComponent = pressable ? TouchableOpacity : View;

              return (
                <CellComponent
                  key={day.key}
                  style={[
                    styles.dayCell,
                    !day.isCurrentMonth && styles.outsideDayCell,
                    day.isToday && styles.todayCell,
                    isFuture && styles.futureCell,
                    mood && { borderColor: mood.color },
                  ]}
                  activeOpacity={0.72}
                  onPress={pressable ? () => onOpenEntry(entry) : undefined}
                  accessibilityRole={pressable ? "button" : undefined}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      !day.isCurrentMonth && styles.outsideDayNumber,
                      day.isToday && styles.todayNumber,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                  {mood && (
                    <View style={[styles.moodDot, { backgroundColor: mood.color }]}>
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    </View>
                  )}
                </CellComponent>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const { streak, refreshStreak, feedRefreshKey } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  const entriesByDate = useMemo(() => {
    const map = new Map();

    for (const entry of entries) {
      const key = entry.createdAt ? toLocalDateKey(entry.createdAt) : entry.date;
      map.set(key, entry);
    }

    return map;
  }, [entries]);

  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((first, second) => {
        const firstDate = new Date(first.createdAt || first.date).getTime();
        const secondDate = new Date(second.createdAt || second.date).getTime();
        return secondDate - firstDate;
      })
      .slice(0, 6)
      .map((entry) => ({
        ...entry,
        recentMood: getRecentMoodSummary(entry),
      }));
  }, [entries]);

  const loadCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getMoodCalendarApi();
      setEntries(result.entries || []);
      await refreshStreak?.();
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load mood calendar.");
    } finally {
      setLoading(false);
    }
  }, [refreshStreak]);

  useEffect(() => {
    loadCalendar();
  }, [feedRefreshKey, loadCalendar]);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Mood calendar</Text>
            <Text style={styles.title}>Mood History</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak || 0}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setCurrentMonth((month) => addMonths(month, -1))}
            accessibilityRole="button"
          >
            <ChevronLeft size={22} color="#fff" strokeWidth={2.8} />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {monthLabels[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>

          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setCurrentMonth((month) => addMonths(month, 1))}
            accessibilityRole="button"
          >
            <ChevronRight size={22} color="#fff" strokeWidth={2.8} />
          </TouchableOpacity>
        </View>

        <MonthGrid
          currentMonth={currentMonth}
          entriesByDate={entriesByDate}
          onOpenEntry={setSelectedEntry}
        />

        <Text style={styles.recentTitle}>Recent moods</Text>

        {recentEntries.length ? (
          recentEntries.map((entry) => {
            const mood = entry.recentMood;
            const snapCount = mood.snapCount || entry.snaps?.length || 1;

            return (
              <TouchableOpacity
                key={entry.snapId || entry.id || entry.date}
                style={styles.recentCard}
                onPress={() => setSelectedEntry(entry)}
                activeOpacity={0.78}
              >
                <View style={[styles.recentEmojiBubble, { backgroundColor: mood.color }]}>
                  <Text style={styles.recentEmoji}>{mood.emoji}</Text>
                </View>
                <View style={styles.recentTextWrap}>
                  <Text style={styles.recentMood}>{mood.mood}</Text>
                  <Text style={styles.recentMeta}>
                    {getEntryDateLabel(entry)} · {snapCount} snap
                    {snapCount > 1 ? "s" : ""}
                  </Text>
                </View>
                {entry.imageUrl && (
                  <Image source={{ uri: entry.imageUrl }} style={styles.recentImage} />
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No moods yet</Text>
            <Text style={styles.emptyBody}>
              Take a snap and it will appear here by local date.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(selectedEntry)}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedEntry(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.closeArea}
            activeOpacity={1}
            onPress={() => setSelectedEntry(null)}
          />
          <View style={styles.modalCard}>
            {selectedEntry && (
              <>
                <Text style={styles.modalTitle}>{getEntryDateLabel(selectedEntry)}</Text>
                <Text style={styles.modalMeta}>
                  Swipe through every snap from this day.
                </Text>

                <FlatList
                  data={
                    selectedEntry.snaps?.length
                      ? selectedEntry.snaps
                      : [selectedEntry]
                  }
                  keyExtractor={(item) => item.id || item.snapId}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => {
                    const mood = getMoodMeta(item.mood);

                    return (
                      <View style={styles.snapSlide}>
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.modalImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={[styles.modalImage, { backgroundColor: "#ddd" }]} />
                        )}
                        <Text style={styles.modalSnapTitle}>
                          {mood.emoji} {item.mood}
                        </Text>
                        <Text style={styles.modalMeta}>
                          {index + 1}/{selectedEntry.snaps?.length || 1} ·{" "}
                          {formatUploadTime(item.createdAt)}
                        </Text>
                      </View>
                    );
                  }}
                />
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
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 120,
  },
  centerState: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  eyebrow: {
    color: "#6F6F78",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
  },
  streakBadge: {
    minWidth: 92,
    borderRadius: 22,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignItems: "center",
  },
  streakText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  streakLabel: {
    color: "#aaa",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
    textTransform: "uppercase",
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: "900",
    marginBottom: 14,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#191919",
    borderWidth: 1,
    borderColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  monthCard: {
    backgroundColor: "#101010",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#242424",
    padding: 14,
    marginBottom: 26,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekText: {
    flex: 1,
    color: "#777",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
  },
  grid: {
    gap: 6,
  },
  dayRow: {
    flexDirection: "row",
    gap: 6,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: "#1B1B1B",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  outsideDayCell: {
    opacity: 0.38,
  },
  todayCell: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  futureCell: {
    opacity: 0.46,
  },
  dayNumber: {
    color: "#dedede",
    fontSize: 11,
    fontWeight: "900",
  },
  outsideDayNumber: {
    color: "#777",
  },
  todayNumber: {
    color: "#fff",
  },
  moodDot: {
    position: "absolute",
    left: 5,
    right: 5,
    bottom: 5,
    top: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moodEmoji: {
    fontSize: 17,
  },
  recentTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  recentCard: {
    minHeight: 82,
    borderRadius: 22,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#242424",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  recentEmojiBubble: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  recentEmoji: {
    fontSize: 28,
  },
  recentTextWrap: {
    flex: 1,
  },
  recentMood: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  recentMeta: {
    color: "#999",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  recentImage: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#222",
  },
  emptyCard: {
    borderRadius: 24,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#242424",
    padding: 18,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  emptyBody: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 18,
  },
  closeArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: "#151515",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#292929",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  modalMeta: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 14,
  },
  snapSlide: {
    width: 320,
    alignItems: "center",
    marginRight: 14,
  },
  modalImage: {
    width: 320,
    height: 320,
    borderRadius: 22,
    backgroundColor: "#222",
  },
  modalSnapTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
  },
});
