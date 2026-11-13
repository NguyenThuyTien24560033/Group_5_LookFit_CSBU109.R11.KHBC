import express from "express";
import {
  searchProducts,
  getProductById,
} from "../services/catalog.service.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { search, category, color, page, pageSize } = req.query;

    const result = await searchProducts({
      search,
      category,
      color,
      page,
      pageSize,
    });

    return res.status(200).json({
      message: "Products retrieved successfully",
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);

    return res.status(200).json({
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;