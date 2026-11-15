import express from "express";
import multer from "multer";
import {
  saveImage,
  streamImage,
  deleteImage,
} from "../services/image.service.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }

    callback(null, true);
  },
});

/**
 * @swagger
 * tags:
 *   - name: Images
 *     description: Image upload and retrieval endpoints
 *
 * components:
 *   parameters:
 *     imageId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ID of the image
 */

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: Upload an image (admin only)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG or WebP file, max 5 MB
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file type or file too large
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 */
// POST /api/images/upload
// Form-data: image = image file
router.post(
  "/upload",
  authenticate,
  authorizeAdmin,
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message: error.message || "Image upload failed",
        });
      }

      next();
    });
  },
  async (req, res, next) => {
    try {
      const result = await saveImage(req.file);

      return res.status(201).json({
        message: "Image uploaded successfully",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/images/{id}:
 *   get:
 *     summary: Get an image by ID (public)
 *     tags: [Images]
 *     parameters:
 *       - $ref: '#/components/parameters/imageId'
 *     responses:
 *       200:
 *         description: The image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: Image not found
 *   delete:
 *     summary: Delete an image by ID (admin only)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/imageId'
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       400:
 *         description: Malformed ID
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not an admin
 *       404:
 *         description: Image not found
 */
// GET /api/images/:id
router.get("/:id", async (req, res, next) => {
  try {
    await streamImage(req.params.id, res);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/images/:id
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const result = await deleteImage(req.params.id);

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
);

export default router;