import { Task } from "./task.model";
import { User } from "../auth.model";

export const createTask = async (
  title: string,
  duration: string,
  day: string,
  startTime: string,
  userId: string,
  assignedTo?: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  return Task.create({ 
    title, 
    duration, 
    day, 
    startTime, 
    userId,
    assignedTo: assignedTo || userId,
    workspaceId: user.workspaceId 
  });
};

export const getTasksByUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Get all tasks in the user's workspace
  return Task.find({ workspaceId: user.workspaceId }).populate('assignedTo', 'name email avatar');
};

export const updateTaskDay = async (
  taskId: string,
  day: string,
  userId: string
) => {
  return Task.findOneAndUpdate(
    { _id: taskId, userId },
    { day },
    { new: true }
  );
};

export const deleteTask = async (taskId: string, userId: string) => {
  return Task.findOneAndDelete({ _id: taskId, userId });
};

export const updateTaskSlot = async (
  taskId: string,
  day: string,
  startTime: string,
  userId: string
) => {
  return Task.findOneAndUpdate(
    { _id: taskId, userId },
    { day, startTime },
    { new: true }
  );
};
