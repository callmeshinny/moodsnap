import { supabase } from "../config/supabase";

type RatingRecord = {
  id: string;
  user_id: string;
  rating: number;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
};

const mapRating = (record: RatingRecord) => ({
  id: record.id,
  userId: record.user_id,
  rating: record.rating,
  feedback: record.feedback || null,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const normalizeRating = (rating: unknown) => {
  const value =
    typeof rating === "number"
      ? rating
      : typeof rating === "string"
        ? Number(rating)
        : Number.NaN;

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error("Rating must be an integer from 1 to 5.");
  }

  return value;
};

const normalizeFeedback = (feedback: unknown) => {
  if (feedback === undefined || feedback === null) {
    return null;
  }

  if (typeof feedback !== "string") {
    throw new Error("Feedback must be text.");
  }

  const trimmed = feedback.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
};

export const getMyRating = async (userId: string) => {
  const { data, error } = await supabase
    .from("app_ratings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRating(data) : null;
};

export const createAppRating = async (
  userId: string,
  input: { rating?: unknown; feedback?: unknown }
) => {
  const existingRating = await getMyRating(userId);

  if (existingRating) {
    throw new Error("You have already rated MoodSnap. Thank you!");
  }

  const rating = normalizeRating(input.rating);
  const feedback = normalizeFeedback(input.feedback);

  const { data, error } = await supabase
    .from("app_ratings")
    .insert({
      user_id: userId,
      rating,
      feedback,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already rated MoodSnap. Thank you!");
    }

    throw new Error(error.message);
  }

  return mapRating(data);
};
