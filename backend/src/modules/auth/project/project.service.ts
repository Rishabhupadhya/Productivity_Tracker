import { Project } from "./project.model";
import { User } from "../auth.model";
import { Types } from "mongoose";
import { logActivity } from "../activity/activity.service";

export const createProject = async (
  userId: string,
  name: string,
  color: string = "#00ffff",
  icon: string = "📁",
  description: string = "",
  notes: string = ""
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const projectData: any = {
    name,
    description,
    notes,
    color,
    icon,
    userId: new Types.ObjectId(userId)
  };

  // If user has active team, add teamId
  if (user.activeTeamId) {
    projectData.teamId = user.activeTeamId;
  }

  const project = await Project.create(projectData);

  // Log activity
  await logActivity({
    teamId: projectData.teamId?.toString() || "",
    userId,
    action: "project_created",
    targetType: "project",
    targetId: project._id.toString(),
    details: { projectName: name }
  });

  return project;
};

export const getUserProjects = async (userId: string) => {
  try {
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
  } catch (error) {
    console.error("Error in getUserProjects:", error);
    throw new Error(`Failed to get projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateProject = async (
  projectId: string,
  userId: string,
  updates: { name?: string; description?: string; notes?: string; color?: string; icon?: string; completed?: boolean }
) => {
  // If marking as completed, set completedAt
  if (updates.completed === true) {
    (updates as any).completedAt = new Date();
  } else if (updates.completed === false) {
    (updates as any).completedAt = null;
  }
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  // Check ownership
  if (project.userId.toString() !== userId) {
    throw new Error("Not authorized");
  }

  const updatedProject = await Project.findByIdAndUpdate(projectId, { $set: updates }, { new: true });

  // Log activity
  if (updatedProject) {
    await logActivity({
      teamId: project.teamId?.toString() || "",
      userId,
      action: updates.completed !== undefined ? (updates.completed ? "project_completed" : "project_uncompleted") : "project_updated",
      targetType: "project",
      targetId: projectId,
      details: { projectName: updatedProject.name, changes: Object.keys(updates).join(", ") }
    });
  }

  return updatedProject;
};

export const deleteProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  // Check ownership
  if (project.userId.toString() !== userId) {
    throw new Error("Not authorized");
  }

  const deletedProject = await Project.findByIdAndDelete(projectId);

  // Log activity
  if (deletedProject) {
    await logActivity({
      teamId: project.teamId?.toString() || "",
      userId,
      action: "project_deleted",
      targetType: "project",
      targetId: projectId,
      details: { projectName: deletedProject.name }
    });
  }

  return deletedProject;
};
