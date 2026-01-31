import { api } from "./api";

export const getTeamMembers = async () => {
  const res = await api.get("/team/members");
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await api.get("/team/me");
  return res.data;
};
