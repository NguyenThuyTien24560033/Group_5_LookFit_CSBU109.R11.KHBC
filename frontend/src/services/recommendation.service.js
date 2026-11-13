import api from "./api";

export const getRecommendations = async (criteria, page = 1) => {
  const response = await api.post("/recommendation", {
    ...criteria,
    page,
  });

  return response.data;
};