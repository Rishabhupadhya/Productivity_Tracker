import { User } from "../auth.model";

export const getTeamMembers = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  return User.find({ workspaceId: user.workspaceId }).select('name email avatar');
};

export const getUserInfo = async (userId: string) => {
  return User.findById(userId).select('name email avatar workspaceId');
};
