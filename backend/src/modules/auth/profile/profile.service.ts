import { User } from "../auth.model";
import bcrypt from "bcrypt";
import { put, del } from "@vercel/blob";
import { env } from "../../../config/env";

export const updateProfile = async (
  userId: string,
  data: {
    name?: string;
    timezone?: string;
    workingHours?: { start: string; end: string };
    defaultTaskDuration?: string;
  }
) => {
  console.log('updateProfile called with userId:', userId);
  console.log('updateProfile data:', data);
  
  const updateData: any = {};
  
  if (data.name) updateData.name = data.name;
  if (data.timezone) updateData.timezone = data.timezone;
  if (data.workingHours) updateData.workingHours = data.workingHours;
  if (data.defaultTaskDuration) updateData.defaultTaskDuration = data.defaultTaskDuration;
  
  console.log('Update data to save:', updateData);
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  ).select('-password');
  
  console.log('User after update:', updatedUser);
  return updatedUser;
};

export const updateAvatar = async (userId: string, fileBuffer: Buffer, originalname: string) => {
  const user = await User.findById(userId);
  
  // Delete old avatar from Vercel Blob if exists
  if (user && user.avatar && user.avatar.startsWith("https://")) {
    try {
      await del(user.avatar);
    } catch (error) {
      console.error("Failed to delete old avatar:", error);
      // Continue even if deletion fails
    }
  }

  // Upload new avatar to Vercel Blob
  const filename = `avatar-${userId}-${Date.now()}-${originalname}`;
  const blob = await put(filename, fileBuffer, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  // Update user with new blob URL
  return User.findByIdAndUpdate(
    userId,
    { $set: { avatar: blob.url } },
    { new: true }
  ).select('-password');
};

export const updateSettings = async (
  userId: string,
  settings: any
) => {
  // Merge with existing settings to preserve any fields not being updated
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  const updatedSettings = {
    ...user.settings,
    ...settings
  };
  
  return User.findByIdAndUpdate(
    userId,
    { $set: { settings: updatedSettings } },
    { new: true }
  ).select('-password');
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Current password is incorrect");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return { message: "Password changed successfully" };
};
