import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["Home", "Office", "Other"],
      default: "Home"
    },
    name: String,
    phone: String,
    addressLine: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
      type: String,
      required: true,
      select: false, // 👈 extra safety
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    addresses: [addressSchema] // ✅ NEW
  },
  { timestamps: true }
);

// password hash
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// password compare
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
