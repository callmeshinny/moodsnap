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
    <div style="margin:0;padding:0;background:#fff5fb;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="width:100%;padding:28px 14px;box-sizing:border-box;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:26px;overflow:hidden;border:1px solid #ffd2e8;box-shadow:0 14px 34px rgba(255,105,180,0.16);">
          <div style="background:#ff69b4;padding:28px 22px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.2;font-weight:900;">Welcome to MoodSnap 💛</h1>
          </div>

          <div style="padding:30px 24px 26px;text-align:left;">
            <p style="margin:0 0 18px;font-size:18px;line-height:1.5;">Your verification code is:</p>

            <div style="background:#fff0f7;border:2px solid #ffc2df;border-radius:22px;padding:26px 18px;text-align:center;margin:0 0 24px;">
              <div style="color:#ff69b4;font-size:42px;line-height:1;font-weight:900;letter-spacing:10px;">${otp}</div>
            </div>

            <p style="margin:0 0 14px;font-size:16px;line-height:1.55;">This code will expire in 10 minutes.</p>
            <p style="margin:0;font-size:16px;line-height:1.55;">If you did not request this, you can ignore this email.</p>
          </div>

          <div style="background:#fff8fc;border-top:1px solid #ffe0ef;padding:18px 22px;text-align:center;">
            <p style="margin:0;color:#8d5a73;font-size:14px;line-height:1.5;">Please do not share your OTP with anyone.</p>
          </div>
        </div>
      </div>
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
