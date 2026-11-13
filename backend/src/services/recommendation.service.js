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
  let scored = scoreAndFilterItems(items, profile, criteria, 8);

  const hasEssentialCategories = (list) => {
    const categories = new Set(list.map((i) => i.category));
    return categories.has("top") && categories.has("bottom") && categories.has("shoes");
  };

  if (!hasEssentialCategories(scored)) {
    scored = scoreAndFilterItems(items, profile, criteria, 5);
  }

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

