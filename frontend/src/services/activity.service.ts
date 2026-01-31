import { api } from "./api";

export const getTeamActivity = async (teamId: string, limit: number = 50) => {
  const res = await api.get(`/team/${teamId}/activity?limit=${limit}`);
  return res.data;
};
