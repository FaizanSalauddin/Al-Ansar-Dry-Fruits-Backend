import User from "../models/User.model.js";
import generateToken from "../utils/generateToken.js";

// ADMIN REGISTRATION 
// Note: Ye route sirf super admin ke liye hoga (baad mein protect karenge)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password"
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // Create ADMIN user (role set to 'admin')
    const adminUser = await User.create({
      name,
      email,
      password,
      role: "admin"
    });

    res.status(201).json({
      success: true,
      message: "✅ Admin created successfully",
      admin: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
      // Note: Token nahi denge - alag se login karna hoga
    });
  } catch (err) {
    console.error("Admin registration error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ==================== ADMIN LOGIN ====================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    // Check if user exists AND is admin
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "✅ Admin login successful",
      admin: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: token
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ==================== GET ALL ADMINS ====================
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    
    res.json({
      success: true,
      count: admins.length,
      admins: admins
    });
  } catch (err) {
    console.error("Get admins error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ==================== DELETE ADMIN ====================
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Don't allow self-deletion
    if (admin._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete yourself"
      });
    }

    await admin.deleteOne();
    
    res.json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};