import React from "react";
import { TextInput, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

export default function CustomInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  accessibilityLabel,
}) {
  const label = accessibilityLabel || placeholder;

  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={COLORS.muted}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
      accessibilityLabel={label}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.input,
    color: COLORS.text,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12
  }
});