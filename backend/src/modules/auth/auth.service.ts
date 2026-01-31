import bcrypt from "bcrypt";
import { User } from "./auth.model";
import { signToken } from "../../utils/jwt";

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

  return signToken({ id: user._id, email: user.email });
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return signToken({ id: user._id, email: user.email });
};
