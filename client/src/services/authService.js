import api from "./api";
 
export const authService = {
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    if (res.data.data.accessToken) {
      localStorage.setItem("accessToken", res.data.data.accessToken);
    }
    return res.data;
  },
 
  login: async (data) => {
    const res = await api.post("/auth/login", data);
    if (res.data.data.accessToken) {
      localStorage.setItem("accessToken", res.data.data.accessToken);
    }
    return res.data;
  },
 
  logout: async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
  },
 
  getCurrentUser: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};