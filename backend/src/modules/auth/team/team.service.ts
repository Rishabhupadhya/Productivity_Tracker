import { User } from "../auth.model";
import { Team } from "./team.model";
import mongoose, { Types } from "mongoose";
import { logActivity } from "../activity/activity.service";

// Helper to check if user is team admin
export const isTeamAdmin = async (teamId: string, userId: string): Promise<boolean> => {
  const team = await Team.findById(teamId);
  if (!team) return false;

  const member = team.members.find(m => m.userId.toString() === userId);
  return member?.role === "admin";
};

export const getTeamMembers = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  return User.find({ workspaceId: user.workspaceId }).select('name email avatar');
};

export const getUserInfo = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.warn("getUserInfo: Invalid userId", userId);
    return null;
  }
  const user = await User.findById(userId).select('name email avatar workspaceId activeTeamId timezone workingHours defaultTaskDuration settings');

  if (!user) return null;

  // Get user's role in active team if they have one
  let teamRole = null;
  if (user.activeTeamId) {
    const team = await Team.findById(user.activeTeamId);
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

// Create a new team
export const createTeam = async (userId: string, name: string) => {
  const team = await Team.create({
    name,
    createdBy: userId,
    members: [
      {
        userId: new Types.ObjectId(userId),
        role: "admin",
        joinedAt: new Date()
      }
    ]
  });

  // Set as active team for creator
  await User.findByIdAndUpdate(userId, { activeTeamId: team._id });

  // Log activity
  await logActivity({
    teamId: team._id.toString(),
    userId,
    action: "team_created",
    targetType: "team",
    targetId: team._id.toString(),
    details: { memberName: "Team creator" }
  });

  return team;
};

// Get all teams user is a member of
export const getUserTeams = async (userId: string) => {
  const teams = await Team.find({
    "members.userId": userId
  }).populate("createdBy", "name email avatar");

  return teams;
};

// Get team details
export const getTeamDetails = async (teamId: string, userId: string) => {
  const team = await Team.findById(teamId)
    .populate("members.userId", "name email avatar")
    .populate("createdBy", "name email avatar");

  if (!team) throw new Error("Team not found");

  // Check if user is a member
  const isMember = team.members.some(m => m.userId._id.toString() === userId);
  if (!isMember) throw new Error("Access denied");

  return team;
};

// Switch active team
export const switchActiveTeam = async (userId: string, teamId: string | null) => {
  if (teamId) {
    const team = await Team.findById(teamId);
    if (!team) throw new Error("Team not found");

    // Check if user is a member
    const isMember = team.members.some(m => m.userId.toString() === userId);
    if (!isMember) throw new Error("Not a team member");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { activeTeamId: teamId || null },
    { new: true }
  ).select('name email avatar workspaceId activeTeamId');

  return user;
};

// Invite member to team
export const inviteMemberToTeam = async (
  teamId: string,
  inviterUserId: string,
  email: string,
  role: "admin" | "member" = "member"
) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error("Team not found");

  // Check if inviter is admin
  const inviter = team.members.find(m => m.userId.toString() === inviterUserId);
  if (!inviter || inviter.role !== "admin") {
    throw new Error("Only admins can invite members");
  }

  // Check if already invited
  const existingInvite = team.invites.find(
    i => i.email === email && i.status === "pending"
  );
  if (existingInvite) throw new Error("User already invited");

  // Check if already a member
  const invitedUser = await User.findOne({ email });
  if (invitedUser) {
    const isMember = team.members.some(
      m => m.userId.toString() === invitedUser._id.toString()
    );
    if (isMember) throw new Error("User is already a team member");
  }

  team.invites.push({
    email,
    role,
    invitedBy: new Types.ObjectId(inviterUserId),
    invitedAt: new Date(),
    status: "pending"
  });

  await team.save();

  // Log activity
  await logActivity({
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

// Cancel/delete a pending invite
export const cancelTeamInvite = async (
  teamId: string,
  adminUserId: string,
  email: string
) => {
  console.log('cancelTeamInvite called:', { teamId, adminUserId, email });

  const team = await Team.findById(teamId);
  if (!team) throw new Error("Team not found");

  console.log('Team found:', team.name);
  console.log('Current invites:', team.invites);

  // Check if user is admin
  const admin = team.members.find(m => m.userId.toString() === adminUserId);
  console.log('Admin check:', { admin, role: admin?.role });

  if (!admin || admin.role !== "admin") {
    throw new Error("Only admins can cancel invites");
  }

  // Count before
  const beforeCount = team.invites.length;

  // Remove the invite (more flexible - remove by email regardless of status)
  team.invites = team.invites.filter(i => i.email !== email);

  console.log('Invites after filter:', { before: beforeCount, after: team.invites.length });

  await team.save();
  console.log('Team saved successfully');

  return team;
};

// Get pending invites for user
export const getPendingInvites = async (email: string) => {
  const teams = await Team.find({
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

// Accept team invite
export const acceptTeamInvite = async (teamId: string, userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const team = await Team.findById(teamId);
  if (!team) throw new Error("Team not found");

  const invite = team.invites.find(
    i => i.email === user.email && i.status === "pending"
  );
  if (!invite) throw new Error("No pending invite found");

  // Add user to team members
  team.members.push({
    userId: new Types.ObjectId(userId),
    role: invite.role,
    joinedAt: new Date()
  });

  // Remove the accepted invite from the invites list
  team.invites = team.invites.filter(i => !(i.email === user.email && i.status === "pending"));
  await team.save();

  // Set this team as the user's active team if they don't have one
  if (!user.activeTeamId) {
    await User.findByIdAndUpdate(userId, { activeTeamId: team._id });
  }

  // Log activity
  await logActivity({
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

// Remove member from team
export const removeMemberFromTeam = async (
  teamId: string,
  adminUserId: string,
  memberUserId: string
) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error("Team not found");

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
  const removedUser = await User.findById(memberUserId);
  await logActivity({
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
