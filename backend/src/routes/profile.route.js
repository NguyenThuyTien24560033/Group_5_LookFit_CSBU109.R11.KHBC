import express from "express";
import {
  createProfile,
  updateProfile,
  getProfile,
} from "../services/profile.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Profile
 *     description: User profile endpoints (requires login)
 */

// All profile routes require authentication.
router.use(authenticate);

/**
 * @swagger
 * /api/profile:
 *   post:
 *     summary: Create the current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Profile fields (see profile.service.js)
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Missing or invalid token
 *       409:
 *         description: Profile already exists
 *   put:
 *     summary: Update the current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Profile fields to update
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Profile not found
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Profile not found
 */
// POST /api/profile
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