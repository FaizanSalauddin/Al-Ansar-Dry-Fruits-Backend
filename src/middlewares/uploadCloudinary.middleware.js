import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Use memory storage
const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
  }
});

export const uploadToCloudinary = (req, res, next) => {
  upload.array("images", 5)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.files || req.files.length === 0) {
      return next(); // no images uploaded
    }

    try {
      const results = await Promise.all(
        req.files.map(file => {
          const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
          return cloudinary.uploader.upload(base64, {
            folder: "al-ansar-dryfruits/products",
            resource_type: "image",
            transformation: [{ width: 800, height: 800, crop: "limit" }]
          });
        })
      );

      req.cloudinaryFiles = results.map(r => ({
        url: r.secure_url,
        public_id: r.public_id,
        width: r.width,
        height: r.height,
        format: r.format
      }));

      next();
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({
        success: false,
        message: "Image upload failed"
      });
    }
  });
};
