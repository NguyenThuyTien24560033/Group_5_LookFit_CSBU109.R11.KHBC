
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import sharp from "sharp";
import HttpError from "../utils/httpError.js";

function getBucket() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new HttpError(503, "Database is not connected");
  }

  return new GridFSBucket(db, { bucketName: "images" });
}

export async function saveImage(file) {
  if (!file?.buffer) {
    throw new HttpError(400, "Image file is required");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new HttpError(400, "Only JPEG, PNG, and WebP images are allowed");
  }

  let processedBuffer;

  try {
    processedBuffer = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new HttpError(400, "Invalid image file");
  }

  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(
    `image-${Date.now()}.webp`,
    {
      contentType: "image/webp",
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date(),
      },
    }
  );

  await new Promise((resolve, reject) => {
    uploadStream.on("error", reject);
    uploadStream.on("finish", resolve);
    uploadStream.end(processedBuffer);
  });

  return {
    imageId: uploadStream.id.toString(),
    contentType: "image/webp",
  };
}

export async function streamImage(imageId, res) {
  if (!mongoose.isValidObjectId(imageId)) {
    throw new HttpError(404, "Image not found");
  }

  const id = new ObjectId(imageId);
  const bucket = getBucket();

  const files = await bucket.find({ _id: id }).toArray();

  if (!files.length) {
    throw new HttpError(404, "Image not found");
  }

  res.setHeader("Content-Type", files[0].contentType || "image/webp");
  res.setHeader("Cache-Control", "public, max-age=86400");

  const downloadStream = bucket.openDownloadStream(id);

  downloadStream.on("error", (error) => {
    if (!res.headersSent) {
      res.status(404).json({ message: "Image not found" });
    } else {
      res.destroy(error);
    }
  });

  downloadStream.pipe(res);
}

export async function deleteImage(imageId) {
  if (!mongoose.isValidObjectId(imageId)) {
    throw new HttpError(404, "Image not found");
  }

  const bucket = getBucket();
  const id = new ObjectId(imageId);
  const files = await bucket.find({ _id: id }).toArray();

  if (!files.length) {
    throw new HttpError(404, "Image not found");
  }

  await bucket.delete(id);

  return { message: "Image deleted successfully" };
}
