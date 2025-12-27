import express from "express";
import {
    registerAdmin,
    loginAdmin,
    getAllAdmins,
    deleteAdmin
} from "../controllers/admin.controller.js";
import protect from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/admin.middleware.js";

import { getAdminDashboard } from "../controllers/adminDashboard.controller.js";

const router = express.Router();

//  PUBLIC ROUTES 
// First admin creation (public initially, then protect)
router.post("/register", registerAdmin);

// Admin login (public)
router.post("/login", loginAdmin);

//  PROTECTED ADMIN ROUTES 
// Get all admins (admin only)
router.get("/", protect, isAdmin, getAllAdmins);

// Admin Dashboard 
router.get("/dashboard", protect, isAdmin, getAdminDashboard);

// Delete admin (admin only)
router.delete("/:id", protect, isAdmin, deleteAdmin);

export default router;