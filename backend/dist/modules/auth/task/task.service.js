"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskSlot = exports.deleteTask = exports.updateTaskDay = exports.getTasksByUser = exports.createTask = void 0;
const task_model_1 = require("./task.model");
const auth_model_1 = require("../auth.model");
const team_model_1 = require("../team/team.model");
const activity_service_1 = require("../activity/activity.service");
const createTask = async (title, duration, day, startTime, userId, assignedTo) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    const taskData = {
        title,
        duration,
        day,
        startTime,
        userId,
        assignedTo: assignedTo || userId,
        workspaceId: user.workspaceId
    };
    // If user has active team, add teamId
    if (user.activeTeamId) {
        const team = await team_model_1.Team.findById(user.activeTeamId);
        if (team) {
            // Check if user is a member
            const isMember = team.members.some(m => m.userId.toString() === userId);
            if (isMember) {
                taskData.teamId = user.activeTeamId;
            }
        }
    }
    const task = await task_model_1.Task.create(taskData);
    // Log activity if it's a team task
    if (taskData.teamId) {
        await (0, activity_service_1.logActivity)({
            teamId: taskData.teamId.toString(),
            userId,
            action: "task_created",
            targetType: "task",
            targetId: task._id.toString(),
            details: { taskTitle: title }
        });
    }
    return task;
};
exports.createTask = createTask;
const getTasksByUser = async (userId) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    // Get personal tasks or team tasks
    const query = {
        $or: [
            { userId, teamId: { $exists: false } }, // Personal tasks
            { userId, teamId: null } // Personal tasks with null teamId
        ]
    };
    // If user has active team, also get team tasks
    if (user.activeTeamId) {
        query.$or.push({ teamId: user.activeTeamId });
    }
    return task_model_1.Task.find(query).populate('assignedTo', 'name email avatar');
};
exports.getTasksByUser = getTasksByUser;
const updateTaskDay = async (taskId, day, userId) => {
    const task = await task_model_1.Task.findById(taskId);
    if (!task)
        throw new Error("Task not found");
    // Check permissions
    if (task.teamId) {
        const team = await team_model_1.Team.findById(task.teamId);
        if (!team)
            throw new Error("Team not found");
        const member = team.members.find(m => m.userId.toString() === userId);
        if (!member)
            throw new Error("Not authorized");
        // Members can only update their assigned tasks, admins can update any
        if (member.role !== "admin" && task.assignedTo?.toString() !== userId) {
            throw new Error("Not authorized");
        }
    }
    else {
        // Personal task - only owner can update
        if (task.userId.toString() !== userId) {
            throw new Error("Not authorized");
        }
    }
    const updatedTask = await task_model_1.Task.findOneAndUpdate({ _id: taskId }, { day }, { new: true });
    // Log activity if it's a team task
    if (task.teamId) {
        await (0, activity_service_1.logActivity)({
            teamId: task.teamId.toString(),
            userId,
            action: "task_updated",
            targetType: "task",
            targetId: taskId,
            details: {
                taskTitle: task.title,
                changes: `Moved to ${day}`
            }
        });
    }
    return updatedTask;
};
exports.updateTaskDay = updateTaskDay;
const deleteTask = async (taskId, userId) => {
    const task = await task_model_1.Task.findById(taskId);
    if (!task)
        throw new Error("Task not found");
    // Check permissions
    if (task.teamId) {
        const team = await team_model_1.Team.findById(task.teamId);
        if (!team)
            throw new Error("Team not found");
        const member = team.members.find(m => m.userId.toString() === userId);
        if (!member || member.role !== "admin") {
            throw new Error("Only admins can delete team tasks");
        }
    }
    else {
        // Personal task - only owner can delete
        if (task.userId.toString() !== userId) {
            throw new Error("Not authorized");
        }
    }
    const deletedTask = await task_model_1.Task.findOneAndDelete({ _id: taskId });
    // Log activity if it's a team task
    if (task.teamId) {
        await (0, activity_service_1.logActivity)({
            teamId: task.teamId.toString(),
            userId,
            action: "task_deleted",
            targetType: "task",
            targetId: taskId,
            details: { taskTitle: task.title }
        });
    }
    return deletedTask;
};
exports.deleteTask = deleteTask;
const updateTaskSlot = async (taskId, day, startTime, userId) => {
    const task = await task_model_1.Task.findById(taskId);
    if (!task)
        throw new Error("Task not found");
    // Check permissions (same as updateTaskDay)
    if (task.teamId) {
        const team = await team_model_1.Team.findById(task.teamId);
        if (!team)
            throw new Error("Team not found");
        const member = team.members.find(m => m.userId.toString() === userId);
        if (!member)
            throw new Error("Not authorized");
        if (member.role !== "admin" && task.assignedTo?.toString() !== userId) {
            throw new Error("Not authorized");
        }
    }
    else {
        if (task.userId.toString() !== userId) {
            throw new Error("Not authorized");
        }
    }
    return task_model_1.Task.findOneAndUpdate({ _id: taskId }, { day, startTime }, { new: true }).populate('assignedTo', 'name email avatar');
};
exports.updateTaskSlot = updateTaskSlot;
