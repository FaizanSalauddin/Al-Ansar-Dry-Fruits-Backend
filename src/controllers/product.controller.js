import { Product } from "../models/index.js";

export const getProducts = async (req, res) => {
  try {
    const { category, featured, search } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (featured) {
      query.featured = featured === "true";
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin

export const createProduct = async (req, res) => {
  try {
    console.log("=== PRODUCT CREATION ===");

    // ❗ Image mandatory
    if (!req.cloudinaryFiles || req.cloudinaryFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required"
      });
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: Number(req.body.price),
      discountedPrice: req.body.discountedPrice
        ? Number(req.body.discountedPrice)
        : undefined,
      weight: req.body.weight,
      stockQuantity: Number(req.body.stockQuantity),
      featured: req.body.featured === "true",
      images: req.cloudinaryFiles
    });

    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: savedProduct
    });

  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Update basic fields
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.category = req.body.category || product.category;
    product.price = req.body.price || product.price;
    product.discountedPrice = req.body.discountedPrice || product.discountedPrice;
    product.weight = req.body.weight || product.weight;
    product.stockQuantity = req.body.stockQuantity || product.stockQuantity;
    product.featured = req.body.featured !== undefined
      ? (req.body.featured === 'true')
      : product.featured;

    // If new images uploaded, add to existing images
    // Update images
    if (req.cloudinaryFiles && req.cloudinaryFiles.length > 0) {
      product.images.push(...req.cloudinaryFiles);
    }


    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
export const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Find the image to delete
    const imageIndex = product.images.findIndex(
      img => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    const imageToDelete = product.images[imageIndex];

    // Delete from Cloudinary
    try {
      const cloudinary = (await import('../config/cloudinary.js')).default;
      await cloudinary.uploader.destroy(imageToDelete.public_id);
      console.log(`Deleted from Cloudinary: ${imageToDelete.public_id}`);
    } catch (cloudinaryErr) {
      console.error("Cloudinary deletion error:", cloudinaryErr);
      // Continue with DB deletion even if Cloudinary fails
    }

    // Remove from product images array
    product.images.splice(imageIndex, 1);
    await product.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
      product
    });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const getFeaturedProducts = async (req, res) => {
//   try {
//     const products = await Product.find({ featured: true });
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Search products (SIMPLE VERSION)
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (req, res) => {
  try {
    const { q, category, min, max } = req.query;

    let filter = {};

    // 1. Search by name (q = query)
    if (q) {
      filter.name = { $regex: q, $options: 'i' }; // 'i' = case insensitive
    }

    // 2. Filter by category
    if (category) {
      filter.category = category;
    }

    // 3. Filter by price range
    if (min || max) {
      filter.price = {};
      if (min) filter.price.$gte = Number(min); // greater than or equal
      if (max) filter.price.$lte = Number(max); // less than or equal
    }

    const products = await Product.find(filter);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
export const updateStock = async (req, res) => {
  try {
    const { stockQuantity, operation } = req.body; // operation: "add", "subtract", "set"

    if (!stockQuantity || stockQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid stock quantity required"
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Update stock based on operation
    if (operation === "add") {
      product.stockQuantity += stockQuantity;
    } else if (operation === "subtract") {
      product.stockQuantity -= stockQuantity;
      if (product.stockQuantity < 0) product.stockQuantity = 0;
    } else {
      // "set" or default
      product.stockQuantity = stockQuantity;
    }

    // Update inStock status
    product.inStock = product.stockQuantity > 0;

    await product.save();

    res.json({
      success: true,
      message: `Stock updated to ${product.stockQuantity}`,
      product: {
        _id: product._id,
        name: product.name,
        stockQuantity: product.stockQuantity,
        inStock: product.inStock,
        updatedAt: product.updatedAt
      }
    });
  } catch (err) {
    console.error("Update stock error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private/Admin
export const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 20 } = req.query; // Default: below 20 is low stock

    const lowStockProducts = await Product.find({
      stockQuantity: { $lt: Number(threshold) }
    }).select("name stockQuantity price category inStock");

    res.json({
      success: true,
      count: lowStockProducts.length,
      threshold: Number(threshold),
      products: lowStockProducts
    });
  } catch (err) {
    console.error("Get low stock error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Get stock report
// @route   GET /api/products/stock-report
// @access  Private/Admin
export const getStockReport = async (req, res) => {
  try {
    // Get all products with stock info
    const products = await Product.find({})
      .select("name category price stockQuantity inStock")
      .sort({ stockQuantity: 1 }); // Sort by stock (lowest first)

    // Calculate summary
    const totalProducts = products.length;
    const outOfStock = products.filter(p => !p.inStock).length;
    const lowStock = products.filter(p => p.stockQuantity < 20 && p.inStock).length;
    const inStock = products.filter(p => p.inStock).length;

    // Total inventory value
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.price * product.stockQuantity);
    }, 0);

    res.json({
      success: true,
      summary: {
        totalProducts,
        inStock,
        outOfStock,
        lowStock,
        totalInventoryValue: totalValue
      },
      products
    });
  } catch (err) {
    console.error("Stock report error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// @desc    Get all unique categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");

    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// @desc    Toggle product inStock
// @route   PUT /api/products/:id/toggle-stock
// @access  Private/Admin
export const toggleProductStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.inStock = !product.inStock;
    await product.save();

    res.json({
      success: true,
      message: `Product marked as ${product.inStock ? "In Stock" : "Out of Stock"}`,
      product,
    });
  } catch (err) {
    console.error("Toggle stock error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

