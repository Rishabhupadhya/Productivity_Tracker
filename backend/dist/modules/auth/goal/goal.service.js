"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoalProgress = exports.updateGoalFromTask = exports.updateGoalFromFinance = exports.updateGoalFromHabit = exports.getGoalReviews = exports.addGoalReview = exports.deleteGoal = exports.updateGoal = exports.updateGoalProgress = exports.getUserGoals = exports.createGoal = void 0;
const goal_model_1 = require("./goal.model");
const auth_model_1 = require("../auth.model");
const mongoose_1 = require("mongoose");
const activity_service_1 = require("../activity/activity.service");
const createGoal = async (userId, data) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    const goalData = {
        userId: new mongoose_1.Types.ObjectId(userId),
        title: data.title,
        description: data.description || "",
        type: data.type,
        targetValue: data.targetValue,
        unit: data.unit || getDefaultUnit(data.type),
        targetDate: data.targetDate,
        milestones: data.milestones || [],
        linkedHabits: data.linkedHabits?.map(id => new mongoose_1.Types.ObjectId(id)) || [],
        linkedFinanceCategory: data.linkedFinanceCategory
    };
    if (user.activeTeamId) {
        goalData.teamId = user.activeTeamId;
    }
    const goal = await goal_model_1.Goal.create(goalData);
    // Log activity
    if (user.activeTeamId) {
        await (0, activity_service_1.logActivity)({
            teamId: user.activeTeamId.toString(),
            userId,
            action: "goal_created",
            targetType: "goal",
            targetId: goal._id.toString(),
            details: {
                title: data.title,
                type: data.type,
                targetValue: data.targetValue
            }
        });
    }
    return goal;
};
exports.createGoal = createGoal;
const getDefaultUnit = (type) => {
    switch (type) {
        case "financial": return "₹";
        case "time": return "hours";
        case "count": return "times";
        case "binary": return "";
        default: return "";
    }
};
const getUserGoals = async (userId, status) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    const query = {
        $or: [
            { userId, teamId: { $exists: false } },
            { userId, teamId: null }
        ]
    };
    if (user.activeTeamId) {
        query.$or.push({ teamId: user.activeTeamId });
    }
    if (status) {
        query.status = status;
    }
    return goal_model_1.Goal.find(query).sort({ createdAt: -1 });
};
exports.getUserGoals = getUserGoals;
const updateGoalProgress = async (goalId, userId, incrementValue, source) => {
    const goal = await goal_model_1.Goal.findOne({ _id: goalId, userId });
    if (!goal)
        throw new Error("Goal not found");
    goal.currentValue += incrementValue;
    // Check milestones
    goal.milestones.forEach(milestone => {
        if (!milestone.completed && goal.currentValue >= milestone.targetValue) {
            milestone.completed = true;
            milestone.completedAt = new Date();
        }
    });
    // Check if goal is complete
    if (goal.type === "binary") {
        if (incrementValue > 0) {
            goal.status = "completed";
            goal.completedAt = new Date();
            goal.currentValue = goal.targetValue;
        }
    }
    else if (goal.currentValue >= goal.targetValue) {
        goal.status = "completed";
        goal.completedAt = new Date();
        // Log completion
        const user = await auth_model_1.User.findById(userId);
        if (user?.activeTeamId) {
            await (0, activity_service_1.logActivity)({
                teamId: user.activeTeamId.toString(),
                userId,
                action: "goal_completed",
                targetType: "goal",
                targetId: goal._id.toString(),
                details: {
                    title: goal.title,
                    finalValue: goal.currentValue
                }
            });
        }
    }
    await goal.save();
    return goal;
};
exports.updateGoalProgress = updateGoalProgress;
const updateGoal = async (goalId, userId, updates) => {
    const goal = await goal_model_1.Goal.findOne({ _id: goalId, userId });
    if (!goal)
        throw new Error("Goal not found");
    Object.assign(goal, updates);
    await goal.save();
    return goal;
};
exports.updateGoal = updateGoal;
const deleteGoal = async (goalId, userId) => {
    await goal_model_1.Goal.findOneAndDelete({ _id: goalId, userId });
};
exports.deleteGoal = deleteGoal;
const addGoalReview = async (goalId, userId, review) => {
    const goal = await goal_model_1.Goal.findOne({ _id: goalId, userId });
    if (!goal)
        throw new Error("Goal not found");
    goal.reviews.push({
        date: new Date(),
        whatHelped: review.whatHelped,
        whatBlocked: review.whatBlocked,
        notes: review.notes
    });
    await goal.save();
    return goal;
};
exports.addGoalReview = addGoalReview;
const getGoalReviews = async (goalId, userId) => {
    const goal = await goal_model_1.Goal.findOne({ _id: goalId, userId });
    if (!goal)
        throw new Error("Goal not found");
    return goal.reviews;
};
exports.getGoalReviews = getGoalReviews;
// Auto-update from habits
const updateGoalFromHabit = async (userId, habitId, value = 1) => {
    const goals = await goal_model_1.Goal.find({
        userId,
        linkedHabits: habitId,
        status: "active"
    });
    for (const goal of goals) {
        await (0, exports.updateGoalProgress)(goal._id.toString(), userId, value, "habit");
    }
};
exports.updateGoalFromHabit = updateGoalFromHabit;
// Auto-update from finance
const updateGoalFromFinance = async (userId, category, amount) => {
    const goals = await goal_model_1.Goal.find({
        userId,
        linkedFinanceCategory: category,
        status: "active",
        type: "financial"
    });
    for (const goal of goals) {
        await (0, exports.updateGoalProgress)(goal._id.toString(), userId, amount, "finance");
    }
};
exports.updateGoalFromFinance = updateGoalFromFinance;
// Auto-update from tasks
const updateGoalFromTask = async (userId, taskId, value = 1) => {
    const goals = await goal_model_1.Goal.find({
        userId,
        linkedTasks: taskId,
        status: "active"
    });
    for (const goal of goals) {
        await (0, exports.updateGoalProgress)(goal._id.toString(), userId, value, "task");
    }
};
exports.updateGoalFromTask = updateGoalFromTask;
const getGoalProgress = async (goalId, userId) => {
    const goal = await goal_model_1.Goal.findOne({ _id: goalId, userId });
    if (!goal)
        throw new Error("Goal not found");
    const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
    const daysRemaining = goal.targetDate
        ? Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    return {
        goal,
        progress: Math.min(progress, 100),
        daysRemaining,
        completedMilestones: goal.milestones.filter(m => m.completed).length,
        totalMilestones: goal.milestones.length
    };
};
exports.getGoalProgress = getGoalProgress;
