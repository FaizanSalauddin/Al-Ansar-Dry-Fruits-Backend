import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import Cart from "../models/Cart.model.js";
const MAX_QTY_PER_PRODUCT = 5;
// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items"
      });
    }

    // Update product stock quantities
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stockQuantity -= item.quantity;
        if (product.stockQuantity < 0) {
          product.stockQuantity = 0;
        }
        product.inStock = product.stockQuantity > 0;
        await product.save();
      }
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // ====== CLEAR CART AFTER ORDER ======
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    // ====================================

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: createdOrder
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (order) {
      // Check if user owns order or is admin
      if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return res.status(401).json({
          success: false,
          message: "Not authorized"
        });
      }

      res.json({
        success: true,
        order
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email");

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.payer?.email_address || req.body.email_address,
      };

      const updatedOrder = await order.save();

      res.json({
        success: true,
        message: "Order marked as paid",
        order: updatedOrder
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
  } catch (err) {
    console.error("Update to paid error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.orderStatus = "delivered";

      const updatedOrder = await order.save();

      res.json({
        success: true,
        message: "Order marked as delivered",
        order: updatedOrder
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
  } catch (err) {
    console.error("Update to delivered error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.orderStatus = req.body.status;

      if (req.body.status === "delivered") {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }

      const updatedOrder = await order.save();

      res.json({
        success: true,
        message: `Order status updated to ${req.body.status}`,
        order: updatedOrder
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create order from cart (AUTOMATIC)
// @route   POST /api/orders/from-cart
// @access  Private
export const createOrderFromCart = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "cod" } = req.body;
    const { name, address, city, state, pincode, phone } = shippingAddress;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required"
      });
    }

    if (!name || !address || !city || !state || !pincode || !phone) {
      return res.status(400).json({
        success: false,
        message: "Incomplete shipping address"
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product", "name price stockQuantity");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // Prepare order items from cart
    const orderItems = cart.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.product.images?.[0]?.url, // ✅ VERY IMPORTANT
      product: item.product._id
    }));


    // Calculate prices (simple calculation)
    const itemsPrice = cart.totalPrice;
    const shippingPrice = itemsPrice > 1000 ? 0 : 50; // Free shipping above 1000
    const taxPrice = Math.round(itemsPrice * 0.1); // 10% tax
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    for (const item of cart.items) {
      if (item.quantity > MAX_QTY_PER_PRODUCT) {
        return res.status(400).json({
          success: false,
          message: `Order limit exceeded for ${item.name}. Max ${MAX_QTY_PER_PRODUCT} allowed`
        });
      }
    }


    // Check stock for all items
    for (const item of cart.items) {
      const product = item.product;
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stockQuantity} available`
        });
      }
    }

    // Update product stock quantities
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.stockQuantity -= item.quantity;
        if (product.stockQuantity < 0) {
          product.stockQuantity = 0;
        }
        product.inStock = product.stockQuantity > 0;
        await product.save();
      }
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // Clear cart after order
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    await cart.save();

    // Populate user details
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate("user", "name email");

    res.status(201).json({
      success: true,
      message: "Order created from cart successfully",
      order: populatedOrder
    });
  } catch (err) {
    console.error("Create order from cart error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
};