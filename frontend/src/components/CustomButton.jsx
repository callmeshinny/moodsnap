import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { COLORS } from "../constants/colors";

export default function CustomButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  accessibilityLabel,
  variant = "primary",
}) {
  const isSecondary = variant === "secondary";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSecondary && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: loading || disabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 6,
  },
  secondary: {
    backgroundColor: "#292929",
  },
  disabled: {
    opacity: 0.5
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  }
});