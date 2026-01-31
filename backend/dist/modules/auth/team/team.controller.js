"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.acceptInvite = exports.getInvites = exports.cancelInvite = exports.inviteMember = exports.switchTeam = exports.getTeamById = exports.listUserTeams = exports.createNewTeam = exports.getCurrentUser = exports.getTeam = void 0;
const team_service_1 = require("./team.service");
const getTeam = async (req, res, next) => {
    try {
        const members = await (0, team_service_1.getTeamMembers)(req.user.id);
        res.json(members);
    }
    catch (error) {
        next(error);
    }
};
exports.getTeam = getTeam;
const getCurrentUser = async (req, res, next) => {
    try {
        const user = await (0, team_service_1.getUserInfo)(req.user.id);
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
const createNewTeam = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Team name is required" });
        }
        const team = await (0, team_service_1.createTeam)(req.user.id, name);
        res.status(201).json(team);
    }
    catch (error) {
        next(error);
    }
};
exports.createNewTeam = createNewTeam;
const listUserTeams = async (req, res, next) => {
    try {
        const teams = await (0, team_service_1.getUserTeams)(req.user.id);
        res.json(teams);
    }
    catch (error) {
        next(error);
    }
};
exports.listUserTeams = listUserTeams;
const getTeamById = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const team = await (0, team_service_1.getTeamDetails)(teamId, req.user.id);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
};
exports.getTeamById = getTeamById;
const switchTeam = async (req, res, next) => {
    try {
        const { teamId } = req.body;
        const user = await (0, team_service_1.switchActiveTeam)(req.user.id, teamId);
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.switchTeam = switchTeam;
const inviteMember = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { email, role } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const team = await (0, team_service_1.inviteMemberToTeam)(teamId, req.user.id, email, role);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
};
exports.inviteMember = inviteMember;
const cancelInvite = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const team = await (0, team_service_1.cancelTeamInvite)(teamId, req.user.id, email);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
};
exports.cancelInvite = cancelInvite;
const getInvites = async (req, res, next) => {
    try {
        const user = await (0, team_service_1.getUserInfo)(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const invites = await (0, team_service_1.getPendingInvites)(user.email);
        res.json(invites);
    }
    catch (error) {
        next(error);
    }
};
exports.getInvites = getInvites;
const acceptInvite = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const team = await (0, team_service_1.acceptTeamInvite)(teamId, req.user.id);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
};
exports.acceptInvite = acceptInvite;
const removeMember = async (req, res, next) => {
    try {
        const { teamId, memberId } = req.params;
        const team = await (0, team_service_1.removeMemberFromTeam)(teamId, req.user.id, memberId);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
};
exports.removeMember = removeMember;
