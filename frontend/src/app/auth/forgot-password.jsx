import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import {
  forgotPasswordApi,
  resetPasswordApi,
} from "../../api/authApi";
import { COLORS } from "../../constants/colors";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email.");
      return;
    }

    try {
      setLoading(true);
      await forgotPasswordApi(email.trim());
      Alert.alert("OTP sent", "Please check your email for the reset code.");
      setStep("otp");
    } catch (error) {
      Alert.alert(
        "Could not send OTP",
        error.response?.data?.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      Alert.alert("Missing OTP", "Please enter the OTP from your email.");
      return;
    }

    setStep("password");
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing password", "Please enter your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await resetPasswordApi({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      Alert.alert("Password reset", "You can now sign in with your new password.", [
        {
          text: "OK",
          onPress: () => router.replace("/auth/signin"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error.response?.data?.message || "Please check your OTP and try again."
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
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.subtitle}>
        {step === "email"
          ? "Enter your email and we will send you an OTP."
          : step === "otp"
          ? "Enter the OTP we sent to your email."
          : "Create a new password for your account."}
      </Text>

      {step === "email" && (
        <>
          <CustomInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <CustomButton
            title="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
          />
        </>
      )}

      {step === "otp" && (
        <>
          <CustomInput
            placeholder="OTP code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />

          <CustomButton
            title="Verify OTP"
            onPress={handleVerifyOtp}
            loading={loading}
          />

          <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
            <Text style={styles.link}>Resend OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === "password" && (
        <>
          <CustomInput
            placeholder="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <CustomInput
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <CustomButton
            title="Reset Password"
            onPress={handleResetPassword}
            loading={loading}
          />
        </>
      )}

      <View style={styles.bottomLinks}>
        {step !== "email" && (
          <TouchableOpacity onPress={() => setStep("email")} disabled={loading}>
            <Text style={styles.secondaryLink}>Change email</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.link}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logo: {
    color: COLORS.primary,
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    marginBottom: 28,
    lineHeight: 22,
  },
  bottomLinks: {
    marginTop: 18,
    gap: 10,
  },
  link: {
    color: COLORS.secondary,
    textAlign: "center",
    fontSize: 15,
  },
  secondaryLink: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 14,
  },
});
