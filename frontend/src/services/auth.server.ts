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
  // NOTE: Tokens are now stored in HttpOnly cookies automatically
  // No need to handle tokens in response body
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const response = await api.post("/auth/login", {
    email,
    password
  });
  // NOTE: Tokens are now stored in HttpOnly cookies automatically
  // No need to handle tokens in response body
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  // Cookies are cleared by backend
  return response.data;
};
