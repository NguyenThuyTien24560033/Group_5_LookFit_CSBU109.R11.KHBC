import mongoose from "mongoose";

const catalogItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    imageId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    },
    imageUrl: {
    type: String,
    trim: true,
    default: null,
    },
    cases: {
      type: [String],
      required: true,
      default: [],
    },
    styles: {
      type: [String],
      required: true,
      default: [],
    },
    seasons: {
      type: [String],
      required: true,
      default: [],
    },
    weathers: {
      type: [String],
      required: true,
      default: [],
    },
    shapes: {
      type: [String],
      required: true,
      default: [],
    },
    lifestyles: {
      type: [String],
      required: true,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

catalogItemSchema.index({ category: 1, isActive: 1 });

const CatalogItem = mongoose.model("CatalogItem", catalogItemSchema);

export default CatalogItem;
