import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { getTeamActivity } from "./activity.service";

export const getActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const activities = await getTeamActivity(teamId, limit);
    res.json(activities);
  } catch (error) {
    next(error);
  }
};
