import api from "./api";

export interface MomentumStats {
  xp: number;
  level: number;
  xpForNextLevel: number;
  levelProgress: number;
  momentumToday: number;
  momentumWeek: number;
}

export const getMomentumStats = async (): Promise<MomentumStats> => {
  const response = await api.get("/momentum/stats");
  return response.data;
};
