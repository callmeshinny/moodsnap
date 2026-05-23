import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from "react-native";
import { router } from "expo-router";
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import { signUpApi } from "../../api/authApi";
import { COLORS } from "../../constants/colors";

export default function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const result = await signUpApi({
        username,
        displayName,
        email,
        password
      });

      Alert.alert("OTP sent", result.message || "Please check your email.");

      router.push({
        pathname: "/auth/verify-otp",
        params: {
          email
        }
      });
    } catch (error) {
      Alert.alert(
        "Sign up failed",
        error.response?.data?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.logo}>MoodSnap</Text>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Sign up and get your OTP by email.</Text>

      <CustomInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <CustomInput
        placeholder="Display name (optional)"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <CustomInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <CustomInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <CustomButton
        title="Sign Up"
        onPress={handleSignUp}
        loading={loading}
      />

      <TouchableOpacity onPress={() => router.push("/auth/signin")}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    justifyContent: "center"
  },
  logo: {
    color: COLORS.primary,
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 10
  },
  title: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 8
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    marginBottom: 28
  },
  link: {
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 18,
    fontSize: 15
  }
});
