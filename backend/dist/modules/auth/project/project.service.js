"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getUserProjects = exports.createProject = void 0;
const project_model_1 = require("./project.model");
const auth_model_1 = require("../auth.model");
const mongoose_1 = require("mongoose");
const createProject = async (userId, name, color = "#00ffff", icon = "📁") => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    const projectData = {
        name,
        color,
        icon,
        userId: new mongoose_1.Types.ObjectId(userId)
    };
    // If user has active team, add teamId
    if (user.activeTeamId) {
        projectData.teamId = user.activeTeamId;
    }
    return project_model_1.Project.create(projectData);
};
exports.createProject = createProject;
const getUserProjects = async (userId) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    // Get personal projects or team projects
    const query = {
        $or: [
            { userId, teamId: { $exists: false } },
            { userId, teamId: null }
        ]
    };
    // If user has active team, also get team projects
    if (user.activeTeamId) {
        query.$or.push({ teamId: user.activeTeamId });
    }
    return project_model_1.Project.find(query).sort({ createdAt: -1 });
};
exports.getUserProjects = getUserProjects;
const updateProject = async (projectId, userId, updates) => {
    const project = await project_model_1.Project.findById(projectId);
    if (!project)
        throw new Error("Project not found");
    // Check ownership
    if (project.userId.toString() !== userId) {
        throw new Error("Not authorized");
    }
    return project_model_1.Project.findByIdAndUpdate(projectId, { $set: updates }, { new: true });
};
exports.updateProject = updateProject;
const deleteProject = async (projectId, userId) => {
    const project = await project_model_1.Project.findById(projectId);
    if (!project)
        throw new Error("Project not found");
    // Check ownership
    if (project.userId.toString() !== userId) {
        throw new Error("Not authorized");
    }
    return project_model_1.Project.findByIdAndDelete(projectId);
};
exports.deleteProject = deleteProject;
