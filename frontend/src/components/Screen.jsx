import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/colors";

export default function Screen({
  children,
  style,
  contentStyle,
  edges = true,
}) {
  const Wrapper = edges ? SafeAreaView : View;

  return (
    <Wrapper style={[styles.screen, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});
