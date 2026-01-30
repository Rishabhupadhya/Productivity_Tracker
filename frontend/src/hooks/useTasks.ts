import { useEffect, useState } from "react";
import {
  fetchTasks,
  createTask,
  moveTask as moveTaskApi,
  deleteTask as deleteTaskApi
} from "../services/task.service";

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks().then(setTasks);
  }, []);

  const addTask = async (task: any) => {
    const newTask = await createTask(task);
    setTasks((prev) => [...prev, newTask]);
  };

  const moveTask = async (taskId: string, day: string) => {
    await moveTaskApi(taskId, day);
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, day } : t))
    );
  };

  const deleteTask = async (taskId: string) => {
    await deleteTaskApi(taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  return { tasks, addTask, moveTask, deleteTask };
}
