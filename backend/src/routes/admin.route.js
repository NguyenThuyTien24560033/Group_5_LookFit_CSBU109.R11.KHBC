import express from "express";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  generatePredefinedOutfits,
  getAdminDashboardStats,
  getAdminUsers,
} from "../services/admin.service.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin-only endpoints (requires an admin token)
 *
 * components:
 *   parameters:
 *     adminId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ID of the catalog product
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 */
// GET /api/admin/dashboard
router.get(
  "/dashboard",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const stats = await getAdminDashboardStats();

      return res.status(200).json({
        message: "Dashboard statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get the list of users (search and pagination)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         description: Users retrieved successfully
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 */
// GET /api/admin/users?page=1&pageSize=10&search=
router.get(
  "/users",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const result = await getAdminUsers({
        search: String(req.query.search ?? ""),
        page: req.query.page,
        pageSize: req.query.pageSize,
      });

      return res.status(200).json({
        message: "Users retrieved successfully",
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/admin/catalog:
 *   get:
 *     summary: Get all catalog products
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 *   post:
 *     summary: Create a catalog product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Product fields (see the product model)
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 */
// GET /api/admin/catalog
router.get(
  "/catalog",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const products = await getAllProducts();

      return res.status(200).json({
        message: "Products retrieved successfully",
        data: products,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// POST /api/admin/catalog
router.post(
  "/catalog",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const product = await createProduct(req.body);

      return res.status(201).json({
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/admin/catalog/{id}:
 *   put:
 *     summary: Update a catalog product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/adminId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Product fields to update
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input or malformed ID
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete a catalog product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/adminId'
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Malformed ID
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 *       404:
 *         description: Product not found
 */
// PUT /api/admin/catalog/:id
router.put(
  "/catalog/:id",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const product = await updateProduct(req.params.id, req.body);

      return res.status(200).json({
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// DELETE /api/admin/catalog/:id
router.delete(
  "/catalog/:id",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      await deleteProduct(req.params.id);

      return res.status(200).json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/admin/predefined-outfits:
 *   post:
 *     summary: Generate predefined outfits
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Generation options (see admin.service.js)
 *     responses:
 *       201:
 *         description: Predefined outfits generated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 */
// POST /api/admin/predefined-outfits
router.post(
  "/predefined-outfits",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const outfits = await generatePredefinedOutfits(
        req.user.userId,
        req.body
      );

      return res.status(201).json({
        message: "Predefined outfits generated successfully",
        count: outfits.length,
        data: outfits,
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;