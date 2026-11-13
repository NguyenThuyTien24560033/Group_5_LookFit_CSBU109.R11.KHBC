import api from "./api.js";

// GET /api/admin/catalog
export async function getAdminProducts() {
  const response = await api.get("/admin/catalog");
  return response.data.data ?? [];
}

// POST /api/admin/catalog
export async function createAdminProduct(product) {
  const response = await api.post("/admin/catalog", product);
  return response.data.data;
}

// PUT /api/admin/catalog/:id
export async function updateAdminProduct(id, product) {
  const response = await api.put(
    `/admin/catalog/${id}`,
    product
  );

  return response.data.data;
}

// DELETE /api/admin/catalog/:id
export async function deactivateAdminProduct(id) {
  const response = await api.delete(`/admin/catalog/${id}`);
  return response.data;
}

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