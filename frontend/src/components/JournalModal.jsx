import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BookText, X } from "lucide-react-native";
import { COLORS } from "../constants/colors";

const MAX_JOURNAL_LENGTH = 220;

export default function JournalModal({
  visible,
  initialText = "",
  onSave,
  onClose,
}) {
  const [text, setText] = useState(initialText);
  const remaining = MAX_JOURNAL_LENGTH - text.length;
  const hasText = text.trim().length > 0;

  useEffect(() => {
    if (visible) {
      setText(initialText || "");
    }
  }, [initialText, visible]);

  const handleSave = () => {
    onSave?.(text.trim());
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={styles.scrim}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close journal"
        />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconBubble}>
                <BookText size={19} color="#fff" strokeWidth={2.8} />
              </View>
              <View>
                <Text style={styles.eyebrow}>Journal</Text>
                <Text style={styles.title}>Add a note</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close journal"
            >
              <X size={20} color="#fff" strokeWidth={2.8} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.input,
              remaining < 24 && {
                borderColor: COLORS.danger,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Write what made this moment feel this way..."
            placeholderTextColor="#747474"
            maxLength={MAX_JOURNAL_LENGTH}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          <View style={styles.metaRow}>
            <Text style={[styles.counter, remaining < 24 && styles.counterWarning]}>
              {remaining} left
            </Text>
            <TouchableOpacity
              onPress={() => setText("")}
              disabled={!hasText}
              accessibilityRole="button"
              accessibilityLabel="Clear journal note"
            >
              <Text style={[styles.clearText, !hasText && styles.disabledText]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              accessibilityRole="button"
            >
              <Text style={styles.saveText}>Save note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#242424",
    padding: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  eyebrow: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    minHeight: 138,
    maxHeight: 210,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#333",
    backgroundColor: "#1B1B1B",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  counter: {
    color: "#888",
    fontSize: 12,
    fontWeight: "900",
  },
  counterWarning: {
    color: COLORS.danger,
  },
  clearText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  disabledText: {
    color: "#555",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#292929",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "900",
  },
  saveButton: {
    flex: 1.4,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
  },
});
