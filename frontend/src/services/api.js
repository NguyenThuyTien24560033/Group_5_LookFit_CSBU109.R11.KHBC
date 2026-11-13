import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject({
      status: error.response?.status ?? 0,
      message:
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred",
      data: error.response?.data ?? null,
    });
  }
);

export default api;


export async function uploadAdminImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post("/images/upload", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });

  return response.data.data;
}
