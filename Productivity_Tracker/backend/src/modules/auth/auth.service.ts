import bcrypt from "bcrypt";
import { User } from "./auth.model";
import { signToken } from "../../utils/jwt";
import { Team } from "./team/team.model";
import { Types } from "mongoose";

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

  return signToken({ id: user._id, email: user.email });
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return signToken({ id: user._id, email: user.email });
};
