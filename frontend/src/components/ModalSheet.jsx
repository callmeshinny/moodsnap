import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/colors";

export default function ModalSheet({
  visible,
  onClose,
  title,
  children,
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
          {onClose ? (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#242424",
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },
  closeButton: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#292929",
    alignItems: "center",
  },
  closeText: {
    color: COLORS.text,
    fontWeight: "900",
  },
});
