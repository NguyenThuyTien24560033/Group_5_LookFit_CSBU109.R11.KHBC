import mongoose from "mongoose";
import UserOutfit from "../models/UserOutfit.js";
import OutfitItem from "../models/OutfitItem.js";
import CatalogItem from "../models/CatalogItem.js";
import HttpError from "../utils/httpError.js";

function validateCriteria(criteria) {
  for (const field of ["case", "style", "season", "weather", "lifestyle"]) {
    if (typeof criteria?.[field] !== "string" || !criteria[field].trim()) {
      throw new HttpError(400, `${field} is required`);
    }
  }
}

async function validateCatalogItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "Outfit items are required");
  }

  const ids = items.map((item) => item?.id);

  if (
    ids.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id)) ||
    new Set(ids).size !== ids.length
  ) {
    throw new HttpError(400, "Invalid or duplicate catalog item IDs");
  }

  const products = await CatalogItem.find({
    _id: { $in: ids },
    isActive: true,
  }).lean();

  if (products.length !== ids.length) {
    throw new HttpError(
      400,
      "One or more catalog items do not exist or are inactive"
    );
  }

  return products;
}

async function getOwnedOutfit(userId, outfitId) {
  if (!mongoose.isValidObjectId(outfitId)) {
    throw new HttpError(404, "Outfit not found");
  }

  const outfit = await UserOutfit.findOne({
    _id: outfitId,
    userId,
  }).lean();

  if (!outfit) {
    throw new HttpError(404, "Outfit not found");
  }

  const items = await OutfitItem.find({
    outfitId: outfit._id,
  }).lean();

  return { ...outfit, items };
}

async function populateOutfitItems(outfit) {
  if (!outfit) {
    throw new HttpError(404, "Outfit not found");
  }

  const items = await OutfitItem.find({
    outfitId: outfit._id,
  }).lean();

  return { ...outfit.toObject(), items };
}

export async function createDraftOutfit(
  userId,
  criteria,
  outfit,
  recommendationGroupId
) {
  validateCriteria(criteria);

  const products = await validateCatalogItems(outfit?.items);

  const createdOutfit = await UserOutfit.create({
    userId,
    recommendationGroupId: recommendationGroupId ?? null,
    case: criteria.case,
    style: criteria.style,
    season: criteria.season,
    weather: criteria.weather,
    lifestyle: criteria.lifestyle,
    status: "DRAFT",
    isPublic: false,
  });

  try {
    await OutfitItem.insertMany(
      products.map((product) => ({
        outfitId: createdOutfit._id,
        catalogId: product._id,
        category: product.category,
        name: product.name,
        color: product.color ?? null,
        imageId: product.imageId ?? null,
        imageUrl: product.imageUrl ?? null,
      }))
    );
  } catch (error) {
    await UserOutfit.deleteOne({ _id: createdOutfit._id });
    throw error;
  }

  return populateOutfitItems(createdOutfit);
}

export async function getOutfitHistory(userId) {
  const outfits = await UserOutfit.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();

  const outfitIds = outfits.map((outfit) => outfit._id);

  const items = outfitIds.length
    ? await OutfitItem.find({ outfitId: { $in: outfitIds } }).lean()
    : [];

  return outfits.map((outfit) => ({
    ...outfit,
    items: items.filter((item) => item.outfitId.equals(outfit._id)),
  }));
}

export async function getOutfitById(userId, outfitId) {
  return getOwnedOutfit(userId, outfitId);
}

export async function updateDraftItems(userId, outfitId, items) {
  const outfit = await getOwnedOutfit(userId, outfitId);

  if (outfit.status !== "DRAFT") {
    throw new HttpError(400, "Only draft outfits can be edited");
  }

  const products = await validateCatalogItems(items);

  await OutfitItem.deleteMany({ outfitId: outfit._id });

  await OutfitItem.insertMany(
    products.map((product) => ({
      outfitId: outfit._id,
      catalogId: product._id,
      category: product.category,
      name: product.name,
      color: product.color ?? null,
      imageId: product.imageId ?? null,
      imageUrl: product.imageUrl ?? null,
    }))
  );

  const updatedOutfit = await UserOutfit.findByIdAndUpdate(
    outfit._id,
    { $set: { updatedAt: new Date() } },
    { new: true }
  );

  return populateOutfitItems(updatedOutfit);
}

export async function finalizeOutfit(userId, outfitId) {
  const outfit = await getOwnedOutfit(userId, outfitId);

  if (outfit.status !== "DRAFT") {
    throw new HttpError(400, "Only draft outfits can be finalized");
  }

  const finalized = await UserOutfit.findOneAndUpdate(
    {
      _id: outfit._id,
      userId,
      status: "DRAFT",
    },
    {
      $set: {
        status: "FINAL",
        isPublic: false,
      },
    },
    { new: true }
  );

  if (!finalized) {
    throw new HttpError(400, "Only draft outfits can be finalized");
  }

  if (outfit.recommendationGroupId) {
    await UserOutfit.deleteMany({
      userId,
      recommendationGroupId: outfit.recommendationGroupId,
      status: "DRAFT",
      _id: { $ne: finalized._id },
    });
  }

  return populateOutfitItems(finalized);
}

export async function updateOutfitVisibility(userId, outfitId, isPublic) {
  if (typeof isPublic !== "boolean") {
    throw new HttpError(400, "isPublic must be a boolean");
  }

  const outfit = await getOwnedOutfit(userId, outfitId);

  if (outfit.status !== "FINAL") {
    throw new HttpError(400, "Only final outfits can change visibility");
  }

  const updated = await UserOutfit.findOneAndUpdate(
    {
      _id: outfit._id,
      userId,
      status: "FINAL",
    },
    { $set: { isPublic } },
    { new: true }
  );

  return populateOutfitItems(updated);
}

export async function deleteOutfit(userId, outfitId) {
  const outfit = await getOwnedOutfit(userId, outfitId);

  await OutfitItem.deleteMany({ outfitId: outfit._id });

  await UserOutfit.deleteOne({
    _id: outfit._id,
    userId,
  });

  return { message: "Outfit deleted successfully" };
}

export async function getPublicOutfits({
  page = 1,
  pageSize = 10,
} = {}) {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);

  const currentPageSize = Math.min(
    10,
    Math.max(1, Number.parseInt(pageSize, 10) || 10)
  );

  const filter = {
    status: "FINAL",
    isPublic: true,
  };

  const [outfits, totalOutfits] = await Promise.all([
    UserOutfit.find(filter)
      .populate("userId", "name")
      .sort({ updatedAt: -1, _id: -1 })
      .skip((currentPage - 1) * currentPageSize)
      .limit(currentPageSize)
      .lean(),

    UserOutfit.countDocuments(filter),
  ]);

  const outfitIds = outfits.map((outfit) => outfit._id);

  const items = outfitIds.length
    ? await OutfitItem.find({ outfitId: { $in: outfitIds } }).lean()
    : [];

  const results = outfits.map((outfit) => ({
    ...outfit,
    user: outfit.userId,
    userId: outfit.userId?._id,
    items: items.filter((item) => item.outfitId.equals(outfit._id)),
  }));

  return {
    outfits: results,
    pagination: {
      page: currentPage,
      pageSize: currentPageSize,
      totalOutfits,
      totalPages: Math.ceil(totalOutfits / currentPageSize),
      hasNextPage: currentPage * currentPageSize < totalOutfits,
    },
  };
}

export async function getPublicOutfitsFeaturingItem({
  catalogId,
  excludeOutfitId,
  page = 1,
  pageSize = 10,
} = {}) {
  if (!mongoose.isValidObjectId(catalogId)) {
    throw new HttpError(404, "Product not found");
  }

  const product = await CatalogItem.findOne({
    _id: catalogId,
    isActive: true,
  }).lean();

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);

  const currentPageSize = Math.min(
    10,
    Math.max(1, Number.parseInt(pageSize, 10) || 10)
  );

  const outfitIds = await OutfitItem.distinct("outfitId", {
    catalogId: product._id,
  });

  const filter = {
    _id: { $in: outfitIds },
    status: "FINAL",
    isPublic: true,
  };

  if (excludeOutfitId) {
    if (!mongoose.isValidObjectId(excludeOutfitId)) {
      throw new HttpError(400, "Invalid outfit ID");
    }

    filter._id = {
      $in: outfitIds,
      $ne: new mongoose.Types.ObjectId(excludeOutfitId),
    };
  }

  const [outfits, totalOutfits] = await Promise.all([
    UserOutfit.find(filter)
      .populate("userId", "name")
      .sort({ updatedAt: -1, _id: -1 })
      .skip((currentPage - 1) * currentPageSize)
      .limit(currentPageSize)
      .lean(),

    UserOutfit.countDocuments(filter),
  ]);

  const relatedOutfitIds = outfits.map((outfit) => outfit._id);

  const items = relatedOutfitIds.length
    ? await OutfitItem.find({
        outfitId: { $in: relatedOutfitIds },
      }).lean()
    : [];

  const results = outfits.map((outfit) => ({
    ...outfit,
    user: outfit.userId,
    userId: outfit.userId?._id,
    items: items.filter((item) => item.outfitId.equals(outfit._id)),
  }));

  return {
    product,
    outfits: results,
    pagination: {
      page: currentPage,
      pageSize: currentPageSize,
      totalOutfits,
      totalPages: Math.ceil(totalOutfits / currentPageSize),
      hasNextPage: currentPage * currentPageSize < totalOutfits,
    },
  };
}