"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendar = exports.getStats = exports.deleteHabit = exports.updateHabit = exports.uncompleteHabit = exports.completeHabit = exports.getTodaysHabits = exports.getHabits = exports.createHabit = void 0;
const habitService = __importStar(require("./habit.service"));
const createHabit = async (req, res, next) => {
    try {
        const habit = await habitService.createHabit(req.user.id, req.body);
        res.status(201).json(habit);
    }
    catch (error) {
        next(error);
    }
};
exports.createHabit = createHabit;
const getHabits = async (req, res, next) => {
    try {
        const { includeInactive } = req.query;
        const habits = await habitService.getUserHabits(req.user.id, includeInactive === "true");
        res.json(habits);
    }
    catch (error) {
        next(error);
    }
};
exports.getHabits = getHabits;
const getTodaysHabits = async (req, res, next) => {
    try {
        const habits = await habitService.getTodaysHabits(req.user.id);
        res.json(habits);
    }
    catch (error) {
        next(error);
    }
};
exports.getTodaysHabits = getTodaysHabits;
const completeHabit = async (req, res, next) => {
    try {
        const { habitId } = req.params;
        const { date, notes } = req.body;
        const habit = await habitService.completeHabit(habitId, req.user.id, date ? new Date(date) : undefined, notes);
        res.json(habit);
    }
    catch (error) {
        next(error);
    }
};
exports.completeHabit = completeHabit;
const uncompleteHabit = async (req, res, next) => {
    try {
        const { habitId } = req.params;
        const { date } = req.body;
        const habit = await habitService.uncompleteHabit(habitId, req.user.id, new Date(date));
        res.json(habit);
    }
    catch (error) {
        next(error);
    }
};
exports.uncompleteHabit = uncompleteHabit;
const updateHabit = async (req, res, next) => {
    try {
        const { habitId } = req.params;
        const habit = await habitService.updateHabit(habitId, req.user.id, req.body);
        res.json(habit);
    }
    catch (error) {
        next(error);
    }
};
exports.updateHabit = updateHabit;
const deleteHabit = async (req, res, next) => {
    try {
        const { habitId } = req.params;
        await habitService.deleteHabit(habitId, req.user.id);
        res.json({ message: "Habit deleted" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteHabit = deleteHabit;
const getStats = async (req, res, next) => {
    try {
        const { habitId } = req.params;
        const stats = await habitService.getHabitStats(habitId, req.user.id);
        res.json(stats);
    }
    catch (error) {
        next(error);
    }
};
exports.getStats = getStats;
const getCalendar = async (req, res, next) => {
    try {
        const { habitId } = req.params;
        const { year, month } = req.query;
        const calendar = await habitService.getHabitCalendar(habitId, req.user.id, parseInt(year), parseInt(month));
        res.json(calendar);
    }
    catch (error) {
        next(error);
    }
};
exports.getCalendar = getCalendar;
