import express from "express";
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus,
  createOrderFromCart
} from "../controllers/order.controller.js";
import protect from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/admin.middleware.js";

const router = express.Router();

// User routes
router.post("/", protect, createOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/pay", protect, updateOrderToPaid);
router.post("/from-cart", protect, createOrderFromCart);
// Admin routes
router.get("/", protect, isAdmin, getOrders);
router.put("/:id/deliver", protect, isAdmin, updateOrderToDelivered);
router.put("/:id/status", protect, isAdmin, updateOrderStatus);

export default router;