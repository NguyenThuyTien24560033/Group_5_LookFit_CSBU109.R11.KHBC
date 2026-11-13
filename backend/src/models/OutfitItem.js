import mongoose from "mongoose";

const outfitItemSchema = new mongoose.Schema(
  {
    outfitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserOutfit",
      required: true,
      index: true,
    },
    catalogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CatalogItem",
      required: true,
    },
    category: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, default: null },
    imageId: { type: mongoose.Schema.Types.ObjectId, default: null },
    imageUrl: { type: String, default: null, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const OutfitItem = mongoose.model("OutfitItem", outfitItemSchema);

export default OutfitItem;