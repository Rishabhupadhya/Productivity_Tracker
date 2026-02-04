import { Activity } from "./activity.model";
import mongoose, { Types } from "mongoose";

export const logActivity = async (data: {
  teamId?: string;
  userId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: any;
}) => {
  try {
    const activityData: any = {
      action: data.action,
      targetType: data.targetType,
      details: data.details || {},
      timestamp: new Date()
    };

    // Safely parse user ID
    if (mongoose.Types.ObjectId.isValid(data.userId)) {
      activityData.userId = new Types.ObjectId(data.userId);
    } else {
      console.warn("logActivity: Invalid userId", data.userId);
      return;
    }

    // Safely parse target ID if provided
    if (data.targetId && mongoose.Types.ObjectId.isValid(data.targetId)) {
      activityData.targetId = new Types.ObjectId(data.targetId);
    }

    // Safely handle optional team ID
    if (data.teamId && data.teamId !== "" && mongoose.Types.ObjectId.isValid(data.teamId)) {
      activityData.teamId = new Types.ObjectId(data.teamId);
    }

    await Activity.create(activityData);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

export const getTeamActivity = async (teamId: string, limit: number = 50) => {
  return Activity.find({ teamId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "name email avatar")
    .lean();
};

export const getUserActivity = async (teamId: string, userId: string, limit: number = 50) => {
  return Activity.find({ teamId, userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "name email avatar")
    .lean();
};

export const getAllUserActivity = async (userId: string, limit: number = 100) => {
  return Activity.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "name email avatar")
    .populate("teamId", "name")
    .lean();
};
