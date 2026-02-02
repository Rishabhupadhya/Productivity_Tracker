import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import * as goalService from "./goal.service";

export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goal = await goalService.createGoal(req.user.id, req.body);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

export const getGoals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const goals = await goalService.getUserGoals(req.user.id, status as string);
    res.json(goals);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    const goal = await goalService.updateGoal(goalId, req.user.id, req.body);
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    const { incrementValue } = req.body;
    const goal = await goalService.updateGoalProgress(goalId, req.user.id, incrementValue);
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    await goalService.deleteGoal(goalId, req.user.id);
    res.json({ message: "Goal deleted" });
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    const goal = await goalService.addGoalReview(goalId, req.user.id, req.body);
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const getReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    const reviews = await goalService.getGoalReviews(goalId, req.user.id);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

export const getProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    const progress = await goalService.getGoalProgress(goalId, req.user.id);
    res.json(progress);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalId, reviewId } = req.params;
    const goal = await goalService.deleteGoalReview(goalId, req.user.id, reviewId);
    res.json(goal);
  } catch (error) {
    next(error);
  }
};
