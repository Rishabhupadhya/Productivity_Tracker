import { api } from "./api";

export const getUserProfile = async () => {
  const res = await api.get("/team/me");
  return res.data;
};

export const updateProfile = async (data: any) => {
  const res = await api.patch("/profile", data);
  return res.data;
};

export const updateSettings = async (settings: any) => {
  const res = await api.patch("/profile/settings", settings);
  return res.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const res = await api.post("/profile/change-password", { currentPassword, newPassword });
  return res.data;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  
  const res = await api.post("/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return res.data;
};
