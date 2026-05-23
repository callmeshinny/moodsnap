import React from "react";
import { StyleSheet, Text } from "react-native";
import { COLORS } from "../constants/colors";

export default function MutedText({ children, style, ...props }) {
  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
