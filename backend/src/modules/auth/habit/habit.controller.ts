import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import * as habitService from "./habit.service";

export const createHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const habit = await habitService.createHabit(req.user.id, req.body);
    res.status(201).json(habit);
  } catch (error) {
    next(error);
  }
};

export const getHabits = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { includeInactive } = req.query;
    const habits = await habitService.getUserHabits(req.user.id, includeInactive === "true");
    res.json(habits);
  } catch (error) {
    next(error);
  }
};

export const getTodaysHabits = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const habits = await habitService.getTodaysHabits(req.user.id);
    res.json(habits);
  } catch (error) {
    next(error);
  }
};

export const completeHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { habitId } = req.params;
    const { date, notes } = req.body;
    const habit = await habitService.completeHabit(
      habitId,
      req.user.id,
      date ? new Date(date) : undefined,
      notes
    );
    res.json(habit);
  } catch (error) {
    next(error);
  }
};

export const uncompleteHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { habitId } = req.params;
    const { date } = req.body;
    const habit = await habitService.uncompleteHabit(habitId, req.user.id, new Date(date));
    res.json(habit);
  } catch (error) {
    next(error);
  }
};

export const updateHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { habitId } = req.params;
    const habit = await habitService.updateHabit(habitId, req.user.id, req.body);
    res.json(habit);
  } catch (error) {
    next(error);
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { habitId } = req.params;
    await habitService.deleteHabit(habitId, req.user.id);
    res.json({ message: "Habit deleted" });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { habitId } = req.params;
    const stats = await habitService.getHabitStats(habitId, req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getCalendar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { habitId } = req.params;
    const { year, month } = req.query;
    const calendar = await habitService.getHabitCalendar(
      habitId,
      req.user.id,
      parseInt(year as string),
      parseInt(month as string)
    );
    res.json(calendar);
  } catch (error) {
    next(error);
  }
};
