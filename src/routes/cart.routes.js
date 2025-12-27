import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  increaseQuantity,
  decreaseQuantity
} from "../controllers/cart.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Get user's cart
router.get("/", getCart);

// Add item to cart for both sing;e and multiple products

router.post("/add", addToCart);


// Update item quantity (set specific quantity)
router.put("/update/:itemId", updateCartItem);

// Increase quantity by 1
router.put("/increase/:itemId", increaseQuantity);

// Decrease quantity by 1
router.put("/decrease/:itemId", decreaseQuantity);

// Remove item from cart
router.delete("/remove/:itemId", removeFromCart);

// Clear entire cart
router.delete("/clear", clearCart);

export default router;