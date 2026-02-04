import api from "./api";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const response = await api.post("/auth/register", {
    name,
    email,
    password
  });

  // Store token in localStorage for cross-domain authentication
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }

  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const response = await api.post("/auth/login", {
    email,
    password
  });

  // Store token in localStorage for cross-domain authentication
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }

  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    // Clear token from localStorage
    localStorage.removeItem('token');
  }
};

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
};
