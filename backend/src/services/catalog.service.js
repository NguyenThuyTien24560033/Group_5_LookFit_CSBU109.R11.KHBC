
import mongoose from "mongoose";
import CatalogItem from "../models/CatalogItem.js";
import HttpError from "../utils/httpError.js";

export async function searchProducts({
  search,
  category,
  color,
  page = 1,
  pageSize = 10,
} = {}) {
  const filter = { isActive: true };

  if (search?.trim()) {
    filter.name = { $regex: escapeRegex(search.trim()), $options: "i" };
  }

  if (category?.trim()) {
    filter.category = category.trim();
  }

  if (color?.trim()) {
    filter.color = color.trim().toLowerCase();
  }

  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const currentPageSize = Math.min(
    10,
    Math.max(1, Number.parseInt(pageSize, 10) || 10)
  );

  const [products, totalProducts] = await Promise.all([
    CatalogItem.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((currentPage - 1) * currentPageSize)
      .limit(currentPageSize)
      .lean(),
    CatalogItem.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page: currentPage,
      pageSize: currentPageSize,
      totalProducts,
      totalPages: Math.ceil(totalProducts / currentPageSize),
      hasNextPage: currentPage * currentPageSize < totalProducts,
    },
  };
}

export async function getProductById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "Product not found");
  }

  const product = await CatalogItem.findOne({
    _id: id,
    isActive: true,
  }).lean();

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  return product;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
