import express from "express";
import { sendOtp, verifyOtp, adminLogin } from "../controllers/auth.controller.js";

const router = express.Router();

// USER (EMAIL OTP)
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// ADMIN (PASSWORD)
router.post("/admin/login", adminLogin);

export default router;
