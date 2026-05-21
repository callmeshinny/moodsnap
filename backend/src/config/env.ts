import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || "5001",

  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  brevoApiKey: process.env.BREVO_API_KEY || "",
  senderEmail: process.env.SENDER_EMAIL || "",
  senderName: process.env.SENDER_NAME || "MoodSnap",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",

  jwtSecret: process.env.JWT_SECRET || "moodsnap_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d"
};