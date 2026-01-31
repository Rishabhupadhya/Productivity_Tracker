import { useEffect, useRef, useState } from "react";
import {
  fetchTasks,
  createTask,
  moveTask as moveTaskApi,
  deleteTask as deleteTaskApi
} from "../services/task.service";

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [undoTask, setUndoTask] = useState<any | null>(null);
  const deleteTimer = useRef<any>(null);

  useEffect(() => {
    fetchTasks().then(setTasks);
  }, []);

  const addTask = async (task: any) => {
    const newTask = await createTask(task);
    setTasks((prev) => [...prev, newTask]);
  };

  const moveTask = async (taskId: string, day: string, startTime?: string) => {
    await moveTaskApi(taskId, day, startTime);
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, day, ...(startTime && { startTime }) } : t))
    );
  };

  const deleteTask = (task: any) => {
    // Remove immediately from UI
    setTasks((prev) => prev.filter((t) => t._id !== task._id));
    setUndoTask(task);

    // Delay backend delete
    deleteTimer.current = setTimeout(async () => {
      await deleteTaskApi(task._id);
      setUndoTask(null);
    }, 5000);
  };

  const undoDelete = () => {
    if (!undoTask) return;

    clearTimeout(deleteTimer.current);
    setTasks((prev) => [...prev, undoTask]);
    setUndoTask(null);
  };

  return {
    tasks,
    addTask,
    moveTask,
    deleteTask,
    undoTask,
    undoDelete
  };
}
