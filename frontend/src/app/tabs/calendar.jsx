import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../../constants/colors";

const monthLabels = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const moodByDate = {
  2: { emoji: "😊", color: "#FFD166" },
  5: { emoji: "😌", color: "#80ED99" },
  8: { emoji: "😢", color: "#74C0FC" },
  12: { emoji: "😊", color: "#FFD166" },
  16: { emoji: "😡", color: "#FF6B6B" },
  21: { emoji: "📅", color: "#FFD60A", selected: true },
  25: { emoji: "😴", color: "#B197FC" },
  29: { emoji: "😊", color: "#FFD166" },
};

export default function CalendarScreen() {
  const [month, setMonth] = useState(4);
  const [year, setYear] = useState(2026);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayFirstOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells = [
    ...Array.from({ length: mondayFirstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goPrevious = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const streakCount = Object.keys(moodByDate).length;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>
              {monthLabels[month]} {year}
            </Text>
            <Text style={styles.subtitle}>Mood check-in calendar</Text>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navButton} onPress={goPrevious}>
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={goNext}>
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekRow}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
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

            const mood = moodByDate[day];

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  mood?.selected && styles.selectedCell,
                ]}
              >
                {mood ? (
                  <View
                    style={[
                      styles.moodDot,
                      { backgroundColor: mood.color },
                      mood.selected && styles.selectedMoodDot,
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  </View>
                ) : (
                  <View style={styles.emptyDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{streakCount}</Text>
          <View>
            <Text style={styles.summaryTitle}>mood check-ins</Text>
            <Text style={styles.summarySubtitle}>
              Keep snapping to protect your streak.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>😊 Happy</Text>
        <Text style={styles.legendText}>😌 Calm</Text>
        <Text style={styles.legendText}>😢 Sad</Text>
        <Text style={styles.legendText}>😡 Angry</Text>
        <Text style={styles.legendText}>😴 Tired</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 18,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 34,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1d1d1d",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 31,
    fontWeight: "900",
  },
  subtitle: {
    color: "#555",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 8,
  },
  navRow: {
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    width: 54,
    height: 54,
    borderRadius: 22,
    backgroundColor: "#181818",
    justifyContent: "center",
    alignItems: "center",
  },
  navText: {
    color: "#fff",
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "500",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  weekText: {
    width: 38,
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
    justifyContent: "space-between",
  },
  dayCell: {
    width: "14.28%",
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4a4d55",
  },
  moodDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCell: {
    borderWidth: 3,
    borderColor: "#FFD60A",
    borderRadius: 18,
  },
  selectedMoodDot: {
    backgroundColor: "transparent",
  },
  moodEmoji: {
    fontSize: 15,
  },
  summaryCard: {
    marginTop: 30,
    borderRadius: 24,
    backgroundColor: "#181818",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  summaryNumber: {
    color: COLORS?.primary || "#D6509A",
    fontSize: 38,
    fontWeight: "900",
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  summarySubtitle: {
    color: "#777",
    marginTop: 3,
    fontSize: 13,
  },
  legend: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  legendText: {
    color: "#aaa",
    backgroundColor: "#151515",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "700",
  },
});
