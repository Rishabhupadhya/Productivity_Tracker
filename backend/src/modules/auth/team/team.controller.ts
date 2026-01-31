import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import {
  getTeamMembers,
  getUserInfo,
  createTeam,
  getUserTeams,
  getTeamDetails,
  switchActiveTeam,
  inviteMemberToTeam,
  cancelTeamInvite,
  getPendingInvites,
  acceptTeamInvite,
  removeMemberFromTeam
} from "./team.service";

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

export const createNewTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Team name is required" });
    }
    const team = await createTeam(req.user.id, name);
    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
};

export const listUserTeams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teams = await getUserTeams(req.user.id);
    res.json(teams);
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const team = await getTeamDetails(teamId, req.user.id);
    res.json(team);
  } catch (error) {
    next(error);
  }
};

export const switchTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.body;
    const user = await switchActiveTeam(req.user.id, teamId);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { email, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const team = await inviteMemberToTeam(teamId, req.user.id, email, role);
    res.json(team);
  } catch (error) {
    next(error);
  }
};

export const cancelInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const team = await cancelTeamInvite(teamId, req.user.id, email);
    res.json(team);
  } catch (error) {
    next(error);
  }
};

export const getInvites = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserInfo(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const invites = await getPendingInvites(user.email);
    res.json(invites);
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const team = await acceptTeamInvite(teamId, req.user.id);
    res.json(team);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId, memberId } = req.params;
    const team = await removeMemberFromTeam(teamId, req.user.id, memberId);
    res.json(team);
  } catch (error) {
    next(error);
  }
};
