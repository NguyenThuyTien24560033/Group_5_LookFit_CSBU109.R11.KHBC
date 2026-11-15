import express from "express";
import { recommendOutfits } from "../services/recommendation.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Recommendation
 *     description: Outfit recommendation endpoints (requires login)
 */

/**
 * @swagger
 * /api/recommendation:
 *   post:
 *     summary: Get outfit recommendations (4 outfits per page)
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               case:
 *                 type: string
 *                 description: Occasion / use case
 *                 example: "casual"
 *               style:
 *                 type: string
 *                 example: "minimalist"
 *               season:
 *                 type: string
 *                 example: "summer"
 *               weather:
 *                 type: string
 *                 example: "sunny"
 *               lifestyle:
 *                 type: string
 *                 example: "active"
 *               page:
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Profile not found
 */
router.post("/", authenticate, async (req, res, next) => {
  try {
    const {
      case: userCase,
      style,
      season,
      weather,
      lifestyle,
      page = 1,
    } = req.body;

    const result = await recommendOutfits(
      req.user.userId,
      {
        case: userCase,
        style,
        season,
        weather,
        lifestyle,
      },
      page,
      4
    );

    return res.status(200).json({
      recommendations: result.outfits,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;