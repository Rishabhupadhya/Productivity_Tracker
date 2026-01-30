"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTaskDay = exports.getTasksByUser = exports.createTask = void 0;
const task_model_1 = require("./task.model");
const createTask = async (title, duration, day, userId) => {
    return task_model_1.Task.create({ title, duration, day, userId });
};
exports.createTask = createTask;
const getTasksByUser = async (userId) => {
    return task_model_1.Task.find({ userId });
};
exports.getTasksByUser = getTasksByUser;
const updateTaskDay = async (taskId, day, userId) => {
    return task_model_1.Task.findOneAndUpdate({ _id: taskId, userId }, { day }, { new: true });
};
exports.updateTaskDay = updateTaskDay;
const deleteTask = async (taskId, userId) => {
    return task_model_1.Task.findOneAndDelete({ _id: taskId, userId });
};
exports.deleteTask = deleteTask;
