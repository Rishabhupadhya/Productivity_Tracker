"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamActivity = exports.logActivity = void 0;
const activity_model_1 = require("./activity.model");
const mongoose_1 = require("mongoose");
const logActivity = async (data) => {
    try {
        await activity_model_1.Activity.create({
            teamId: new mongoose_1.Types.ObjectId(data.teamId),
            userId: new mongoose_1.Types.ObjectId(data.userId),
            action: data.action,
            targetType: data.targetType,
            targetId: data.targetId ? new mongoose_1.Types.ObjectId(data.targetId) : undefined,
            details: data.details || {},
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error("Failed to log activity:", error);
    }
};
exports.logActivity = logActivity;
const getTeamActivity = async (teamId, limit = 50) => {
    return activity_model_1.Activity.find({ teamId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("userId", "name email avatar")
        .lean();
};
exports.getTeamActivity = getTeamActivity;
