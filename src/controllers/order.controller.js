import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import Cart from "../models/Cart.model.js";
import sendEmail from "../utils/sendEmail.js";
import { orderPlacedEmail } from "../templates/orderPlacedEmail.js";
import { orderStatusUpdateEmail } from "../templates/orderStatusUpdateEmail.js";


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

// @desc    Get all orders (FILTERED)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const { status, payment, date } = req.query;

    const query = {};

    // 🔹 USER FILTER
    if (req.query.user) {
      query.user = req.query.user;
    }


    // 🔹 STATUS FILTER
    if (status) {
      query.orderStatus = status;
    }

    // 🔹 PAYMENT FILTER
    if (payment === "paid") query.isPaid = true;
    if (payment === "unpaid") query.isPaid = false;

    // 🔹 DATE FILTER
    if (date === "today") {
      // 🇮🇳 IST START OF DAY
      const istOffset = 5.5 * 60 * 60 * 1000;

      const now = new Date();
      const istNow = new Date(now.getTime() + istOffset);

      const startIST = new Date(istNow);
      startIST.setHours(0, 0, 0, 0);

      const endIST = new Date(istNow);
      endIST.setHours(23, 59, 59, 999);

      // 🔁 Convert back to UTC for MongoDB
      const startUTC = new Date(startIST.getTime() - istOffset);
      const endUTC = new Date(endIST.getTime() - istOffset);

      query.createdAt = {
        $gte: startUTC,
        $lte: endUTC,
      };
    }


    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
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

// @desc    Update order status (ADMIN)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, isPaid } = req.body; // Added isPaid here

    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const oldStatus = order.orderStatus;

    // ✅ UPDATE STATUS LOGIC
    if (status && status !== oldStatus) {
      order.orderStatus = status;

      // Agar status 'delivered' set kiya jaye, toh automatically delivered status update ho
      if (status === "delivered") {
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        // Logic: Agar delivered ho gaya hai, toh logically wo Paid bhi hona chahiye (COD ke case mein)
        if (order.paymentMethod === 'cod') {
          order.isPaid = true;
          order.paidAt = Date.now();
        }
      }
    }

    // ✅ NEW: MANUAL PAID TOGGLE LOGIC (For your Dashboard revenue)
    // Agar admin ne checkbox/toggle se isPaid bheja hai
    if (typeof isPaid !== 'undefined') {
      order.isPaid = isPaid;
      if (isPaid) {
        order.paidAt = Date.now();
      } else {
        order.paidAt = null;
      }
    }

    const updatedOrder = await order.save();

    // ✅ SEND EMAIL (Only if status changed)
    if (status && status !== oldStatus) {
      await sendEmail({
        to: order.user.email,
        subject: `Order Status Updated: ${status.toUpperCase()}`,
        html: orderStatusUpdateEmail(
          order.user.name,
          updatedOrder
        ),
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });

  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// @desc    Create order from cart (AUTOMATIC)
// @route   POST /api/orders/from-cart
// @access  Private
export const createOrderFromCart = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "cod", paymentResult } = req.body;

    // 1. Validation for Shipping Address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const { name, address, city, state, pincode, phone } = shippingAddress;
    if (!name || !address || !city || !state || !pincode || !phone) {
      return res.status(400).json({
        success: false,
        message: "Incomplete shipping address",
      });
    }

    // 2. Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price stockQuantity images"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // 3. Check Order Limits & Stock
    for (const item of cart.items) {
      if (item.quantity > MAX_QTY_PER_PRODUCT) {
        return res.status(400).json({
          success: false,
          message: `Order limit exceeded for ${item.product.name}. Max ${MAX_QTY_PER_PRODUCT} allowed`,
        });
      }
      if (item.product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}. Only ${item.product.stockQuantity} available`,
        });
      }
    }

    // 4. Prepare Order Data
    const orderItems = cart.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.images?.[0]?.url,
      product: item.product._id,
    }));

    const itemsPrice = cart.totalPrice;
    const shippingPrice = itemsPrice >= 1000 ? 0 : 50;
    const totalPrice = itemsPrice + shippingPrice;

    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3);

    // 5. Initialize New Order (Fixed the ReferenceError here)
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      estimatedDeliveryDate,
      orderStatus: "confirmed",
    });

    // 6. Set Online Payment Details if applicable
    if (paymentMethod === "online" || paymentMethod === "stripe") {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = paymentResult;
      // Ensure paymentMethod is consistent with your Schema Enum
      order.paymentMethod = "online";
    }

    // 7. Update product stock quantities
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.stockQuantity -= item.quantity;
        product.inStock = product.stockQuantity > 0;
        await product.save();
      }
    }

    // 8. Save Order & Clear Cart
    const createdOrder = await order.save();

    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    await cart.save();

    // 9. Final Response & Email
    const populatedOrder = await Order.findById(createdOrder._id).populate(
      "user",
      "name email"
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder,
    });

    // 10. Send Email (Async)
    sendEmail({
      to: populatedOrder.user.email,
      subject: `Your Order ${createdOrder._id} has been placed ✅`,
      html: orderPlacedEmail(populatedOrder.user.name, populatedOrder),
    }).catch((err) => console.error("Email Sending Failed:", err));

  } catch (err) {
    console.error("Create order from cart error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Update estimated delivery date
// @route   PUT /api/orders/:id/estimated-date
// @access  Private/Admin

export const updateEstimatedDeliveryDate = async (req, res) => {
  try {
    const { estimatedDeliveryDate } = req.body;

    if (!estimatedDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: "Estimated delivery date is required",
      });
    }

    // ✅ 1. Update date in DB
    await Order.findByIdAndUpdate(
      req.params.id,
      {
        estimatedDeliveryDate: new Date(estimatedDeliveryDate),
      },
      { new: true }
    );

    // ✅ 2. Fetch FRESH order from DB
    const freshOrder = await Order.findById(req.params.id)
      .populate("user", "name email");

    if (!freshOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 📧 SEND DELIVERY DATE EMAIL ONLY
    await sendEmail({
      to: freshOrder.user.email,
      subject: "📦 Delivery Date Updated",
      html: `
    <div style="font-family: Arial">
      <h2>Hi ${freshOrder.user.name} 👋</h2>
      <p>Your delivery date has been updated.</p>
      <p><b>New Expected Delivery:</b> 
        ${new Date(freshOrder.estimatedDeliveryDate).toDateString()}
      </p>
      <p>— Team Al-Ansar</p>
    </div>
  `,
    });


    // ✅ 4. Respond with fresh data
    res.json({
      success: true,
      message: "Estimated delivery date updated & email sent",
      order: freshOrder,
    });

  } catch (err) {
    console.error("Update estimated date error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
// @desc    Toggle payment status (Admin)
// @route   PUT /api/orders/:id/payment-status
// @access  Private/Admin
export const updatePaymentStatus = async (req, res) => {
  try {
    const { isPaid } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isPaid = isPaid;
    order.paidAt = isPaid ? Date.now() : null;

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: `Order marked as ${isPaid ? "Paid" : "Unpaid"}`,
      order: updatedOrder,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
