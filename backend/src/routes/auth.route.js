import express from "express";
import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import HttpError from "../utils/httpError.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: "Nguyen Van A"
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           example: "123456"
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           example: "123456"
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 */
// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    return res.status(201).json({
      message: "Registration successful",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive a token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Wrong email or password
 */
// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out (client must remove its token)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
// POST /api/auth/logout
router.post("/logout", (req, res) => {
  return res.status(200).json({
    message: "Logout successful. Please remove your token on the client.",
  });
});

/**
 * @swagger
 * /api/auth/admin-test:
 *   get:
 *     summary: Test admin-only access
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 */
// GET /api/auth/admin-test
router.get(
  "/admin-test",
  authenticate,
  authorizeAdmin,
  (req, res) => {
    return res.status(200).json({
      message: "Admin access granted",
    });
  }
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the current logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user (id, name, email, role)
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: User not found
 */
// GET /api/auth/me
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("_id name email role")
      .lean();

    if (!user) {
      return next(new HttpError(404, "User not found"));
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;