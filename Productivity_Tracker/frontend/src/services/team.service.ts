import api from "./api";

export interface Team {
  _id: string;
  name: string;
  createdBy: any;
  members: Array<{
    userId: any;
    role: "admin" | "member";
    joinedAt: Date;
  }>;
  invites: Array<{
    email: string;
    role: "admin" | "member";
    invitedBy: any;
    invitedAt: Date;
    status: "pending" | "accepted" | "rejected";
  }>;
}

export const getTeamMembers = async () => {
  const res = await api.get("/team/members");
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await api.get("/team/me");
  return res.data;
};

export const createTeam = async (name: string) => {
  const res = await api.post("/team", { name });
  return res.data;
};

export const getUserTeams = async () => {
  const res = await api.get("/team");
  return res.data;
};

export const getTeamDetails = async (teamId: string) => {
  const res = await api.get(`/team/${teamId}`);
  return res.data;
};

export const switchTeam = async (teamId: string | null) => {
  const res = await api.post("/team/switch", { teamId });
  return res.data;
};

export const inviteTeamMember = async (teamId: string, email: string, role: "admin" | "member" = "member") => {
  const res = await api.post(`/team/${teamId}/invite`, { email, role });
  return res.data;
};

export const cancelTeamInvite = async (teamId: string, email: string) => {
  const res = await api.delete(`/team/${teamId}/invite`, { data: { email } });
  return res.data;
};

export const getPendingInvites = async () => {
  const res = await api.get("/team/invites/pending");
  return res.data;
};

export const acceptTeamInvite = async (teamId: string) => {
  const res = await api.post(`/team/${teamId}/accept`);
  return res.data;
};

export const removeTeamMember = async (teamId: string, memberId: string) => {
  const res = await api.delete(`/team/${teamId}/members/${memberId}`);
  return res.data;
};
