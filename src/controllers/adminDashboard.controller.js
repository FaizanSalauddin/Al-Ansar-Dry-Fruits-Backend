import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import User from "../models/User.model.js";

export const getAdminDashboard = async (req, res) => {
  try {
    // 1. Basic Counts
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });

    // 2. Revenue: Sirf un orders ka jinka paymentStatus 'Paid' hai
    const revenueData = await Order.aggregate([
      { $match: { isPaid: true } }, // Sirf paid orders uthayega
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    // 3. Pie Chart Data: Paid vs Unpaid orders ki ginti
    const paidOrders = await Order.countDocuments({ isPaid: true });
    const unpaidOrders = await Order.countDocuments({ isPaid: false });

    // 4. Monthly Revenue (Futuristic Bar Chart ke liye)
    // Ye pichle 6 mahine ka data group karega
    const monthlyStats = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 6 }
    ]);

    // Month numbers ko names mein convert karna (Frontend ke liye)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyData = monthlyStats.map(item => ({
      name: monthNames[item._id - 1],
      revenue: item.revenue
    }));

    // 5. Recent orders and Low Stock
    const recentOrders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    const lowStockProducts = await Product.find({
      stockQuantity: { $lt: 20 }
    }).limit(10);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: revenueData[0]?.total || 0,
        paidOrders,
        unpaidOrders,
        monthlyData: formattedMonthlyData // Ye aapke bar chart mein jayega
      },
      recentOrders,
      lowStockProducts
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};