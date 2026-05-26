import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Check, ChevronLeft, Edit3, X, Trash2 } from "lucide-react-native";
import { getDiaryApi, updateDiaryApi } from "../../api/diaryApi";
import { deleteSnapApi } from "../../api/snapApi";

const MOOD_OPTIONS = [
  { key: "depressed", color: "#9333EA", label: "Depressed", emoji: "😞" },
  { key: "sad", color: "#3B82F6", label: "Sad", emoji: "😢" },
  { key: "normal", color: "#4B5563", label: "Normal", emoji: "😐" },
  { key: "happy", color: "#FB923C", label: "Happy", emoji: "😊" },
  { key: "cheerful", color: "#FBBF24", label: "Cheerful", emoji: "😄" },
];

const getMoodMeta = (key) => {
  return MOOD_OPTIONS.find((mood) => mood.key === key) || MOOD_OPTIONS[2];
};

const formatDisplayDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function DiaryDetailsScreen() {
  const { id } = useLocalSearchParams();
  const diaryId = typeof id === "string" ? id : "";
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftMood, setDraftMood] = useState("normal");
  const [draftCoverImage, setDraftCoverImage] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  const loadDiary = useCallback(async () => {
    if (!diaryId) {
      return;
    }

    try {
      setLoading(true);
      const result = await getDiaryApi(diaryId);
      const nextDiary = result.diary;
      setDiary(nextDiary);
      setDraftTitle(nextDiary?.title || "");
      setDraftContent(nextDiary?.content || "");
      setDraftMood(nextDiary?.mood || "normal");
      setDraftCoverImage(nextDiary?.coverImageUrl || null);
    } catch (error) {
      Alert.alert(
        "Could not load diary",
        error.response?.data?.message || error.message || "Please try again.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  }, [diaryId]);

  useEffect(() => {
    loadDiary();
  }, [loadDiary]);

  const saveDiary = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) {
      Alert.alert("Incomplete diary", "Title and content cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      const result = await updateDiaryApi(diaryId, {
        title: draftTitle,
        content: draftContent,
        mood: draftMood,
        coverImageUrl: draftCoverImage || null,
      });
      const nextDiary = result.diary || result.data?.diary;
      setDiary(nextDiary);
      setEditing(false);
    } catch (error) {
      Alert.alert(
        "Save failed",
        error.response?.data?.message || error.message || "Could not update diary."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#FFB800" />
      </View>
    );
  }

  const mood = getMoodMeta(editing ? draftMood : diary?.mood);
  const snaps = diary?.snaps || [];
  // viewer state already declared above; don't redeclare here

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (editing ? setEditing(false) : router.back())}
          style={styles.headerButton}
          accessibilityRole="button"
        >
          {editing ? (
            <X size={21} color="#fff" strokeWidth={3} />
          ) : (
            <ChevronLeft size={25} color="#fff" strokeWidth={3} />
          )}
        </TouchableOpacity>
        <Text style={styles.headerDate} numberOfLines={1}>
          {formatDisplayDate(diary?.entryDate)}
        </Text>
        <TouchableOpacity
          onPress={editing ? saveDiary : () => setEditing(true)}
          style={[styles.headerAction, editing && styles.headerSaveAction]}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color="#000" size="small" />
          ) : editing ? (
            <>
              <Check size={16} color="#000" strokeWidth={3} />
              <Text style={styles.saveText}>Save</Text>
            </>
          ) : (
            <Edit3 size={17} color="#fff" strokeWidth={2.7} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {snaps.length ? (
            <FlatList
              horizontal
              data={snaps}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.snapList}
              renderItem={({ item }) => {
                const selected = draftCoverImage === item.imageUrl;

                return (
                  <TouchableOpacity
                    onPress={() => setDraftCoverImage(item.imageUrl)}
                    activeOpacity={0.8}
                    style={[styles.snapCard, selected && styles.snapCardSelected]}
                  >
                    {item.imageUrl ? (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => {
                            setViewerUri(item.imageUrl);
                            setViewerVisible(true);
                          }}
                          style={{ flex: 1 }}
                        >
                          <Image source={{ uri: item.imageUrl }} style={styles.snapImage} />
                        </TouchableOpacity>
                    ) : (
                      <View style={[styles.snapImage, { backgroundColor: "#ddd" }]} />
                    )}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            "Delete snap",
                            "Are you sure you want to delete this snap? This cannot be undone.",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    setLoading(true);
                                    await deleteSnapApi(item.id);
                                    await loadDiary();
                                  } catch (err) {
                                    Alert.alert(
                                      "Delete failed",
                                      err.response?.data?.message || err.message || "Could not delete snap"
                                    );
                                  } finally {
                                    setLoading(false);
                                  }
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <Trash2 size={16} color="#fff" strokeWidth={3} />
                      </TouchableOpacity>

                      <View style={styles.snapCaptionPill}>
                        <Text style={styles.snapCaptionText} numberOfLines={1}>
                          {item.caption || item.mood}
                        </Text>
                      </View>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <View style={styles.noSnapsCard}>
              <Text style={styles.noSnapsText}>No snapped moments for this day.</Text>
            </View>
          )}

          <View style={styles.body}>
            <View style={[styles.moodPill, { borderColor: mood.color }]}>
              <View style={[styles.moodDot, { backgroundColor: mood.color }]} />
              <Text style={[styles.moodText, { color: mood.color }]}>
                {mood.label}
              </Text>
            </View>

            {editing ? (
              <View>
                <View style={styles.moodPickerRow}>
                  {MOOD_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setDraftMood(option.key)}
                      style={[
                        styles.editMoodButton,
                        draftMood === option.key && styles.editMoodButtonActive,
                      ]}
                    >
                      <Text style={styles.editMoodEmoji}>{option.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={draftTitle}
                  onChangeText={setDraftTitle}
                  style={styles.titleInput}
                  placeholder="Title..."
                  placeholderTextColor="#52525B"
                  multiline
                />
                <TextInput
                  value={draftContent}
                  onChangeText={setDraftContent}
                  style={styles.contentInput}
                  placeholder="Write your reflection..."
                  placeholderTextColor="#52525B"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <View>
                <Text style={styles.diaryTitle}>{diary?.title}</Text>
                <Text style={styles.diaryContent}>{diary?.content}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={viewerVisible} animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerScreen}>
          <TouchableOpacity
            onPress={() => setViewerVisible(false)}
            style={styles.viewerClose}
            accessibilityRole="button"
          >
            <X size={22} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
          <ScrollView
            maximumZoomScale={4}
            minimumZoomScale={1}
            contentContainerStyle={styles.viewerScroll}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {viewerUri ? (
              <Image source={{ uri: viewerUri }} style={styles.viewerImage} resizeMode="contain" />
            ) : null}
          </ScrollView>
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
  centerState: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingTop: 62,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },
  headerDate: {
    flex: 1,
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerAction: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    flexDirection: "row",
    gap: 6,
  },
  headerSaveAction: {
    backgroundColor: "#FFB800",
  },
  saveText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "900",
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    paddingBottom: 140,
  },
  snapList: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  snapCard: {
    width: 320,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#18181B",
    marginRight: 16,
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  snapCardSelected: {
    borderWidth: 3,
    borderColor: "#FFB800",
  },
  snapImage: {
    width: "100%",
    height: "100%",
  },
  snapCaptionPill: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  snapCaptionText: {
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
  },
  noSnapsCard: {
    margin: 20,
    minHeight: 220,
    borderRadius: 28,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },
  noSnapsText: {
    color: "#A1A1AA",
    fontWeight: "800",
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  moodPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0B0B0B",
    marginBottom: 20,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moodText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  moodPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(24,24,27,0.55)",
    borderRadius: 24,
    padding: 10,
    marginBottom: 22,
  },
  editMoodButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "transparent",
  },
  editMoodButtonActive: {
    borderColor: "#fff",
  },
  editMoodEmoji: {
    fontSize: 20,
  },
  diaryTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
  },
  diaryContent: {
    color: "#D4D4D8",
    fontSize: 18,
    lineHeight: 28,
    marginTop: 18,
    fontWeight: "500",
  },
  titleInput: {
    color: "#fff",
    fontSize: 31,
    fontWeight: "900",
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
    paddingBottom: 10,
  },
  contentInput: {
    color: "#D4D4D8",
    fontSize: 18,
    lineHeight: 27,
    minHeight: 220,
    marginTop: 18,
  },
  viewerScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  viewerClose: {
    position: "absolute",
    top: 56,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerScroll: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
});
