import User from "../models/User.model.js";
import Order from "../models/Order.model.js";

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");

    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's orders
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get order stats
    const totalOrders = await Order.countDocuments({ user: userId });

    // Calculate total spent
    const totalSpentResult = await Order.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    res.json({
      success: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        joined: req.user.createdAt
      },
      stats: {
        totalOrders,
        totalSpent: totalSpentResult[0]?.total || 0,
        recentOrders: orders.length
      },
      recentOrders: orders
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADDRESS APIs =================

// @desc    Get user addresses
// @route   GET /api/users/addresses
export const getUserAddresses = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.addresses || []);
};

// @desc    Add new address
// @route   POST /api/users/addresses
export const addUserAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  user.addresses.push(req.body);
  await user.save();

  // ✅ return ONLY newly added address
  const newAddress = user.addresses[user.addresses.length - 1];

  res.json(newAddress);
};


// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
export const updateUserAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  Object.assign(address, req.body);
  await user.save();

  res.json(user.addresses);
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
export const deleteUserAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  user.addresses = user.addresses.filter(
    (addr) => addr._id.toString() !== req.params.addressId
  );

  await user.save();
  res.json(user.addresses);
};


// @desc    Get orders of a specific user (Admin)
// @route   GET /api/users/:id/orders
// @access  Admin
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
