import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { getTeamActivity, getUserActivity, getAllUserActivity } from "./activity.service";

export const getActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const userOnly = req.query.userOnly === 'true';
    
    let activities;
    if (userOnly) {
      activities = await getUserActivity(teamId, req.user.id, limit);
    } else {
      activities = await getTeamActivity(teamId, limit);
    }
    
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

export const getUserActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const activities = await getAllUserActivity(req.user.id, limit);
    res.json(activities);
  } catch (error) {
    next(error);
  }
};
