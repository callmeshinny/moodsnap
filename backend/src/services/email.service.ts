import * as brevo from "@getbrevo/brevo";
import { env } from "../config/env";

export const sendOtpEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  if (!env.brevoApiKey) {
    throw new Error("BREVO_API_KEY is missing in environment variables");
  }

  if (!env.senderEmail) {
    throw new Error("SENDER_EMAIL is missing in environment variables");
  }

  const apiInstance = new brevo.TransactionalEmailsApi();

  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    env.brevoApiKey
  );

  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    email: env.senderEmail,
    name: env.senderName
  };

  sendSmtpEmail.to = [
    {
      email
    }
  ];

  sendSmtpEmail.subject = "Your MoodSnap verification code";

  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome to MoodSnap 💛</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 5px; font-size: 32px;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Brevo error";

    throw new Error(`Failed to send OTP email through Brevo: ${message}`);
  }
};
