import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import * as momentumService from "./momentum.service";

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await momentumService.getMomentumStats(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
