import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";

const MAX_QTY_PER_PRODUCT = 5;

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    // Safety check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authorized",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product", "name price images weight");

    if (!cart) {
      // If no cart exists, return empty cart
      return res.json({
        success: true,
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
        },
      });
    }

    res.json({
      success: true,
      cart,
    });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// @desc    Add to cart (SMART - handles single AND multiple items)
// @route   POST /api/cart/add
// @access  Private

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, items } = req.body;

    // Validate input
    if (!productId && (!items || !Array.isArray(items))) {
      return res.status(400).json({
        success: false,
        message: "Please provide productId or items array"
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Function to add a single item
    const addSingleItem = async (prodId, qty) => {
      const product = await Product.findById(prodId);
      if (!product) {
        throw new Error(`Product ${prodId} not found`);
      }

      // Check stock
      if (product.stockQuantity < qty) {
        throw new Error(`Only ${product.stockQuantity} ${product.name} in stock`);
      }

      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === prodId
      );
      if (existingItemIndex > -1) {
        const newQty = cart.items[existingItemIndex].quantity + qty;

        if (newQty > MAX_QTY_PER_PRODUCT) {
          throw new Error(
            `You can only add up to ${MAX_QTY_PER_PRODUCT} units of ${product.name}`
          );
        }

        cart.items[existingItemIndex].quantity = newQty;
      }
      else {
        if (qty > MAX_QTY_PER_PRODUCT) {
          throw new Error(
            `You can only add up to ${MAX_QTY_PER_PRODUCT} units of ${product.name}`
          );
        }
        // Add new item
        cart.items.push({
          product: prodId,
          quantity: qty,
          price: product.discountedPrice || product.price,
          name: product.name,
          image: product.images[0]?.url || "",
          weight: product.weight
        });
      }

      return { success: true, product: product.name };
    };

    const results = [];
    const errors = [];

    // Case 1: Single item (backward compatible)
    if (productId) {
      try {
        await addSingleItem(productId, quantity);
        results.push(`Added ${quantity} of product ${productId}`);
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Case 2: Multiple items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const { productId: itemProductId, quantity: itemQuantity = 1 } = item;

        if (!itemProductId) {
          errors.push("Item missing productId");
          continue;
        }

        try {
          await addSingleItem(itemProductId, itemQuantity);
          results.push(`Added ${itemQuantity} of product ${itemProductId}`);
        } catch (err) {
          errors.push(err.message);
        }
      }
    }

    // Save cart
    await cart.save();

    // Populate product details
    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product", "name price images weight");

    // Prepare response
    const response = {
      success: true,
      message: "Cart updated successfully",
      cart: populatedCart,
      added: results.length,
      results,
      ...(errors.length > 0 && { warnings: errors })
    };

    res.json(response);
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:itemId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }
    if (quantity > MAX_QTY_PER_PRODUCT) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_QTY_PER_PRODUCT} units allowed per product`
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    // Get product for stock check
    const product = await Product.findById(cart.items[itemIndex].product);
    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stockQuantity} items in stock`
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product", "name price images weight");

    res.json({
      success: true,
      message: "Cart updated",
      cart: populatedCart
    });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Remove item
    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId
    );

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product", "name price images weight");

    res.json({
      success: true,
      message: "Item removed from cart",
      cart: populatedCart
    });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: "Cart cleared",
      cart
    });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Increase item quantity by 1
// @route   PUT /api/cart/increase/:itemId
// @access  Private
export const increaseQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    const currentItem = cart.items[itemIndex];

    // Get product for stock check
    const product = await Product.findById(currentItem.product);
    if (product.stockQuantity < currentItem.quantity + 1) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stockQuantity} items in stock`
      });
    }
    if (currentItem.quantity >= MAX_QTY_PER_PRODUCT) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_QTY_PER_PRODUCT} units allowed per product`
      });
    }


    // Increase quantity by 1
    cart.items[itemIndex].quantity += 1;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product", "name price images weight");

    res.json({
      success: true,
      message: "Quantity increased",
      cart: populatedCart
    });
  } catch (err) {
    console.error("Increase quantity error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Decrease item quantity by 1
// @route   PUT /api/cart/decrease/:itemId
// @access  Private
export const decreaseQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    const currentItem = cart.items[itemIndex];

    // If quantity is 1, remove the item
    if (currentItem.quantity === 1) {
      cart.items = cart.items.filter(
        item => item._id.toString() !== itemId
      );

      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate("items.product", "name price images weight");

      return res.json({
        success: true,
        message: "Item removed from cart (quantity was 1)",
        cart: populatedCart
      });
    }

    // Decrease quantity by 1
    cart.items[itemIndex].quantity -= 1;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product", "name price images weight");

    res.json({
      success: true,
      message: "Quantity decreased",
      cart: populatedCart
    });
  } catch (err) {
    console.error("Decrease quantity error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
