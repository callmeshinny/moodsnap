import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user?.username}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8
  },
  email: {
    color: COLORS.muted,
    marginBottom: 24
  },
  button: {
    backgroundColor: COLORS.danger,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700"
  }
});