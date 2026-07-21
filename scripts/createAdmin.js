import dotenv from "dotenv";
dotenv.config();

import connectDB from "../src/config/db.js";
import User from "../src/models/User.model.js";

const createAdmin = async () => {
  try {
    await connectDB();

    const email = "admin@gmail.com";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("❌ Admin already exists.");
      process.exit(0);
    }

    const admin = await User.create({
      name: "Admin",
      email: process.env.email,
      password: process.env.password,
      role: "admin",
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();