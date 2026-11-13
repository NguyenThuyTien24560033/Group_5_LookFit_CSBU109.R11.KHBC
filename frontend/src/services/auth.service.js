
import api from "./api";

export async function register(userData) {
  const response = await api.post("/auth/register", userData);
  return response.data;
}

export async function login(credentials) {
  const response = await api.post("/auth/login", credentials);

  const { token } = response.data;

  if (token) {
    localStorage.setItem("token", token);
  }

  return response.data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("token");
  }
}
