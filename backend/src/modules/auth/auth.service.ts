import bcrypt from "bcrypt";
import { User } from "./auth.model";
import { signToken } from "../../utils/jwt";
import { Team } from "./team/team.model";
import { Types } from "mongoose";
import crypto from "crypto";

export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error("User not found");

  if (user.authMethod === 'oauth') {
    throw new Error("This account use OAuth. Please login with your provider.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  return { user, token };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) throw new Error("Invalid or expired reset token");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Also clear any lockouts
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = undefined;

  await user.save();
  return user;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  workspaceId: string = "default"
) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const avatar = name.charAt(0).toUpperCase();
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    workspaceId,
    avatar
  });

  // Auto-accept any pending team invites for this email
  const teamsWithInvites = await Team.find({
    "invites.email": email,
    "invites.status": "pending"
  });

  for (const team of teamsWithInvites) {
    const invite = team.invites.find(
      i => i.email === email && i.status === "pending"
    );

    if (invite) {
      // Add user to team members
      team.members.push({
        userId: new Types.ObjectId(user._id),
        role: invite.role,
        joinedAt: new Date()
      });

      // Update invite status
      invite.status = "accepted";
      await team.save();

      // Set first team as active if user doesn't have one
      if (!user.activeTeamId) {
        user.activeTeamId = team._id;
        await user.save();
      }
    }
  }

  const token = signToken({ id: user._id, email: user.email });
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }
  };
};

export const loginUser = async (email: string, password: string) => {
  // Validate input types to prevent NoSQL injection
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid credentials');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error("User not found");

  // Check if account is locked
  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    const unlockTime = user.accountLockedUntil.toLocaleTimeString();
    throw new Error(`Account locked due to multiple failed login attempts. Try again after ${unlockTime}`);
  }

  if (!user.password) {
    throw new Error("This account uses OAuth. Please login with your OAuth provider.");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    // Increment failed login attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Lock account after 5 failed attempts for 30 minutes
    if (user.failedLoginAttempts >= 5) {
      user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      throw new Error("Account locked due to multiple failed login attempts. Try again in 30 minutes.");
    }

    await user.save();
    throw new Error("Invalid credentials");
  }

  // Successful login - reset failed attempts and unlock account
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  const token = signToken({ id: user._id, email: user.email });
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }
  };
};
