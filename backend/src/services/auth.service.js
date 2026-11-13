import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import HttpError from "../utils/httpError.js";

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new HttpError(500, "JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

export async function registerUser({ name, email, password } = {}) {
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    throw new HttpError(400, "Name, email and password are required");
  }

  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail })
    .select("_id")
    .lean();

  if (existingUser) {
    throw new HttpError(409, "Email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;

  try {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(409, "Email already exists");
    }

    throw error;
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token: createToken(user),
  };
}

export async function loginUser({ email, password } = {}) {
  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    throw new HttpError(400, "Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail })
    .select("+passwordHash");

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: createToken(user),
  };
}
