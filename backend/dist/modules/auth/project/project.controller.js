"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProjectById = exports.updateProjectById = exports.listProjects = exports.createNewProject = void 0;
const project_service_1 = require("./project.service");
const createNewProject = async (req, res, next) => {
    try {
        const { name, color, icon } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Project name is required" });
        }
        const project = await (0, project_service_1.createProject)(req.user.id, name, color, icon);
        res.status(201).json(project);
    }
    catch (error) {
        next(error);
    }
};
exports.createNewProject = createNewProject;
const listProjects = async (req, res, next) => {
    try {
        const projects = await (0, project_service_1.getUserProjects)(req.user.id);
        res.json(projects);
    }
    catch (error) {
        next(error);
    }
};
exports.listProjects = listProjects;
const updateProjectById = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await (0, project_service_1.updateProject)(projectId, req.user.id, req.body);
        res.json(project);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProjectById = updateProjectById;
const deleteProjectById = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        await (0, project_service_1.deleteProject)(projectId, req.user.id);
        res.json({ message: "Project deleted" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProjectById = deleteProjectById;
