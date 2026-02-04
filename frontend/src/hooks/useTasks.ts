import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchTasks,
  createTask,
  moveTask as moveTaskApi,
  deleteTask as deleteTaskApi
} from "../services/task.service";

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState("My Work");
  const [undoTask, setUndoTask] = useState<any | null>(null);
  const deleteTimer = useRef<any>(null);


  const filterTasks = useCallback((taskList: any[], view: string) => {
    if (!Array.isArray(taskList)) {
      console.warn("filterTasks: taskList is not an array", taskList);
      setTasks([]);
      return;
    }

    if (view === "My Work") {
      // Show only personal tasks (no teamId)
      setTasks(taskList.filter(t => t && !t.teamId));
    } else if (view === "Teams") {
      // Show only team tasks (with teamId)
      setTasks(taskList.filter(t => t && t.teamId));
    } else {
      setTasks(taskList);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const fetchedTasks = await fetchTasks();
      if (Array.isArray(fetchedTasks)) {
        setAllTasks(fetchedTasks);
        filterTasks(fetchedTasks, currentView);
      } else {
        console.warn("loadTasks: received non-array data", fetchedTasks);
        setAllTasks([]);
        setTasks([]);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setAllTasks([]);
      setTasks([]);
    }
  }, [currentView, filterTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const handleViewChange = (e: any) => {
      const view = e.detail.view;
      setCurrentView(view);
      filterTasks(allTasks, view);
    };

    const handleTeamChange = () => {
      loadTasks();
    };

    window.addEventListener('viewChanged', handleViewChange);
    window.addEventListener('teamChanged', handleTeamChange);
    return () => {
      window.removeEventListener('viewChanged', handleViewChange);
      window.removeEventListener('teamChanged', handleTeamChange);
    };
  }, [allTasks, filterTasks, loadTasks]);

  const addTask = useCallback(async (task: any) => {
    const newTask = await createTask(task);
    const updatedAllTasks = [...allTasks, newTask];
    setAllTasks(updatedAllTasks);
    filterTasks(updatedAllTasks, currentView);
  }, [allTasks, currentView, filterTasks]);

  const moveTask = useCallback(async (taskId: string, day: string, startTime?: string) => {
    await moveTaskApi(taskId, day, startTime);
    const updatedAllTasks = allTasks.map((t) =>
      t._id === taskId ? { ...t, day, ...(startTime && { startTime }) } : t
    );
    setAllTasks(updatedAllTasks);
    filterTasks(updatedAllTasks, currentView);
  }, [allTasks, currentView, filterTasks]);

  const deleteTask = useCallback((task: any) => {
    // Remove immediately from UI
    const updatedAllTasks = allTasks.filter((t) => t._id !== task._id);
    setAllTasks(updatedAllTasks);
    filterTasks(updatedAllTasks, currentView);
    setUndoTask(task);

    // Delay backend delete
    deleteTimer.current = setTimeout(async () => {
      await deleteTaskApi(task._id);
      setUndoTask(null);
    }, 5000);
  }, [allTasks, currentView, filterTasks]);

  const undoDelete = useCallback(() => {
    if (!undoTask) return;

    clearTimeout(deleteTimer.current);
    const updatedAllTasks = [...allTasks, undoTask];
    setAllTasks(updatedAllTasks);
    filterTasks(updatedAllTasks, currentView);
    setUndoTask(null);
  }, [undoTask, allTasks, currentView, filterTasks]);

  return {
    tasks,
    addTask,
    moveTask,
    deleteTask,
    undoTask,
    undoDelete,
    refreshTasks: loadTasks
  };
}
