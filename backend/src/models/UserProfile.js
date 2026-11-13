import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    height: {
      type: Number,
      required: true,
      min: 1,
    },
    weight: {
      type: Number,
      required: true,
      min: 1,
    },
    bust: {
      type: Number,
      required: true,
      min: 1,
    },
    waist: {
      type: Number,
      required: true,
      min: 1,
    },
    hip: {
      type: Number,
      required: true,
      min: 1,
    },
    bodyShape: {
      type: String,
      required: true,
      enum: [
        "hourglass",
        "pear",
        "inverted-triangle",
        "rectangle",
        "apple",
      ],
    },
    favoriteColors: {
      type: [String],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
