import api from "./api";

export interface Activity {
  _id: string;
  teamId: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: any;
  createdAt: Date;
}

export const getTeamActivity = async (teamId: string): Promise<Activity[]> => {
  const response = await api.get(`/team/${teamId}/activity`);
  return response.data;
};
