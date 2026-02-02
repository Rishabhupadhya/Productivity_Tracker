import { Activity } from "./activity.model";
import { Types } from "mongoose";

export const logActivity = async (data: {
  teamId: string;
  userId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: any;
}) => {
  try {
    await Activity.create({
      teamId: new Types.ObjectId(data.teamId),
      userId: new Types.ObjectId(data.userId),
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId ? new Types.ObjectId(data.targetId) : undefined,
      details: data.details || {},
      timestamp: new Date()
    });
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
