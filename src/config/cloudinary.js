import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Validate config
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️ Cloudinary credentials missing. Image upload will fail.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy',
  api_key: process.env.CLOUDINARY_API_KEY || 'dummy',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy',
  secure: true
});

// Test connection
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.api.ping()
    .then(() => console.log('✅ Cloudinary connected successfully'))
    .catch(err => console.warn('⚠️ Cloudinary connection test failed:', err.message));
}

export default cloudinary;