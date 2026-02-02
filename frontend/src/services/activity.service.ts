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

export const getTeamActivity = async (teamId: string, userOnly: boolean = true): Promise<Activity[]> => {
  const response = await api.get(`/team/${teamId}/activity`, {
    params: { userOnly }
  });
  return response.data;
};

export const getUserActivity = async (): Promise<Activity[]> => {
  const response = await api.get("/team/activity/me");
  return response.data;
};
