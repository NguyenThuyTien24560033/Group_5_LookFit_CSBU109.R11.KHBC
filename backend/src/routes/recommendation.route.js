import express from "express";
import { recommendOutfits } from "../services/recommendation.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();


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