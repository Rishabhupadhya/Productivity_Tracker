import { Router } from "express";
import {
  getTeam,
  getCurrentUser,
  createNewTeam,
  listUserTeams,
  getTeamById,
  switchTeam,
  inviteMember,
  cancelInvite,
  getInvites,
  acceptInvite,
  removeMember
} from "./team.controller";
import { getActivity } from "../activity/activity.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

// User routes
router.get("/me", authMiddleware, getCurrentUser);
router.get("/members", authMiddleware, getTeam);

// Team CRUD
router.post("/", authMiddleware, createNewTeam);
router.get("/", authMiddleware, listUserTeams);
router.get("/:teamId", authMiddleware, getTeamById);
router.post("/switch", authMiddleware, switchTeam);

// Invites
router.post("/:teamId/invite", authMiddleware, inviteMember);
router.delete("/:teamId/invite", authMiddleware, cancelInvite);
router.get("/invites/pending", authMiddleware, getInvites);
router.post("/:teamId/accept", authMiddleware, acceptInvite);

// Members
router.delete("/:teamId/members/:memberId", authMiddleware, removeMember);

// Activity
router.get("/:teamId/activity", authMiddleware, getActivity);

export default router;
