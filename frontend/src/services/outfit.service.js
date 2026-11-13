import api from "./api";

export const createOutfit = async (
  criteria,
  outfit,
  recommendationGroupId = null
) => {
  const response = await api.post("/outfits", {
    criteria,
    outfit,
    recommendationGroupId,
  });

  return response.data;
};

export const getOutfitHistory = async () => {
  const response = await api.get("/outfits/history");
  return response.data;
};

export const getOutfitById = async (id) => {
  const response = await api.get(`/outfits/${id}`);
  return response.data;
};

export const updateDraftItems = async (id, items) => {
  const response = await api.patch(`/outfits/${id}/items`, {
    items,
  });

  return response.data;
};

export const finalizeOutfit = async (id) => {
  const response = await api.patch(`/outfits/${id}/finalize`);
  return response.data;
};

export const updateOutfitVisibility = async (id, isPublic) => {
  const response = await api.patch(`/outfits/${id}/visibility`, {
    isPublic,
  });

  return response.data;
};

export const deleteOutfit = async (id) => {
  const response = await api.delete(`/outfits/${id}`);
  return response.data;
};

export const getPublicOutfits = async ({
  page = 1,
  pageSize = 10,
} = {}) => {
  const response = await api.get("/outfits/public", {
    params: {
      page,
      pageSize: Math.min(10, Math.max(1, pageSize)),
    },
  });

  return response.data;
};

export const getPublicOutfitsFeaturingItem = async ({
  catalogId,
  page = 1,
  pageSize = 10,
  excludeOutfitId = "",
} = {}) => {
  const response = await api.get(
    `/outfits/public/featuring/${catalogId}`,
    {
      params: {
        page: Math.max(1, Number.parseInt(page, 10) || 1),
        pageSize: Math.min(
          10,
          Math.max(1, Number.parseInt(pageSize, 10) || 10)
        ),
        ...(excludeOutfitId ? { excludeOutfitId } : {}),
      },
    }
  );

  return response.data;
};