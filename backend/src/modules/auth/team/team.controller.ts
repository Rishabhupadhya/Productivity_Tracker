import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { getTeamMembers, getUserInfo } from "./team.service";

export const getTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const members = await getTeamMembers(req.user.id);
    res.json(members);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserInfo(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
