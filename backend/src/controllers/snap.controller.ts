import { Request, Response } from "express";
import { uploadImageToCloudinary } from "../services/upload.service";
import { supabase } from "../config/supabase";

const TABLE_NAME = "moodsnap";

export const createSnap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mood, caption } = req.body;

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Image is required",
      });
      return;
    }

    if (!mood) {
      res.status(400).json({
        success: false,
        message: "Mood is required",
      });
      return;
    }

    const uploadedImage = await uploadImageToCloudinary(req.file.buffer);

    const { data: snap, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        user_id: "test-user-1",
        mood,
        caption: caption || null,
        image_url: uploadedImage.secure_url,
        image_public_id: uploadedImage.public_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.status(201).json({
      success: true,
      message: "Snap uploaded to Cloudinary and saved to Supabase successfully",
      snap,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload snap";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getSnaps = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: snaps, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      snaps,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get snaps";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const deleteSnap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: snap, error: findError } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !snap) {
      res.status(404).json({
        success: false,
        message: "Snap not found",
      });
      return;
    }

    await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id);

    res.status(200).json({
      success: true,
      message: "Snap deleted from Supabase. Cloudinary delete can be added later.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete snap";

    res.status(500).json({
      success: false,
      message,
    });
  }
};
