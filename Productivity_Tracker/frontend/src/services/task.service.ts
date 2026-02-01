import api from "./api";

export const fetchTasks = async () => {
  const res = await api.get("/tasks");
  return res.data;
};

export const createTask = async (task: {
  title: string;
  duration: string;
  day: string;
  startTime: string;
  assignedTo?: string;
}) => {
  const res = await api.post("/tasks", task);
  return res.data;
};

export const moveTask = async (taskId: string, day: string, startTime?: string) => {
  await api.patch(`/tasks/${taskId}`, { taskId, day, startTime });
};

export const deleteTask = async (taskId: string) => {
  await api.delete(`/tasks/${taskId}`);
};
