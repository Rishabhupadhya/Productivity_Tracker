import { Project } from "./project.model";
import { User } from "../auth.model";
import { Types } from "mongoose";

export const createProject = async (
  userId: string,
  name: string,
  color: string = "#00ffff",
  icon: string = "📁"
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const projectData: any = {
    name,
    color,
    icon,
    userId: new Types.ObjectId(userId)
  };

  // If user has active team, add teamId
  if (user.activeTeamId) {
    projectData.teamId = user.activeTeamId;
  }

  return Project.create(projectData);
};

export const getUserProjects = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Get personal projects or team projects
  const query: any = {
    $or: [
      { userId, teamId: { $exists: false } },
      { userId, teamId: null }
    ]
  };

  // If user has active team, also get team projects
  if (user.activeTeamId) {
    query.$or.push({ teamId: user.activeTeamId });
  }

  return Project.find(query).sort({ createdAt: -1 });
};

export const updateProject = async (
  projectId: string,
  userId: string,
  updates: { name?: string; color?: string; icon?: string }
) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  // Check ownership
  if (project.userId.toString() !== userId) {
    throw new Error("Not authorized");
  }

  return Project.findByIdAndUpdate(projectId, { $set: updates }, { new: true });
};

export const deleteProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  // Check ownership
  if (project.userId.toString() !== userId) {
    throw new Error("Not authorized");
  }

  return Project.findByIdAndDelete(projectId);
};
