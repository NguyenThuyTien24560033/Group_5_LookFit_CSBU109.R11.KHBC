import UserProfile from "../models/UserProfile.js";
import CatalogItem from "../models/CatalogItem.js";
import HttpError from "../utils/httpError.js";

import { calculateBodyShapeCompatibility } from "./bodyshapeCompatibility.service.js";
import {
  calculateColorCompatibility,
  calculateColorHarmony,
} from "./colorCompatibility.service.js";
import {
  calculateCaseCompatibility,
  calculateStyleCompatibility,
  calculateSeasonCompatibility,
  calculateWeatherCompatibility,
  calculateLifestyleCompatibility,
} from "./contextCompatibility.service.js";

export async function getRecommendationData(userId) {
  const profile = await UserProfile.findOne({ userId }).lean();

  if (!profile) {
    throw new HttpError(404, "User profile not found");
  }

  return profile;
}

export async function getCatalogItems() {
  return CatalogItem.find({ isActive: true }).lean();
}

export function calculateRecommendationScore(item, profile, criteria) {
  let score = 0;

  score += calculateBodyShapeCompatibility(item.shapes, profile.bodyShape);
  score += calculateColorCompatibility(item.color, profile.favoriteColors);
  score += calculateCaseCompatibility(item.cases, criteria.case);
  score += calculateStyleCompatibility(item.styles, criteria.style);
  score += calculateSeasonCompatibility(item.seasons, criteria.season);
  score += calculateWeatherCompatibility(item.weathers, criteria.weather);
  score += calculateLifestyleCompatibility(
    item.lifestyles,
    criteria.lifestyle
  );

  return score;
}

function scoreAndFilterItems(items, profile, criteria, minScore = 8) {
  return items
    .map((item) => ({
      ...item,
      score: calculateRecommendationScore(item, profile, criteria),
    }))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

export function filterRecommendedItems(items, profile, criteria) {
  // 1. Thử lọc với ngưỡng điểm chuẩn >= 8
  let scored = scoreAndFilterItems(items, profile, criteria, 8);

  const hasEssentialCategories = (list) => {
    const categories = new Set(list.map((i) => i.category));
    return categories.has("top") && categories.has("bottom") && categories.has("shoes");
  };

  // 2. Nếu thiếu 1 trong 3 nhóm thiết yếu (áo, quần, giày), nới lỏng xuống >= 5
  if (!hasEssentialCategories(scored)) {
    scored = scoreAndFilterItems(items, profile, criteria, 5);
  }

  // 3. Nếu vẫn thiếu, lấy các món có điểm phù hợp bất kỳ (> 0)
  if (!hasEssentialCategories(scored)) {
    scored = scoreAndFilterItems(items, profile, criteria, 1);
  }

  return scored;
}

function calculateOutfitColorScore(items) {
  let score = 0;
  let pairCount = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      score += calculateColorHarmony(items[i].color, items[j].color);
      pairCount++;
    }
  }

  return pairCount === 0 ? 0 : score / pairCount;
}

export function buildOutfits(items, page = 1, pageSize = 4) {
  // Giới hạn ứng viên điểm cao nhất mỗi loại để kiểm soát tổ hợp O(N^4)
  const MAX_CANDIDATES = 8;

  const categories = {
    top: items.filter((item) => item.category === "top").slice(0, MAX_CANDIDATES),
    bottom: items.filter((item) => item.category === "bottom").slice(0, MAX_CANDIDATES),
    shoes: items.filter((item) => item.category === "shoes").slice(0, MAX_CANDIDATES),
    accessory: items.filter((item) => item.category === "accessory").slice(0, 5),
  };

  // Bắt buộc phải có đủ 3 nhóm chính: áo, quần/váy, giày
  if (
    categories.top.length === 0 ||
    categories.bottom.length === 0 ||
    categories.shoes.length === 0
  ) {
    return {
      outfits: [],
      pagination: {
        page: 1,
        pageSize: Math.max(1, Math.floor(Number(pageSize) || 4)),
        totalOutfits: 0,
        totalPages: 0,
        hasNextPage: false,
      },
    };
  }

  const outfits = [];
  const accessories =
    categories.accessory.length > 0
      ? categories.accessory
      : [null];

  for (const top of categories.top) {
    for (const bottom of categories.bottom) {
      for (const shoes of categories.shoes) {
        for (const accessory of accessories) {
          const outfitItems = [
            top,
            bottom,
            shoes,
            ...(accessory ? [accessory] : []),
          ];

          const itemScore = outfitItems.reduce(
            (total, item) => total + item.score,
            0
          );

          const colorScore = calculateOutfitColorScore(outfitItems);

          outfits.push({
            items: outfitItems,
            itemScore,
            colorScore: Number(colorScore.toFixed(2)),
            totalScore: Number((itemScore + colorScore).toFixed(2)),
          });
        }
      }
    }
  }

  outfits.sort((a, b) => b.totalScore - a.totalScore);

  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safePageSize = Math.min(
    4,
    Math.max(1, Math.floor(Number(pageSize) || 4))
  );

  const startIndex = (safePage - 1) * safePageSize;
  const paginatedOutfits = outfits.slice(
    startIndex,
    startIndex + safePageSize
  );

  return {
    outfits: paginatedOutfits,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalOutfits: outfits.length,
      totalPages: Math.ceil(outfits.length / safePageSize),
      hasNextPage: startIndex + safePageSize < outfits.length,
    },
  };
}

export async function recommendOutfitsForProfile(
  profile,
  criteria,
  page = 1,
  pageSize = 4
) {
  const items = await getCatalogItems();
  const recommendedItems = filterRecommendedItems(items, profile, criteria);

  return buildOutfits(recommendedItems, page, pageSize);
}

export async function recommendOutfits(
  userId,
  criteria,
  page = 1,
  pageSize = 4
) {
  const profile = await getRecommendationData(userId);

  return recommendOutfitsForProfile(profile, criteria, page, pageSize);
}