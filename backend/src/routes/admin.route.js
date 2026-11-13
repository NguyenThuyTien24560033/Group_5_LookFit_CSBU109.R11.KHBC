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