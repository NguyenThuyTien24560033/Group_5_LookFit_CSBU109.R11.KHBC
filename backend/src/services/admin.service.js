import mongoose from "mongoose";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import CatalogItem from "../models/CatalogItem.js";
import UserOutfit from "../models/UserOutfit.js";
import OutfitItem from "../models/OutfitItem.js";
import HttpError from "../utils/httpError.js";
import { recommendOutfitsForProfile } from "./recommendation.service.js";

const SUPPORTED_BODY_SHAPES = [
  "hourglass",
  "pear",
  "inverted-triangle",
  "rectangle",
  "apple",
];

const VALID_CATEGORIES = ["top", "bottom", "shoes", "accessory"];

function getOutfitSignature(items) {
  return items
    .map((item) => String(item.catalogId ?? item.id ?? item._id))
    .sort()
    .join("|");
}

function validateProductData(data, isUpdate = false) {
  const fields = [
    "cases",
    "styles",
    "seasons",
    "weathers",
    "shapes",
    "lifestyles",
  ];

  if (!isUpdate) {
    if (
      typeof data.category !== "string" ||
      typeof data.name !== "string" ||
      !data.name.trim() ||
      typeof data.color !== "string" ||
      !data.color.trim() ||
      fields.some((field) => !Array.isArray(data[field]))
    ) {
      throw new HttpError(400, "Invalid product data");
    }
  }

  if (
    data.category !== undefined &&
    !VALID_CATEGORIES.includes(data.category)
  ) {
    throw new HttpError(400, "Invalid product category");
  }

  for (const field of ["name", "color"]) {
    if (
      data[field] !== undefined &&
      (typeof data[field] !== "string" || !data[field].trim())
    ) {
      throw new HttpError(400, `Invalid product ${field}`);
    }
  }

  for (const field of fields) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      throw new HttpError(400, `Invalid ${field}`);
    }
  }

  if (
    data.imageId !== undefined &&
    data.imageId !== null &&
    !mongoose.isValidObjectId(data.imageId)
  ) {
    throw new HttpError(400, "Invalid image ID");
  }

  if (
    data.imageUrl !== undefined &&
    data.imageUrl !== null &&
    (
      typeof data.imageUrl !== "string" ||
      !data.imageUrl.trim() ||
      !/^https?:\/\/\S+$/i.test(data.imageUrl.trim())
    )
  ) {
    throw new HttpError(400, "Invalid image URL");
  }

  if (
    data.isActive !== undefined &&
    typeof data.isActive !== "boolean"
  ) {
    throw new HttpError(400, "Invalid active status");
  }
}

export async function getAllProducts() {
  return CatalogItem.find()
    .sort({ createdAt: -1 })
    .lean();
}

export async function createProduct(data = {}) {
  validateProductData(data);

  const {
    category,
    name,
    color,
    imageId,
    imageUrl,
    cases,
    styles,
    seasons,
    weathers,
    shapes,
    lifestyles,
  } = data;

  return CatalogItem.create({
    category,
    name: name.trim(),
    color: color.trim().toLowerCase(),
    imageId: imageId || null,
    imageUrl: imageUrl?.trim() || null,
    cases,
    styles,
    seasons,
    weathers,
    shapes,
    lifestyles,
  });
}

export async function updateProduct(id, data = {}) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "Product not found");
  }

  const allowedFields = [
    "category",
    "name",
    "color",
    "imageId",
    "imageUrl",
    "cases",
    "styles",
    "seasons",
    "weathers",
    "shapes",
    "lifestyles",
    "isActive",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  validateProductData(updateData, true);

  if (updateData.name !== undefined) {
    updateData.name = updateData.name.trim();
  }

  if (updateData.color !== undefined) {
    updateData.color = updateData.color.trim().toLowerCase();
  }

  if (updateData.imageId !== undefined && updateData.imageId !== null) {
    updateData.imageId = new mongoose.Types.ObjectId(updateData.imageId);
  }

  if (updateData.imageUrl !== undefined && updateData.imageUrl !== null) {
    updateData.imageUrl = updateData.imageUrl.trim();
  }

  const product = await CatalogItem.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  return product;
}

export async function deleteProduct(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "Product not found");
  }

  const product = await CatalogItem.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  return product;
}

export async function generatePredefinedOutfits(adminId, criteria) {
  const fields = ["case", "style", "season", "weather", "lifestyle"];

  for (const field of fields) {
    if (
      typeof criteria?.[field] !== "string" ||
      !criteria[field].trim()
    ) {
      throw new HttpError(400, `${field} is required`);
    }
  }

  const normalizedCriteria = Object.fromEntries(
    fields.map((field) => [field, criteria[field].trim()])
  );

  const results = [];

  for (const bodyShape of SUPPORTED_BODY_SHAPES) {
    const existingOutfits = await UserOutfit.find({
      isPreDefined: true,
      bodyShape,
      ...normalizedCriteria,
    }).select("_id");

    const existingItems = await OutfitItem.find({
      outfitId: { $in: existingOutfits.map((outfit) => outfit._id) },
    }).select("outfitId catalogId");

    const itemsByOutfit = new Map();

    for (const item of existingItems) {
      const key = String(item.outfitId);

      if (!itemsByOutfit.has(key)) {
        itemsByOutfit.set(key, []);
      }

      itemsByOutfit.get(key).push(item);
    }

    const existingSignatures = new Set(
      existingOutfits.map((outfit) =>
        getOutfitSignature(itemsByOutfit.get(String(outfit._id)) ?? [])
      )
    );

    const recommendationResult = await recommendOutfitsForProfile(
      { bodyShape, favoriteColors: null },
      normalizedCriteria
    );

    const outfits = recommendationResult.outfits;

    const newOutfits = [];

    for (const outfit of outfits) {
      const signature = getOutfitSignature(outfit.items);

      if (existingSignatures.has(signature)) continue;

      existingSignatures.add(signature);
      newOutfits.push(outfit);

      if (newOutfits.length === 3) break;
    }

    for (const outfit of newOutfits) {
      const savedOutfit = await UserOutfit.create({
        userId: adminId,
        ...normalizedCriteria,
        bodyShape,
        status: "FINAL",
        isPublic: true,
        isPreDefined: true,
      });

      try {
        const itemsToSave = outfit.items.map((item) => ({
          outfitId: savedOutfit._id,
          catalogId: item.id ?? item._id,
          category: item.category,
          name: item.name,
          color: item.color ?? null,
          imageId: item.imageId ?? null,
          imageUrl: item.imageUrl ?? null,
        }));

        await OutfitItem.insertMany(itemsToSave);

        const savedItems = await OutfitItem.find({
          outfitId: savedOutfit._id,
        }).lean();

        results.push({
          ...savedOutfit.toObject(),
          items: savedItems,
        });
      } catch (error) {
        await UserOutfit.findByIdAndDelete(savedOutfit._id);
        throw error;
      }
    }
  }

  return results;
}

export async function getAdminDashboardStats() {
  const [
    totalUsers,
    totalProducts,
    activeProducts,
    totalPredefinedOutfits,
    totalUserOutfits,
  ] = await Promise.all([
    User.countDocuments(),
    CatalogItem.countDocuments(),
    CatalogItem.countDocuments({ isActive: true }),
    UserOutfit.countDocuments({ isPreDefined: true }),
    UserOutfit.countDocuments({ isPreDefined: false }),
  ]);

  return {
    totalUsers,
    totalProducts,
    activeProducts,
    inactiveProducts: totalProducts - activeProducts,
    totalPredefinedOutfits,
    totalUserOutfits,
  };
}

export async function getAdminUsers({
  search = "",
  page = 1,
  pageSize = 10,
} = {}) {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const currentPageSize = Math.min(
    10,
    Math.max(1, Number.parseInt(pageSize, 10) || 10)
  );

  const keyword = search.trim();
  const filter = {};

  if (keyword) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { name: { $regex: escapedKeyword, $options: "i" } },
      { email: { $regex: escapedKeyword, $options: "i" } },
    ];
  }

  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * currentPageSize)
      .limit(currentPageSize)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page: currentPage,
      pageSize: currentPageSize,
      totalUsers,
      totalPages: Math.ceil(totalUsers / currentPageSize),
      hasNextPage: currentPage * currentPageSize < totalUsers,
    },
  };
}