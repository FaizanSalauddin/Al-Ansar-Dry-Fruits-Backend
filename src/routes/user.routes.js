import express from "express";

import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getUserDashboard
} from "../controllers/user.controller.js";
import protect from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/admin.middleware.js";

const router = express.Router();


// User profile routes

router.get("/profile", protect, getUserProfile);

// User Dashboard 

router.get("/dashboard", protect, getUserDashboard);
router.put("/profile", protect, updateUserProfile);

// Admin user management routes

router.get("/", protect, isAdmin, getUsers);
router.get("/:id", protect, isAdmin, getUserById);
router.put("/:id", protect, isAdmin, updateUser);
router.delete("/:id", protect, isAdmin, deleteUser);

export default router;


