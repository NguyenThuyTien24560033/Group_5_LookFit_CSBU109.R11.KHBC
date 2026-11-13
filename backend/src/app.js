import express from "express";
import cors from "cors";

import errorHandler from "./middleware/errorHandler.js";

import authRouter from "./routes/auth.route.js";
import profileRouter from "./routes/profile.route.js";
import outfitRouter from "./routes/outfit.route.js";
import adminRouter from "./routes/admin.route.js";


const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "LFit API is running",
  });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/admin", adminRouter);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

export default app;
