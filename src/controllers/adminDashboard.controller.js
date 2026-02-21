import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import User from "../models/User.model.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const { timeframe, date } = req.query;
    const now = new Date();

    /* =====================================================
       1️⃣ PARALLEL BASIC COUNTS + TOTAL REVENUE
    ===================================================== */

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      paidOrders,
      unpaidOrders,
      revenueAgg
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Order.countDocuments({ isPaid: true }),
      Order.countDocuments({ isPaid: false }),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    /* =====================================================
       2️⃣ TIME BASED REVENUE (PARALLEL)
    ===================================================== */

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    yearEnd.setHours(23, 59, 59, 999);

    const [
      todayAgg,
      weeklyAgg,
      monthlyAgg,
      yearlyAgg
    ] = await Promise.all([
      getRevenueBetween(todayStart, todayEnd),
      getRevenueBetween(weekStart, weekEnd),
      getRevenueBetween(monthStart, monthEnd),
      getRevenueBetween(yearStart, yearEnd)
    ]);

    const todayRevenue = todayAgg;
    const weeklyRevenue = weeklyAgg;
    const monthlyRevenue = monthlyAgg;
    const yearlyRevenue = yearlyAgg;

    /* =====================================================
       3️⃣ CUSTOM DATE (ONLY IF NEEDED)
    ===================================================== */

    let customDateRevenue = 0;

    if (date && timeframe === "custom") {
      const customStart = new Date(date);
      customStart.setHours(0, 0, 0, 0);

      const customEnd = new Date(date);
      customEnd.setHours(23, 59, 59, 999);

      customDateRevenue = await getRevenueBetween(
        customStart,
        customEnd
      );
    }

    /* =====================================================
       4️⃣ CHART DATA — ONLY 4 AGGREGATIONS (BIG WIN 🚀)
    ===================================================== */

    const [dailyData, weeklyData, monthlyData, yearlyData] =
      await Promise.all([
        getDailyDataOptimized(),
        getWeeklyDataOptimized(),
        getMonthlyDataOptimized(),
        getYearlyDataOptimized()
      ]);

    /* =====================================================
       5️⃣ LIGHTWEIGHT RECENT ORDERS
    ===================================================== */

    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select("user totalPrice createdAt isPaid")
      .populate("user", "name email")
      .lean();

    const lowStockProducts = await Product.find({
      stockQuantity: { $lt: 20 }
    })
      .select("name stockQuantity")
      .limit(10)
      .lean();

    /* =====================================================
       RESPONSE
    ===================================================== */

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

/* =====================================================
   🔥 HELPER: Revenue Between Dates
===================================================== */

async function getRevenueBetween(start, end) {
  const result = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" }
      }
    }
  ]);

  return result[0]?.total || 0;
}

/* =====================================================
   🚀 DAILY (LAST 7 DAYS) — SINGLE QUERY
===================================================== */

async function getDailyDataOptimized() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  // Mongo se actual data
  const raw = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: { $gte: start }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        revenue: { $sum: "$totalPrice" }
      }
    }
  ]);

  // map for quick lookup
  const map = new Map(raw.map(r => [r._id, r.revenue]));

  // ALWAYS 7 days return
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const key = d.toISOString().slice(0, 10);

    result.push({
      _id: key,
      revenue: map.get(key) || 0
    });
  }

  return result;
}

/* =====================================================
   🚀 WEEKLY — SINGLE QUERY
===================================================== */

async function getWeeklyDataOptimized() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 28);

  const raw = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: { $gte: start }
      }
    },
    {
      $group: {
        _id: { $isoWeek: "$createdAt" },
        revenue: { $sum: "$totalPrice" }
      }
    }
  ]);

  const map = new Map(raw.map(r => [r._id, r.revenue]));

  const currentWeek = getISOWeek(now);
  const result = [];

  for (let i = 3; i >= 0; i--) {
    const week = currentWeek - i;

    result.push({
      _id: week,
      revenue: map.get(week) || 0
    });
  }

  return result;
}

// helper
function getISOWeek(date) {
  const tmp = new Date(date);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
}

/* =====================================================
   🚀 MONTHLY — SINGLE QUERY
===================================================== */

async function getMonthlyDataOptimized() {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 5);

  const raw = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: { $gte: start }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalPrice" }
      }
    }
  ]);

  const map = new Map(raw.map(r => [r._id, r.revenue]));
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);

    const month = d.getMonth() + 1;

    result.push({
      _id: month,
      revenue: map.get(month) || 0
    });
  }

  return result;
}

/* =====================================================
   🚀 YEARLY — SINGLE QUERY
===================================================== */

async function getYearlyDataOptimized() {
  const now = new Date();
  const startYear = now.getFullYear() - 4;

  const raw = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: {
          $gte: new Date(startYear, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { $year: "$createdAt" },
        revenue: { $sum: "$totalPrice" }
      }
    }
  ]);

  const map = new Map(raw.map(r => [r._id, r.revenue]));
  const result = [];

  for (let y = startYear; y <= now.getFullYear(); y++) {
    result.push({
      _id: y,
      revenue: map.get(y) || 0
    });
  }

  return result;
}