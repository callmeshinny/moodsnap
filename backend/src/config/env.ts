import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, fallback = ""): string => {
  const candidates = [key, key.toLowerCase(), key.toUpperCase()];

  for (const candidate of candidates) {
    const value = process.env[candidate]?.trim();

    if (value) {
      return value;
    }
  }

  return fallback;
};

const requireEnv = (key: string): string => {
  const value = getEnv(key);

  if (!value) {
    throw new Error(`${key} is missing in environment variables`);
  }

  return value;
};

export const env = {
  port: getEnv("PORT", "5001"),

  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),

  brevoApiKey: getEnv("BREVO_API_KEY"),
  senderEmail: getEnv("SENDER_EMAIL"),
  senderName: getEnv("SENDER_NAME", "MoodSnap"),

  cloudinaryCloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: requireEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: requireEnv("CLOUDINARY_API_SECRET"),

  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: getEnv("JWT_EXPIRES_IN", "7d")
};
