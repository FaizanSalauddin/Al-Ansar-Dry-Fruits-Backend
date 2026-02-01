import express from "express";
import { createPaymentIntent } from "../controllers/payment.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-intent", protect, createPaymentIntent);

export default router;
