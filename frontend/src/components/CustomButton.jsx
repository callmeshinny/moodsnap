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
  disabled = false
}) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={loading || disabled}
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
    marginTop: 6
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