import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { updateProfile, updateSettings, changePassword, updateAvatar } from "./profile.service";

export const updateUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('Updating profile for user:', req.user.id);
    console.log('Profile update data:', req.body);
    const user = await updateProfile(req.user.id, req.body);
    console.log('Updated user:', user);
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    next(error);
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // Pass file buffer and original name for Vercel Blob upload
    const user = await updateAvatar(req.user.id, req.file.buffer, req.file.originalname);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await updateSettings(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const changeUserPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
