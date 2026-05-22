import { Request, Response } from "express";
import {
  deleteUserAccount,
  getUserById,
  updateUserProfilePhoto,
  updateUserProfile,
} from "../services/user.service";

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

export const updateMyProfilePhoto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Image is required",
      });
      return;
    }

    const user = await updateUserProfilePhoto(req.user.id, req.file.buffer);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile photo";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const deleteMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    await deleteUserAccount(req.user.id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete account";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
