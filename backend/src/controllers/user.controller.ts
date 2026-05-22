import { Request, Response } from "express";
import { getUserById, updateUserProfile } from "../services/user.service";

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const user = await getUserById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get profile";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const user = await updateUserProfile(req.user.id, req.body);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
