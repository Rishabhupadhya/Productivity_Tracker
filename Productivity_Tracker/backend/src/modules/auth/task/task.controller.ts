import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { createTask, getTasksByUser, updateTaskSlot, deleteTask } from "./task.service";

export const addTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, duration, day, startTime, assignedTo } = req.body;
    const task = await createTask(title, duration, day, startTime, req.user.id, assignedTo);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await getTasksByUser(req.user.id);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const moveTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId, day, startTime } = req.body;
    const task = await updateTaskSlot(taskId, day, startTime, req.user.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const removeTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteTask(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
