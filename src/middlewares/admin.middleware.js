const isAdmin = (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  
  // Check if user role is admin
  if (req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access denied" });
  }
};

export default isAdmin;