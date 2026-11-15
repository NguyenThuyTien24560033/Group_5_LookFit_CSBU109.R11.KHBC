import express from "express";
import {
  searchProducts,
  getProductById,
} from "../services/catalog.service.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Catalog
 *     description: Public product catalog endpoints
 *
 * components:
 *   parameters:
 *     catalogId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ID of the product
 */

/**
 * @swagger
 * /api/catalog:
 *   get:
 *     summary: Search products (filters and pagination)
 *     tags: [Catalog]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by color
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
 *         description: Products retrieved successfully
 */
// GET /api/catalog?page=1&pageSize=10&search=&category=&color=
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

/**
 * @swagger
 * /api/catalog/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Catalog]
 *     parameters:
 *       - $ref: '#/components/parameters/catalogId'
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: Product not found
 */

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