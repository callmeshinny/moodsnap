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
import { router, useLocalSearchParams } from "expo-router";
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import { resendOtpApi, verifyOtpApi } from "../../api/authApi";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams();
  const { login } = useContext(AuthContext);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyOtpApi({
        email,
        otp
      });

      await login(result.token, result.user);

      Alert.alert("Success", "Your email has been verified.");

      router.replace("/tabs/camera");
    } catch (error) {
      Alert.alert(
        "Verify failed",
        error.response?.data?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);

      const result = await resendOtpApi(email);

      Alert.alert("OTP resent", result.message || "Please check your email.");
    } catch (error) {
      Alert.alert(
        "Resend failed",
        error.response?.data?.message || "Something went wrong."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to {email}
      </Text>

      <CustomInput
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
      />

      <CustomButton
        title="Verify OTP"
        onPress={handleVerify}
        loading={loading}
        disabled={otp.length !== 6}
      />

      <TouchableOpacity onPress={handleResend} disabled={resending}>
        <Text style={styles.link}>
          {resending ? "Resending..." : "Resend OTP"}
        </Text>
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
  title: {
    color: COLORS.text,
    fontSize: 27,
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
