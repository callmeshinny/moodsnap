import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS } from "../../constants/colors";

const posts = [
  {
    id: 1,
    name: "Mia",
    mood: "Happy",
    emoji: "😊",
    color: "#FFD166",
    time: "2 min ago",
  },
  {
    id: 2,
    name: "Leo",
    mood: "Calm",
    emoji: "😌",
    color: "#80ED99",
    time: "12 min ago",
  },
  {
    id: 3,
    name: "Ngoc",
    mood: "Tired",
    emoji: "😴",
    color: "#B197FC",
    time: "Today",
  },
];

export default function FeedScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>MoodSnap</Text>
      <Text style={styles.title}>Friends' moments</Text>
      <Text style={styles.subtitle}>See what your close friends are feeling.</Text>

      {posts.map((post) => (
        <View key={post.id} style={[styles.card, { borderColor: post.color }]}>
          <View style={styles.photoMock}>
            <Text style={styles.photoEmoji}>📸</Text>
            <Text style={styles.photoText}>{post.name}'s snap</Text>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.name}>{post.name}</Text>
              <Text style={styles.time}>{post.time}</Text>
            </View>

            <View style={[styles.moodBadge, { backgroundColor: post.color }]}>
              <Text style={styles.moodText}>
                {post.emoji} {post.mood}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 120,
  },
  logo: {
    color: COLORS?.primary || "#D6509A",
    fontSize: 42,
    fontWeight: "900",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 18,
  },
  subtitle: {
    color: "#888",
    fontSize: 16,
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 28,
    borderWidth: 3,
    padding: 14,
    marginBottom: 22,
  },
  photoMock: {
    height: 310,
    borderRadius: 22,
    backgroundColor: "#202020",
    justifyContent: "center",
    alignItems: "center",
  },
  photoEmoji: {
    fontSize: 52,
    marginBottom: 10,
  },
  photoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  cardFooter: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  time: {
    color: "#777",
    marginTop: 3,
  },
  moodBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  moodText: {
    color: "#111",
    fontWeight: "900",
  },
});
