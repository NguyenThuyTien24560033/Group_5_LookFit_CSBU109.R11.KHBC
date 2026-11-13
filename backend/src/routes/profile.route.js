import express from "express";
import {
  createProfile,
  updateProfile,
  getProfile,
} from "../services/profile.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();


router.use(authenticate);

router.post("/", async (req, res, next) => {
  try {
    const profile = await createProfile(req.user.userId, req.body);

    return res.status(201).json(profile);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/profile
router.put("/", async (req, res, next) => {
  try {
    const profile = await updateProfile(req.user.userId, req.body);

    return res.status(200).json(profile);
  } catch (error) {
    return next(error);
  }
});

// GET /api/profile
router.get("/", async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.userId);

    return res.status(200).json({
      message: "Profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;