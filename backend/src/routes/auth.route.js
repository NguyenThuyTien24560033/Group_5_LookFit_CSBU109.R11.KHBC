import express from "express";
import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import HttpError from "../utils/httpError.js";

const router = express.Router();


router.post("/register", async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    return res.status(201).json({
      message: "Registration successful",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (req, res) => {
  return res.status(200).json({
    message: "Logout successful. Please remove your token on the client.",
  });
});

router.get(
  "/admin-test",
  authenticate,
  authorizeAdmin,
  (req, res) => {
    return res.status(200).json({
      message: "Admin access granted",
    });
  }
);

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("_id name email role")
      .lean();

    if (!user) {
      return next(new HttpError(404, "User not found"));
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;