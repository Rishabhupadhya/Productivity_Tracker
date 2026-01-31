import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { updateProfile, updateSettings, changePassword, updateAvatar } from "./profile.service";

export const updateUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await updateAvatar(req.user.id, req.file.filename);
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
