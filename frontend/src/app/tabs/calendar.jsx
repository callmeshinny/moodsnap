import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { getMoodCalendarApi } from "../../api/moodApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { getMoodMeta } from "../../utils/moods";
import { formatUploadTime } from "../../utils/time";

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

const MODAL_IMAGE_WIDTH = 320;

const dateKey = (date) => date.toISOString().slice(0, 10);

const buildMonths = (startedAt) => {
  const now = new Date();
  const start = startedAt ? new Date(startedAt) : now;
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const months = [];

  while (cursor <= end) {
    months.push({
      month: cursor.getMonth(),
      year: cursor.getFullYear(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
};

function MonthGrid({ month, year, entriesByDate, onOpenEntry }) {
  const todayKey = dateKey(new Date());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayFirstOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = [
    ...Array.from({ length: mondayFirstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.monthCard}>
      <Text style={styles.monthTitle}>
        {monthLabels[month]} {year}
      </Text>

      <View style={styles.weekRow}>
        {weekLabels.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;
          const entry = entriesByDate.get(key);
          const mood = entry ? getMoodMeta(entry.mood) : null;
          const isFuture = key > todayKey;

          const CellComponent = entry?.imageUrl ? TouchableOpacity : View;
          const cellPressProps = entry?.imageUrl
            ? { activeOpacity: 0.72, onPress: () => onOpenEntry(entry) }
            : {};

          return (
            <CellComponent
              key={key}
              style={[styles.dayCell, isFuture && styles.futureCell]}
              {...cellPressProps}
            >
              {mood ? (
                <View style={[styles.moodDot, { backgroundColor: mood.color }]}>
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </View>
              ) : (
                <Text style={styles.dayNumber}>{day}</Text>
              )}
            </CellComponent>
          );
        })}
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const { streak, refreshStreak, feedRefreshKey } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  const entriesByDate = useMemo(() => {
    const map = new Map();

    for (const entry of entries) {
      map.set(entry.date, entry);
    }

    return map;
  }, [entries]);

  const months = useMemo(() => buildMonths(startedAt), [startedAt]);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const result = await getMoodCalendarApi();
      setEntries(result.entries || []);
      setStartedAt(result.startedAt);
      await refreshStreak?.();
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [feedRefreshKey]);

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
          <Text style={styles.title}>Mood calendar</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak || 0} day streak</Text>
          </View>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {months.map(({ month, year }) => (
          <MonthGrid
            key={`${year}-${month}`}
            month={month}
            year={year}
            entriesByDate={entriesByDate}
            onOpenEntry={setSelectedEntry}
          />
        ))}
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
                <Text style={styles.modalTitle}>
                  {selectedEntry.date}
                </Text>
                <Text style={styles.modalMeta}>
                  Swipe to view all snaps from this day
                </Text>

                <FlatList
                  data={selectedEntry.snaps?.length ? selectedEntry.snaps : [selectedEntry]}
                  keyExtractor={(item) => item.id || item.snapId}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <View style={styles.snapSlide}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.modalSnapTitle}>
                        {getMoodMeta(item.mood).emoji} {item.mood}
                      </Text>
                      <Text style={styles.modalMeta}>
                        {index + 1}/{selectedEntry.snaps?.length || 1} · {formatUploadTime(item.createdAt)}
                      </Text>
                    </View>
                  )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },
  streakBadge: {
    backgroundColor: "#202020",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  streakText: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: "800",
    marginBottom: 14,
  },
  monthCard: {
    backgroundColor: "#111",
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#1d1d1d",
  },
  monthTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 18,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekText: {
    width: "14.28%",
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  dayCell: {
    width: "14.28%",
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  futureCell: {
    opacity: 0.26,
  },
  dayNumber: {
    color: "#555",
    fontSize: 13,
    fontWeight: "800",
  },
  moodDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 16,
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
    backgroundColor: "#111",
    borderRadius: 30,
    padding: 14,
    alignSelf: "center",
    width: MODAL_IMAGE_WIDTH + 28,
  },
  snapSlide: {
    width: MODAL_IMAGE_WIDTH,
  },
  modalImage: {
    width: MODAL_IMAGE_WIDTH,
    height: 440,
    borderRadius: 24,
    backgroundColor: "#050505",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 16,
  },
  modalSnapTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 14,
  },
  modalMeta: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
});
