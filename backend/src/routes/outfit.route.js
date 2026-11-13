import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createDraftOutfit,
  getOutfitHistory,
  getOutfitById,
  updateDraftItems,
  finalizeOutfit,
  updateOutfitVisibility,
  deleteOutfit,
  getPublicOutfits,
  getPublicOutfitsFeaturingItem,
} from "../services/outfit.service.js";

const router = express.Router();


router.get("/public", async (req, res, next) => {
  try {
    const result = await getPublicOutfits({
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    return res.status(200).json({
      outfits: result.outfits,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});


router.get("/public/featuring/:catalogId", async (req, res, next) => {
  try {
    const result = await getPublicOutfitsFeaturingItem({
      catalogId: req.params.catalogId,
      excludeOutfitId: req.query.excludeOutfitId,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    return res.status(200).json({
      message: "Related public outfits retrieved successfully",
      product: result.product,
      outfits: result.outfits,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

// All routes below require authentication.
router.use(authenticate);


router.get("/history", async (req, res, next) => {
  try {
    const outfits = await getOutfitHistory(req.user.userId);

    return res.status(200).json({ outfits });
  } catch (error) {
    return next(error);
  }
});


router.post("/", async (req, res, next) => {
  try {
    const { criteria, outfit, recommendationGroupId } = req.body;

    const createdOutfit = await createDraftOutfit(
      req.user.userId,
      criteria,
      outfit,
      recommendationGroupId
    );

    return res.status(201).json({ outfit: createdOutfit });
  } catch (error) {
    return next(error);
  }
});


router.get("/:id", async (req, res, next) => {
  try {
    const outfit = await getOutfitById(req.user.userId, req.params.id);

    return res.status(200).json({ outfit });
  } catch (error) {
    return next(error);
  }
});


router.patch("/:id/items", async (req, res, next) => {
  try {
    const outfit = await updateDraftItems(
      req.user.userId,
      req.params.id,
      req.body.items
    );

    return res.status(200).json({ outfit });
  } catch (error) {
    return next(error);
  }
});


router.patch("/:id/finalize", async (req, res, next) => {
  try {
    const outfit = await finalizeOutfit(req.user.userId, req.params.id);

    return res.status(200).json({ outfit });
  } catch (error) {
    return next(error);
  }
});


router.patch("/:id/visibility", async (req, res, next) => {
  try {
    const outfit = await updateOutfitVisibility(
      req.user.userId,
      req.params.id,
      req.body.isPublic
    );

    return res.status(200).json({ outfit });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/outfits/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await deleteOutfit(req.user.userId, req.params.id);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;