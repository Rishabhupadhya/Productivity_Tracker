import api from "./api";

export interface Project {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  notes?: string;
  color?: string;
  icon?: string;
  completed: boolean;
  completedAt?: Date;
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
  const response = await api.patch(`/projects/${projectId}`, updates);
  return response.data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};

export const toggleProjectComplete = async (projectId: string, completed: boolean): Promise<Project> => {
  const response = await api.patch(`/projects/${projectId}/complete`, { completed });
  return response.data;
};
