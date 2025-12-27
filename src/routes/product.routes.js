import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
  updateStock,
  getLowStockProducts,
  getStockReport
} from "../controllers/product.controller.js";
import protect from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/admin.middleware.js";
import { uploadToCloudinary } from "../middlewares/uploadCloudinary.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/search", searchProducts);
// Stock management routes
router.get("/low-stock", protect, isAdmin, getLowStockProducts);
router.get("/stock-report", protect, isAdmin, getStockReport);
router.get("/category/:category", getProductsByCategory);
router.put("/:id/stock", protect, isAdmin, updateStock);
router.get("/:id", getProductById);

// Admin routes (FIXED ORDER)
router.post(
  "/",
  protect,
  isAdmin,
  uploadToCloudinary, 
  createProduct
);

router.put(
  "/:id",
  protect,
  isAdmin,
  uploadToCloudinary,
  updateProduct
);

router.delete("/:id", protect, isAdmin, deleteProduct);


export default router;