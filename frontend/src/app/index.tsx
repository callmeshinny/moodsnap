import React, { useContext, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { COLORS } from "../constants/colors";
import { getHasSeenOnboarding } from "../storage/tokenStorage";

export default function Index() {
  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const resolveRoute = async () => {
      if (!user) {
        router.replace("/auth/signin");
        return;
      }

      const seen = await getHasSeenOnboarding();

      if (!seen) {
        router.replace("/onboarding");
        return;
      }

      router.replace("/tabs/camera");
    };

    resolveRoute();
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator
        color={COLORS.primary}
        size="large"
        accessibilityLabel="Loading MoodSnap"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
