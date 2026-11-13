
import jwt from "jsonwebtoken";
import HttpError from "../utils/httpError.js";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new HttpError(401, "Authentication token is required")
    );
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return next(new HttpError(401, "Invalid or expired token"));
  }

  if (!process.env.JWT_SECRET) {
    return next(
      new HttpError(500, "JWT_SECRET is not configured")
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId || !decoded.role) {
      return next(new HttpError(401, "Invalid or expired token"));
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}

export function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return next(new HttpError(403, "Admin access required"));
  }

  return next();
}
