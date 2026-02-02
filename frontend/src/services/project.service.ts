import api from "./api";

export interface Project {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getUserProjects = async (): Promise<Project[]> => {
  const response = await api.get("/projects");
  return response.data;
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
  const response = await api.post("/projects", projectData);
  return response.data;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<Project> => {
  const response = await api.put(`/projects/${projectId}`, updates);
  return response.data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};
