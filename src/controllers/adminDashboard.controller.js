import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import User from "../models/User.model.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const { timeframe, date } = req.query;
    const now = new Date();

    // 1. Basic Counts
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });

    // 2. Total Revenue (All Paid Orders)
    const revenueData = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // 3. Pie Chart Data: Paid vs Unpaid orders
    const paidOrders = await Order.countDocuments({ isPaid: true });
    const unpaidOrders = await Order.countDocuments({ isPaid: false });

    // 4. Time-based Revenue Calculations
    // Today's Revenue
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayRevenueData = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: todayStart, $lte: todayEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const todayRevenue = todayRevenueData[0]?.total || 0;

    // This Week's Revenue (Monday to Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59, 999);
    
    const weeklyRevenueData = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: weekStart, $lte: weekEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const weeklyRevenue = weeklyRevenueData[0]?.total || 0;

    // This Month's Revenue
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    const monthlyRevenueData = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: monthStart, $lte: monthEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const monthlyRevenue = monthlyRevenueData[0]?.total || 0;

    // This Year's Revenue
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    yearEnd.setHours(23, 59, 59, 999);
    
    const yearlyRevenueData = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: yearStart, $lte: yearEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const yearlyRevenue = yearlyRevenueData[0]?.total || 0;

    // Custom Date Revenue
    let customDateRevenue = 0;
    if (date && timeframe === 'custom') {
      const customStart = new Date(date);
      customStart.setHours(0, 0, 0, 0);
      const customEnd = new Date(date);
      customEnd.setHours(23, 59, 59, 999);
      
      const customRevenueData = await Order.aggregate([
        { 
          $match: { 
            isPaid: true,
            createdAt: { $gte: customStart, $lte: customEnd }
          } 
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]);
      customDateRevenue = customRevenueData[0]?.total || 0;
    }

    // 5. Generate Chart Data
    // Daily Data (Last 7 days)
    const dailyData = await generateDailyData();
    
    // Weekly Data (Last 4 weeks)
    const weeklyData = await generateWeeklyData();
    
    // Monthly Data (Last 6 months)
    const monthlyData = await generateMonthlyData();
    
    // Yearly Data (Last 5 years)
    const yearlyData = await generateYearlyData();

    // 6. Recent orders and Low Stock
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
        totalRevenue,
        paidOrders,
        unpaidOrders,
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        yearlyRevenue,
        customDateRevenue,
        dailyData,
        weeklyData,
        monthlyData,
        yearlyData
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

// Helper function for Daily Data (Last 7 days)
async function generateDailyData() {
  const data = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const result = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: date, $lte: dayEnd }
        } 
      },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" } } }
    ]);
    
    data.push({
      name: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      fullDate: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: result[0]?.revenue || 0
    });
  }
  
  return data;
}

// Helper function for Weekly Data (Last 4 weeks)
async function generateWeeklyData() {
  const data = [];
  const now = new Date();
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (now.getDay() + (i * 7)) + 1);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const result = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: weekStart, $lte: weekEnd }
        } 
      },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" } } }
    ]);
    
    data.push({
      name: `Week ${i + 1}`,
      dateRange: `${weekStart.getDate()}/${weekStart.getMonth()+1} - ${weekEnd.getDate()}/${weekEnd.getMonth()+1}`,
      revenue: result[0]?.revenue || 0
    });
  }
  
  return data;
}

// Helper function for Monthly Data (Last 6 months)
async function generateMonthlyData() {
  const data = [];
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    const result = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: monthStart, $lte: monthEnd }
        } 
      },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" } } }
    ]);
    
    data.push({
      name: monthNames[month.getMonth()],
      fullMonth: month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      revenue: result[0]?.revenue || 0
    });
  }
  
  return data;
}

// Helper function for Yearly Data (Last 5 years)
async function generateYearlyData() {
  const data = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    yearEnd.setHours(23, 59, 59, 999);
    
    const result = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: yearStart, $lte: yearEnd }
        } 
      },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" } } }
    ]);
    
    data.push({
      name: year.toString(),
      revenue: result[0]?.revenue || 0
    });
  }
  
  return data;
}