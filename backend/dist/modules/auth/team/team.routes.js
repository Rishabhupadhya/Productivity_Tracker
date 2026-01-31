"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const team_controller_1 = require("./team.controller");
const activity_controller_1 = require("../activity/activity.controller");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// User routes
router.get("/me", auth_middleware_1.authMiddleware, team_controller_1.getCurrentUser);
router.get("/members", auth_middleware_1.authMiddleware, team_controller_1.getTeam);
// Team CRUD
router.post("/", auth_middleware_1.authMiddleware, team_controller_1.createNewTeam);
router.get("/", auth_middleware_1.authMiddleware, team_controller_1.listUserTeams);
router.get("/:teamId", auth_middleware_1.authMiddleware, team_controller_1.getTeamById);
router.post("/switch", auth_middleware_1.authMiddleware, team_controller_1.switchTeam);
// Invites
router.post("/:teamId/invite", auth_middleware_1.authMiddleware, team_controller_1.inviteMember);
router.delete("/:teamId/invite", auth_middleware_1.authMiddleware, team_controller_1.cancelInvite);
router.get("/invites/pending", auth_middleware_1.authMiddleware, team_controller_1.getInvites);
router.post("/:teamId/accept", auth_middleware_1.authMiddleware, team_controller_1.acceptInvite);
// Members
router.delete("/:teamId/members/:memberId", auth_middleware_1.authMiddleware, team_controller_1.removeMember);
// Activity
router.get("/:teamId/activity", auth_middleware_1.authMiddleware, activity_controller_1.getActivity);
exports.default = router;
