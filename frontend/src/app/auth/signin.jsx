import React, { useContext, useState } from "react";
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
import { signInApi } from "../../api/authApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

export default function SignInScreen() {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await signInApi({
        email,
        password
      });

      await login(result.token, result.user);

      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Sign in failed",
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
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue snapping moods.</Text>

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
        title="Sign In"
        onPress={handleSignIn}
        loading={loading}
      />

      <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
        <Text style={styles.forgotLink}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/signup")}>
        <Text style={styles.link}>New here? Create an account</Text>
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
  forgotLink: {
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 14,
    fontSize: 15,
    fontWeight: "800"
  },
  link: {
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 18,
    fontSize: 15
  }
});
