
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import User from "../src/models/User.js";

const rl = readline.createInterface({ input, output });

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected database:", mongoose.connection.name);

    if (mongoose.connection.name !== "lfit") {
      throw new Error(
        `Wrong database "${mongoose.connection.name}". Expected "lfit".`
      );
    }

    const name = (await rl.question("Admin name: ")).trim();
    const email = (await rl.question("Admin email: "))
      .trim()
      .toLowerCase();
    const password = await rl.question("Admin password (visible while typing): ");

    if (!name || !email || password.length < 8) {
      throw new Error(
        "Name and email are required; password must be at least 8 characters."
      );
    }

    const existingUser = await User.findOne({ email })
      .select("_id email role")
      .lean();

    if (existingUser) {
      throw new Error(
        `Email already exists with role "${existingUser.role}". No changes made.`
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      passwordHash,
      role: "ADMIN",
    });

    console.log("Admin created successfully:");
    console.log({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Could not create admin:", error.message);
  process.exitCode = 1;
});
