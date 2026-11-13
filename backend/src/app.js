import express from "express";
import cors from "cors";
import errorHandler from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.route.js";


const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));


app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "LFit API is running",
  });
});


app.use("/api/auth", authRouter);


app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(errorHandler);

export default app;
