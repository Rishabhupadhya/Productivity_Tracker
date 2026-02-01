import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { createProject, getUserProjects, updateProject, deleteProject } from "./project.service";

export const createNewProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }
    const project = await createProject(req.user.id, name, color, icon);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projects = await getUserProjects(req.user.id);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const updateProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const project = await updateProject(projectId, req.user.id, req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    await deleteProject(projectId, req.user.id);
    res.json({ message: "Project deleted" });
  } catch (error) {
    next(error);
  }
};
