import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { profileStyles as styles } from "./profileStyles";

export function SettingRow({ icon, label, danger, onPress }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowIcon, danger && styles.dangerText]}>{icon}</Text>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>
          {label}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export function Section({ title, children }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}
