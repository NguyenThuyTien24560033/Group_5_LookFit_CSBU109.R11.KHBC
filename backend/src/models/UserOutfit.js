import mongoose from "mongoose";

const userOutfitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    case: { type: String, required: true, trim: true },
    style: { type: String, required: true, trim: true },
    season: { type: String, required: true, trim: true },
    weather: { type: String, required: true, trim: true },
    lifestyle: { type: String, required: true, trim: true },
    bodyShape: { type: String, default: "rectangle" },
    recommendationGroupId: { type: String, default: null },
    status: {
      type: String,
      enum: ["DRAFT", "FINAL"],
      default: "DRAFT",
      index: true,
    },
    isPublic: { type: Boolean, default: false },
    isPreDefined: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userOutfitSchema.index({ status: 1, isPublic: 1, isPreDefined: 1 });
userOutfitSchema.index({ userId: 1, recommendationGroupId: 1, status: 1 });

const UserOutfit = mongoose.model("UserOutfit", userOutfitSchema);

export default UserOutfit;
