import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

// ========== CRITICAL: MIDDLEWARE ORDER ==========
// 1. CORS FIRST
// app.use(cors());

// for mobile testing 

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// 2. URL-encoded for form-data (MUST come before json)
app.use(express.urlencoded({
  extended: true,
  limit: '50mb'  // Increase limit for file uploads
}));

// 3. JSON parsing
app.use(express.json({
  limit: '50mb'  // Increase limit
}));


app.use("/api/chat", chatRoutes);

import cloudinary from './config/cloudinary.js';

app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      { folder: 'test' }
    );
    res.json({ success: true, result });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ========== BASIC ROUTE ==========
app.get("/", (req, res) => {
  res.json({
    message: "Al-Ansar Dry Fruits API is running",
    timestamp: new Date().toISOString()
  });
});

// ========== API ROUTES ==========
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
// ========== ERROR HANDLING ==========
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
});

export default app;