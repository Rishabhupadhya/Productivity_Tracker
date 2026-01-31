"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMemberFromTeam = exports.acceptTeamInvite = exports.getPendingInvites = exports.cancelTeamInvite = exports.inviteMemberToTeam = exports.switchActiveTeam = exports.getTeamDetails = exports.getUserTeams = exports.createTeam = exports.getUserInfo = exports.getTeamMembers = exports.isTeamAdmin = void 0;
const auth_model_1 = require("../auth.model");
const team_model_1 = require("./team.model");
const mongoose_1 = require("mongoose");
const activity_service_1 = require("../activity/activity.service");
// Helper to check if user is team admin
const isTeamAdmin = async (teamId, userId) => {
    const team = await team_model_1.Team.findById(teamId);
    if (!team)
        return false;
    const member = team.members.find(m => m.userId.toString() === userId);
    return member?.role === "admin";
};
exports.isTeamAdmin = isTeamAdmin;
const getTeamMembers = async (userId) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    return auth_model_1.User.find({ workspaceId: user.workspaceId }).select('name email avatar');
};
exports.getTeamMembers = getTeamMembers;
const getUserInfo = async (userId) => {
    const user = await auth_model_1.User.findById(userId).select('name email avatar workspaceId activeTeamId timezone workingHours defaultTaskDuration settings');
    if (!user)
        return null;
    // Get user's role in active team if they have one
    let teamRole = null;
    if (user.activeTeamId) {
        const team = await team_model_1.Team.findById(user.activeTeamId);
        if (team) {
            const member = team.members.find(m => m.userId.toString() === userId);
            if (member) {
                teamRole = member.role;
            }
        }
    }
    return {
        ...user.toObject(),
        teamRole
    };
};
exports.getUserInfo = getUserInfo;
// Create a new team
const createTeam = async (userId, name) => {
    const team = await team_model_1.Team.create({
        name,
        createdBy: userId,
        members: [
            {
                userId: new mongoose_1.Types.ObjectId(userId),
                role: "admin",
                joinedAt: new Date()
            }
        ]
    });
    // Set as active team for creator
    await auth_model_1.User.findByIdAndUpdate(userId, { activeTeamId: team._id });
    // Log activity
    await (0, activity_service_1.logActivity)({
        teamId: team._id.toString(),
        userId,
        action: "team_created",
        targetType: "team",
        targetId: team._id.toString(),
        details: { memberName: "Team creator" }
    });
    return team;
};
exports.createTeam = createTeam;
// Get all teams user is a member of
const getUserTeams = async (userId) => {
    const teams = await team_model_1.Team.find({
        "members.userId": userId
    }).populate("createdBy", "name email avatar");
    return teams;
};
exports.getUserTeams = getUserTeams;
// Get team details
const getTeamDetails = async (teamId, userId) => {
    const team = await team_model_1.Team.findById(teamId)
        .populate("members.userId", "name email avatar")
        .populate("createdBy", "name email avatar");
    if (!team)
        throw new Error("Team not found");
    // Check if user is a member
    const isMember = team.members.some(m => m.userId._id.toString() === userId);
    if (!isMember)
        throw new Error("Access denied");
    return team;
};
exports.getTeamDetails = getTeamDetails;
// Switch active team
const switchActiveTeam = async (userId, teamId) => {
    if (teamId) {
        const team = await team_model_1.Team.findById(teamId);
        if (!team)
            throw new Error("Team not found");
        // Check if user is a member
        const isMember = team.members.some(m => m.userId.toString() === userId);
        if (!isMember)
            throw new Error("Not a team member");
    }
    const user = await auth_model_1.User.findByIdAndUpdate(userId, { activeTeamId: teamId || null }, { new: true }).select('name email avatar workspaceId activeTeamId');
    return user;
};
exports.switchActiveTeam = switchActiveTeam;
// Invite member to team
const inviteMemberToTeam = async (teamId, inviterUserId, email, role = "member") => {
    const team = await team_model_1.Team.findById(teamId);
    if (!team)
        throw new Error("Team not found");
    // Check if inviter is admin
    const inviter = team.members.find(m => m.userId.toString() === inviterUserId);
    if (!inviter || inviter.role !== "admin") {
        throw new Error("Only admins can invite members");
    }
    // Check if already invited
    const existingInvite = team.invites.find(i => i.email === email && i.status === "pending");
    if (existingInvite)
        throw new Error("User already invited");
    // Check if already a member
    const invitedUser = await auth_model_1.User.findOne({ email });
    if (invitedUser) {
        const isMember = team.members.some(m => m.userId.toString() === invitedUser._id.toString());
        if (isMember)
            throw new Error("User is already a team member");
    }
    team.invites.push({
        email,
        role,
        invitedBy: new mongoose_1.Types.ObjectId(inviterUserId),
        invitedAt: new Date(),
        status: "pending"
    });
    await team.save();
    // Log activity
    await (0, activity_service_1.logActivity)({
        teamId,
        userId: inviterUserId,
        action: "member_invited",
        targetType: "member",
        details: {
            memberEmail: email,
            role
        }
    });
    return team;
};
exports.inviteMemberToTeam = inviteMemberToTeam;
// Cancel/delete a pending invite
const cancelTeamInvite = async (teamId, adminUserId, email) => {
    const team = await team_model_1.Team.findById(teamId);
    if (!team)
        throw new Error("Team not found");
    // Check if user is admin
    const admin = team.members.find(m => m.userId.toString() === adminUserId);
    if (!admin || admin.role !== "admin") {
        throw new Error("Only admins can cancel invites");
    }
    // Remove the invite
    team.invites = team.invites.filter(i => !(i.email === email && i.status === "pending"));
    await team.save();
    return team;
};
exports.cancelTeamInvite = cancelTeamInvite;
// Get pending invites for user
const getPendingInvites = async (email) => {
    const teams = await team_model_1.Team.find({
        "invites.email": email,
        "invites.status": "pending"
    })
        .populate("createdBy", "name email")
        .select("name invites createdBy");
    return teams.map(team => ({
        teamId: team._id,
        teamName: team.name,
        invitedBy: team.createdBy,
        invite: team.invites.find(i => i.email === email && i.status === "pending")
    }));
};
exports.getPendingInvites = getPendingInvites;
// Accept team invite
const acceptTeamInvite = async (teamId, userId) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    const team = await team_model_1.Team.findById(teamId);
    if (!team)
        throw new Error("Team not found");
    const invite = team.invites.find(i => i.email === user.email && i.status === "pending");
    if (!invite)
        throw new Error("No pending invite found");
    // Add user to team members
    team.members.push({
        userId: new mongoose_1.Types.ObjectId(userId),
        role: invite.role,
        joinedAt: new Date()
    });
    // Update invite status
    invite.status = "accepted";
    await team.save();
    // Log activity
    await (0, activity_service_1.logActivity)({
        teamId,
        userId,
        action: "member_joined",
        targetType: "member",
        targetId: userId,
        details: {
            memberName: user.name,
            memberEmail: user.email,
            role: invite.role
        }
    });
    return team;
};
exports.acceptTeamInvite = acceptTeamInvite;
// Remove member from team
const removeMemberFromTeam = async (teamId, adminUserId, memberUserId) => {
    const team = await team_model_1.Team.findById(teamId);
    if (!team)
        throw new Error("Team not found");
    // Check if admin
    const admin = team.members.find(m => m.userId.toString() === adminUserId);
    if (!admin || admin.role !== "admin") {
        throw new Error("Only admins can remove members");
    }
    // Can't remove creator
    if (team.createdBy.toString() === memberUserId) {
        throw new Error("Cannot remove team creator");
    }
    team.members = team.members.filter(m => m.userId.toString() !== memberUserId);
    await team.save();
    // Log activity
    const removedUser = await auth_model_1.User.findById(memberUserId);
    await (0, activity_service_1.logActivity)({
        teamId,
        userId: adminUserId,
        action: "member_removed",
        targetType: "member",
        targetId: memberUserId,
        details: {
            memberName: removedUser?.name || "Unknown",
            memberEmail: removedUser?.email || ""
        }
    });
    return team;
};
exports.removeMemberFromTeam = removeMemberFromTeam;
