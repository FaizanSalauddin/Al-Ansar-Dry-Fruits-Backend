import express from "express";

import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getUserDashboard,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
} from "../controllers/user.controller.js";
import protect from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/admin.middleware.js";

const router = express.Router();


// User profile routes

router.get("/profile", protect, getUserProfile);

// User Dashboard 

router.get("/dashboard", protect, getUserDashboard);
router.put("/profile", protect, updateUserProfile);

// User Addresses

router.get("/addresses", protect, getUserAddresses);
router.post("/addresses", protect, addUserAddress);
router.put("/addresses/:addressId", protect, updateUserAddress);
router.delete("/addresses/:addressId", protect, deleteUserAddress);

// Admin user management routes

router.get("/", protect, isAdmin, getUsers);
router.get("/:id", protect, isAdmin, getUserById);
router.put("/:id", protect, isAdmin, updateUser);
router.delete("/:id", protect, isAdmin, deleteUser);

export default router;


