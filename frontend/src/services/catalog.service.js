import api from "./api";

export const getCatalogProducts = async ({
  search = "",
  category = "",
  color = "",
  page = 1,
  pageSize = 10,
} = {}) => {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const currentPageSize = Math.min(
    10,
    Math.max(1, Number.parseInt(pageSize, 10) || 10)
  );

  const response = await api.get("/catalog", {
    params: {
      search,
      category,
      color,
      page: currentPage,
      pageSize: currentPageSize,
    },
  });

  const data = response.data;

  return {
    products: data.data ?? [],
    pagination: data.pagination ?? {
      page: currentPage,
      pageSize: currentPageSize,
      totalProducts: 0,
      totalPages: 0,
      hasNextPage: false,
    },
  };
};

export const getCatalogProductById = async (id) => {
  const response = await api.get(`/catalog/${id}`);
  return response.data.data;
};