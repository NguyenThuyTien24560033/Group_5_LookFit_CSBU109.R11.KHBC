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

/**
 * @swagger
 * tags:
 *   - name: Outfits
 *     description: Outfit endpoints (public feed and personal outfits)
 *
 * components:
 *   parameters:
 *     outfitId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ID of the outfit
 *     featuredCatalogId:
 *       in: path
 *       name: catalogId
 *       required: true
 *       schema:
 *         type: string
 *       description: ID of the catalog product
 */

/**
 * @swagger
 * /api/outfits/public:
 *   get:
 *     summary: Get public outfits (pagination)
 *     tags: [Outfits]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Current page
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Public outfits retrieved successfully
 */
// GET /api/outfits/public?page=1&pageSize=10
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

/**
 * @swagger
 * /api/outfits/public/featuring/{catalogId}:
 *   get:
 *     summary: Get public outfits featuring a catalog product
 *     tags: [Outfits]
 *     parameters:
 *       - $ref: '#/components/parameters/featuredCatalogId'
 *       - in: query
 *         name: excludeOutfitId
 *         schema:
 *           type: string
 *         description: Outfit ID to exclude from the results
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Current page
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Related public outfits retrieved successfully
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: Product not found
 */
// GET /api/outfits/public/featuring/:catalogId
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

/**
 * @swagger
 * /api/outfits/history:
 *   get:
 *     summary: Get the current user's outfit history
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Outfit history retrieved successfully
 *       401:
 *         description: Missing or invalid token
 */
// GET /api/outfits/history
router.get("/history", async (req, res, next) => {
  try {
    const outfits = await getOutfitHistory(req.user.userId);

    return res.status(200).json({ outfits });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/outfits:
 *   post:
 *     summary: Create a draft outfit
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               criteria:
 *                 type: object
 *                 description: Criteria used to build the outfit
 *               outfit:
 *                 type: object
 *                 description: Outfit data (items, etc.)
 *               recommendationGroupId:
 *                 type: string
 *                 description: ID of the recommendation group
 *     responses:
 *       201:
 *         description: Draft outfit created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Missing or invalid token
 */
// POST /api/outfits
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

/**
 * @swagger
 * /api/outfits/{id}:
 *   get:
 *     summary: Get an outfit by ID
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/outfitId'
 *     responses:
 *       200:
 *         description: Outfit retrieved successfully
 *       400:
 *         description: Malformed ID
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Outfit not found
 *   delete:
 *     summary: Delete an outfit by ID
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/outfitId'
 *     responses:
 *       200:
 *         description: Outfit deleted successfully
 *       400:
 *         description: Malformed ID
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Outfit not found
 */
// GET /api/outfits/:id
router.get("/:id", async (req, res, next) => {
  try {
    const outfit = await getOutfitById(req.user.userId, req.params.id);

    return res.status(200).json({ outfit });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/outfits/{id}/items:
 *   patch:
 *     summary: Update the items of a draft outfit
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/outfitId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: New list of outfit items
 *     responses:
 *       200:
 *         description: Outfit items updated successfully
 *       400:
 *         description: Invalid input or malformed ID
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Outfit not found
 */
// PATCH /api/outfits/:id/items
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

/**
 * @swagger
 * /api/outfits/{id}/finalize:
 *   patch:
 *     summary: Finalize a draft outfit
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/outfitId'
 *     responses:
 *       200:
 *         description: Outfit finalized successfully
 *       400:
 *         description: Invalid state or malformed ID
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Outfit not found
 */
// PATCH /api/outfits/:id/finalize
router.patch("/:id/finalize", async (req, res, next) => {
  try {
    const outfit = await finalizeOutfit(req.user.userId, req.params.id);

    return res.status(200).json({ outfit });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/outfits/{id}/visibility:
 *   patch:
 *     summary: Change the visibility of an outfit
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/outfitId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPublic
 *             properties:
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Visibility updated successfully
 *       400:
 *         description: Invalid input or malformed ID
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Outfit not found
 */
// PATCH /api/outfits/:id/visibility
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