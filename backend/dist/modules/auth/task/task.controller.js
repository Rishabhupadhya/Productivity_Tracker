"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTask = exports.moveTask = exports.getTasks = exports.addTask = void 0;
const task_service_1 = require("./task.service");
const addTask = async (req, res, next) => {
    try {
        const { title, duration, day, startTime, assignedTo } = req.body;
        const task = await (0, task_service_1.createTask)(title, duration, day, startTime, req.user.id, assignedTo);
        res.status(201).json(task);
    }
    catch (error) {
        next(error);
    }
};
exports.addTask = addTask;
const getTasks = async (req, res, next) => {
    try {
        const tasks = await (0, task_service_1.getTasksByUser)(req.user.id);
        res.json(tasks);
    }
    catch (error) {
        next(error);
    }
};
exports.getTasks = getTasks;
const moveTask = async (req, res, next) => {
    try {
        const { taskId, day, startTime } = req.body;
        const task = await (0, task_service_1.updateTaskSlot)(taskId, day, startTime, req.user.id);
        res.json(task);
    }
    catch (error) {
        next(error);
    }
};
exports.moveTask = moveTask;
const removeTask = async (req, res, next) => {
    try {
        await (0, task_service_1.deleteTask)(req.params.id, req.user.id);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.removeTask = removeTask;
