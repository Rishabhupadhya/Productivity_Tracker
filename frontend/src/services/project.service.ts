import { api } from "./api";

export interface Project {
  _id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  teamId?: string;
  createdAt: string;
}

export const createProject = async (name: string, color: string = "#00ffff", icon: string = "📁"): Promise<Project> => {
  const res = await api.post("/projects", { name, color, icon });
  return res.data;
};

export const getUserProjects = async (): Promise<Project[]> => {
  const res = await api.get("/projects");
  return res.data;
};

export const updateProject = async (projectId: string, updates: { name?: string; color?: string; icon?: string }): Promise<Project> => {
  const res = await api.patch(`/projects/${projectId}`, updates);
  return res.data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};
