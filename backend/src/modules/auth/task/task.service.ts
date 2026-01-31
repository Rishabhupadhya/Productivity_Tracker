import { Task } from "./task.model";

export const createTask = async (
  title: string,
  duration: string,
  day: string,
  startTime: string,
  userId: string
) => {
  return Task.create({ title, duration, day, startTime, userId });
};


export const getTasksByUser = async (userId: string) => {
  return Task.find({ userId });
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
