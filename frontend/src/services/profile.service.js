import api from "./api.js";

export async function createProfile(profileData) {
  const response = await api.post("/profile", profileData);
  return response.data;
}

export async function updateProfile(profileData) {
  const response = await api.put("/profile", profileData);
  return response.data;
}

export async function getProfile() {
  const response = await api.get("/profile");
  return response.data;
}
