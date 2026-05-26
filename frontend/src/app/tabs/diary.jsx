import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { ArrowRight, Check, Plus, X } from "lucide-react-native";
import {
  createDiaryApi,
  getDiariesApi,
  getTodayDiaryApi,
} from "../../api/diaryApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

const MOOD_OPTIONS = [
  { key: "depressed", color: "#9333EA", label: "Depressed" },
  { key: "sad", color: "#3B82F6", label: "Sad" },
  { key: "normal", color: "#4B5563", label: "Normal" },
  { key: "happy", color: "#FB923C", label: "Happy" },
  { key: "cheerful", color: "#FBBF24", label: "Cheerful" },
];

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

const formatDisplayDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
};

export default function CalendarScreen() {
  const { feedRefreshKey, refreshFeed, user } = useContext(AuthContext);
  const [todayState, setTodayState] = useState(null);
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState("normal");
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const todaySnaps = useMemo(() => todayState?.snaps || [], [todayState]);
  const hasDiaryToday = Boolean(todayState?.hasDiaryToday);
  const unsnappedCount = todayState?.unsnappedCount ?? todaySnaps.length;
  const accentColor = isHexColor(user?.profileColor)
    ? user.profileColor
    : COLORS.primary;
  const accentTextColor = getReadableTextColor(accentColor);

  const loadDiary = useCallback(async () => {
    try {
      setLoading(true);
      const [todayResult, diariesResult] = await Promise.all([
        getTodayDiaryApi(),
        getDiariesApi({ limit: 20 }),
      ]);
      setTodayState(todayResult.data || todayResult);
      setDiaries(diariesResult.diaries || []);
    } catch (error) {
      Alert.alert(
        "Diary unavailable",
        error.response?.data?.message || error.message || "Could not load diary."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiary();
  }, [feedRefreshKey, loadDiary]);

  useFocusEffect(
    useCallback(() => {
      loadDiary();
    }, [loadDiary])
  );

  useEffect(() => {
    if (modalVisible) {
      setSelectedCoverImage(todaySnaps[0]?.imageUrl || null);
      setSelectedMood("normal");
      setTitle("");
      setContent("");
    }
  }, [modalVisible, todaySnaps]);

  const createDiary = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Incomplete diary", "Please add both a title and content.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await createDiaryApi({
        entryDate: todayState?.todayKey,
        title,
        content,
        mood: selectedMood,
        coverImageUrl: selectedCoverImage,
      });
      const diary = result.diary || result.data?.diary;

      setModalVisible(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => null
      );
      await loadDiary();
      refreshFeed?.();

      if (diary?.id) {
        router.push({ pathname: "/diary/[id]", params: { id: diary.id } });
      }
    } catch (error) {
      Alert.alert(
        "Could not create diary",
        error.response?.data?.message || error.message || "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const previousEntries = useMemo(() => diaries || [], [diaries]);

  if (loading && !todayState) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Your Diary</Text>
        <Text style={styles.title}>Daily Reflections</Text>

        {hasDiaryToday ? (
          <TouchableOpacity
            style={[styles.completedCard, { borderColor: accentColor }]}
            onPress={() => {
              const todayDiary = todayState?.diary;
              if (todayDiary?.id) {
                router.push({ pathname: "/diary/[id]", params: { id: todayDiary.id } });
              }
            }}
            activeOpacity={0.86}
          >
            <View style={styles.createCopy}>
              <Text style={styles.createTitle}>Today reflection is complete</Text>
              <Text style={styles.createBody}>
                You can reopen it, edit details, or keep building tomorrow story.
              </Text>
            </View>
            <View style={[styles.checkCircle, { backgroundColor: accentColor }]}>
              <Check size={22} color={accentTextColor} strokeWidth={3} />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.createCard, { borderColor: accentColor }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel="Create today's diary"
          >
            <View style={styles.createCopy}>
              <Text style={styles.createTitle}>Create Your Diary for Today</Text>
              <Text style={styles.createBody}>
                You have {unsnappedCount} unsnapped moments waiting to be added
                into your diary.
              </Text>
            </View>
            <View style={[styles.plusCircle, { backgroundColor: accentColor }]}>
              <Plus size={24} color={accentTextColor} strokeWidth={3} />
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.previousTitle}>Previous Entries</Text>

        {previousEntries.length ? (
          <FlatList
            horizontal
            data={previousEntries}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previousList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.entryCard}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => null);
                  router.push({ pathname: "/diary/[id]", params: { id: item.id } });
                }}
                activeOpacity={0.94}
              >
                <View style={styles.entryImageWrap}>
                  {item.coverImageUrl ? (
                    <Image source={{ uri: item.coverImageUrl }} style={styles.entryImage} />
                  ) : (
                    <View style={styles.entryFallback} />
                  )}
                  <View style={styles.datePill}>
                    <Text style={styles.datePillText}>
                      {formatDisplayDate(item.entryDate)}
                    </Text>
                  </View>
                </View>
                <View style={styles.entryBody}>
                  <Text style={styles.entryTitle} numberOfLines={3}>
                    {item.title}
                  </Text>
                  <Text style={styles.entryContent} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <View style={[styles.readPill, { backgroundColor: accentColor }]}>
                    <Text style={[styles.readText, { color: accentTextColor }]}>
                      Continue reading
                    </Text>
                    <ArrowRight size={13} color={accentTextColor} strokeWidth={3} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No diary entries yet. Create your first reflection from today
              snaps.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalIconButton}
              disabled={submitting}
            >
              <X size={18} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Diary</Text>
            <TouchableOpacity
              onPress={createDiary}
              style={[
                styles.createDiaryButton,
                { backgroundColor: accentColor },
                submitting && styles.disabled,
              ]}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={accentTextColor} size="small" />
              ) : (
                <Check size={17} color={accentTextColor} strokeWidth={3} />
              )}
              <Text style={[styles.createDiaryText, { color: accentTextColor }]}>
                {submitting ? "Creating..." : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {todaySnaps.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.coverList}
              >
                {todaySnaps.map((snap) => {
                  const selected = selectedCoverImage === snap.imageUrl;

                  return (
                    <TouchableOpacity
                      key={snap.id}
                      style={[
                        styles.coverOption,
                        selected && { borderColor: accentColor },
                      ]}
                      onPress={() => setSelectedCoverImage(snap.imageUrl)}
                      activeOpacity={0.82}
                    >
                      <Image source={{ uri: snap.imageUrl }} style={styles.coverImage} />
                      {selected ? (
                        <View
                          style={[
                            styles.coverCheck,
                            { backgroundColor: accentColor },
                          ]}
                        >
                          <Check size={15} color={accentTextColor} strokeWidth={3} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noSnapCover}>
                <Text style={styles.noSnapText}>
                  No moments snapped today. Your diary will use a simple cover.
                </Text>
              </View>
            )}

            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((mood) => {
                const active = selectedMood === mood.key;

                return (
                  <TouchableOpacity
                    key={mood.key}
                    style={styles.moodOption}
                    onPress={() => setSelectedMood(mood.key)}
                    activeOpacity={0.82}
                  >
                    <View
                      style={[
                        styles.moodDot,
                        {
                          borderColor: mood.color,
                          backgroundColor: active ? mood.color : "#121212",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.moodInnerDot,
                          { backgroundColor: active ? "#000" : mood.color },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#71717A"
              style={styles.titleInput}
              editable={!submitting}
            />
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write what you felt today..."
              placeholderTextColor="#71717A"
              style={styles.contentInput}
              editable={!submitting}
              multiline
              textAlignVertical="top"
            />
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 78,
    paddingBottom: 130,
  },
  eyebrow: {
    color: "#6F6F78",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 10,
  },
  createCard: {
    marginTop: 34,
    minHeight: 140,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "#FFB800",
    backgroundColor: "#101010",
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  completedCard: {
    marginTop: 34,
    minHeight: 140,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "#03883F",
    backgroundColor: "#101010",
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  createCopy: {
    flex: 1,
  },
  createTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  createBody: {
    color: "#A1A1AA",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 8,
  },
  plusCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFB800",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#49E08B",
    alignItems: "center",
    justifyContent: "center",
  },
  previousTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 54,
  },
  previousList: {
    paddingTop: 22,
    paddingRight: 20,
  },
  entryCard: {
    width: 292,
    height: 432,
    borderRadius: 36,
    backgroundColor: "#22231C",
    overflow: "hidden",
    marginRight: 18,
  },
  entryImageWrap: {
    height: "52%",
    backgroundColor: "#171717",
  },
  entryImage: {
    width: "100%",
    height: "100%",
  },
  entryFallback: {
    flex: 1,
    backgroundColor: "#1B1B1B",
  },
  datePill: {
    position: "absolute",
    top: 16,
    left: 16,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  datePillText: {
    color: "#EAEAEA",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  entryBody: {
    flex: 1,
    padding: 22,
  },
  entryTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  entryContent: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 12,
  },
  readPill: {
    alignSelf: "flex-start",
    marginTop: "auto",
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  readText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  emptyCard: {
    marginTop: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222",
    backgroundColor: "#101010",
    padding: 22,
  },
  emptyText: {
    color: "#A1A1AA",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    textAlign: "center",
  },
  modalScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalHeader: {
    paddingTop: 66,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  createDiaryButton: {
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: "#FFB800",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  createDiaryText: {
    color: "#000",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.62,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  coverList: {
    paddingTop: 10,
    paddingRight: 20,
  },
  coverOption: {
    width: 276,
    aspectRatio: 4 / 3,
    marginRight: 14,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "transparent",
    overflow: "hidden",
  },
  coverOptionSelected: {
    borderColor: "#FFB800",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverCheck: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFB800",
    alignItems: "center",
    justifyContent: "center",
  },
  noSnapCover: {
    marginTop: 10,
    borderRadius: 30,
    minHeight: 136,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noSnapText: {
    color: "#ddd",
    textAlign: "center",
    fontWeight: "800",
    lineHeight: 21,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26,
  },
  moodOption: {
    alignItems: "center",
  },
  moodDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  moodInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  titleInput: {
    marginTop: 26,
    borderRadius: 20,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#242424",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "900",
  },
  contentInput: {
    marginTop: 14,
    minHeight: 178,
    borderRadius: 20,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#242424",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
});
