import UserProfile from "../models/UserProfile.js";
import HttpError from "../utils/httpError.js";
import { calculateBodyShape } from "./bodyShape.service.js";

function normalizeFavoriteColors(colors) {
  if (!Array.isArray(colors)) return null;
  return colors
    .map((c) => (typeof c === "string" ? c.trim().toLowerCase() : ""))
    .filter(Boolean);
}

export async function createProfile(userId, data = {}) {
  const existingProfile = await UserProfile.findOne({ userId }).lean();

  if (existingProfile) {
    throw new HttpError(409, "Profile already exists");
  }

  const bodyShape = calculateBodyShape({
    bust: data.bust,
    waist: data.waist,
    hip: data.hip,
  });

  try {
    return await UserProfile.create({
      userId,
      height: data.height,
      weight: data.weight,
      bust: data.bust,
      waist: data.waist,
      hip: data.hip,
      bodyShape,
      favoriteColors: normalizeFavoriteColors(data.favoriteColors),
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(409, "Profile already exists");
    }
    throw error;
  }
}

export async function updateProfile(userId, data = {}) {
  const existingProfile = await UserProfile.findOne({ userId });

  if (!existingProfile) {
    throw new HttpError(404, "Profile not found");
  }

  const bodyShape = calculateBodyShape({
    bust: data.bust ?? existingProfile.bust,
    waist: data.waist ?? existingProfile.waist,
    hip: data.hip ?? existingProfile.hip,
  });

  const fields = ["height", "weight", "bust", "waist", "hip"];

  for (const field of fields) {
    if (data[field] !== undefined) {
      existingProfile[field] = data[field];
    }
  }

  if (data.favoriteColors !== undefined) {
    existingProfile.favoriteColors = normalizeFavoriteColors(data.favoriteColors);
  }

  existingProfile.bodyShape = bodyShape;

  await existingProfile.save();
  return existingProfile;
}

export async function getProfile(userId) {
  const profile = await UserProfile.findOne({ userId });

  if (!profile) {
    throw new HttpError(404, "Profile not found");
  }

  return profile;
}