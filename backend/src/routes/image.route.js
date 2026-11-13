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